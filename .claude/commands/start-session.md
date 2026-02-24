# Start Session Command

Start a new development session with full context loading.

## Process

1. Read `docs/CURRENT_STATUS.md`
2. Read `docs/decisions/_index.md` (only the index, not individual ADRs)
3. Run: `gh issue list --label "in-progress" --limit 5`
4. Run: `gh pr list --state open --limit 5`

## Summary Format

Provide a brief summary:
- Current work in progress
- Open issues assigned or in progress
- Open PRs awaiting review
- Suggested focus for this session based on priorities in CURRENT_STATUS.md

Keep the summary under 20 lines. Do NOT read source code files.

## Usage

```
/session:start
```

OR use the simpler version (docs only, no GitHub CLI):
```
/project:status
```

## Example Output

```
📋 Session Start - 2026-02-24

## Current Work
- Implementing user profile API (#142)
  - Blocked by: Email validation strategy decision

## Open Issues (in-progress)
- #142: Add user profile endpoint
- #138: Fix flaky auth integration test

## Open PRs
- #145: Refactor authentication middleware (awaiting review)

## Recent Decisions
- ADR-014: Switch to bcrypt for password hashing (2026-02-20)

## Suggested Focus
1. Resolve email validation decision (use /decision:new)
2. Complete user profile API implementation
3. Address flaky test in #138
```

## Notes

- This command integrates with GitHub CLI (requires `gh` installed)
- Does NOT read source code files
- Provides context overview only, not implementation details
- Run this at the start of EVERY work session (Phase 1 - Login)

## See Also

- `/project:status` - Simpler version without GitHub CLI integration
- `/decision:new` - Document new architectural decision
- `/context:validate` - Check CFD structure integrity
