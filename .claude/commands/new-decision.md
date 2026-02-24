# New Decision Command

I need to document a new architectural decision. Guide me through the following:

1. **Ask me** what decision needs to be made
2. **Help me articulate** the context (what problem are we solving?)
3. **Propose 2–3 alternatives** with pros/cons
4. **Once I choose**, generate a new ADR file in `docs/decisions/` following this format:

```markdown
# ADR-[next number]: [Title]

## Status
Accepted

## Date
[today's date]

## Context
[What I described]

## Decision
[What was chosen]

## Alternatives Considered
[The alternatives we discussed with pros/cons]

## Consequences
### Positive
- [Benefits]

### Negative
- [Trade-offs]
```

5. **Then update** `docs/decisions/_index.md` with the new entry in the table

**Process:**
- Read `docs/decisions/_index.md` to get the next ADR number
- Create the new ADR file with appropriate number
- Add entry to the index table
- Keep the conversation interactive - don't generate everything at once
