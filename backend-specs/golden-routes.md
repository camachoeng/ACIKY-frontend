# Golden Routes — Backend Modifications

## Target Repo
`d:/coding/yoga-backend` — See `d:/coding/yoga-backend/CLAUDE.md` for conventions.

## Current State
The routes module already exists with full CRUD:
- **Routes**: `routes/routes.js` → `GET /`, `GET /:id`, `POST /` (admin), `PUT /:id` (admin), `DELETE /:id` (admin)
- **Controller**: `controllers/routeController.js`
- **Service**: `services/routeService.js` — validates `name`, `origin`, `destination`; allowed fields: `name`, `origin`, `destination`, `description`, `frequency`, `status`, `participants_count`, `spaces_established`
- **Repository**: `repositories/routeRepository.js`
- **Mounted at**: `/api/routes` in `server.js`

### Current DB Schema (`routes` table)
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| name | VARCHAR(255) | Required |
| origin | VARCHAR(255) | Required |
| destination | VARCHAR(255) | Required |
| description | TEXT | Optional |
| frequency | VARCHAR(100) | e.g., "Anual", "Marzo 2026" |
| status | VARCHAR(50) | 'active' or 'planning' |
| participants_count | INT | Default 0 |
| spaces_established | INT | Default 0 |
| image_url | VARCHAR(500) | Optional |
| created_at | TIMESTAMP | Auto |

## Required Changes

### 1. Database Migration
Add bilingual columns to the `routes` table:

```sql
ALTER TABLE routes ADD COLUMN name_en VARCHAR(255) AFTER name;
ALTER TABLE routes ADD COLUMN description_en TEXT AFTER description;
```

### 2. Service (`services/routeService.js`)
Add `name_en` and `description_en` to the allowed fields in both `createRoute()` and `updateRoute()`:

**In `createRoute()`** — destructure `name_en`, `description_en` from `data`, pass to repository:
```js
const { name, name_en, origin, destination, description, description_en, frequency, status, participants_count, spaces_established } = data;
```

**In `updateRoute()`** — add to `allowedFields` array:
```js
const allowedFields = [
  'name', 'name_en', 'origin', 'destination', 'description', 'description_en',
  'frequency', 'status', 'participants_count', 'spaces_established'
];
```

### 3. Repository (`repositories/routeRepository.js`)
Update the `create()` method to include the new fields:

```js
async create({ name, name_en, origin, destination, description, description_en, frequency, status, participants_count, spaces_established }) {
  const [result] = await db.query(`
    INSERT INTO routes
    (name, name_en, origin, destination, description, description_en, frequency, status, participants_count, spaces_established)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [name, name_en, origin, destination, description, description_en, frequency, status, participants_count, spaces_established]);
  return result.insertId;
}
```

The `findAll()` and `findById()` methods use `SELECT *` so they'll automatically return the new fields.

### 4. No New Endpoints Needed
The existing CRUD endpoints are sufficient. The frontend uses:
- `GET /api/routes` (public) — all routes, optional `?status=active|planning`
- `POST /api/routes` (admin) — create with bilingual fields
- `PUT /api/routes/:id` (admin) — update with bilingual fields
- `DELETE /api/routes/:id` (admin) — delete

## Testing
```bash
# Verify migration
mysql -u root -p yoga_db -e "DESCRIBE routes;"

# Test GET
curl http://localhost:3000/api/routes
curl http://localhost:3000/api/routes?status=active

# Test POST (admin session required)
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -b "connect.sid=<session>" \
  -d '{"name":"Test Route","name_en":"Test Route EN","origin":"Havana","destination":"Santiago","description":"Desc ES","description_en":"Desc EN","frequency":"Anual","status":"planning","participants_count":0,"spaces_established":0}'
```
