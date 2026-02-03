# CONVENTIONS.md - ACIKY Frontend

## General Principles

1. **Simplicity** - Clear code over clever code
2. **Consistency** - Always follow the same patterns
3. **Performance** - Optimized HTML, CSS, and JS for the web
4. **Accessibility** - Semantic HTML, ARIA when necessary
5. **Mobile-first** - Design for mobile, enhance for desktop

---

## Naming Conventions

### Files

- **HTML**: `kebab-case.html`
  - `schedule.html`, `admin-dashboard.html`
  - Not: `Schedule.html`, `adminDashboard.html`

- **JavaScript**: `camelCase.js`
  - `schedule.js`, `adminDashboard.js`
  - Not: `schedule-page.js`, `AdminDashboard.js`

- **Images**: `kebab-case.ext`
  - `hero-banner.webp`, `logo-dark.svg`
  - Not: `HeroBanner.webp`, `logoDark.svg`

### JavaScript

- **Variables and functions**: `camelCase`
  ```javascript
  const userName = 'Ana'
  function loadSchedule() {}
  ```

- **Constants**: `UPPER_SNAKE_CASE`
  ```javascript
  const API_BASE = 'http://localhost:3000'
  const MAX_RETRIES = 3
  ```

- **Init functions**: `init` + `PascalCase` (one per page module)
  ```javascript
  export async function initSchedule() {}
  export async function initDashboard() {}
  ```

### HTML

- **Element IDs**: `camelCase`
  ```html
  <div id="scheduleContainer"></div>
  <form id="loginForm"></form>
  ```

- **Data attributes**: `kebab-case` for event delegation
  ```html
  <button data-action="edit" data-id="5">Edit</button>
  <button data-action="delete" data-id="5">Delete</button>
  ```

### CSS / Tailwind

- **Custom theme tokens**: `kebab-case` in `@theme`
  ```css
  --color-primary-dark: #5c6c4a;
  --color-accent-teal: #5AACCC;
  ```

- **Custom classes** (only when Tailwind is not enough): `kebab-case`
  ```css
  .hide-scrollbar { }
  ```

---

## HTML Structure

### Order of elements in `<head>`

```html
<head>
    <!-- 1. Charset and viewport -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- 2. Title and meta description -->
    <title>ACIKY - Page Title</title>
    <meta name="description" content="...">

    <!-- 3. Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- 4. Favicon -->
    <link rel="icon" href="/public/images/logo/favicon.svg">

    <!-- 5. Google Fonts (Plus Jakarta Sans + Material Symbols) -->
    <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">

    <!-- 6. CSS (Vite handles this via main.js import) -->
    <!-- No manual CSS links needed - Tailwind is bundled by Vite -->
</head>
```

### Semantic HTML

```html
<!-- CORRECT: Use semantic elements -->
<header>     <!-- Site header / navbar -->
<nav>        <!-- Navigation links -->
<main>       <!-- Primary page content (one per page) -->
<section>    <!-- Thematic grouping with heading -->
<footer>     <!-- Site footer -->

<!-- WRONG: Generic divs for structural elements -->
<div class="header">
<div class="navigation">
```

### Accessibility

```html
<!-- Always alt on images -->
<img src="instructor.webp" alt="Instructor teaching Kundalini Yoga class">

<!-- Labels on form inputs -->
<label for="email">Email</label>
<input type="email" id="email" name="email">

<!-- ARIA when necessary -->
<button aria-label="Close menu" aria-expanded="false">
<nav aria-label="Main navigation">

<!-- lang="es" on html element -->
<html lang="es">
```

---

## CSS / Tailwind

### Use Tailwind utilities, avoid custom CSS

```html
<!-- CORRECT: Tailwind utilities -->
<div class="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm">

<!-- WRONG: Custom CSS for things Tailwind handles -->
<div class="my-card">
```

Custom CSS is only acceptable for:
- Base body/html styles (in `style.css`)
- Pseudo-element styles Tailwind can't handle
- Third-party overrides
- Scrollbar hiding (`.hide-scrollbar`)

### Theme colors via `@theme` (not `:root`)

```css
/* CORRECT: Tailwind 4 @theme directive */
@theme {
  --color-primary: #708558;
  --color-primary-dark: #5c6c4a;
}

/* WRONG: Standard CSS variables */
:root {
  --color-primary: #708558;
}
```

### Static class names for dynamic styling

```javascript
// CORRECT: Static lookup array
const ROLE_STYLES = {
  admin:      { bg: 'bg-accent-rose/10', text: 'text-accent-rose', label: 'Admin' },
  instructor: { bg: 'bg-accent-teal/10', text: 'text-accent-teal', label: 'Instructor' },
  user:       { bg: 'bg-primary/10',     text: 'text-primary',     label: 'User' }
}

// WRONG: Template interpolation (Tailwind can't detect these)
const cls = `bg-${role}/10`
const textCls = `text-${color}`
```

