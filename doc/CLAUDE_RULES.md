# CLAUDE_RULES.md - Rules for Claude Code

## Project Context

**Project**: ACIKY - Web platform for Kundalini Yoga center
**Stack**: HTML5 + Tailwind CSS 4 + Vanilla JavaScript + Vite 7
**Partials**: vite-plugin-handlebars (`{{> partial}}` syntax)
**Backend**: Node.js + Express + MySQL (separate repo: yoga-backend)
**Auth**: Sessions with httpOnly cookies + localStorage fallback
**Deploy**: GitHub Pages (frontend) + Heroku (backend)

---

## MANDATORY RULES

### 1. Tech Stack

**DO NOT use:**
- TypeScript
- React, Vue, Angular or any framework
- jQuery
- Bootstrap
- SASS/SCSS
- Webpack, Rollup (we use Vite)
- CDN for Tailwind (we use @tailwindcss/vite)

**DO use:**
- Semantic HTML5
- Tailwind CSS 4 with `@theme` directive in `src/style.css`
- JavaScript ES2022+ (vanilla, ES modules)
- Vite 7 as build tool
- vite-plugin-handlebars for HTML partials
- Material Symbols Outlined (icons via Google Fonts)
- Plus Jakarta Sans (font via Google Fonts)

### 2. File Structure

**ALWAYS follow this structure:**

```
yoga-v2/
├── doc/                     # Project documentation
├── pages/                   # HTML pages (not in src/)
│   ├── admin/               # Admin panel pages
│   └── *.html               # Public pages
├── public/images/           # Static assets
├── src/
│   ├── js/                  # JavaScript modules
│   │   ├── admin/           # Admin panel modules
│   │   ├── api.js           # Shared fetch wrapper
│   │   └── auth.js          # Auth state management
│   ├── partials/            # Handlebars partials (header, footer, etc.)
│   ├── main.js              # Entry point and page router
│   └── style.css            # Tailwind imports + @theme
├── index.html               # Home page (in root, not in pages/)
├── CLAUDE.md                # References this file
└── vite.config.js           # Multi-page input config + partials
```

**DO NOT create:**
- `.ts`, `.tsx`, `.jsx` files
- `components/` folders (we use `src/partials/`)
- Runtime dependencies in package.json (devDependencies only)

### 3. JavaScript Modules

**Required pattern: ES Modules with dynamic import()**

Each page has its own module loaded dynamically from `main.js`:

```javascript
// main.js - Page router
async function initPage() {
  const path = window.location.pathname
  if (path.includes('/pages/schedule.html')) {
    const { initSchedule } = await import('./js/schedule.js')
    initSchedule()
  }
}
```

```javascript
// Page module - exports an init function
import { apiFetch } from './api.js'

export async function initSchedule() {
  // page logic
}
```

**Always:**
- `const` and `let` (never `var`)
- `async/await` (not `.then()`)
- `try/catch` in async functions
- Export one `init*` function per page module
- Use `apiFetch()` from `api.js` for all backend calls
- Escape dynamic HTML with `escapeHtml()` (create div, use textContent)

### 4. Tailwind CSS 4

**Theme colors in `src/style.css` via `@theme`:**

```css
@import "tailwindcss";

@theme {
  --color-primary: #708558;
  --color-primary-dark: #5c6c4a;
  --color-primary-light: #a3be84;
  --color-accent-teal: #5AACCC;
  --color-accent-terracotta: #E8A090;
  --color-accent-rose: #E87A9A;
}
```

**Dynamic classes - use static arrays:**

```javascript
// CORRECT: full class names so Tailwind can detect them
const COLOR_CLASSES = [
  { bg: 'bg-primary/10', text: 'text-primary' },
  { bg: 'bg-accent-teal/10', text: 'text-accent-teal' }
]

// WRONG: interpolation that Tailwind can't detect
const cls = `bg-${color}/10`
```

### 5. Handlebars Partials

**Partials in `src/partials/`, use with `{{> name}}`:**

```html
<body>
  {{> header}}
  <main>...</main>
  {{> footer}}
  {{> bottom-nav}}
  <script type="module" src="/src/main.js"></script>
</body>
```

