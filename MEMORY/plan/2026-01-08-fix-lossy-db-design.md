# Fix Lossy Database Design for Messages

**Date**: 2026-01-08
**Status**: Implemented

## Problem

Message persistence loses data when switching conversations:
- Agent tool traces (`google_search`, `url_context`) with metadata
- Reasoning texts (`<thinking>` blocks)
- Source citations with URLs

**Root cause**: Only `iterations` (rawContent + toolOutput) stored. Rich `parts` array never persisted.

## Solution

Store both `iterations` and `parts` in the content column:

```typescript
// Before: content = JSON.stringify(iterations)
// After:  content = JSON.stringify({ iterations, parts })
```

## Implementation

**File**: `src/lib/db/index.ts`

1. `saveMessage()` - Now stores `{ iterations, parts }` object for assistant messages
2. `hydrateMessage()` - Destructures stored object directly: `const { iterations, parts } = JSON.parse(row.content)`
3. Deleted `reconstructParts()` - 50+ lines of lossy regex parsing removed

**Breaking change**: Old conversation data incompatible. Since we're in dev mode, no migration added.
