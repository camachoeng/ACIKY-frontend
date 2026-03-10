# Current Project Status

Last updated: 2026-03-10

## In Progress
_No active work at this time._

## Recently Completed
- [x] **Admin users modal bilingual fix - COMPLETE** (2026-03-10)
  - `src/js/admin/users.js`: imported `t()` from i18n.js, replaced all hardcoded Spanish strings with `t()` calls
  - `pages/admin/users.html`: added `data-i18n` / `data-i18n-placeholder` to all hardcoded labels and inputs (password, role, position, search)
  - `src/i18n/es/admin-users.json` + `en/admin-users.json`: added `table.searchPlaceholder` key
- [x] **Golden Routes Vision section editable - COMPLETE** (2026-03-10)
  - `pages/golden-routes.html`: added IDs to vision goal elements
  - `src/js/goldenRoutes.js`: added `loadVisionSettings()` — calls `GET /api/settings`, overrides vision DOM; falls back to i18n defaults on error
  - `pages/admin/golden-routes.html`: added "Editar Visión" button + 6-field vision modal
  - `src/js/admin/goldenRoutes.js`: `openVisionModal()`, `closeVisionModal()`, `saveVision()` using `PUT /api/settings`
  - `src/i18n/es/admin-golden-routes.json` + `en/`: added full `vision` section keys + `errors.visionSaveError`
  - Backend: `settingsRepository.js`, `settingsService.js`, `settingsController.js`, `routes/settings.js` — `GET /api/settings` (public), `PUT /api/settings` (requireAdmin)

## Recently Completed
- [x] **Blog tags bilingual + multiple fixes - COMPLETE** (2026-03-10)
  - Blog tags now bilingual: `tags_en VARCHAR(500)` column added to `blog_posts`; admin form shows ES + EN tag fields; public blog uses `localized(post, 'tags')` so tag filter shows correct language; language switch resets active tag
  - Admin spaces list sorted alphabetically by name
  - Homepage spaces carousel re-renders on language change (was missing from `languageChanged` listener)
  - "Espacios Establecidos" → "Espacios Alcanzados" / "Spaces Reached" in admin and public golden routes (both ES and EN i18n)
  - Route cards (public golden-routes page + homepage carousel) now uniform height: fixed `h-52` / `h-40` image area with placeholder icon when no image; `flex flex-col` layout
  - Editable Vision section in golden routes: admin can click "Editar Visión" to open modal and update the 3 goals via `PUT /api/settings`; public page loads overrides via `GET /api/settings` and falls back to i18n defaults
  - Backend spec at `backend-specs/site-settings.md` (new `site_settings` table + `/api/settings` endpoints needed)
  - Backend spec at `backend-specs/blog-tags-en.md` (`tags_en` column + repo/service/controller pass-through)
- [x] **Admin instructor ordering - COMPLETE** (2026-03-10)
  - New `pages/admin/team-order.html` page: admin can reorder instructors for the "Our Team" section on the About page using up/down arrows; saves via `PUT /api/users/team/order`
  - Spaces modal: when ≥2 instructors are selected, an "Instructor Order" section appears with up/down arrows; the saved `instructor_ids` array preserves this order, which the backend uses as `sort_order` in `space_instructors`
  - Backend spec at `backend-specs/instructor-ordering.md`
  - "Orden Equipo" link added to admin nav
- [x] **Stale broken image URLs resolved - COMPLETE** (2026-03-10)
  - Pre-Cloudinary broken image URLs re-uploaded via admin panel
  - Full save pipeline confirmed working end-to-end
- [x] **Heroku Scheduler configured - COMPLETE** (2026-03-10)
  - `node scripts/cleanup.js` job added in Heroku dashboard, runs every 24 hours
- [x] **Admin dashboard notifications - COMPLETE** (2026-03-09)
  - Dashboard now fetches pending testimonials (`GET /api/testimonials`) and recent blog posts (`GET /api/blog`)
  - Amber card shows pending testimonial count → links to testimonials admin (hidden when 0)
  - Green card shows blog posts published in the last 7 days → links to blog admin (hidden when 0)
  - Notifications section only appears when at least one count is > 0
