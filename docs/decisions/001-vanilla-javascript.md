# 001: Vanilla JavaScript (No Frameworks)

**Status**: Accepted
**Date**: 2025-XX-XX
**Deciders**: Project team

## Context

The ACIKY platform needed a frontend technology stack. Modern web development often defaults to React, Vue, or Angular, but we needed to evaluate if a framework was necessary for this project's requirements:
- Relatively simple UI (content-heavy, not highly interactive)
- Small team with varying JS experience
- Need for fast initial load times
- Static hosting (GitHub Pages)
- Limited ongoing maintenance resources

## Decision

Use **vanilla JavaScript ES2022+** with ES modules, without any frontend framework (React/Vue/Angular) or compile-to-JS languages (TypeScript, CoffeeScript).

All JavaScript code will:
- Use modern ES2022+ features (async/await, optional chaining, etc.)
- Be organized into ES modules
- Run directly in browsers without transpilation
- Use Vite only for development server and bundling

## Consequences

### Positive
- **Zero learning curve**: Standard JavaScript works everywhere
- **Smaller bundle size**: No framework overhead (~40-100KB saved)
- **Faster initial load**: Less parsing and execution time
- **Long-term stability**: No breaking framework updates
- **Direct debugging**: No framework abstraction layers
- **Browser compatibility**: Modern browsers support ES2022+ natively
- **Simple deployment**: Static files, no build complexity

### Negative
- **Manual DOM manipulation**: No reactive data binding
- **Event delegation required**: More boilerplate for dynamic content
- **State management**: Need custom solutions for complex state
- **Code organization**: Need discipline to avoid spaghetti code
- **Limited ecosystem**: Can't use React/Vue component libraries

### Mitigations
- Use **Handlebars partials** for HTML reusability (header/footer)
- Implement **page modules** pattern for organization
- Use **event delegation** for dynamic content
- Create **utility functions** (`apiFetch()`, `escapeHtml()`) for common tasks
- Enforce **~300 line file limit** to prevent monolithic modules

## Alternatives Considered

1. **React**:
   - Pros: Huge ecosystem, reactive updates, component reusability
   - Cons: 40KB+ overhead, JSX build step, steeper learning curve, overkill for content-heavy site

2. **Vue**:
   - Pros: Lighter than React (~30KB), simpler API, good documentation
   - Cons: Still adds overhead, requires build step, another framework to learn

3. **Svelte**:
   - Pros: Compiles to vanilla JS, no runtime overhead, reactive
   - Cons: Requires compilation, newer/smaller ecosystem, team unfamiliarity

4. **TypeScript**:
   - Pros: Type safety, better IDE support, catches errors early
   - Cons: Adds build complexity, compilation step required, team prefers vanilla JS

## Related Decisions
- 002: Vite + Handlebars for templating (provides HTML reusability without framework)
- 005: Tailwind CSS 4 with @theme (provides styling without JS framework)
