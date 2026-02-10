# Testimonials API — Backend Modifications

## Overview
The testimonials API already exists but needs modifications to support:
1. **Bilingual content** (`content_en` field)
2. **User-linked submissions** (`author_id` from session, not from request body)
3. **Full edit endpoint** (`PUT /:id` for admin to edit content + translation)
4. **Auth requirement** on `POST /` (only logged-in users can submit)

## Current State

### Database Schema (actual, not migration file)
```sql
-- Fields currently in use (based on repository queries):
-- id, author_name, location, content, rating, activity_id, approved, featured, created_at
```

### Current Endpoints
| Method | Route | Auth | Body |
|--------|-------|------|------|
| `GET` | `/approved` | None | — |
| `GET` | `/all` | Admin | — |
| `POST` | `/` | None | `{ author_name, content, rating, location?, activity_id? }` |
| `PUT` | `/:id/status` | Admin | `{ approved: 0\|1 }` |
| `PUT` | `/:id/featured` | Admin | — (toggles) |
| `DELETE` | `/:id` | Admin | — |

### Current Files
- `routes/testimonials.js`
- `controllers/testimonialController.js`
- `services/testimonialService.js`
- `repositories/testimonialRepository.js`

## Required Changes

### 1. Database — Add columns
```sql
ALTER TABLE testimonials ADD COLUMN content_en TEXT DEFAULT NULL AFTER content;
ALTER TABLE testimonials ADD COLUMN author_id INT DEFAULT NULL AFTER author_name;
ALTER TABLE testimonials ADD FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
```
- `content_en`: English translation (nullable, admin adds later)
- `author_id`: Links to users table (nullable for backward compat with old data)

### 2. Routes — `routes/testimonials.js`
- Change `POST /` from public to require auth: add `requireAuth` middleware
- Add new route: `PUT /:id` with `requireAdmin` for full testimonial editing
```js
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Change this:
router.post('/', testimonialController.createTestimonial);
// To this:
router.post('/', requireAuth, testimonialController.createTestimonial);

// Add this (before /:id/status to avoid route conflicts):
router.put('/:id', requireAdmin, testimonialController.updateTestimonial);
```

### 3. Controller — `controllers/testimonialController.js`
**Modify `createTestimonial`**: Get author info from session instead of body
```js
exports.createTestimonial = async (req, res) => {
  try {
    const userId = req.session.userId;
    // Look up user to get username
    const user = await userRepository.findById(userId);

    const testimonialId = await testimonialService.createTestimonial({
      author_id: userId,
      author_name: user.username,
      content: req.body.content || null,
      content_en: req.body.content_en || null,
      rating: 5  // Default rating (frontend doesn't send it)
    });
    // ... rest stays the same
  }
};
```

**Add `updateTestimonial`**: Full edit for admin
```js
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, content_en, approved } = req.body;

    const updated = await testimonialService.updateTestimonial(id, {
      content, content_en, approved
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    res.json({ success: true, message: 'Testimonial updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating testimonial' });
  }
};
```

### 4. Service — `services/testimonialService.js`
**Modify `createTestimonial`**: Accept `author_id`, `content_en`, don't require `author_name` from body
```js
async createTestimonial(data) {
  const { author_id, author_name, content, content_en, rating } = data;

  if (!content && !content_en) {
    throw new Error('Content is required');
  }

  const sanitizedContent = content ? sanitizeText(content) : null;
  const sanitizedContentEn = content_en ? sanitizeText(content_en) : null;

  return await testimonialRepository.create({
    author_id,
    author_name: sanitizeText(author_name),
    content: sanitizedContent,
    content_en: sanitizedContentEn,
    rating: rating || 5
  });
}
```

**Add `updateTestimonial`**:
```js
async updateTestimonial(id, data) {
  const { content, content_en, approved } = data;
  const updates = {};
  if (content !== undefined) updates.content = content ? sanitizeText(content) : null;
  if (content_en !== undefined) updates.content_en = content_en ? sanitizeText(content_en) : null;
  if (approved !== undefined) updates.approved = approved;

  const affectedRows = await testimonialRepository.update(id, updates);
  return affectedRows > 0;
}
```

### 5. Repository — `repositories/testimonialRepository.js`
**Modify `create`**: Add `author_id` and `content_en` to INSERT
```js
async create({ author_id, author_name, location, content, content_en, rating, activity_id }) {
  const [result] = await db.query(
    'INSERT INTO testimonials (author_id, author_name, location, content, content_en, rating, activity_id, approved, featured) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)',
    [author_id, author_name, location, content, content_en, rating, activity_id]
  );
  return result.insertId;
}
```

**Modify `findAllApproved`**: Include `content_en` in SELECT
```js
async findAllApproved() {
  const [testimonials] = await db.query(
    `SELECT t.id, t.author_name, t.location, t.content, t.content_en, t.rating, t.featured, t.created_at,
            a.name as activity_name
     FROM testimonials t
     LEFT JOIN activities a ON t.activity_id = a.id
     WHERE t.approved = 1
     ORDER BY t.featured DESC, t.created_at DESC`
  );
  return testimonials;
}
```

**Modify `findAll`**: Already uses `t.*` so `content_en` and `author_id` will be included automatically.

**Add `update`**: Generic update method
```js
async update(id, data) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  const [result] = await db.query(
    `UPDATE testimonials SET ${fields} WHERE id = ?`,
    [...values, id]
  );
  return result.affectedRows;
}
```

## Final API After Changes

| Method | Route | Auth | Body | Description |
|--------|-------|------|------|-------------|
| `GET` | `/approved` | None | — | Approved testimonials (public) |
| `GET` | `/all` | Admin | — | All testimonials (admin) |
| `POST` | `/` | **User+** | `{ content?, content_en? }` | Submit testimonial (author from session) |
| `PUT` | `/:id` | Admin | `{ content?, content_en?, approved? }` | **NEW**: Full edit |
| `PUT` | `/:id/status` | Admin | `{ approved: 0\|1 }` | Toggle approval |
| `PUT` | `/:id/featured` | Admin | — | Toggle featured |
| `DELETE` | `/:id` | Admin | — | Delete |

## Testing
1. Run `npm test` after changes
2. Test `POST /api/testimonials` requires auth (should return 401 without session)
3. Test `POST /api/testimonials` with auth creates with `author_id` from session
4. Test `PUT /api/testimonials/:id` updates `content_en` and `approved`
5. Test `GET /api/testimonials/approved` returns `content_en` field
