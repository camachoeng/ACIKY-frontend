# 003: Backend Separation Strategy

**Status**: Accepted
**Date**: 2025-XX-XX
**Deciders**: Project team

## Context

The ACIKY platform needs a backend for data persistence (blog, bookings, testimonials, user accounts). We needed to decide the architecture:
- Monorepo (frontend + backend in one repo) vs multi-repo
- Backend technology and deployment strategy
- Communication pattern between frontend and backend

## Decision

Use **multi-repo (polyrepo) architecture** with separate repositories:

- **Frontend repo**: `d:/coding/yoga-v2`
  - HTML5 + Tailwind CSS 4 + Vanilla JavaScript
  - Deployed to GitHub Pages (static hosting)

- **Backend repo**: `d:/coding/yoga-backend`
  - Node.js + Express + MySQL
  - Route → Controller → Service → Repository pattern
  - Deployed to Heroku

Communication via REST API with `apiFetch()` wrapper handling:
- Credentials (`credentials: 'include'` for session cookies)
- Environment detection (localhost/LAN/production URLs)
- Error handling and content-type headers

## Consequences

### Positive
- **Independent deployment**: Frontend can update without backend rebuild
- **Technology flexibility**: Can replace backend without touching frontend
- **Separation of concerns**: Clear API contract via REST
- **Scalability**: Backend can scale independently on Heroku
- **Static hosting**: Frontend on free GitHub Pages
- **Team specialization**: Different developers can work on each repo

### Negative
- **CORS complexity**: Must configure cross-origin requests
- **Two repos to maintain**: Separate version control, issues, PRs
- **API versioning**: Breaking changes require coordination
- **Local dev setup**: Need to run both servers (frontend on :5173, backend on :5000)
- **Deployment coordination**: Frontend changes may require backend updates

### Implementation Rules
- **NEVER modify backend files directly from frontend repo**
- **ALWAYS create spec file** at `backend-specs/<feature>.md` for backend changes
- Spec file describes required API/DB changes for another Claude AI to implement
- Backend CLAUDE.md location: `d:/coding/yoga-backend/CLAUDE.md`

## Alternatives Considered

1. **Monorepo (single repository)**:
   - Pros: Atomic commits, easier refactoring, single version control
   - Cons: Coupled deployment, larger repo, frontend can't deploy independently

2. **Serverless backend (Firebase/Supabase)**:
   - Pros: No server management, auto-scaling, free tier
   - Cons: Vendor lock-in, limited MySQL compatibility, Cuba connectivity concerns

3. **Backend in same repo, different deploy**:
   - Pros: Single codebase, easier local dev
   - Cons: Still need separate deployments, no clear separation

4. **Monolith (server-side rendering)**:
   - Pros: Traditional, simpler auth, no CORS
   - Cons: Can't use GitHub Pages, requires Node.js hosting, slower updates

## Related Decisions
- 004: Session-based authentication (requires CORS configuration)
- 006: GitHub Pages + Heroku deployment (separate hosting services)
