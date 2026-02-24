# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ HTML Pages   │  │  Tailwind    │  │  JS Modules  │      │
│  │ (Handlebars) │  │   CSS 4      │  │  (Vanilla)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                                     │              │
│         └─────────────┬───────────────────────┘              │
│                       │                                      │
│                  ┌────▼────┐                                │
│                  │ main.js │ (Router + Auth Check)          │
│                  └────┬────┘                                │
│                       │                                      │
│                  ┌────▼────┐                                │
│                  │apiFetch │ (API Wrapper)                  │
│                  └────┬────┘                                │
└───────────────────────┼──────────────────────────────────────┘
                        │ HTTPS
                        │
┌───────────────────────▼──────────────────────────────────────┐
│              Backend API (yoga-backend repo)                 │
│                                                              │
│  ┌────────┐   ┌────────────┐   ┌─────────┐   ┌──────────┐  │
│  │ Routes │──▶│Controllers │──▶│Services │──▶│Repository│  │
│  └────────┘   └────────────┘   └─────────┘   └────┬─────┘  │
│                                                     │        │
│                                              ┌──────▼─────┐  │
│                                              │   MySQL    │  │
│                                              └────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Layer Structure

### Presentation Layer
- **HTML Pages**: Built with Vite + Handlebars partials (`{{> header}}`, `{{> footer}}`)
- **Styling**: Tailwind CSS 4 with custom `@theme` tokens for brand colors
- **Interactivity**: Vanilla JavaScript ES2022+ modules, no frameworks
- **Patterns**: Mobile-first responsive, semantic HTML5, Material Symbols icons

### Domain Layer (Frontend Logic)
- **Page Modules**: Each page has dedicated module with `init*()` function
- **Router**: `main.js` handles routing and loads appropriate page module
- **Auth**: `auth.js` manages authentication state (`checkAuth()`, `requireAuth()`, `requireAdmin()`)
- **API Client**: `api.js` provides `apiFetch()` wrapper with credentials and error handling
- **i18n**: Bilingual support (Spanish/English) via translation files

### Data Layer
- **Backend API**: Separate Node.js + Express repo at `d:/coding/yoga-backend`
- **Architecture**: Route → Controller → Service → Repository pattern
- **Auth**: Session-based with httpOnly cookies (`req.session.userId`)
- **Database**: MySQL

## Module Map

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **Core** | Entry point, routing, auth | `src/main.js`, `src/js/auth.js`, `src/js/api.js` |
| **Partials** | Reusable HTML components | `src/partials/header.hbs`, `footer.hbs`, `admin-nav.hbs`, `bottom-nav.hbs` |
| **Public Pages** | User-facing pages | `index.html`, `pages/*.html` |
| **Admin Pages** | Admin panel pages | `pages/admin/*.html`, `src/js/admin/*.js` |
| **Blog** | Blog feature (public + admin) | `pages/blog.html`, `pages/admin/blog-admin.html` |
| **Testimonials** | User testimonials system | `pages/testimonials.html`, admin pages |
| **Golden Routes** | Yoga routes feature | `pages/golden-routes.html`, admin pages |
| **i18n** | Translation system | `public/locales/es.json`, `en.json` |

## Data Flow

### Page Load Flow
1. User navigates to page → Vite serves HTML with partials injected
2. `main.js` executes → Calls `checkAuth()` to update navbar UI
3. Route detected → Loads appropriate page module (e.g., `initSchedule()`)
4. Page module fetches data via `apiFetch()` → Backend API
5. API returns JSON → Page module renders to DOM with `escapeHtml()`

### Authentication Flow
1. User submits login form → `apiFetch('/api/auth/login', { method: 'POST', body })`
2. Backend validates credentials → Creates session → Sets httpOnly cookie
3. Frontend stores user info in localStorage (fallback)
4. Subsequent requests include credentials automatically via `apiFetch()`
5. Protected pages call `requireAuth()` or `requireAdmin()` on init

### Backend Communication
- **All API calls** use `apiFetch()` from `src/js/api.js`
- **Credentials**: Included automatically (`credentials: 'include'`)
- **Content-Type**: JSON for POST/PUT/PATCH
- **Error Handling**: Throws on non-ok responses
- **Environment Detection**: Switches between localhost/LAN/production URLs

## External Dependencies

| Service | Purpose | Docs |
|---------|---------|------|
| **yoga-backend** | REST API for all data operations | `d:/coding/yoga-backend/CLAUDE.md` |
| **Material Symbols** | Icon library (web font) | https://fonts.google.com/icons |
| **WhatsApp API** | Direct messaging CTAs | https://wa.me/5350759360 |

## Build & Deployment

- **Build Tool**: Vite 7 (multi-page app config)
- **Dev Server**: `localhost:5173` (hot reload)
- **Production**: Static files in `dist/` → GitHub Pages
- **Backend Deploy**: Heroku (separate deployment)
