# ACIKY Frontend

**Project**: ACIKY - Web platform for Kundalini Yoga center
**Stack**: HTML5 + Tailwind CSS 4 + Vanilla JavaScript + Vite 7
**Partials**: vite-plugin-handlebars (`{{> partial}}` syntax)
**Backend**: Node.js + Express + MySQL (separate repo: `yoga-backend`)
**Auth**: Sessions with httpOnly cookies + localStorage fallback
**Deploy**: GitHub Pages (frontend) + Heroku (backend)

## Commands

```bash
npm run dev       # Dev server (localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Hard Constraints

**DO NOT use:** TypeScript, React/Vue/Angular, jQuery, Bootstrap, SASS/SCSS, Webpack/Rollup, CDN for Tailwind, `var`, `.then()` chains, raw `fetch()`, inline styles, `!important`

**ALWAYS use:**
- Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- Tailwind CSS 4 with `@theme` directive (not `:root` variables)
- JavaScript ES2022+ (vanilla, ES modules, `const`/`let`, `async`/`await` with `try`/`catch`)
- Vite 7 + vite-plugin-handlebars for HTML partials
- `apiFetch()` from `src/js/api.js` for ALL backend calls
- `escapeHtml()` for any user data inserted into HTML
- Event delegation with `data-action`/`data-id` for dynamic content
- Static class name arrays for dynamic Tailwind classes (never interpolate: `` `bg-${color}` ``)
- Mobile-first responsive design (`px-4 md:px-8 lg:px-16`)
- `lang="es"` on `<html>`, `alt` on all images, labels on form inputs

**DO NOT:**
- Add runtime dependencies to `package.json` (devDependencies only)
- Create `.ts`, `.tsx`, `.jsx` files or `components/` folders (use `src/partials/`)
- Leave `console.log` or commented-out code in production
- Create files larger than ~300 lines (split into modules)
- Create global variables (use ES module scope)
- Use IDs for styling (use Tailwind classes)
- Change folder structure or add dependencies without asking first

## File Structure

```
yoga-v2/
├── pages/                   # HTML pages (not in src/)
│   ├── admin/               # Admin panel pages
│   └── *.html               # Public pages
├── public/images/           # Static assets
├── src/
│   ├── js/                  # JavaScript modules
│   │   ├── admin/           # Admin panel modules
│   │   ├── api.js           # apiFetch() wrapper + API_BASE config
│   │   └── auth.js          # checkAuth(), requireAuth(), requireAdmin()
│   ├── partials/            # Handlebars partials (header, footer, etc.)
│   ├── main.js              # Entry point + page router
│   └── style.css            # Tailwind imports + @theme brand colors
├── index.html               # Home page (root, not in pages/)
└── vite.config.js           # Multi-page input config + partials
```

## Key Patterns

### Page Modules

Each page has its own module loaded dynamically from `main.js`. Each module exports one `init*` function (`initSchedule()`, `initDashboard()`, etc.). New pages must:
1. Be registered in `vite.config.js` (`rollupOptions.input`)
2. Have a route in `main.js` (`initPage()`)
3. Use partials for header/footer (`{{> header}}`, `{{> footer}}`)

### Partials

Use `{{> header}}`, `{{> footer}}`, `{{> bottom-nav}}` (public pages), `{{> admin-nav}}` (admin pages). Never copy/paste header or footer HTML. Global variables available: `siteName`, `siteTitle`, `year`.

### Authentication

- Roles: `user`, `instructor`, `admin`
- `checkAuth()` runs on every page from `main.js` (updates navbar UI)
- `requireAuth()` redirects to `/pages/login.html` if not authenticated
- `requireAdmin()` redirects to `/` if not admin
- All admin pages must call `requireAdmin()` before loading content

### API Calls

Always use `apiFetch()` — it handles credentials (`include`), content-type, environment detection (localhost/LAN/production), and throws on non-ok responses. Never use raw `fetch()`.

### Dynamic Tailwind Classes

```javascript
// CORRECT: static lookup
const STYLES = { admin: { bg: 'bg-accent-rose/10', text: 'text-accent-rose' } }

// WRONG: interpolation (Tailwind can't detect)
const cls = `bg-${color}/10`
```

### XSS Prevention

```javascript
// CORRECT: escape user data
container.innerHTML = `<p>${escapeHtml(user.name)}</p>`

// WRONG: direct interpolation
container.innerHTML = `<p>${user.name}</p>`
```

### Event Delegation

```javascript
container.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]')
  if (!btn) return
  const { action, id } = btn.dataset
  if (action === 'edit') openEditModal(parseInt(id))
  if (action === 'delete') confirmDelete(parseInt(id))
})
```

## Naming Conventions

| What | Convention | Example |
|---|---|---|
| HTML files | `kebab-case.html` | `admin-dashboard.html` |
| JS files | `camelCase.js` | `adminDashboard.js` |
| Variables/functions | `camelCase` | `loadSchedule()` |
| Constants | `UPPER_SNAKE_CASE` | `API_BASE` |
| Init functions | `init` + PascalCase | `initSchedule()` |
| Element IDs | `camelCase` | `scheduleContainer` |
| Data attributes | `kebab-case` | `data-action="edit"` |
| CSS tokens | `kebab-case` | `--color-primary-dark` |
| Images | `kebab-case.ext` | `hero-banner.webp` |

## Brand Colors (`@theme` in style.css)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#708558` | Main brand green |
| `primary-dark` | `#5c6c4a` | Buttons, headings |
| `primary-light` | `#a3be84` | Highlights, accents |
| `accent-teal` | `#5AACCC` | Instructor badge |
| `accent-terracotta` | `#E8A090` | Warnings, delete |
| `accent-rose` | `#E87A9A` | Admin badge |

## Git Commits

Format: `<type>: <short description>`
Types: `feat`, `fix`, `style`, `refactor`, `docs`, `perf`, `chore`

## Checklist Before Completing a Task

- [ ] Code follows project conventions (no frameworks, no TypeScript)
- [ ] HTML is semantic with proper accessibility
- [ ] JavaScript uses ES modules, async/await, try/catch
- [ ] User data escaped with `escapeHtml()`
- [ ] `apiFetch()` used for all backend calls
- [ ] New pages registered in `vite.config.js` and routed in `main.js`
- [ ] Tailwind classes are static (no interpolation)
- [ ] No `console.log` or commented-out code
- [ ] Works on mobile (mobile-first)
