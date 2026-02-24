# Code Conventions

## Tech Stack Quick Reference

- **Frontend**: HTML5, Tailwind CSS 4, Vanilla JavaScript ES2022+, Vite 7
- **Partials**: vite-plugin-handlebars (`{{> partial}}`)
- **Backend**: Node.js + Express + MySQL (separate repo at `d:/coding/yoga-backend`)
  - Architecture: Route → Controller → Service → Repository
  - Modules: auth, blog, activities, routes, users, booking, testimonials, stats, gallery, contact, spaces, upload
- **Auth**: Sessions with httpOnly cookies (`req.session.userId`) + localStorage fallback
- **Deploy**: GitHub Pages (frontend) + Heroku (backend)

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
- Material Symbols icons (NEVER emojis): `<span class="material-symbols-outlined text-primary">icon_name</span>`
- Proper Spanish accent marks in all translation files (á, é, í, ó, ú, ñ, ü, ¿, ¡)
- Primary green colors for CTA buttons: `bg-primary-dark text-white hover:bg-primary` (NEVER use accent colors for main CTAs)

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

## Established Features & Patterns

### Existing Features
- **Blog**: Public + admin pages, bilingual, instructor access from dashboard button (NOT header/admin panel), admin nav hidden for instructors
- **Testimonials**: Public + admin, user submissions, admin approval, featured for homepage
- **Golden Routes**: Public + admin, bilingual routes, auto-calculated impact stats

### Page Structure Patterns

**Hero Section** (card-style, NOT full-width):
```html
<section class="px-6 mb-10">
  <div class="relative h-[420px] rounded-3xl overflow-hidden shadow-xl">
    <!-- content -->
  </div>
</section>
```

**Quote Section** (place BEFORE hero):
```html
<section class="px-6 py-6">
  <div class="relative p-8 bg-white rounded-2xl shadow-sm border-l-4 border-primary">
    <!-- quote content -->
  </div>
</section>
```

**Homepage Preview Sections** (follow testimonials pattern):
- Title + subtitle in `px-6`
- Horizontal scrollable: `flex overflow-x-auto gap-5 px-6 pb-4 hide-scrollbar`
- "View all" link below

### Icon Usage

Use Material Symbols icons in cards:
```html
<div class="w-12 h-12 bg-background rounded-full flex items-center justify-center">
  <span class="material-symbols-outlined text-primary">spa</span>
</div>
```

Common icons: `spa`, `flutter_dash`, `auto_awesome`, `waves`, `candle`, `air`, `music_note`, `local_fire_department`, `wb_twilight`, `healing`, `explore`, `star`

Reference: [pages/about.html](pages/about.html)

### WhatsApp CTA Pattern

**ALWAYS** make WhatsApp messages bilingual via i18n:

1. **HTML**: No hardcoded text parameter
```html
<a id="whatsappCtaBtn" href="https://wa.me/5350759360">
```

2. **i18n files**: Add key in both `es.json` and `en.json`
```json
"cta": {
  "whatsappMessage": "Message with feature name + (este mensaje es desde el sitio web de ACIKY)"
}
```

3. **JS Module**: Create `updateWhatsAppLink()` function
```javascript
function updateWhatsAppLink() {
  const btn = document.getElementById('whatsappCtaBtn')
  if (btn) {
    btn.href = `https://wa.me/5350759360?text=${encodeURIComponent(t('cta.whatsappMessage'))}`
  }
}
// Update on language change
document.addEventListener('languageChanged', updateWhatsAppLink)
```

Examples: [src/js/onlinesadhana.js](src/js/onlinesadhana.js), [src/js/rebirthing.js](src/js/rebirthing.js)

## Internationalization (i18n)

**Spanish accent marks are MANDATORY** in all `.json` translation files:
- Vowels: á, é, í, ó, ú
- Other: ñ, ü
- Punctuation: ¿ (opening question), ¡ (opening exclamation)

Common words: expansión, transformación, misión, práctica, enseñanza, energía, planificación, identificación, descripción, visión, formación, certificación, región, promoción, contáctanos, únete, kilómetro, corazón, país, líder, básicas, auténtico, geográficas, logístico

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
| `primary-dark` | `#5c6c4a` | **CTA buttons**, headings |
| `primary-light` | `#a3be84` | Highlights, accents |
| `accent-teal` | `#5AACCC` | Instructor badge |
| `accent-terracotta` | `#E8A090` | Warnings, delete |
| `accent-rose` | `#E87A9A` | Admin badge |

**CTA Button Rule**: Always use primary green (`bg-primary-dark text-white hover:bg-primary`) for main CTA buttons. Accent colors (`accent-terracotta`, `accent-rose`, `accent-teal`) are ONLY for badges and secondary elements, NEVER for main CTAs.

## Backend Changes

**CRITICAL:** When a task requires backend modifications (in `d:/coding/yoga-backend`):

**ALWAYS** create a spec file at `backend-specs/<feature>.md` in this repo. The spec file must be a Claude Code-readable document describing all modifications needed in the `yoga-backend` repo. Include:
- Current state of the backend API (existing endpoints, DB schema)
- Required changes (new endpoints, DB alterations, service/repository modifications)
- Remember: Route → Controller → Service → Repository pattern
- Backend CLAUDE.md location: `d:/coding/yoga-backend/CLAUDE.md`

**Example spec file structure:**
```markdown
# Feature Name Backend Spec

## Current State
- Endpoint: GET /api/spaces
- DB table: spaces (columns: id, name, address, location)

## Required Changes
- Add name_en column (VARCHAR 255) to spaces table
- Update spaceRepository.create() to accept bilingual fields
- Update spaceService.createSpace() to extract and pass new fields
- Add validation for required bilingual fields
```

**DO NOT:**
- Directly modify backend files
- Include code snippets with line numbers
- Use detailed file paths in instructions

## Database Changes

**CRITICAL:** When database schema changes are needed:

1. **DO NOT** include SQL code snippets
2. **ALWAYS** provide simple action items for another Claude Code AI
3. Format as clear column/table descriptions
4. The AI will write the SQL based on these instructions

**Good format (simple todo list):**
```
Database Todo:
- Add name_en column (VARCHAR 255) to spaces table after name column
- Add address_en column (TEXT) to spaces table after address column
- Add municipality column (VARCHAR 100) to spaces table
- Rename location column to gps_location in spaces table
- Add discipline_name_en column (VARCHAR 100) to spaces_disciplines table
```

**Bad format (DO NOT USE):**
```
ALTER TABLE spaces ADD COLUMN name_en VARCHAR(255) AFTER name;
ALTER TABLE spaces ADD COLUMN address_en TEXT AFTER address;
```

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