- [x] **Social sharing (Web Share API) - COMPLETE** (2026-03-09)
  - Created `src/js/utils/share.js`: uses `navigator.share()` natively; falls back to clipboard copy + toast notification
  - Blog: share button on each card (shares `blog.html#post-{id}`) + share button in post detail view
  - Schedule: share button next to book button on each class card (shares schedule page URL)
  - Events: share button below WhatsApp CTA (shares event page URL with `?id=`)
  - Posturas: share button inside lightbox (shares posturas page URL)
  - Videos: share button inside video modal (shares YouTube URL directly)
  - Added `common.share` and `common.urlCopied` i18n keys to both languages
- [x] **GPS URL deprecation warning in admin spaces - COMPLETE** (2026-03-09)
  - `maps.app.goo.gl` links from Google Maps "Share" button stopped working (Firebase Dynamic Links discontinued Aug 2025)
  - Admin spaces form now shows a red inline warning when a deprecated short URL is detected in the GPS Location field
  - Warning is bilingual, non-blocking (doesn't prevent saving), and also triggers when opening existing spaces with bad URLs
  - Fix: admins must copy the full URL from the browser address bar in Google Maps (starts with `maps.google.com` or `google.com/maps`)

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
- [x] Fixed admin user edit silently dropping `profile_image_url` (2026-02-27)
  - Root cause: `updateUser` destructured `req.body` but never included `profile_image_url`
  - Fix: backend now accepts, validates (Cloudinary URL check), and saves the field
  - Also deletes old Cloudinary image when replaced
- [x] Added `onerror` fallbacks to all database images (2026-02-27)
  - Broken content images (events, schedule, rebirthing) hide gracefully instead of showing broken icon
  - Broken profile images fall back to `default-avatar.svg`
  - Fixed `default-avatar.png` → `.svg` reference bug in admin/users.js
- [x] Fixed dashboard.js profile upload to use `apiFetch` instead of raw `fetch` (2026-02-27)
  - Raw fetch was missing the Bearer token fallback → upload could fail on mobile
- [x] Google Search Console HTML verification file added, ownership verified (2026-02-27)
  - Sitemap fixed: removed `www.` prefix (canonical URL is aciky.org without www)
  - Next step: submit sitemap in GSC → `https://aciky.org/sitemap.xml`
- [x] Fixed "Missing translation: pageTitle" console warning (2026-03-02)
  - Root cause: `applyTranslations()` calls `t('pageTitle')` on every page, but most page JSON files lacked the key
  - Fix: added `"pageTitle": "ACIKY"` to both `es/common.json` and `en/common.json` as fallback
  - Pages with their own `pageTitle` (e.g. admin-users) still use their specific title
  - Also added `pages/admin/festival.html` to i18n.js `pageMap` (was registered in vite.config.js but missing from map)
- [x] Fixed session expiry not logging users out (2026-03-02)
  - Root cause: `checkAuth()` used `data.isAuthenticated || tokenValid` — localStorage data overrode the backend's "not authenticated" response, keeping users stuck as logged-in
  - Fix: `checkAuth()` now trusts the backend's `isAuthenticated` value directly; clears both localStorage and sessionStorage when false
  - localStorage fallback preserved only for actual network failures (backend unreachable)
  - Mobile Bearer token auth still works — backend validates the token and returns correct `isAuthenticated` value

- [x] **Secure password recovery (forgot password) - COMPLETE** (2026-03-03)
  - `pages/forgot-password.html` + `src/js/forgot-password.js` — email request form, generic response (anti-enumeration)
  - `pages/reset-password.html` + `src/js/reset-password.js` — token from URL, same password validation as register
  - "¿Olvidaste tu contraseña?" link added to login page
  - Backend: SHA-256 hashed token stored in DB, bcrypt for new password, single-use (token cleared atomically with password update), 1-hour expiry
  - Backend uses `FRONTEND_URL` env var for reset link (localhost in dev, aciky.org in prod)
  - Registered in `vite.config.js`, `main.js`, and `i18n.js` pageMap
- [x] **Cloudinary cleanup system - COMPLETE** (2026-03-03)
  - Admin cleanup page now shows environment badge (green=production, amber=development) pulled from backend
  - Dev warning banner shown automatically when on localhost
  - Added "1 hora (prueba)" and "2 horas (prueba)" options for testing without waiting 24h
  - Backend Phase 1: `CLOUDINARY_FOLDER_PREFIX` env var separates dev (`aciky-dev/`) from prod (`aciky/`) uploads — verified working
  - Backend Phase 2: cleanup now calls `cloudinary.uploader.destroy()` before DB delete — verified: 23 orphaned dev uploads cleaned, production unaffected
  - Backend Phase 3: `scripts/cleanup.js` standalone script for Heroku Scheduler (production-only guard, runs at 03:00 UTC daily)
  - Spec: `backend-specs/cleanup-improvements.md`
- [x] **Cloudinary cleanup redesigned — DB-vs-Cloudinary reconciliation - COMPLETE** (2026-03-04)
  - Replaced time-based temporary-uploads approach with true orphan detection: list all Cloudinary assets, compare against all image URLs in every DB table, delete what's unreferenced
  - Both dev and prod now share the same `aciky/` Cloudinary folder (removed `aciky-dev/` separation); `uploadController.js` updated to hardcode `'aciky'` prefix
  - Backend: new `config/databaseSecondary.js` (optional second DB pool from `DB2_*` env vars) + new `services/cloudinaryOrphanService.js` querying both DBs and merging reference sets
  - Backend: added `GET /api/cleanup/orphaned` (preview/dry-run) and `POST /api/cleanup/orphaned` (delete) to `routes/cleanup.js` and `controllers/cleanupController.js`
  - Backend: `scripts/cleanup.js` updated to use `cloudinaryOrphanService.deleteOrphaned()` instead of old time-based approach
  - Frontend: `pages/admin/cleanup.html` + `src/js/admin/cleanup.js` fully redesigned — Analyze button shows Cloudinary total / DB total / orphaned count + list; Delete button with confirmation; auto-re-analyzes after deletion
  - Dev `.env` now includes `DB2_*` pointing to Heroku prod DB for accurate dual-DB analysis locally
  - Spec: `backend-specs/cloudinary-orphan-cleanup.md`
- [x] **Fixed mobile login (Bearer token fallback in checkAuth) - COMPLETE** (2026-03-04)
  - Root cause: `authController.checkAuth` only checked `req.session.userId` — never the Bearer token fallback
  - Mobile Safari blocks cross-origin session cookies → session was always empty → `isAuthenticated: false` immediately after login
  - Fix: `checkAuth` now uses `getUserId(req)` from `utils/authToken`; if token path, queries DB for user data
  - Session path (desktop) unchanged; Bearer token path (mobile) added with DB query
  - Spec: `backend-specs/fix-mobile-auth-check.md`
- [x] **Fixed "Hola," without name after session expiry - COMPLETE** (2026-03-05)
  - Root cause: `requireAuth` middleware partially restores the session from Bearer token (sets only `req.session.userId`, not `name`/`email`/etc.); on the next `checkAuth` call the session path was entered but returned `name: undefined`
  - Fix: `checkAuth` session path now requires `req.session.userId && req.session.email` — if only `userId` is present (partial restore), falls through to the Bearer token / DB path which returns the full user record
  - Spec: `backend-specs/fix-checkauth-incomplete-session.md`
- [x] **Fixed file input not detecting re-selected same image in posturas admin** (2026-03-05)
  - Root cause: browser does not fire `change` event when the same file path is selected again
  - Fix: reset file input value to `''` after each successful upload in `src/js/admin/posturas.js`
- [x] **Allowed instructor and admin roles to write testimonials** (2026-03-07)
  - Root cause: `setupAuthSection()` in `src/js/testimonials.js` only showed the write form for `role === 'user'`; instructors and admins fell into the else branch (both sections hidden)
  - Fix: simplified condition to show write form for any authenticated user regardless of role
  - Also updated `testimonials.subtitle` i18n key: "practicantes" → "comunidad" / "practitioners" → "community"
- [x] **Privacy Policy and Terms of Use pages - COMPLETE** (2026-03-07)
  - `pages/privacy.html` + `src/i18n/es/privacy.json` + `src/i18n/en/privacy.json`
  - `pages/terms.html` + `src/i18n/es/terms.json` + `src/i18n/en/terms.json`
  - Terms includes dedicated "Publicación de blogs" section covering the CEU ACIKY Tribunal review process and Yogi Bhajan teaching alignment requirement
  - Footer updated with Privacy Policy, Terms of Use, and Contact links (visible on every page)
  - Both pages registered in `vite.config.js` and `i18n.js` pageMap
  - Footer link i18n keys added to `es/common.json` and `en/common.json`

## Known Issues
_No known issues at this time._

## Next Priorities
_[User to define next feature priorities]_

---

**Note**: This file should be updated at the end of each work session to reflect current project state.
