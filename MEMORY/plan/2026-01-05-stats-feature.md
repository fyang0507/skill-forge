# Stats Feature Implementation Plan

## Overview
Add token usage and execution time stats to the chat UI:
1. **Per-message stats**: Inline display below each assistant message
2. **Cumulative stats**: Footer bar showing session totals

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/api/agent/route.ts` | Add reasoning tokens + execution time to usage event |
| `src/hooks/useForgeChat.ts` | Handle usage events, track per-message and cumulative stats |
| `src/components/ChatMessage.tsx` | Render per-message stats inline |
| `src/components/ForgeDemo.tsx` | Add cumulative stats footer |
| `src/components/MessageStats.tsx` | **NEW** - Per-message stats component |
| `src/components/CumulativeStats.tsx` | **NEW** - Session totals footer component |

---

## Implementation Steps

### Step 1: Server-Side - Extend Usage Event (`route.ts`)

**Add reasoning tokens extraction** (after line 148):
```typescript
const reasoningTokens = (usage?.outputTokenDetails as { reasoningTokens?: number })?.reasoningTokens;
```

**Add execution time tracking**:
- Record `iterationStartTime = Date.now()` at start of iteration (line 95)
- Calculate `executionTimeMs = Date.now() - iterationStartTime` before sending usage

**Update SSEEvent interface** to include:
```typescript
usage?: {
  promptTokens?: number;
  completionTokens?: number;
  cachedContentTokenCount?: number;
  reasoningTokens?: number;  // NEW
};
executionTimeMs?: number;  // NEW
```

**Update usage send call** (line 157-164):
```typescript
send({
  type: 'usage',
  usage: {
    promptTokens: usage?.inputTokens,
    completionTokens: usage?.outputTokens,
    cachedContentTokenCount: cacheReadTokens,
    reasoningTokens,
  },
  executionTimeMs,
});
```

---

### Step 2: Client Hook - Track Stats (`useForgeChat.ts`)

**Add interfaces**:
```typescript
export interface MessageStats {
  promptTokens?: number;
  completionTokens?: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  executionTimeMs?: number;
}

export interface CumulativeStats {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCachedTokens: number;
  totalReasoningTokens: number;
  totalExecutionTimeMs: number;
  messageCount: number;
}
```

**Extend Message interface**:
```typescript
export interface Message {
  // ... existing fields
  stats?: MessageStats;  // NEW
}
```

**Add SSEEvent 'usage' type** (line 25):
```typescript
interface SSEEvent {
  type: '...' | 'usage';  // Add 'usage'
  // ... existing fields
  usage?: { ... };
  executionTimeMs?: number;
}
```

**Add state**:
```typescript
const [cumulativeStats, setCumulativeStats] = useState<CumulativeStats>({
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalCachedTokens: 0,
  totalReasoningTokens: 0,
  totalExecutionTimeMs: 0,
  messageCount: 0,
});
```

**Track per-message stats** (inside sendMessage):
```typescript
const messageStartTime = Date.now();
let messageStats: MessageStats = {};
```

**Handle 'usage' event** (add case in switch):
```typescript
case 'usage': {
  // Accumulate across iterations
  messageStats = {
    promptTokens: (messageStats.promptTokens || 0) + (event.usage?.promptTokens || 0),
    completionTokens: (messageStats.completionTokens || 0) + (event.usage?.completionTokens || 0),
    cachedTokens: (messageStats.cachedTokens || 0) + (event.usage?.cachedContentTokenCount || 0),
    reasoningTokens: (messageStats.reasoningTokens || 0) + (event.usage?.reasoningTokens || 0),
  };
  break;
}
```

**Finalize in 'done' handler**:
- Set `messageStats.executionTimeMs = Date.now() - messageStartTime`
- Update cumulative stats via `setCumulativeStats`
- Include `stats: messageStats` when updating assistant message

**Reset in clearMessages**:
```typescript
setCumulativeStats({ totalPromptTokens: 0, ... });
```

**Return from hook**:
```typescript
return { messages, status, error, cumulativeStats, sendMessage, clearMessages, stop };
```

---

### Step 3: Create MessageStats Component (`src/components/MessageStats.tsx`)

```typescript
interface MessageStatsProps {
  stats: MessageStats | undefined;
}

export function MessageStats({ stats }: MessageStatsProps) {
  if (!stats) return null;

  return (
    <div className="mt-2 pt-2 border-t border-zinc-700/50">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>In: {stats.promptTokens?.toLocaleString() ?? '-'}</span>
        {stats.cachedTokens ? <span>Cached: {stats.cachedTokens.toLocaleString()}</span> : null}
        <span>Out: {stats.completionTokens?.toLocaleString() ?? '-'}</span>
        <span>Time: {stats.executionTimeMs ? `${(stats.executionTimeMs / 1000).toFixed(1)}s` : '-'}</span>
      </div>
      {stats.reasoningTokens ? (
        <div className="text-xs text-zinc-500 mt-1">
          Reasoning: {stats.reasoningTokens.toLocaleString()} tokens
        </div>
      ) : null}
    </div>
  );
}
```

---

### Step 4: Update ChatMessage (`src/components/ChatMessage.tsx`)

Import and render MessageStats after parts:
```typescript
import { MessageStats } from './MessageStats';

// In assistant message render (after parts.map):
<MessageStats stats={message.stats} />
```

---

### Step 5: Create CumulativeStats Component (`src/components/CumulativeStats.tsx`)

```typescript
export function CumulativeStatsBar({ stats }: { stats: CumulativeStats }) {
  if (stats.messageCount === 0) return null;

  const cacheRatio = stats.totalPromptTokens > 0
    ? ((stats.totalCachedTokens / stats.totalPromptTokens) * 100).toFixed(0)
    : 0;

  return (
    <div className="px-6 py-2 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 text-xs text-zinc-500">
        <span>Total In: {stats.totalPromptTokens.toLocaleString()}</span>
        <span>Cached: {stats.totalCachedTokens.toLocaleString()} ({cacheRatio}%)</span>
        <span>Total Out: {stats.totalCompletionTokens.toLocaleString()}</span>
        {stats.totalReasoningTokens > 0 && (
          <span>Reasoning: {stats.totalReasoningTokens.toLocaleString()}</span>
        )}
        <span>Time: {(stats.totalExecutionTimeMs / 1000).toFixed(1)}s</span>
        <span className="text-zinc-600">|</span>
        <span>{stats.messageCount} response{stats.messageCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
```

---

### Step 6: Update ForgeDemo (`src/components/ForgeDemo.tsx`)

```typescript
import { CumulativeStatsBar } from './CumulativeStats';

// Get cumulativeStats from hook
const { messages, status, error, cumulativeStats, sendMessage, clearMessages, stop } = useForgeChat();

// Add between messages area and input area:
<CumulativeStatsBar stats={cumulativeStats} />
```

---

## Edge Cases

- **Multi-iteration**: Stats accumulate across all agent loop iterations
- **Aborted requests**: Show partial stats received before abort
- **Missing fields**: Use optional chaining, show "-" or hide when unavailable
- **Reasoning tokens**: Only show row when model returns reasoning data