### Mobile-first approach

Design for mobile screens first, then use Tailwind responsive prefixes to enhance for larger screens:

```html
<!-- Mobile-first: base styles are mobile, sm/md/lg add desktop enhancements -->
<div class="px-4 md:px-8 lg:px-16">
<h1 class="text-2xl md:text-3xl lg:text-4xl">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## JavaScript

### ES Modules pattern

```javascript
// CORRECT: ES module with named exports
import { apiFetch } from './api.js'

export async function initSchedule() {
  // All page logic inside the init function
}

// WRONG: IIFE / Revealing Module pattern
const Schedule = (function() { /* ... */ })()

// WRONG: Global variables
window.scheduleData = []
```

### Async/Await (never callbacks or chained promises)

```javascript
// CORRECT: async/await with try/catch
async function loadActivities() {
  try {
    const activities = await apiFetch('/api/activities')
    renderActivities(activities)
  } catch (error) {
    console.error('Failed to load activities:', error)
    showErrorMessage('Could not load activities')
  }
}

// WRONG: Chained promises
apiFetch('/api/activities')
  .then(data => renderActivities(data))
  .catch(err => console.error(err))

// WRONG: No error handling
async function loadActivities() {
  const activities = await apiFetch('/api/activities')
  renderActivities(activities)
}
```

### Event delegation for dynamic content

```javascript
// CORRECT: Single listener on container with data attributes
container.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]')
  if (!btn) return
  const action = btn.dataset.action
  const id = parseInt(btn.dataset.id)
  if (action === 'edit') openEditModal(id)
  if (action === 'delete') confirmDelete(id)
})

// WRONG: Individual listeners on each dynamically created button
buttons.forEach(btn => btn.addEventListener('click', handleClick))
```

### XSS prevention

```javascript
// CORRECT: Escape user-provided data before inserting into HTML
function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

container.innerHTML = `<p>${escapeHtml(user.name)}</p>`

// WRONG: Direct interpolation of user data
container.innerHTML = `<p>${user.name}</p>`
```

### Comments

```javascript
// Comments only when they add value - explain "why", not "what"

// CORRECT: Explains the reason
// Delay refresh because the backend needs time to process the deletion
setTimeout(() => refreshList(), 500)

// WRONG: States the obvious
// Get the user name
const userName = user.name
```

### Variable declarations

```javascript
// CORRECT: const by default, let when reassignment is needed
const activities = await apiFetch('/api/activities')
let currentPage = 1

// WRONG: var (function-scoped, hoisted)
var activities = []
```

---

## API Calls

### Always use `apiFetch()`

```javascript
// CORRECT: Shared wrapper with credentials and error handling
import { apiFetch } from './api.js'

const users = await apiFetch('/api/users')
await apiFetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'Ana', role: 'user' })
})

// WRONG: Raw fetch (no credentials, no base URL, no error handling)
const res = await fetch('http://localhost:3000/api/users')
const data = await res.json()
```

---

## Images & Performance

### Image optimization

- **Format**: WebP preferred, SVG for icons/logos
- **Lazy loading**: `loading="lazy"` on images below the fold
- **Alt text**: Always descriptive, never empty

```html
<!-- Above the fold: no lazy loading -->
<img src="/public/images/hero.webp" alt="Kundalini Yoga class in session">

<!-- Below the fold: lazy loading -->
<img src="/public/images/instructor.webp" alt="Instructor portrait" loading="lazy">
```

### Script loading

All JavaScript is loaded via a single entry point with Vite's module system:

```html
<!-- CORRECT: Single entry point, Vite handles code splitting -->
<script type="module" src="/src/main.js"></script>

<!-- WRONG: Multiple script tags -->
<script src="/src/js/api.js"></script>
<script src="/src/js/schedule.js"></script>
```

---

## Git Commit Messages

### Format

```
<type>: <short description>

[Optional body with more details]
```

### Types

- `feat`: New functionality
- `fix`: Bug fix
- `style`: Style changes (CSS/Tailwind)
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `perf`: Performance improvement
- `chore`: Build config, dependencies, tooling

### Examples

```bash
feat: add WhatsApp booking button to schedule cards

fix: correct mobile menu scroll behavior

style: update CTA section with new brand colors

refactor: extract shared modal logic into utility

docs: update ARCHITECTURE.md with API endpoints
```

---

## What NOT to do

- Do not use jQuery, Bootstrap, or any CSS/JS framework
- Do not use inline styles (`style="..."`) - use Tailwind classes
- Do not use `!important` - fix specificity issues properly
- Do not use IDs for styling - use Tailwind classes
- Do not use generic `<div>` where a semantic element fits
- Do not leave `console.log` in production code
- Do not leave commented-out code - use git history instead
- Do not create global variables - use ES module scope
- Do not create files larger than ~300 lines - split into modules
- Do not use `var` - use `const` and `let`
- Do not add runtime dependencies to `package.json` - devDependencies only
