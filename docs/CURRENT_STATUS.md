# Current Project Status

Last updated: 2026-02-27

## In Progress
_No active work at this time._

## Recently Completed
- [x] **Context-First Development setup - COMPLETE** (2026-02-24)
  - Created root CLAUDE.md as entry point with @references
  - Created ARCHITECTURE.md with system diagram and data flow
  - Created CURRENT_STATUS.md for session tracking
  - Created CONVENTIONS.md with coding patterns and tech stack
  - Created decisions/_index.md with ADR system and template
  - Created all 6 architectural decision records:
    - ADR-001: Vanilla JavaScript (no frameworks)
    - ADR-002: Vite + Handlebars for templating
    - ADR-003: Backend separation strategy (multi-repo)
    - ADR-004: Session-based authentication
    - ADR-005: Tailwind CSS 4 with @theme
    - ADR-006: GitHub Pages + Heroku deployment
  - Created `/project:status` command for session startup (simple version)
  - Created `/session:start` command (enhanced startup with GitHub CLI integration)
  - Created `/decision:new` command for documenting decisions
  - Established 3-phase daily workflow (Login → Work → Logout)
  - Moved CFD meta-documentation to .claude/cfd/ (ignored from context)
  - Streamlined to minimum CFD structure for single developer (6 core files)
  - Moved docs/ to project root (standard CFD structure)
  - Verified all documentation cross-references and structure integrity
  - Reorganized D:\coding\CFD\CONTEXT_FIRST_GUIDE.md for clarity
- [x] Consolidated MEMORY.md into CONVENTIONS.md
- [x] Blog feature (public + admin pages, bilingual, instructor access)
- [x] Testimonials system (user submissions, admin approval, featured display)
- [x] Golden Routes feature (bilingual routes, auto-calculated impact stats)
- [x] Open Graph meta tags and SEO improvements
- [x] Removed DEPLOYMENT-GUIDE.md and SEO-SNIPPETS.md (no longer needed)
- [x] Added 19 gallery images to `public/images/gallery/` and database (2026-02-27)
- [x] Fixed broken images in production for events, rebirthing, user profiles (2026-02-27)
  - Root cause: `POST /api/upload` route was missing in backend → 404 on user profile uploads
  - All upload endpoints now confirmed on Cloudinary (`aciky/gallery`, `aciky/content`, `aciky/profiles`)
- [x] Fixed profile image uploads returning 404 Cloudinary URLs (2026-02-27)
  - Root cause: `gravity: 'face'` in `uploadImage` handler requires Cloudinary face detection add-on
  - Fix: changed to `gravity: 'center'` → standard center crop, no add-ons required
  - Affected: `POST /api/upload` and `POST /api/upload/image` (admin + user dashboard uploads)
- [x] Added `onerror` fallbacks to all database images (2026-02-27)
  - Broken content images (events, schedule, rebirthing) hide gracefully instead of showing broken icon
  - Broken profile images fall back to `default-avatar.svg`
  - Fixed `default-avatar.png` → `.svg` reference bug in admin/users.js
- [x] Fixed dashboard.js profile upload to use `apiFetch` instead of raw `fetch` (2026-02-27)
  - Raw fetch was missing the Bearer token fallback → upload could fail on mobile
- [x] Google Search Console HTML verification file added, ownership verified (2026-02-27)
  - Sitemap fixed: removed `www.` prefix (canonical URL is aciky.org without www)
  - Next step: submit sitemap in GSC → `https://aciky.org/sitemap.xml`

## Known Issues
_No known issues at this time. Update this section when issues are discovered._

## Next Priorities
_[User to define next feature priorities]_

---

**Note**: This file should be updated at the end of each work session to reflect current project state.
