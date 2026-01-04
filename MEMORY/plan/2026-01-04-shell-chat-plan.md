# SkillForge Enhancement Plan: Shell Commands + Chat Interface

## Overview

Two enhancements to make the agent more capable:
1. **Shell command auto-execution**: Detect `<shell>` tags in Gemini output, execute commands, feed results back
2. **Chat interface**: Full chat UI with message history using a custom useChat-like hook

## Critical Constraint: KV Cache Preservation

**The agent's raw output must be stored VERBATIM in conversation history.** We detect and execute commands, but:
- Never modify/strip the assistant message content
- The `<shell>skill list</shell>` tags stay in the stored message exactly as output
- Command results are injected as **separate messages** (role: 'tool' or 'system')

This preserves the token sequence for KV cache efficiency on subsequent inference calls.

## Architecture

```
User sends message
       ↓
┌─────────────────────────────────────────────────┐
│  API Route (agent loop)                         │
│  1. Stream Gemini response (send to client)     │
│  2. Store raw output verbatim as assistant msg  │
│  3. Parse output for <shell>...</shell> tags    │
│  4. Execute commands, store results as          │
│     separate tool/system messages               │
│  5. Re-prompt with full history (unchanged)     │
│  6. Repeat until no commands (max 10 iter)      │
└─────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────┐
│  Frontend (useForgeChat hook)                   │
│  - Parse SSE events                             │
│  - Store messages with original content         │
│  - UI can render <shell> tags specially but     │
│    underlying content is unchanged              │
└─────────────────────────────────────────────────┘
```

## Message History Format

```typescript
// Conversation preserves exact agent output
[
  { role: 'user', content: 'What skills do I have?' },
  { role: 'assistant', content: 'Let me check your skills.\n\n<shell>skill list</shell>' },  // VERBATIM
  { role: 'tool', content: '- javascript-variable-scope\n- claude-code-skills' },  // Separate message
  { role: 'assistant', content: 'You have 2 skills: ...' },  // VERBATIM
]
```

The assistant messages are **never modified** - this is what gets sent back to Gemini and preserves KV cache.

## Implementation Steps

### Phase 1: Backend - Command Detection & Execution

#### 1.1 Create command parser
**File:** `src/lib/tools/command-parser.ts` (new)

```typescript
const SHELL_PATTERN = /<shell>([\s\S]*?)<\/shell>/g;

// Extract commands WITHOUT modifying the source text
export function extractCommands(text: string): string[] {
  const commands: string[] = [];
  let match;
  while ((match = SHELL_PATTERN.exec(text)) !== null) {
    commands.push(match[1].trim());
  }
  return commands;
}

export function formatToolResults(
  executions: Array<{ command: string; result: string }>
): string {
  return executions
    .map(({ command, result }) => `$ ${command}\n${result}`)
    .join('\n\n');
}
```

#### 1.2 Update agent system prompt
**File:** `src/lib/agent/forge-agent.ts`

Add to `FORGE_INSTRUCTIONS`:
- Document available shell commands
- Instruct to wrap commands in `<shell>...</shell>` tags
- Explain that results will appear in a follow-up message
- Update workflow to check existing skills first

#### 1.3 Rewrite API route with agent loop + SSE
**File:** `src/app/api/agent/route.ts`

Key behavior:
- Accept `{ messages: [...] }` array
- Stream agent output to client AND accumulate it
- Store **exact raw output** as assistant message
- Parse for commands (read-only, don't modify)
- Execute commands, create **separate tool message**
- Append tool message to history
- Re-prompt agent with full unmodified history
- Stream SSE events for UI rendering

SSE events:
```typescript
{ type: 'text', content: '...' }           // Streamed text chunk
{ type: 'tool-call', command: '...' }      // Command detected (for UI)
{ type: 'tool-result', command, result }   // Command result (for UI)
{ type: 'done' }                           // Stream complete
```

### Phase 2: Frontend - Chat Interface

#### 2.1 Create custom chat hook
**File:** `src/hooks/useForgeChat.ts` (new)

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;  // Raw, unmodified content
  timestamp: Date;
}

export function useForgeChat(): {
  messages: Message[];
  status: 'ready' | 'streaming' | 'error';
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  stop: () => void;
}
```

The hook stores messages with their **original content**. The UI layer handles rendering (e.g., detecting `<shell>` tags for special display).

#### 2.2 Create message component
**File:** `src/components/ChatMessage.tsx` (new)

- Render user/assistant/tool messages with different styles
- For assistant messages: detect `<shell>` tags and render them with terminal styling
- For tool messages: render as command output blocks
- **Content is never modified** - only visual rendering differs

#### 2.3 Update main chat component
**File:** `src/components/ForgeDemo.tsx`

- Full-height chat layout with header, messages area, input
- Message list with auto-scroll
- Input with Send/Stop button
- Clear chat button
- Empty state with example prompts

## Files to Modify

| File | Action |
|------|--------|
| `src/lib/tools/command-parser.ts` | Create |
| `src/lib/agent/forge-agent.ts` | Update prompt |
| `src/app/api/agent/route.ts` | Rewrite with SSE + loop |
| `src/hooks/useForgeChat.ts` | Create |
| `src/components/ChatMessage.tsx` | Create |
| `src/components/ForgeDemo.tsx` | Rewrite |

## SSE Event Format

```typescript
// Text chunk from agent (accumulated into assistant message)
{ type: 'text', content: 'Let me check...' }

// Command detected in output (UI hint, original text unchanged)
{ type: 'tool-call', command: 'skill list' }

// Command executed (becomes separate tool message)
{ type: 'tool-result', command: 'skill list', result: '- skill-a\n- skill-b' }

// Agent iteration complete
{ type: 'iteration-end', hasMoreCommands: true }

// All iterations done
{ type: 'done' }
```

## Edge Cases

- **Max iterations**: Hard limit of 10 to prevent infinite loops
- **Abort handling**: AbortController in hook, cleanup on unmount
- **Partial tags**: Buffer stream until iteration complete before parsing
- **Large results**: Truncate command output to 2000 chars (in tool message only)
- **KV cache**: Never modify assistant messages - append-only history
