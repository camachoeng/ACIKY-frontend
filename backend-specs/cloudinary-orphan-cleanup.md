# Cloudinary Orphan Cleanup — Backend Spec

## Summary
Replace the time-based `temporary_uploads` cleanup with a **DB-vs-Cloudinary reconciliation** approach:
1. List all images currently in Cloudinary under the `aciky/` folder
2. Collect all Cloudinary image URLs from **both** the dev and prod databases
3. Delete from Cloudinary anything not referenced in either database

This runs nightly via `scripts/cleanup.js` (Heroku Scheduler) and can be triggered manually from the admin UI.

---

## Current State

### Existing files involved
- `services/uploadCleanupService.js` — time-based cleanup using `temporary_uploads` table
- `repositories/temporaryUploadRepository.js` — queries the `temporary_uploads` table
- `controllers/cleanupController.js` — exposes `getUploadStats`, `cleanupTemporaryUploads`, `getTemporaryUploadsDebug`
- `routes/cleanup.js` — `GET /api/cleanup/stats`, `POST /api/cleanup/temporary-uploads`, `GET /api/cleanup/debug`
- `scripts/cleanup.js` — scheduled script, calls `uploadCleanupService.cleanupOldTemporary(24)`
- `config/cloudinary.js` — exports `cloudinary`, `extractPublicId(url)`, `deleteByUrl(url)`
- `config/database.js` — primary DB pool (reads `JAWSDB_URL` on Heroku, or `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT` locally)
- `controllers/uploadController.js` — already updated: `folderPrefix` is now hardcoded as `'aciky'`

### DB tables with Cloudinary image URLs
| Table | Column |
|-------|--------|
| `users` | `profile_image_url` |
| `gallery` | `image_url` |
| `activities` | `image_url` |
| `events` | `image_url` |
| `routes` | `image_url` |
| `spaces` | `image` |
| `rebirthing_sessions` | `image` |

Note: `gallery.thumbnail_url` is a URL-transformation derivative of `gallery.image_url` — same Cloudinary asset, no separate file. Do NOT include it in the collection query.

---

## Required Changes

### 0. New file: `config/databaseSecondary.js`

Create an optional second DB connection pool using the same structure as `config/database.js`, but reading from a separate set of env vars: `DB2_HOST`, `DB2_USER`, `DB2_PASSWORD`, `DB2_NAME`, `DB2_PORT`.

- If none of those vars are set, the module exports `null` instead of a pool
- No startup connection test log needed
- Do NOT use `JAWSDB_URL` for this connection — always use explicit host vars

### 1. New file: `services/cloudinaryOrphanService.js`

Create a new service class with two public methods:

**`getOrphaned()`**
- Call `cloudinary.api.resources()` with `type: 'upload'`, `prefix: 'aciky'`, `max_results: 500` — paginate using `next_cursor` until all resources are listed
- Both dev and prod share the same Cloudinary folder (`aciky/`)
- For each DB table listed above, run a SELECT of only the image column WHERE the column IS NOT NULL — do this against **both** the primary DB (`config/database`) and the secondary DB (`config/databaseSecondary`); if the secondary pool is `null`, skip it silently
- Use `extractPublicId(url)` from `config/cloudinary.js` to convert each DB URL to a public_id — skip nulls
- Build a **single merged Set** of public_ids from both databases
- Filter the Cloudinary list: keep only assets whose `public_id` is NOT in the merged Set
- Return: `{ cloudinaryTotal, dbTotal, orphaned: [{publicId, url}] }` where `dbTotal` is the size of the merged Set

**`deleteOrphaned()`**
- Call `getOrphaned()` to get the list
- Safety guard: if `orphaned.length > cloudinaryTotal * 0.8`, return `{ success: false, error: 'Safety limit exceeded: more than 80% of Cloudinary assets would be deleted. Check DB connectivity.' }`
- For each orphaned asset, call `cloudinary.uploader.destroy(publicId)` — catch individual errors, continue
- Return: `{ success: true, deletedCount, failed, errors: [...], orphanedTotal }`

### 2. Update: `controllers/cleanupController.js`

Add two new exported functions (keep existing ones unchanged):

**`exports.previewOrphaned`**
- Calls `cloudinaryOrphanService.getOrphaned()`
- Returns `{ success: true, data: { cloudinaryTotal, dbTotal, orphanedCount: orphaned.length, orphaned, environment } }`
- Adds `environment: process.env.NODE_ENV || 'development'` to the response data

**`exports.deleteOrphaned`**
- Calls `cloudinaryOrphanService.deleteOrphaned()`
- On success: returns `{ success: true, data: result }`
- On service-level failure (safety guard, etc.): returns `{ success: false, message: result.error }`
- On exception: returns 500

### 3. Update: `routes/cleanup.js`

Add two new routes (keep existing routes unchanged):
- `GET /api/cleanup/orphaned` → `cleanupController.previewOrphaned` — require admin session
- `POST /api/cleanup/orphaned` → `cleanupController.deleteOrphaned` — require admin session

Use the same admin authentication middleware already applied to existing cleanup routes.

### 4. Update: `scripts/cleanup.js`

Replace the call to `uploadCleanupService.cleanupOldTemporary(24)` with `cloudinaryOrphanService.deleteOrphaned()`.

Keep everything else the same:
- `require('dotenv').config()` at top
- `NODE_ENV !== 'production'` guard (skip and exit 0 in non-production)
- Log start time, result counts, and errors
- `process.exit(0)` on success, `process.exit(1)` on failure

---

## Environment Variables

### Dev `.env`
```
# Primary DB (local dev)
DB_HOST=localhost
DB_USER=...
DB_PASSWORD=...
DB_NAME=yoga_dev
DB_PORT=3306

# Secondary DB (prod — so cleanup counts both)
DB2_HOST=<jawsdb hostname>
DB2_USER=<jawsdb user>
DB2_PASSWORD=<jawsdb password>
DB2_NAME=<jawsdb database>
DB2_PORT=3306
```

### Prod (Heroku config vars)
```
JAWSDB_URL=...   ← primary DB as usual
# DB2_* not set — secondary pool will be null, orphan service skips it
```

This means:
- **Dev analysis** queries both DBs → accurate full picture
- **Prod scheduled cleanup** (Heroku) queries only prod DB → safe, since dev images should not exist in prod once dev work is finished

---

## Notes
- Do NOT delete or modify `uploadCleanupService.js`, `temporaryUploadRepository.js`, or the `temporary_uploads` DB table
- The `folderPrefix` in `cloudinaryOrphanService.js` must be hardcoded as `'aciky'` (not read from env), since both environments now share the same folder
