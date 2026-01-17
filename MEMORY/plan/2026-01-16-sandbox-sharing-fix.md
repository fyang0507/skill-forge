# Plan: Fix Sandbox Sharing Between TaskAgent and SkillAgent

## Problem Summary
1. **Sandbox sharing bug**: TaskAgent and SkillAgent create separate sandboxes. SkillAgent can't access files (like python scripts) created by TaskAgent.
2. **Sandbox termination bug**: Aborting during SkillAgent execution doesn't terminate the sandbox properly.

## Root Cause Analysis

### Bug 1: Separate Sandboxes
- Sandbox caching is **in-memory** (`let cachedExecutor = null` in `executor.ts:52`)
- TaskAgent and SkillAgent run in **separate HTTP requests**
- In Vercel serverless: each request = new function invocation = fresh memory = new sandbox
- Even locally: if cache is cleared between requests, new sandbox is created

**Flow showing the problem:**
```
Request 1: /api/agent (mode=task) → TaskAgent → creates Sandbox A → writes script.py
Request 2: /api/agent (mode=codify-skill) → SkillAgent → creates Sandbox B → can't find script.py ❌
```

### Bug 2: Termination Issue
- Abort cleanup in `route.ts:320-328` only cleans up the current request's sandbox
- SkillAgent creates its own sandbox, so aborting it doesn't clean up TaskAgent's sandbox
- The `sandboxUsed` flag is request-scoped, not conversation-scoped

## Solution: Pass Sandbox ID Between Requests

The `@vercel/sandbox` SDK supports reconnecting to existing sandboxes via `Sandbox.get({ sandboxId })`. The sandbox instance has a `sandboxId` getter. We'll:
1. Capture `sandbox.sandboxId` when TaskAgent creates a sandbox
2. Return it to frontend via SSE event
3. Pass it back when SkillAgent runs → use `Sandbox.get({ sandboxId })` to reconnect

## Implementation Plan

### Step 1: Update Executor Interface
**File:** `src/lib/sandbox/executor.ts`

```typescript
export interface SandboxExecutor {
  // ... existing methods
  getSandboxId(): string | null;  // NEW: Get current sandbox ID
}

// NEW: Accept sandboxId to reconnect
export async function getSandboxExecutor(sandboxId?: string): Promise<SandboxExecutor>
```

### Step 2: Update VercelSandboxExecutor
**File:** `src/lib/sandbox/vercel-executor.ts`

```typescript
export class VercelSandboxExecutor implements SandboxExecutor {
  private existingSandboxId: string | null = null;

  constructor(existingSandboxId?: string) {
    this.existingSandboxId = existingSandboxId || null;
  }

  private async ensureSandbox(): Promise<Sandbox> {
    if (!this.sandbox) {
      if (this.existingSandboxId) {
        // Reconnect to existing sandbox using Sandbox.get()
        this.sandbox = await Sandbox.get({ sandboxId: this.existingSandboxId });
      } else {
        // Create new sandbox
        this.sandbox = await Sandbox.create({ runtime: 'python3.13', timeout: IDLE_TIMEOUT_MS });
      }
    }
    return this.sandbox;
  }

  getSandboxId(): string | null {
    return this.sandbox?.sandboxId ?? null;
  }
}
```

### Step 3: Update LocalSandboxExecutor
**File:** `src/lib/sandbox/local-executor.ts`

For local dev, use a consistent sandbox directory path as the "ID":
```typescript
export class LocalSandboxExecutor implements SandboxExecutor {
  private sandboxId: string;

  constructor(sandboxId?: string) {
    this.sandboxId = sandboxId || 'default';
    this.sandboxDir = path.join(process.cwd(), '.sandbox', this.sandboxId);
  }

  getSandboxId(): string | null {
    return this.sandboxId;
  }
}
```

### Step 4: Update API Route
**File:** `src/app/api/agent/route.ts`

```typescript
// Accept sandboxId in request body
const { messages, mode, conversationId, env, sandboxId } = await req.json();

// Pass sandboxId to executor
const executor = await getSandboxExecutor(sandboxId);

// After first shell command, emit sandbox_created event
if (!sandboxId && sandboxUsed) {
  const currentSandboxId = executor.getSandboxId();
  if (currentSandboxId) {
    send({ type: 'sandbox_created', sandboxId: currentSandboxId });
  }
}

// On abort, cleanup the specific sandbox (not just the cached one)
if (aborted && sandboxId) {
  await terminateSandbox(sandboxId);
}
```

### Step 5: Update Frontend Hook
**File:** `src/hooks/useForgeChat.ts`

```typescript
const [currentSandboxId, setCurrentSandboxId] = useState<string | null>(null);

// Handle sandbox_created event
case 'sandbox_created':
  setCurrentSandboxId(event.sandboxId);
  break;

// Pass sandboxId in subsequent requests
body: JSON.stringify({ messages, mode, conversationId, env, sandboxId: currentSandboxId }),

// Clear sandboxId when conversation ends or is cleared
const clearMessages = useCallback(() => {
  setCurrentSandboxId(null);
  // ...existing logic
}, []);
```

## Key Files to Modify
1. `src/lib/sandbox/executor.ts` - Add sandbox ID support to interface and getter
2. `src/lib/sandbox/vercel-executor.ts` - Implement `Sandbox.get()` for reconnection
3. `src/lib/sandbox/local-executor.ts` - Support sandbox ID as directory name
4. `src/app/api/agent/route.ts` - Accept/emit sandbox ID, fix termination
5. `src/hooks/useForgeChat.ts` - Track and pass sandbox ID

## Verification Plan
1. Start the Stripe subscription task → TaskAgent creates sandbox, writes python script
2. Check SSE events for `sandbox_created` with ID
3. Trigger SkillAgent codification → verify it receives the sandbox ID
4. Verify SkillAgent can `cat` or `ls` the python script created by TaskAgent
5. Test abort during TaskAgent → verify sandbox is cleaned up
6. Test abort during SkillAgent → verify the SAME sandbox is cleaned up
7. Deploy to Vercel and repeat tests
