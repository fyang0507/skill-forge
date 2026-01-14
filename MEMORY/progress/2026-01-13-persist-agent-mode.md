# Persist Agent Mode Across Conversation

Last Updated: 2026-01-13

## Problem Solved

When user clicked "codify-skill" button, only that single request used `skillAgent`. Subsequent messages fell back to `taskAgent` because mode defaulted to `'task'` per-request. Historical conversations also lost their mode context.

## Implementation

**Database Layer** (`src/lib/db/index.ts`):
- Added `mode: 'task' | 'codify-skill'` to `Conversation` interface
- Schema includes `mode TEXT DEFAULT 'task'` column
- Migration via `ALTER TABLE` for existing databases (silently ignores if column exists)
- Updated all CRUD functions to handle mode

**API Routes**:
- POST `/api/conversations` accepts optional `mode` parameter
- PATCH `/api/conversations/[id]` supports `mode` updates
- GET already returns mode via `getConversation()`

**Hooks** (`useConversations.ts`):
- `createConversation(title, mode)` accepts optional mode
- Added `updateMode(id, mode)` function for persisting mode changes

**UI** (`ForgeDemo.tsx`):
- `currentMode` state tracks active mode
- `handleSelectConversation` restores mode from DB
- `handleSubmit` passes `currentMode` to `sendMessage()`
- `handleCodifySkill` sets mode to 'codify-skill' and persists to DB
- `handleNewChat` resets mode to 'task'

## Verification Flow

1. New conversation → mode is 'task', taskAgent responds
2. Click "Codify Skill" → mode changes to 'codify-skill', skillAgent takes over
3. Send follow-up → still uses skillAgent (mode persisted)
4. Switch away → mode saved in DB
5. Return to conversation → mode restored to 'codify-skill'
6. New conversation → mode resets to 'task'