**Global variables available:** `siteName`, `siteTitle`, `year`

**Existing partials:**
- `header` - Navbar with auth-aware UI
- `footer` - Page footer
- `bottom-nav` - Mobile bottom tab bar (public pages only)
- `admin-nav` - Admin sub-navigation (admin pages only)

### 6. Authentication

**User roles:** `user`, `instructor`, `admin`

**Route guards:**
- `requireAuth()` - Redirects to login if not authenticated
- `requireAdmin()` - Redirects to home if not admin
- All admin pages must call `requireAdmin()` before loading content

**Adaptive UI:**
- `checkAuth()` runs on every page from `main.js`
- Shows/hides login buttons, user menu, admin links based on auth state

### 7. API

**Always use `apiFetch()` from `src/js/api.js`:**

```javascript
import { apiFetch } from './api.js'

// GET
const data = await apiFetch('/api/activities?active=true')

// POST/PUT
await apiFetch('/api/activities', {
  method: 'POST',
  body: JSON.stringify({ name: 'Yoga' })
})
```

`apiFetch` automatically includes:
- `credentials: 'include'` (session cookies)
- `Content-Type: application/json` (except GET/HEAD)
- Environment detection (localhost / LAN / production)
- Throws on non-ok responses with server error message

### 8. HTML

**Required:**
- Semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- `alt` on images
- `lang="es"` on `<html>`
- Include partials with `{{> name}}` (don't copy/paste)

**New pages must:**
1. Be registered in `vite.config.js` (rollupOptions.input)
2. Have a route added in `main.js` (initPage)
3. Use partials for header/footer

### 9. Naming Conventions

- HTML files: `kebab-case.html`
- JavaScript files: `camelCase.js`, variables `camelCase`, constants `UPPER_SNAKE_CASE`
- CSS: Use Tailwind utilities, avoid custom CSS
- Element IDs: `camelCase` (e.g., `scheduleContainer`, `activityModal`)
- Data attributes: `data-action`, `data-id` for event delegation

### 10. Event Delegation

**For dynamic lists, use event delegation:**

```javascript
container.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]')
  if (!btn) return
  const action = btn.dataset.action
  const id = parseInt(btn.dataset.id)
  if (action === 'edit') openEditModal(id)
  if (action === 'delete') confirmDelete(id)
})
```

---

## WHEN MODIFYING CODE

1. **DO NOT break existing conventions** - Maintain the current code style
2. **DO NOT add dependencies** without asking first
3. **DO NOT change the folder structure** without justified reason
4. **Maintain consistency** with the existing module pattern
5. **Respect the order** of imports and file structure

---

## COMMON MISTAKES TO AVOID

### Mistake 1: Dynamic Tailwind classes
```javascript
// BAD - Tailwind can't detect the class
const cls = `bg-${color}/10`

// GOOD - Full class name in static array
const classes = ['bg-primary/10', 'bg-accent-teal/10']
```

### Mistake 2: Fetch without apiFetch
```javascript
// BAD - No credentials or error handling
const res = await fetch('/api/users')

// GOOD - Use the shared wrapper
const data = await apiFetch('/api/users')
```

### Mistake 3: innerHTML without escaping
```javascript
// BAD - XSS vulnerable
container.innerHTML = `<p>${user.name}</p>`

// GOOD - Escape user data
container.innerHTML = `<p>${escapeHtml(user.name)}</p>`
```

### Mistake 4: Copy/paste header/footer
```html
<!-- BAD - Copying the header HTML -->
<header>...</header>

<!-- GOOD - Use partial -->
{{> header}}
```

---

## CHECKLIST BEFORE COMPLETING A TASK

- [ ] Code follows project conventions
- [ ] HTML is semantic
- [ ] JavaScript uses ES modules and async/await
- [ ] User data escaped with escapeHtml()
- [ ] apiFetch() used for backend calls
- [ ] New pages registered in vite.config.js
- [ ] No errors in console
- [ ] Works on mobile (mobile-first)
- [ ] No leftover console.log in final code
