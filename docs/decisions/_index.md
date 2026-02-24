# Architecture Decision Records

This directory contains records of significant architectural decisions made for the ACIKY Frontend project.

## Decision Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| 001 | [Vanilla JavaScript (no frameworks)](001-vanilla-javascript.md) | Accepted | 2025-XX-XX |
| 002 | [Vite + Handlebars for templating](002-vite-handlebars.md) | Accepted | 2025-XX-XX |
| 003 | [Backend separation strategy](003-backend-separation.md) | Accepted | 2025-XX-XX |
| 004 | [Session-based authentication](004-session-auth.md) | Accepted | 2025-XX-XX |
| 005 | [Tailwind CSS 4 with @theme](005-tailwind-theme.md) | Accepted | 2025-XX-XX |
| 006 | [GitHub Pages + Heroku deployment](006-deployment-strategy.md) | Accepted | 2025-XX-XX |

## How to Add a New Decision

1. Create a new file: `NNN-decision-title.md` (e.g., `007-api-versioning.md`)
2. Use the following template:

```markdown
# NNN: Decision Title

**Status**: Accepted | Proposed | Rejected | Superseded by XXX
**Date**: YYYY-MM-DD
**Deciders**: [who was involved]

## Context
[Describe the situation that requires a decision]

## Decision
[Describe what was decided]

## Consequences
### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Trade-off 1]
- [Trade-off 2]

## Alternatives Considered
1. **[Alternative 1]**: Why it wasn't chosen
2. **[Alternative 2]**: Why it wasn't chosen
```

3. Add an entry to this index table
4. Update CURRENT_STATUS.md if relevant

---

**Note**: ADRs are immutable once accepted. To change a decision, create a new ADR that supersedes the old one.
