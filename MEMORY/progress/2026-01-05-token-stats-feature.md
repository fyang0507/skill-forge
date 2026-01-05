# Token Usage Stats Feature

Last Updated: 2026-01-05

## Summary

Added comprehensive token usage statistics to the chat UI, providing visibility into API costs and cache efficiency.

## Changes

### API Route (`src/app/api/agent/route.ts`)
- Extract `reasoningTokens` from `usage.outputTokenDetails` (Gemini-specific field)
- Track iteration execution time via `Date.now()` delta
- Send `usage` SSE event with all metrics per iteration
- Added try/catch around controller.close() to handle disconnected clients

### Hook (`src/hooks/useForgeChat.ts`)
- New interfaces: `MessageStats` and `CumulativeStats`
- Extended `Message` interface with optional `stats` field
- Handle `usage` events by accumulating tokens across iterations
- Track cumulative stats in React state, reset on `clearMessages()`
- Fallback to client-measured time if server timing unavailable

### Components
- **`MessageStats.tsx`**: Inline stats below assistant messages (In/Cached/Out/Time)
- **`CumulativeStats.tsx`**: Footer bar with session totals and cache hit ratio
- **`ChatMessage.tsx`**: Import MessageStats, render after parts, default tool collapsed

### Agent Prompt (`forge-agent.ts`)
- Simplified shell command reference (removed redundant examples)

## Metrics Displayed

| Metric | Per-Message | Cumulative |
|--------|-------------|------------|
| Prompt Tokens | ✓ | ✓ |
| Cached Tokens | ✓ | ✓ (with %) |
| Completion Tokens | ✓ | ✓ |
| Reasoning Tokens | ✓ (if present) | ✓ |
| Execution Time | ✓ | ✓ |

## Design Decisions

- **Accumulate across iterations**: Multi-turn agent loops sum all iteration stats
- **Server + client timing**: Server measures API latency, client provides end-to-end fallback
- **Sparse display**: Reasoning tokens row only shown when non-zero
- **Cache ratio**: Calculated as `cachedTokens / promptTokens * 100`
