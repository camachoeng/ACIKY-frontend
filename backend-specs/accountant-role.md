# Accountant Role Backend Spec

## Current State (after migration applied)
- `users` table has `is_accountant TINYINT(1) DEFAULT 0`
- `GET /api/transactions` — currently requires `requireAccountantOrAdmin` (too restrictive)
- `POST /api/transactions` — requires `requireAccountantOrAdmin`
- `PUT /api/transactions/:id` — requires admin
- `DELETE /api/transactions/:id` — requires admin
- `PUT /api/settings` — requires admin

## Required Fix

### 1. GET /api/transactions — open to all instructors
The read-only ledger page (`pages/accountant.html`) is accessible to any instructor or admin. The GET endpoint must allow any authenticated user with role `instructor` or `admin` (i.e., `requireAuth` + role check, or just `requireInstructor`).

Change: `GET /api/transactions` middleware from `requireAccountantOrAdmin` → `requireInstructor` (or equivalent: any user whose role is `instructor` or `admin` may read transactions).

### 2. POST /api/transactions — accountant instructors + admin only
Only users where `is_accountant = 1` OR `role = 'admin'` may create transactions.

Keep: `POST /api/transactions` guarded by `requireAccountantOrAdmin` middleware.

The `requireAccountantOrAdmin` middleware should check: `req.session.user.role === 'admin' || req.session.user.is_accountant === 1`

### 3. PUT /api/transactions/:id — admin only
Keep: admin only.

### 4. DELETE /api/transactions/:id — admin only
Keep: admin only.

### 5. PUT /api/settings — admin only (no change)
Keep: admin only.

## Summary of Changes
- Change `GET /api/transactions` from `requireAccountantOrAdmin` to `requireInstructor` (allow all instructors + admins to read)
- No other backend changes needed
