# Plan: Cloud-Compatible Skill Storage System

## Setup Status (Completed)

- ✅ Project deployed: https://skill-forge-navy.vercel.app
- ✅ Blob store connected: `store_bGWxihMxgrpYW1WP` (IAD1 region)
- ✅ `BLOB_READ_WRITE_TOKEN` pulled to `.env.local`

## Problem

The current skill system uses direct filesystem operations (`.skills/` directory), which doesn't work on Vercel's serverless environment where:
- Write operations to disk are blocked
- Content isn't preserved between function invocations

## Requirements

- Skills can contain multiple files: `SKILL.md`, Python scripts, other executables
- Global skills (no user scoping) with manual delete option
- No versioning needed
- Hackathon demo app - prioritize simplicity

## Solution: Hybrid Storage Architecture

**Vercel Blob** for file content + **Turso** for metadata/search

```
┌─────────────────────────────────────────────────────────┐
│                    skill-commands.ts                     │
│              (unchanged command interface)               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Storage Abstraction Layer                   │
│                src/lib/skills/storage.ts                 │
├─────────────────────┬───────────────────────────────────┤
│   LocalStorage      │      CloudStorage                  │
│   (filesystem)      │   (Blob + Turso)                   │
│   - Dev mode        │   - Production                     │
└─────────────────────┴───────────────────────────────────┘
```

## Implementation Steps

### 1. Create storage abstraction interface

**File:** `src/lib/skills/storage.ts`

```typescript
interface SkillStorage {
  list(): Promise<SkillMeta[]>
  search(keyword: string): Promise<SkillMeta[]>
  get(name: string): Promise<Skill | null>
  set(name: string, content: string): Promise<void>
  addFile(name: string, filename: string, content: string): Promise<void>
  delete(name: string): Promise<void>
  listFiles(name: string): Promise<string[]>
}

interface SkillMeta {
  name: string
  description: string
  updatedAt: Date
}

interface Skill extends SkillMeta {
  content: string  // SKILL.md content
  files: string[]  // list of additional files
}
```

### 2. Implement LocalStorage (dev mode)

**File:** `src/lib/skills/local-storage.ts`

- Wraps existing filesystem logic from `skill-commands.ts`
- Used when `process.env.VERCEL !== '1'` (local development)

### 3. Implement CloudStorage (production)

**File:** `src/lib/skills/cloud-storage.ts`

**Turso Schema (metadata):**
```sql
CREATE TABLE skills (
  name TEXT PRIMARY KEY,
  description TEXT,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE skill_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  blob_url TEXT NOT NULL,
  FOREIGN KEY (skill_name) REFERENCES skills(name) ON DELETE CASCADE,
  UNIQUE(skill_name, filename)
);
```

**Vercel Blob:**
- Store files at path: `skills/{skill-name}/{filename}`
- Use `@vercel/blob` SDK for put/get/delete operations

### 4. Refactor skill-commands.ts

Replace direct `fs` calls with storage abstraction:

```typescript
import { getStorage } from './skills/storage';

const storage = getStorage(); // returns LocalStorage or CloudStorage

// Before: await fs.readdir(SKILLS_DIR)
// After:  await storage.list()
```

### 5. Add skill CRUD API

**File:** `src/app/api/skills/route.ts`

```typescript
GET  /api/skills         // List all skills
POST /api/skills         // Create skill (optional, agents use shell)
```

**File:** `src/app/api/skills/[name]/route.ts`

```typescript
GET    /api/skills/{name}   // Get skill details
DELETE /api/skills/{name}   // Delete skill
```

### 6. Add skills management UI

**File:** `src/components/skills-panel.tsx` (or integrate into existing sidebar)

- List all skills with name + description
- Delete button (with confirmation) for each skill
- Call `DELETE /api/skills/{name}` on confirm

### 7. Environment configuration

```env
# Vercel auto-sets VERCEL=1 in production - no custom config needed

# For local Blob integration testing
BLOB_READ_WRITE_TOKEN=xxx  # Vercel Blob token (optional, for local testing)
```

**Storage selection logic:**
```typescript
function getStorage(): SkillStorage {
  // Vercel auto-sets VERCEL=1 in deployed environments
  if (process.env.VERCEL === '1') {
    return new CloudStorage();
  }
  return new LocalStorage();
}
```

### 8. Add integration tests for Vercel Blob

**File:** `src/lib/skills/__tests__/cloud-storage.test.ts`

Integration tests that can run locally against real Vercel Blob:

```typescript
// Skip if no BLOB_READ_WRITE_TOKEN (CI without secrets)
describe.skipIf(!process.env.BLOB_READ_WRITE_TOKEN)('CloudStorage', () => {
  it('should create and retrieve a skill', async () => {
    const storage = new CloudStorage();
    await storage.set('test-skill', '---\nname: test\ndescription: test\n---\n# Test');
    const skill = await storage.get('test-skill');
    expect(skill?.name).toBe('test-skill');
    // Cleanup
    await storage.delete('test-skill');
  });

  it('should list skills', async () => { /* ... */ });
  it('should delete skills', async () => { /* ... */ });
  it('should handle skill files', async () => { /* ... */ });
});
```

**Run locally:**
```bash
# Set token for local Blob testing
export BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Run integration tests
npm test -- src/lib/skills/__tests__/cloud-storage.test.ts
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/skills/storage.ts` | NEW - abstraction interface + factory |
| `src/lib/skills/local-storage.ts` | NEW - filesystem implementation |
| `src/lib/skills/cloud-storage.ts` | NEW - Blob + Turso implementation |
| `src/lib/tools/skill-commands.ts` | Refactor to use storage abstraction |
| `src/lib/db/index.ts` | Add skills table migration |
| `src/app/api/skills/route.ts` | NEW - list endpoint |
| `src/app/api/skills/[name]/route.ts` | NEW - get/delete endpoints |
| `src/components/skills-panel.tsx` | NEW - skills list UI with delete |
| `src/lib/skills/__tests__/cloud-storage.test.ts` | NEW - Blob integration tests |
| `.env.example` | Add BLOB_READ_WRITE_TOKEN |

## Verification

1. **Local dev:** Run `skill set test "content"`, verify `.skills/test/SKILL.md` created
2. **Local dev:** Run `skill list`, `skill search test`, `skill get test` - all work
3. **Local dev:** Open skills panel UI, verify skills listed
4. **Local dev:** Click delete on a skill, confirm removal from filesystem
5. **Integration test:** Set `BLOB_READ_WRITE_TOKEN`, run `npm test -- cloud-storage.test.ts`
6. **Production build:** Deploy to Vercel preview
7. **Production:** Create skill via agent, verify stored in Blob + Turso
8. **Production:** Skills panel shows the skill
9. **Production:** Delete skill via UI removes from both Blob + Turso

## Dependencies to Add

```bash
npm install @vercel/blob
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Blob latency | Skills are small, latency acceptable for demo |
| Migration complexity | Keep local storage for dev, only cloud for prod |
| Cost | Vercel Blob has generous free tier for hackathon |
