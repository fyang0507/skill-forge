# Skill Suggest Unification Implementation

Last Updated: 2026-01-17

## Summary

Implemented the skill suggest/update unification plan, consolidating command syntax and adding a two-phase flow with fuzzy search detection.

## Problem Solved

TaskAgent was using `skill suggest --update="skill-name"` without verifying if skills existed, creating confusion between create vs update actions.

## Implementation

### New Command Syntax

```
skill suggest "description" --name="skill-name"           # Check for similar skills
skill suggest "description" --name="skill-name" --force   # Skip check, proceed
```

### Two-Phase Flow

1. **No `--force`**: Backend performs fuzzy search using `--name` value
   - Match found (score ≥ 0.5) → Returns `status: 'guidance'` with similar skill names
   - No match → Returns `status: 'success'`

2. **With `--force`**: Skips fuzzy search, returns `status: 'success'`

### Agent Decision Point

When `status: 'guidance'` is returned, agent can:
- `skill get <name>` to review existing skill
- Re-run with `--force` to proceed anyway

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/tools/skill-commands.ts` | Async suggest command with fuzzy search logic |
| `src/lib/skills/storage.ts` | Added `SkillSearchResult` interface with `score` field |
| `src/lib/skills/local-storage.ts` | Updated search to return similarity scores |
| `src/lib/skills/cloud-storage.ts` | Updated search to return similarity scores |
| `src/components/ChatMessage.tsx` | Updated `SkillSuggestion` interface, UI shows button only for `success` |
| `src/components/ForgeDemo.tsx` | Fixed codify handler to use new `name` field |
| `src/lib/agent/task-agent.ts` | Updated instructions with new syntax |

## Key Technical Details

- Fuse.js distance score (0 = perfect match) converted to similarity score (1 = perfect): `similarity = 1 - fuseScore`
- Similarity threshold: 0.5
- Returns top 3 similar skills in guidance message

## Test Fixes

Fixed sandbox test isolation issues:
- `LocalSandboxExecutor` uses `.sandbox/{sandboxId}` internally
- Tests now generate unique sandbox IDs per test
- Added `clearSandboxExecutor()` calls to reset cached executor between tests
