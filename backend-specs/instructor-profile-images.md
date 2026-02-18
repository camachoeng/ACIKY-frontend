# Backend Spec: Instructor Profile Images in All Queries

## Context

The frontend now renders instructor/author profile photos wherever instructors are displayed: golden routes, rebirthing sessions, activities (schedule), spaces, and blog posts. The `profile_image_url` column already exists on the `users` table but is missing from all instructor JOIN queries.

Backend repo: `d:/coding/yoga-backend`
Pattern: Route → Controller → Service → Repository
Reference: Backend CLAUDE.md at `d:/coding/yoga-backend/CLAUDE.md`

---

## No Database Changes Required

`profile_image_url` already exists on the `users` table. Only SELECT queries need updating.

---

## Changes Required

### 1. `repositories/routeRepository.js`

The query that fetches instructors for routes (used in the instructors array returned per route) currently selects `id, username, name, last_name, spiritual_name, email`. Add `profile_image_url`:

**Before:**
```sql
SELECT u.id, u.username, u.name, u.last_name, u.spiritual_name, u.email
FROM route_instructors ri
JOIN users u ON ri.instructor_id = u.id
WHERE ri.route_id = ?
```

**After:**
```sql
SELECT u.id, u.username, u.name, u.last_name, u.spiritual_name, u.email, u.profile_image_url
FROM route_instructors ri
JOIN users u ON ri.instructor_id = u.id
WHERE ri.route_id = ?
```

Each route's `instructors` array will then include `profile_image_url` per instructor object.

---

### 2. `repositories/rebirthingRepository.js`

The main SELECT that fetches sessions with instructor info currently aliases instructor fields as `instructor_name`, `instructor_last_name`, etc. Add `u.profile_image_url AS instructor_profile_image_url`:

**Before:**
```sql
SELECT rs.*, u.name AS instructor_name, u.last_name AS instructor_last_name,
       u.spiritual_name AS instructor_spiritual_name, u.email AS instructor_email
FROM rebirthing_sessions rs
LEFT JOIN users u ON rs.instructor_id = u.id
```

**After:**
```sql
SELECT rs.*, u.name AS instructor_name, u.last_name AS instructor_last_name,
       u.spiritual_name AS instructor_spiritual_name, u.email AS instructor_email,
       u.profile_image_url AS instructor_profile_image_url
FROM rebirthing_sessions rs
LEFT JOIN users u ON rs.instructor_id = u.id
```

The frontend reads: `s.instructor_profile_image_url`

---

### 3. `repositories/activityRepository.js`

Both `findAll` and `findById` queries JOIN users for instructor info. Add `u.profile_image_url AS instructor_profile_image_url` to both:

**Before (findAll):**
```sql
SELECT a.*, u.name AS instructor_name, u.last_name AS instructor_last_name,
       u.spiritual_name AS instructor_spiritual_name, u.username AS instructor_username,
       u.email AS instructor_email
FROM activities a
LEFT JOIN users u ON a.instructor_id = u.id
```

**After (findAll):**
```sql
SELECT a.*, u.name AS instructor_name, u.last_name AS instructor_last_name,
       u.spiritual_name AS instructor_spiritual_name, u.username AS instructor_username,
       u.email AS instructor_email, u.profile_image_url AS instructor_profile_image_url
FROM activities a
LEFT JOIN users u ON a.instructor_id = u.id
```

Apply the same addition to the `findById` query.

The frontend reads: `activity.instructor_profile_image_url`

---

### 4. `repositories/spaceRepository.js`

The query that fetches instructors for spaces (used in the instructors array per space) currently selects `id, username, name, last_name, spiritual_name, email`. Add `profile_image_url`:

**Before:**
```sql
SELECT u.id, u.username, u.name, u.last_name, u.spiritual_name, u.email
FROM space_instructors si
JOIN users u ON si.instructor_id = u.id
WHERE si.space_id IN (...)
```

**After:**
```sql
SELECT u.id, u.username, u.name, u.last_name, u.spiritual_name, u.email, u.profile_image_url
FROM space_instructors si
JOIN users u ON si.instructor_id = u.id
WHERE si.space_id IN (...)
```

Each space's `instructors` array will then include `profile_image_url` per instructor object.

---

### 5. `repositories/blogRepository.js`

The query currently returns only `u.username AS author_name`. Extend it to also return the author's profile image and formatted name fields:

**Before:**
```sql
SELECT p.*, u.username AS author_name
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
```

**After:**
```sql
SELECT p.*, u.username AS author_name, u.profile_image_url AS author_profile_image_url
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
```

The frontend reads: `post.author_profile_image_url`

Apply to all blog queries (findAll, findById, findBySlug, or equivalents).

---

## Summary of Field Names Used by Frontend

| Repository | Frontend field name |
|---|---|
| routeRepository | `instructor.profile_image_url` (in instructors array) |
| rebirthingRepository | `s.instructor_profile_image_url` |
| activityRepository | `activity.instructor_profile_image_url` |
| spaceRepository | `instructor.profile_image_url` (in instructors array) |
| blogRepository | `post.author_profile_image_url` |

All fields are nullable — the frontend falls back to a `person` icon when the value is `null`.
