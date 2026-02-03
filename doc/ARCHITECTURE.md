# Frontend Architecture Documentation

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Vite | 7.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first CSS (`@theme` directive) |
| Handlebars | 2.x | HTML partials (`vite-plugin-handlebars`) |
| Vanilla JS | ES2022+ | No framework, ES modules with dynamic `import()` |

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

## File Structure

```
yoga-v2/
├── doc/
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   └── CLAUDE_RULES.md
├── pages/
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── schedule.html
│   │   └── users.html
│   ├── about.html
│   ├── login.html
│   ├── register.html
│   └── schedule.html
├── public/
│   └── images/
│       ├── activity cards/
│       └── logo/
├── src/
│   ├── js/
│   │   ├── api.js              # apiFetch() wrapper, API_BASE config
│   │   ├── auth.js             # checkAuth(), requireAuth(), requireAdmin()
│   │   ├── login.js            # Login form handler
│   │   ├── register.js         # Register form handler
│   │   ├── schedule.js         # Public schedule page (dynamic cards)
│   │   └── admin/
│   │       ├── dashboard.js    # Admin stats
│   │       ├── schedule.js     # Activity CRUD
│   │       └── users.js        # User CRUD
│   ├── partials/
│   │   ├── admin-nav.html      # Admin sub-navigation
│   │   ├── bottom-nav.html     # Mobile bottom tab bar
│   │   ├── footer.html
│   │   └── header.html         # Navbar with auth-aware UI
│   ├── main.js                 # Entry point, page router, shared logic
│   └── style.css               # Tailwind imports + @theme brand colors
├── .gitignore
├── index.html
├── package.json
└── vite.config.js              # Multi-page input config + partials
```

## Module Architecture

### Entry Point (`main.js`)

All pages load `main.js` via `<script type="module">`. It runs shared logic on every page, then dynamically imports page-specific modules:

```
DOMContentLoaded
  ├── initMobileMenu()      # Shared: hamburger toggle
  ├── initLogout()           # Shared: logout buttons
  ├── checkAuth()            # Shared: update navbar for auth state
  └── initPage()             # Router: dynamic import by pathname
        ├── /                  → initHeroSchedule()  (inline)
        ├── /pages/login       → login.js
        ├── /pages/register    → register.js
        ├── /pages/schedule    → schedule.js
        ├── /pages/admin/dashboard → admin/dashboard.js
        ├── /pages/admin/users     → admin/users.js
        └── /pages/admin/schedule  → admin/schedule.js
```

Page-specific JS is only loaded when needed (code splitting via dynamic `import()`).

### Shared Modules

- **`api.js`** -- `apiFetch(path, options)` wrapper. Auto-detects backend URL by hostname. Includes `credentials: 'include'` for session cookies. Throws on non-ok responses.
- **`auth.js`** -- Manages auth state. Hybrid approach: server session (httpOnly cookie) + localStorage fallback. Exports `checkAuth()`, `requireAuth()`, `requireAdmin()`, `getUser()`.

## API Integration

### Environment Detection

`api.js` resolves the backend URL automatically:

| Frontend hostname | Backend URL |
|---|---|
| `localhost` | `http://localhost:3000` |
| `192.168.1.70` | `http://192.168.1.70:3000` |
| `camachoeng.github.io` | `https://aciky-backend-298cb7d6b0a8.herokuapp.com` |

### API Endpoints Used

| Endpoint | Used by | Purpose |
|---|---|---|
| `GET /api/auth/check` | auth.js | Verify session |
| `POST /api/auth/login` | login.js | Login |
| `POST /api/auth/logout` | main.js | Logout |
| `POST /api/auth/register` | register.js | Register |
| `GET /api/activities` | schedule.js, admin/schedule.js | List activities |
| `GET /api/activities/:id` | admin/schedule.js | Get single activity |
| `POST /api/activities` | admin/schedule.js | Create activity |
| `PUT /api/activities/:id` | admin/schedule.js | Update activity |
| `DELETE /api/activities/:id` | admin/schedule.js | Delete activity |
| `GET /api/users` | admin/users.js | List users |
| `GET /api/users/:id` | admin/users.js | Get single user |
| `POST /api/users` | admin/users.js | Create user |
| `PUT /api/users/:id` | admin/users.js | Update user |
| `DELETE /api/users/:id` | admin/users.js | Delete user |
| `GET /api/users/instructors` | admin/schedule.js | Instructor dropdown |

## Authentication Flow

```
User visits page
  └── checkAuth()
        ├── GET /api/auth/check (session cookie)
        ├── Fallback: localStorage token + loginTime (24h TTL)
        └── updateAuthUI()
              ├── Show/hide login/register buttons
              ├── Show/hide user menu + display name
              └── Show/hide admin links (role === 'admin')
```

### Route Guards

- **`requireAuth()`** -- Redirects to `/pages/login.html` if not authenticated
- **`requireAdmin()`** -- Calls `requireAuth()` first, then redirects to `/` if role is not `admin`

All admin pages (`pages/admin/*`) call `requireAdmin()` before loading content.

## Partials System (Handlebars)

HTML pages use `{{> partialName}}` syntax. Partials live in `src/partials/` and are resolved by `vite-plugin-handlebars`.

| Partial | Usage |
|---|---|
| `{{> header}}` | All pages |
| `{{> footer}}` | All pages |
| `{{> bottom-nav}}` | Public pages (mobile tab bar) |
| `{{> admin-nav}}` | Admin pages only |

Global context variables available in templates: `siteName`, `siteTitle`, `year`.

## Design System

### Brand Colors (defined in `style.css` via `@theme`)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#708558` | Main brand green |
| `primary-dark` | `#5c6c4a` | Buttons, headings |
| `primary-light` | `#a3be84` | Highlights, accents |
| `accent-teal` | `#5AACCC` | Instructor role badge |
| `accent-terracotta` | `#E8A090` | Warnings, delete actions |
| `accent-rose` | `#E87A9A` | Admin role badge |

### Typography

- Font: **Plus Jakarta Sans** (Google Fonts)
- Icons: **Material Symbols Outlined** (Google Fonts)

### Tailwind Note

Dynamic class names (e.g. `bg-${color}`) don't work with Tailwind's JIT scanner. Use static lookup arrays instead:

```js
// Correct: static full class names
const COLOR_CLASSES = [
  { bg10: 'bg-primary/10', text: 'text-primary' },
  { bg10: 'bg-accent-teal/10', text: 'text-accent-teal' }
]

// Wrong: template interpolation
const cls = `bg-${colorName}/10`  // Tailwind won't detect this
```

## Backend

Repository: `yoga-backend` (separate repo)
- Runtime: Node.js + Express
- Database: MySQL
- Auth: express-session with httpOnly cookies
- Architecture: Routes > Controllers > Services > Repositories
