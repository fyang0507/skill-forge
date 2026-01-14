# Plan: Persist Agent Mode Across Conversation

## Problem
When user clicks "codify-skill" button, only that single request uses `skillAgent`. Subsequent messages fall back to `taskAgent` because mode defaults to `'task'` per-request.

**Desired behavior:**
1. Once skillAgent takes over (after codify-skill click), it should remain in control for skill tuning
2. When revisiting a historical conversation, the correct mode should be restored

## Solution Overview
Add `mode` field to conversations table and persist it throughout the conversation lifecycle.

---

## Part 1: Database Schema

### File: `src/lib/db/index.ts`

**Change 1: Add mode to Conversation interface**
```typescript
export interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  mode: 'task' | 'codify-skill';  // ADD
}
```

**Change 2: Update schema creation** (add migration for existing DBs)
```sql
ALTER TABLE conversations ADD COLUMN mode TEXT DEFAULT 'task'
```

**Change 3: Update createConversation()** to include mode in INSERT

**Change 4: Update getConversation()** to return mode

**Change 5: Add updateConversationMode()** function or extend existing update

---

## Part 2: Hooks

### File: `src/hooks/useConversations.ts`

**Change 1: Update Conversation interface** to include `mode`

**Change 2: Update createConversation()** to accept optional mode parameter

**Change 3: Add updateMode()** function to update conversation mode

**Change 4: Update switchConversation()** to return mode with conversation data

---

## Part 3: API Routes

### File: `src/app/api/conversations/route.ts`
- Update POST to accept `mode` parameter (default 'task')

### File: `src/app/api/conversations/[id]/route.ts`
- Update GET to return `mode`
- Update PATCH to support `mode` updates

---

## Part 4: Frontend UI

### File: `src/components/ForgeDemo.tsx`

**Change 1: Add state**
```tsx
const [currentMode, setCurrentMode] = useState<'task' | 'codify-skill'>('task');
```

**Change 2: Restore mode when switching conversations** (in handleSelectConversation)
```tsx
const result = await switchConversation(id);
if (result) {
  setCurrentMode(result.conversation.mode || 'task');
  // ... existing code
}
```

**Change 3: Use currentMode in handleSubmit** (line 204)
```tsx
await sendMessage(message, currentMode);
```

**Change 4: Set and persist mode in handleCodifySkill**
```tsx
setCurrentMode('codify-skill');
await updateMode(currentId, 'codify-skill');  // Persist to DB
await sendMessage(codifyPrompt, 'codify-skill');
```

**Change 5: Reset mode on new conversation** (in handleNewChat)
```tsx
setCurrentMode('task');
```

---

## Implementation Order

1. **Database layer** (`src/lib/db/index.ts`) - schema + functions
2. **API routes** - endpoints to read/write mode
3. **Hooks** (`useConversations.ts`) - expose mode in hook
4. **UI** (`ForgeDemo.tsx`) - state management + persistence calls

---

## Verification

1. Start new conversation → mode is 'task', taskAgent responds
2. Click "Codify Skill" → mode changes to 'codify-skill', skillAgent takes over
3. Send follow-up message → still uses skillAgent
4. Refresh page → conversation reloads with 'codify-skill' mode preserved
5. Switch to different conversation → mode resets appropriately
6. Return to codify-skill conversation → mode restored to 'codify-skill'
7. Start new conversation → mode is 'task'

