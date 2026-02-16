# Golden Routes - Instructor Assignment & Date Range

## Overview
Modify Golden Routes to support:
1. Multi-instructor assignment (many-to-many relationship)
2. Replace `frequency` field with `start_date` and `end_date`
3. Enable instructors to manage their assigned routes
4. Sort routes by `start_date` in public view

## Current Backend State

**Database Schema (routes table)**:
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- name_en (VARCHAR)
- origin (VARCHAR)
- destination (VARCHAR)
- description (TEXT)
- description_en (TEXT)
- frequency (VARCHAR) -- TO BE REMOVED
- status (ENUM: 'active', 'planning')
- participants_count (INT)
- spaces_established (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Existing Endpoints**:
- GET /api/routes - Get all routes
- POST /api/routes - Create route (admin only)
- PUT /api/routes/:id - Update route (admin only)
- DELETE /api/routes/:id - Delete route (admin only)

**Backend Architecture**: Express + MySQL, Route → Controller → Service → Repository pattern

## Required Changes

### 1. Database Schema Migrations

**Step 1: Remove frequency column**
```sql
ALTER TABLE routes DROP COLUMN frequency;
```

**Step 2: Add date columns**
```sql
ALTER TABLE routes
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;
```

**Step 3: Create route_instructors junction table**
```sql
CREATE TABLE route_instructors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_route_instructor (route_id, user_id)
);
```

### 2. Repository Layer Updates

**File**: `src/repositories/routeRepository.js`

**Modify findAll()** to:
- Join with route_instructors and users tables
- Return instructors array for each route
- Sort by start_date ASC (nulls last)

```javascript
async findAll() {
  const [routes] = await pool.query(`
    SELECT
      r.*,
      GROUP_CONCAT(DISTINCT u.id) as instructor_ids,
      GROUP_CONCAT(DISTINCT u.full_name) as instructor_names
    FROM routes r
    LEFT JOIN route_instructors ri ON r.id = ri.route_id
    LEFT JOIN users u ON ri.user_id = u.id
    GROUP BY r.id
    ORDER BY
      CASE WHEN r.start_date IS NULL THEN 1 ELSE 0 END,
      r.start_date ASC
  `)

  return routes.map(route => ({
    ...route,
    instructors: route.instructor_ids ?
      route.instructor_ids.split(',').map((id, i) => ({
        id: parseInt(id),
        name: route.instructor_names.split(',')[i]
      })) : []
  }))
}
```

**Add findByInstructorId()**:
```javascript
async findByInstructorId(userId) {
  const [routes] = await pool.query(`
    SELECT
      r.*,
      GROUP_CONCAT(DISTINCT u.id) as instructor_ids,
      GROUP_CONCAT(DISTINCT u.full_name) as instructor_names
    FROM routes r
    INNER JOIN route_instructors ri ON r.id = ri.route_id
    LEFT JOIN users u ON ri.user_id = u.id AND u.id = ri.user_id
    WHERE ri.user_id = ?
    GROUP BY r.id
    ORDER BY
      CASE WHEN r.start_date IS NULL THEN 1 ELSE 0 END,
      r.start_date ASC
  `, [userId])

  return routes.map(route => ({
    ...route,
    instructors: route.instructor_ids ?
      route.instructor_ids.split(',').map((id, i) => ({
        id: parseInt(id),
        name: route.instructor_names.split(',')[i]
      })) : []
  }))
}
```

**Modify create()** to handle instructor_ids array:
```javascript
async create(data) {
  const { instructor_ids, ...routeData } = data

  const [result] = await pool.query(
    'INSERT INTO routes SET ?',
    routeData
  )

  const routeId = result.insertId

  // Insert instructor assignments
  if (instructor_ids && instructor_ids.length > 0) {
    await this.setInstructors(routeId, instructor_ids)
  }

  return this.findById(routeId)
}
```

**Modify update()** to handle instructor_ids array:
```javascript
async update(id, data) {
  const { instructor_ids, ...routeData } = data

  await pool.query(
    'UPDATE routes SET ? WHERE id = ?',
    [routeData, id]
  )

  // Update instructor assignments
  if (instructor_ids !== undefined) {
    await this.setInstructors(id, instructor_ids)
  }

  return this.findById(id)
}
```

**Add setInstructors()** helper:
```javascript
async setInstructors(routeId, instructorIds) {
  // Remove existing assignments
  await pool.query(
    'DELETE FROM route_instructors WHERE route_id = ?',
    [routeId]
  )

  // Add new assignments
  if (instructorIds && instructorIds.length > 0) {
    const values = instructorIds.map(userId => [routeId, userId])
    await pool.query(
      'INSERT INTO route_instructors (route_id, user_id) VALUES ?',
      [values]
    )
  }
}
```

### 3. Service Layer Updates

**File**: `src/services/routeService.js`

**Add getInstructorRoutes()**:
```javascript
async getInstructorRoutes(userId) {
  return await routeRepository.findByInstructorId(userId)
}
```

**Modify updateRoute()** to validate instructor permissions:
```javascript
async updateRouteAsInstructor(userId, routeId, data) {
  const route = await routeRepository.findById(routeId)

  if (!route) {
    throw new Error('Ruta no encontrada')
  }

  // Check if user is assigned to this route
  const [assignment] = await pool.query(
    'SELECT 1 FROM route_instructors WHERE route_id = ? AND user_id = ?',
    [routeId, userId]
  )

  if (!assignment || assignment.length === 0) {
    throw new Error('No tienes permiso para editar esta ruta')
  }

  // Instructors can only update certain fields
  const allowedFields = {
    start_date: data.start_date,
    end_date: data.end_date,
    participants_count: data.participants_count,
    spaces_established: data.spaces_established,
    status: data.status
  }

  return await routeRepository.update(routeId, allowedFields)
}
```

### 4. Controller Layer Updates

**File**: `src/controllers/routeController.js`

**Add getMyRoutes()** for instructors:
```javascript
async getMyRoutes(req, res) {
  try {
    const userId = req.session.userId
    const routes = await routeService.getInstructorRoutes(userId)
    res.json({ success: true, data: routes })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
```

**Add updateAsInstructor()**:
```javascript
async updateAsInstructor(req, res) {
  try {
    const userId = req.session.userId
    const routeId = req.params.id
    const route = await routeService.updateRouteAsInstructor(userId, routeId, req.body)
    res.json({ success: true, data: route })
  } catch (error) {
    res.status(error.message.includes('permiso') ? 403 : 500).json({
      success: false,
      message: error.message
    })
  }
}
```

### 5. Routes Layer Updates

**File**: `src/routes/routeRoutes.js`

Add instructor endpoints:
```javascript
const { requireInstructor } = require('../middleware/auth')

// Instructor routes
router.get('/instructor/my-routes', requireInstructor, routeController.getMyRoutes)
router.put('/instructor/:id', requireInstructor, routeController.updateAsInstructor)
```

### 6. API Response Format Changes

**GET /api/routes** response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ruta La Habana - Santiago",
      "name_en": "Havana - Santiago Route",
      "origin": "La Habana",
      "destination": "Santiago de Cuba",
      "description": "...",
      "description_en": "...",
      "start_date": "2026-03-15",
      "end_date": "2026-03-22",
      "status": "active",
      "participants_count": 25,
      "spaces_established": 3,
      "instructors": [
        { "id": 5, "name": "Juan Pérez" },
        { "id": 7, "name": "María García" }
      ],
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**POST/PUT /api/routes** request body:
```json
{
  "name": "Ruta La Habana - Santiago",
  "name_en": "Havana - Santiago Route",
  "origin": "La Habana",
  "destination": "Santiago de Cuba",
  "description": "...",
  "description_en": "...",
  "start_date": "2026-03-15",
  "end_date": "2026-03-22",
  "status": "active",
  "participants_count": 25,
  "spaces_established": 3,
  "instructor_ids": [5, 7]
}
```

## Testing Checklist

1. ✅ Routes sorted by start_date in GET /api/routes
2. ✅ Instructor assignment saves to route_instructors table
3. ✅ GET /api/routes/instructor/my-routes returns only assigned routes
4. ✅ PUT /api/routes/instructor/:id validates instructor assignment
5. ✅ Admin can assign/unassign instructors
6. ✅ Instructors can update their routes (limited fields)
7. ✅ Cascade delete works (deleting route removes assignments)

## Production Database Migration

Run these on Heroku production database:
```sql
-- Backup first!
ALTER TABLE routes DROP COLUMN frequency;
ALTER TABLE routes ADD COLUMN start_date DATE, ADD COLUMN end_date DATE;

CREATE TABLE route_instructors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_route_instructor (route_id, user_id)
);
```
