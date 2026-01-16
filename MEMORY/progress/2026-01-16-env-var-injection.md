# UI-Based Environment Variable Injection

Last Updated: 2026-01-16
Status: ✅ Completed

## Goal
Add a UI panel where hackathon judges can provide their own API credentials (e.g., `STRIPE_SECRET_KEY`), with smart merging based on environment.

## Environment Strategy

| Environment | Priority (highest → lowest) |
|-------------|----------------------------|
| **Local dev** | UI vars → `.env.playground` → `process.env` |
| **Production** | UI vars → Vercel dashboard env → `process.env` |

## Architecture

```
UI (env input panel)
  → useForgeChat (include env in request)
  → POST /api/agent
  → mergePlaygroundEnv(uiEnv)  // NEW: merge with .env.playground or Vercel env
  → executeCommand(cmd, { env: mergedEnv })
  → sandbox.execute(cmd, { env })
```

## Implementation Steps

### 1. Create playground env loader utility
**File:** [playground-env.ts](src/lib/tools/playground-env.ts) (new file)

```typescript
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

export function getPlaygroundEnv(): Record<string, string> {
  // Local dev only: load .env.playground for convenience
  if (!process.env.VERCEL) {
    const envPath = join(process.cwd(), '.env.playground');
    if (existsSync(envPath)) {
      return config({ path: envPath }).parsed || {};
    }
  }
  return {};
}

export function mergePlaygroundEnv(uiEnv?: Record<string, string>): Record<string, string> {
  const baseEnv = getPlaygroundEnv();
  // UI vars take precedence
  return { ...baseEnv, ...uiEnv };
}
```

### 2. Update useForgeChat hook
**File:** [useForgeChat.ts](src/hooks/useForgeChat.ts)

- Add `env?: Record<string, string>` parameter to `sendMessage()`
- Include `env` in the API request body

### 3. Update API route
**File:** [route.ts](src/app/api/agent/route.ts)

- Accept `env` from request body
- Call `mergePlaygroundEnv(env)` to get merged env
- Pass merged env to `executeCommand()` calls

### 4. Update command executor
**File:** [command-executor.ts](src/lib/tools/command-executor.ts)

- Add `CommandOptions` interface with `env` field
- Update `executeCommand()` signature to accept options
- Pass through to `executeShellCommand()`

### 5. Update shell executor
**File:** [shell-executor.ts](src/lib/tools/shell-executor.ts)

- Accept `env` in options parameter
- Pass `env` to `sandbox.execute()` via `ExecuteOptions`

### 6. Add UI component
**File:** [ForgeDemo.tsx](src/components/ForgeDemo.tsx)

- Add state: `envVars: Array<{ key: string; value: string }>`
- Add collapsible "API Keys" panel above the input:
  - Key-value input pairs (password-type for values)
  - Add/remove buttons
  - Helper text: "Override or add environment variables for sandbox execution"
- Pass env vars to `sendMessage()` in `handleSubmit()`

## Security
- Password-type inputs hide credentials in UI
- Env vars are per-request, not persisted to database
- Sandbox isolation prevents leakage between requests

## Verification

### Local dev
1. Ensure `.env.playground` has `STRIPE_SECRET_KEY=sk_test_xxx`
2. Start dev server, run task with `echo $STRIPE_SECRET_KEY`
3. Verify it outputs the value from `.env.playground`
4. Add `STRIPE_SECRET_KEY=override` in UI, run again
5. Verify UI value takes precedence

### Production
1. Add `MY_API_KEY=secret123` in UI panel
2. Run task with `echo $MY_API_KEY`
3. Verify it outputs `secret123`

## Implementation Notes

### Bug Fixes During Implementation
- **ENOENT error**: `.sandbox` directory wasn't auto-created. Fixed by adding `fs.mkdir(sandboxDir, { recursive: true })` in `LocalSandboxExecutor.execute()` before command execution.

### UX Enhancements
- Changed from inline-editable list to saved vars display + add form pattern
- Key input auto-uppercases and filters to valid env var characters (`[A-Z0-9_]`)
- Add button disabled until both key and value are non-empty
- Values displayed as masked (`••••••••`) in saved vars list
- Delete button with hover:red-400 transition

### Files Modified
- `src/lib/tools/playground-env.ts` (new)
- `src/lib/tools/command-executor.ts` (added CommandOptions interface)
- `src/lib/tools/shell-executor.ts` (pass env to executor)
- `src/app/api/agent/route.ts` (accept env, merge with playground)
- `src/hooks/useForgeChat.ts` (pass env in sendMessage)
- `src/components/ForgeDemo.tsx` (API Keys panel UI)
- `src/lib/sandbox/local-executor.ts` (auto-create sandbox dir)
- `package.json` (added dotenv dependency)
