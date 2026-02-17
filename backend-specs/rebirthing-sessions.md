# Backend Spec: Rebirthing Sessions

## Context

Rebirthing sessions are managed events. Each session has bilingual name/description, address, instructor, and a date.
Both admin and the assigned instructor can manage sessions.
Active sessions appear on the homepage and public rebirthing page.

Backend repo: `d:/coding/yoga-backend`
Pattern: Route → Controller → Service → Repository
Auth: session-based (`req.session.userId`)
Reference: Backend CLAUDE.md at `d:/coding/yoga-backend/CLAUDE.md`

---

## Database Migration

```sql
CREATE TABLE rebirthing_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT,
  description_en TEXT,
  address VARCHAR(500),
  instructor_id INT,
  date DATETIME,
  active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## API Endpoints

### Public

**GET /api/rebirthing**
- Auth: none
- Query params: `?active=true` (optional, filters active only)
- Returns all fields including joined instructor: `instructor_name`, `instructor_last_name`, `instructor_spiritual_name`
- SQL: `SELECT rs.*, u.name AS instructor_name, u.last_name AS instructor_last_name, u.spiritual_name AS instructor_spiritual_name FROM rebirthing_sessions rs LEFT JOIN users u ON rs.instructor_id = u.id [WHERE rs.active = 1] ORDER BY rs.date ASC`

### Admin

**POST /api/rebirthing**
- Auth: `requireAdmin`
- Body: `{ name, name_en, description, description_en, address, instructor_id, date, active }`
- Validation: `name` required

**PUT /api/rebirthing/:id**
- Auth: `requireAdmin`
- Body: any subset of `{ name, name_en, description, description_en, address, instructor_id, date, active }`

**DELETE /api/rebirthing/:id**
- Auth: `requireAdmin`

### Instructor

**GET /api/rebirthing/instructor/my-sessions**
- Auth: `requireInstructor`
- Returns sessions where `instructor_id = req.session.userId` (same JOIN as public endpoint)

**PUT /api/rebirthing/instructor/:id**
- Auth: `requireInstructor`
- Validate that `session.instructor_id === req.session.userId` before updating
- Body: `{ name, name_en, description, description_en, address, date, active }` (cannot change `instructor_id`)

---

## Files to Create/Modify in yoga-backend

### New files:
- `routes/rebirthingRoutes.js`
- `controllers/rebirthingController.js`
- `services/rebirthingService.js`
- `repositories/rebirthingRepository.js`
- `migrations/create_rebirthing_sessions.sql`

### Modified files:
- `app.js` — register `rebirthingRoutes` at `/api/rebirthing`

---

## Notes

- Register `/instructor/my-sessions` BEFORE `/:id` in the router to prevent `:id` matching "instructor"
- `date` field: store as DATETIME, accept ISO string from frontend
- `active` field: frontend sends boolean, store as TINYINT (0/1)
- Middleware: `requireAdmin` and `requireInstructor` already exist in `middleware/auth.js`
