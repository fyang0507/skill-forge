# Plan: Add Transcript Summarization Tool for Skill Agent

## Problem Statement

Currently, when the skill agent processes a codification request, it receives the **entire conversation history** from the task agent in its context. This wastes tokens on verbose output.

## Approach: Tool-Based Transcript Injection

The skill agent starts with a **blank context** (just system prompt). It calls `get-processed-transcript` tool as its first step. The tool:
1. Has access to the raw task agent transcript (via closure)
2. Processes it with Gemini Flash
3. Returns compressed text summary to skill agent

**Key insight:** The transcript is injected via the tool, not the message history.

## Flow

```
User clicks "Codify as Skill"
    ↓
Skill Agent starts (blank context, just system prompt + user request)
    ↓
Skill Agent calls get-processed-transcript tool (no params needed)
    ↓
Tool internally:
  - Has raw transcript from task agent (via closure)
  - Calls Gemini Flash to summarize
  - Returns plain text summary
    ↓
Skill Agent receives summary as tool output
    ↓
Skill Agent creates skill based on summary
```

## Implementation

### 1. Create Transcript Processing Function

**New file: `src/lib/agent/tools/process-transcript.ts`**

```typescript
import { generateText } from 'ai';

export async function processTranscript(rawTranscript: string): Promise<string> {
  const result = await generateText({
    model: 'google/gemini-3-flash',
    prompt: `You are a transcript processor. Analyze this task conversation and produce a concise summary for skill codification.

Extract and summarize:
1. **Goal**: What was the user trying to accomplish?
2. **Steps**: Key steps taken (in order)
3. **Commands**: Important shell commands used
4. **Gotchas**: Non-obvious issues, errors, or edge cases encountered
5. **Solutions**: How problems were resolved
6. **Patterns**: Reusable patterns or best practices discovered

Be concise but preserve all procedural knowledge needed to recreate the task.

Transcript:
${rawTranscript}`,
  });

  return result.text;
}
```

### 2. Create Tool Factory with Transcript Closure

**File: `src/lib/agent/skill-agent.ts`**

The tool is created per-request with the transcript captured in closure:

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { processTranscript } from './tools/process-transcript';

function createProcessTranscriptTool(rawTranscript: string) {
  return tool({
    description: 'Get the processed transcript from the previous task conversation. Call this FIRST to get context for skill creation.',
    parameters: z.object({}), // No params - transcript is in closure
    execute: async () => {
      return processTranscript(rawTranscript);
    },
  });
}
```

### 3. Update Skill Agent Factory

**File: `src/lib/agent/skill-agent.ts`**

Agent is created per-request with the transcript tool:

```typescript
const SKILL_AGENT_INSTRUCTIONS = `You are a Skill Codification Agent.

# First Step - REQUIRED
Call the get-processed-transcript tool to get the summary of the task conversation.
You have no context about the task until you call this tool.

# After Getting Summary
Analyze the summary to determine if this is worth codifying as a skill.

## Worth Codifying
- Multi-step procedures with non-obvious ordering
- Integration gotchas (auth flows, API quirks, error handling)
- Debugging patterns that required trial-and-error
- User-specific preferences or constraints discovered
- Workarounds for common errors or edge cases

## Skip If
- Single-step operations
- Generic model capabilities (summarization, translation)
- Overly specific one-off tasks
- Nothing was actually "learned"

# Output
If worth codifying, use:
<shell>skill set skill-name "---
name: skill-name
description: One-line description
---
# Content..."</shell>

If not worth saving, explain briefly why.`;

export function createSkillAgent(rawTranscript: string) {
  return new Agent({
    model: 'google/gemini-3-pro-preview',
    instructions: SKILL_AGENT_INSTRUCTIONS,
    tools: {
      'get-processed-transcript': createProcessTranscriptTool(rawTranscript),
    },
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: 'low',
          includeThoughts: true,
        },
      },
    },
  });
}
```

### 4. Update API Route

**File: `src/app/api/agent/route.ts`**

When mode is `codify-skill`, create skill agent with transcript:

```typescript
// Build raw transcript from messages
function buildTranscript(messages: Message[]): string {
  return messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');
}

// In the route handler:
if (mode === 'codify-skill') {
  const rawTranscript = buildTranscript(messages.slice(0, -1)); // Exclude codify prompt
  const agent = createSkillAgent(rawTranscript);
  // Run agent with just the codify prompt (not full history)
  // ...
}
```

### 5. Update Message Handling

**File: `src/hooks/useForgeChat.ts`**

When sending to skill agent, don't expand full history - just send the codify prompt:

```typescript
// In sendMessage, when mode is codify-skill:
const apiMessages = mode === 'codify-skill'
  ? [{ role: 'user', content }]  // Just the codify prompt
  : buildFullMessageHistory(messages, content);
```

### 6. UI for Summary Display

**File: `src/components/ChatMessage.tsx`**

Render `get-processed-transcript` tool result as collapsible section.

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/agent/tools/process-transcript.ts` | **New** - Gemini Flash text summarization |
| `src/lib/agent/skill-agent.ts` | Factory function with transcript closure |
| `src/app/api/agent/route.ts` | Create agent with transcript, send minimal messages |
| `src/hooks/useForgeChat.ts` | Don't expand history for codify-skill mode |
| `src/components/ChatMessage.tsx` | Render summary as collapsible section |

## Verification

1. Run a task with 5+ iterations, then codify
2. Verify skill agent starts with blank context (check token count)
3. Verify `get-processed-transcript` is called first
4. Check summary quality in tool output
5. Verify skill created matches expectations
