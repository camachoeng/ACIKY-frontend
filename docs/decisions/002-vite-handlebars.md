# 002: Vite + Handlebars for Templating

**Status**: Accepted
**Date**: 2025-XX-XX
**Deciders**: Project team

## Context

After deciding on vanilla JavaScript (ADR-001), we needed a solution for HTML reusability without a full framework. Key requirements:
- Reusable header/footer/navigation components
- No framework overhead (React/Vue components)
- Simple templating without runtime dependencies
- Fast development server with hot reload
- Multi-page application support

## Decision

Use **Vite 7** as build tool with **vite-plugin-handlebars** for HTML templating.

HTML pages use Handlebars partials syntax:
```html
{{> header}}
{{> footer}}
{{> admin-nav}}
{{> bottom-nav}}
```

Partials stored in `src/partials/` directory. Vite compiles partials at build time into static HTML.

## Consequences

### Positive
- **No runtime overhead**: Partials compiled to static HTML
- **Fast dev server**: Vite's HMR for instant updates
- **Simple syntax**: Handlebars is minimal and widely known
- **Multi-page support**: Vite's `rollupOptions.input` handles multiple HTML entry points
- **No framework lock-in**: Standard HTML output
- **Global variables**: Can pass `siteName`, `siteTitle`, `year` to all partials

### Negative
- **No reactivity**: Changes require page reload (acceptable for content-heavy site)
- **Build step required**: Can't run HTML files directly
- **Limited logic**: Handlebars has minimal conditionals (but this is a feature, keeps templates simple)
- **Manual registration**: New pages must be added to `vite.config.js`

### Implementation Details
- All pages registered in `vite.config.js` under `rollupOptions.input`
- Partials never copied/pasted - always use `{{> partial-name}}`
- Page routing handled by `main.js` (loads appropriate module)

## Alternatives Considered

1. **HTML includes (`<include>` tag)**:
   - Pros: No build tool needed, browser-native (future standard)
   - Cons: Not widely supported yet, no SSR support

2. **Server-side templating (Express + EJS/Pug)**:
   - Pros: Dynamic rendering, full templating features
   - Cons: Requires Node.js server (can't use GitHub Pages), deployment complexity

3. **Web Components**:
   - Pros: Native browser support, encapsulation
   - Cons: Requires JavaScript, more complex than needed, browser compatibility

4. **Manual copy/paste HTML**:
   - Pros: No dependencies, simple
   - Cons: Maintenance nightmare, inconsistencies across pages

## Related Decisions
- 001: Vanilla JavaScript (provides rationale for avoiding frameworks)
- 006: GitHub Pages deployment (requires static HTML output)
