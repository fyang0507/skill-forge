# Cloud Skill Storage + Lint Fixes

Last Updated: 2026-01-13

## Summary

Implemented production-ready cloud storage for skills and fixed all lint errors.

## Cloud Storage Implementation

**Architecture:** Hybrid storage with abstraction layer

- `storage.ts` - Interface + factory (`getStorage()` returns LocalStorage or CloudStorage)
- `local-storage.ts` - Filesystem-based for local dev (`.skills/` directory)
- `cloud-storage.ts` - Vercel Blob (content) + Turso (metadata) for production

**Storage Selection Logic:**
```typescript
if (process.env.VERCEL === '1') → CloudStorage
else → LocalStorage
```

**Database Tables Added** (`src/lib/db/index.ts`):
- `skills(name, description, updated_at)` - metadata
- `skill_files(skill_name, filename, blob_url)` - file references

**New Files:**
- `src/lib/skills/storage.ts` - abstraction interface
- `src/lib/skills/local-storage.ts` - filesystem impl
- `src/lib/skills/cloud-storage.ts` - Blob + Turso impl
- `src/app/api/skills/route.ts` - GET list, POST create
- `src/app/api/skills/[name]/route.ts` - GET/DELETE endpoints
- `src/components/SkillsPanel.tsx` - UI with delete functionality
- `src/lib/skills/__tests__/` - tests (19 pass, 9 skipped without tokens)

## Lint Fixes Applied

1. **Unused imports removed:**
   - `skill-agent.ts`: removed `google` (tools moved to providerOptions)
   - `db/index.ts`: removed `AgentIteration`, `MessageStats`, `MessagePart`
   - `cloud-storage.ts`: removed `blobList`

2. **ESLint config:** Added `venv/**` to globalIgnores

3. **React hooks fixes:**
   - `useConversations.ts`: reordered hooks, added fetchConversations to deps
   - `ForgeDemo.tsx`: added eslint-disable for valid URL sync pattern

## Future: Toggle Storage Locally

To test CloudStorage in local dev, add explicit `SKILL_STORAGE` env var:
```typescript
if (process.env.SKILL_STORAGE === 'cloud') → CloudStorage
else if (process.env.SKILL_STORAGE === 'local') → LocalStorage
else if (process.env.VERCEL === '1') → CloudStorage
else → LocalStorage
```
