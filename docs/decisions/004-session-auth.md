# 004: Session-Based Authentication

**Status**: Accepted
**Date**: 2025-XX-XX
**Deciders**: Project team

## Context

The platform requires user authentication for:
- Admin panel (instructors and administrators)
- User dashboards (registered members)
- Protected API endpoints (blog admin, bookings, testimonials)

Need to choose authentication strategy across separate frontend/backend repos (ADR-003).

## Decision

Use **session-based authentication** with httpOnly cookies + localStorage fallback.

**Backend (yoga-backend)**:
- Express sessions with `express-session`
- Store user ID in `req.session.userId` after successful login
- httpOnly cookies (prevent XSS attacks)
- Session stored server-side (MySQL session store)

**Frontend (yoga-v2)**:
- `checkAuth()` runs on every page (updates navbar UI)
- `requireAuth()` redirects to `/pages/login.html` if not authenticated
- `requireAdmin()` redirects to `/` if not admin role
- localStorage fallback for user info (name, role) for UI display
- All API calls via `apiFetch()` with `credentials: 'include'`

**Roles**:
- `user`: Basic member
- `instructor`: Can manage blog posts
- `admin`: Full system access

## Consequences

### Positive
- **Secure**: httpOnly cookies prevent JavaScript access (XSS protection)
- **Stateful**: Server knows who's logged in, can revoke sessions
- **Simple**: No token management, refresh tokens, or JWT complexity
- **Standard**: Built into Express, well-tested
- **Cross-tab sync**: Sessions work across browser tabs automatically

### Negative
- **CORS required**: Must configure `credentials: 'include'` for cross-origin
- **Server state**: Sessions stored in DB (memory/storage cost)
- **Scalability**: Horizontal scaling requires session store replication
- **Mobile apps**: Sessions harder than tokens for native mobile
- **No offline**: Can't authenticate without server connection

### Implementation Details
- Login endpoint: `POST /api/auth/login` (sets session)
- Logout endpoint: `POST /api/auth/logout` (destroys session)
- Check auth: `GET /api/auth/check` (returns current user)
- Protected routes check `req.session.userId` in middleware
- Frontend `apiFetch()` automatically includes credentials

## Alternatives Considered

1. **JWT (JSON Web Tokens)**:
   - Pros: Stateless, scalable, mobile-friendly, can store claims
   - Cons: Can't revoke (must wait for expiry), XSS vulnerable if stored in localStorage, refresh token complexity

2. **OAuth 2.0 (Google/Facebook login)**:
   - Pros: No password management, trusted providers
   - Cons: Requires external accounts, Cuba internet restrictions, over-engineered for small site

3. **API Keys**:
   - Pros: Simple, stateless
   - Cons: No user context, can't revoke per-user, security risk if leaked

4. **Basic Auth (username:password in header)**:
   - Pros: Standard HTTP, simple
   - Cons: Credentials sent on every request, no logout, poor UX

## Related Decisions
- 003: Backend separation (requires CORS for sessions)
- 001: Vanilla JavaScript (no framework auth libraries like NextAuth)
