# Sandbox Idle Timeout Implementation

Last Updated: 2026-01-15

## Summary

Implemented 5-minute idle timeout for sandbox with frontend notification banner when timeout occurs.

## Problem

Sandboxes persisted indefinitely until user abort, wasting resources. Need automatic cleanup after inactivity.

## Solution Architecture

### Backend Changes

1. **`SandboxTimeoutError`** (`executor.ts`): New error class for timeout detection
2. **Interface extension**: Added `resetTimeout(): Promise<boolean>` and `isAlive(): boolean`
3. **Idle tracking**: Both executors track `lastActivityTime`, check elapsed > 5 min
4. **SSE event**: New `sandbox_timeout` type sent when timeout detected

### Frontend Changes

1. **`SandboxTimeoutBanner.tsx`**: Amber warning banner, fixed position, dismissible
2. **`useForgeChat.ts`**: Handles `sandbox_timeout` event, exposes `sandboxTimeoutMessage` state
3. **`ForgeDemo.tsx`**: Renders banner when timeout message is set

## Key Design Decisions

- **Timestamp-based tracking** over Vercel's `extendTimeout()` which adds time rather than resetting
- **5-min hard limit** for both Vercel SDK timeout and our idle tracking
- **Graceful degradation**: If Vercel kills sandbox, next command detects via `isSandboxDeadError()`

## Files Modified

| File | Purpose |
|------|---------|
| `src/lib/sandbox/executor.ts` | Error class + interface |
| `src/lib/sandbox/vercel-executor.ts` | Idle timeout logic |
| `src/lib/sandbox/local-executor.ts` | Dev parity |
| `src/app/api/agent/route.ts` | Catch error, send SSE |
| `src/hooks/useForgeChat.ts` | Handle event |
| `src/components/SandboxTimeoutBanner.tsx` | New banner |
| `src/components/ForgeDemo.tsx` | Banner integration |
