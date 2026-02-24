# 005: Tailwind CSS 4 with @theme

**Status**: Accepted
**Date**: 2025-XX-XX
**Deciders**: Project team

## Context

After deciding on vanilla JavaScript (ADR-001), we needed a CSS strategy. Requirements:
- Brand colors (primary green, accent colors)
- Responsive design (mobile-first)
- Fast development (utility classes)
- No CSS-in-JS or styled-components (framework-free)

Tailwind CSS 4 introduced `@theme` directive as replacement for CSS variables.

## Decision

Use **Tailwind CSS 4** with **`@theme` directive** for brand tokens.

Configuration in `src/style.css`:
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

Use in HTML: `class="bg-primary text-white"` (not `bg-[#708558]`)

**Critical constraint**: Never interpolate Tailwind classes in JavaScript:
```javascript
// ❌ WRONG: Tailwind can't detect at build time
const cls = `bg-${color}/10`

// ✅ CORRECT: Static lookup
const STYLES = { admin: { bg: 'bg-accent-rose/10' } }
```

## Consequences

### Positive
- **Fast development**: Utility classes, no CSS file management
- **Small bundle**: PurgeCSS removes unused classes automatically
- **Responsive**: Built-in breakpoints (`md:`, `lg:`)
- **Brand consistency**: `@theme` tokens ensure color consistency
- **No naming**: No need for BEM, SMACSS, or other methodologies
- **Readable HTML**: Class names describe appearance
- **Dark mode ready**: Tailwind has built-in dark mode support

### Negative
- **HTML verbosity**: Many classes per element
- **Learning curve**: Need to memorize utilities
- **Tooling required**: Vite plugin for processing
- **No dynamic classes**: Can't interpolate class names
- **Purging issues**: Unused classes removed (must use static strings)

### Conventions Enforced
- Mobile-first responsive: `px-4 md:px-8 lg:px-16`
- **CTA buttons use primary green**: `bg-primary-dark text-white hover:bg-primary`
- Accent colors (`accent-rose`, `accent-teal`, `accent-terracotta`) ONLY for badges, NEVER for main CTAs
- Material Symbols icons, NEVER emojis
- No IDs for styling (use classes)
- No `!important` (use specificity)

## Alternatives Considered

1. **Custom CSS (BEM methodology)**:
   - Pros: Full control, no build step, traditional
   - Cons: Naming bikeshedding, file organization, harder maintenance, larger bundles

2. **CSS Modules**:
   - Pros: Scoped styles, prevents conflicts
   - Cons: Requires build tool, more files, still need to write CSS

3. **Bootstrap**:
   - Pros: Ready components, familiar
   - Cons: Large bundle (~200KB), opinionated styling, jQuery dependency (Bootstrap 4), harder customization

4. **Styled Components / CSS-in-JS**:
   - Pros: Dynamic styling, scoped
   - Cons: Framework dependency (conflicts with ADR-001), runtime overhead, theme complexity

5. **Tailwind CSS 3 (with :root variables)**:
   - Pros: Same utilities as v4
   - Cons: v4's `@theme` is cleaner, better DX, better performance

## Related Decisions
- 001: Vanilla JavaScript (no CSS-in-JS frameworks)
- 002: Vite + Handlebars (Vite processes Tailwind)
