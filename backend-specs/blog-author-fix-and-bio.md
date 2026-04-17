# Blog: Preserve Author on Edit + Include Author Bio in Response

## Problem 1: Author name disappears when admin edits a post

When `PUT /api/blog/:id` is called by an admin, the backend sets `author_id = req.session.userId` (or equivalent), replacing the original instructor's ID with the admin's ID. This causes `author_name` to change (or become null if the admin has no name stored).

### Fix
In `blogRepository.update()` (or `blogController` / `blogService`):
- Do NOT update `author_id` on edit — only set it on `INSERT` (creation)
- Remove `author_id` from the UPDATE SET clause entirely

---

## Problem 2: Author bio not included in blog API response

The blog list and detail APIs return `author_name` and `author_profile_image_url` via JOIN with `users`, but not `bio` or `bio_en`.

### Fix
In `blogRepository.findAll()` and `blogRepository.findById()` (the SELECT queries that JOIN with `users`):
- Add `u.bio AS author_bio` to the SELECT
- Add `u.bio_en AS author_bio_en` to the SELECT

No service or controller changes needed — the fields will pass through automatically.

## Notes
- Both fixes are independent and safe to apply separately
- Frontend already renders `post.author_bio` and `post.author_bio_en` once the fields are present
