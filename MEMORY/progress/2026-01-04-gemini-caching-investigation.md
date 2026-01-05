# Gemini 3 Flash Implicit Caching Investigation

Date: 2026-01-04

## Problem

KV cache not being leveraged despite implementing proper message array structure per `MEMORY/progress/2026-01-04-shell-chat-implementation.md`.

## Investigation

### Test Setup

Added instrumentation to `src/app/api/agent/route.ts`:
```typescript
const usage = await result.usage;
const cacheReadTokens = usage?.inputTokenDetails?.cacheReadTokens;
console.log('[Cache Debug]', { inputTokens, outputTokens, cacheReadTokens });
```

### Test Results

| Request | Input Tokens | Cache Read Tokens |
|---------|-------------|-------------------|
| Initial (bloated) | 981 | 0 |
| With skill list | 1004 | 0 |
| Iteration 2 | 1037 | 0 |
| Follow-up conversation | 1117 | 0 |
| Follow-up iteration 2 | 1599 | 0 |

All requests exceed the documented 1024 token minimum for Gemini 3 Flash, yet `cacheReadTokens` is always 0.

## Root Cause

**Tools prevent implicit caching from activating.**

Evidence:
1. Google API error for explicit caching: "CachedContent cannot be used with GenerateContent request setting system_instruction, tools or tool_config"
2. GitHub issues confirm tools break caching (#3333, #3212)
3. Google forum reports Gemini 3 implicit caching issues

### Our Tool Configuration

```typescript
// forge-agent.ts
tools: {
  google_search: google.tools.googleSearch({}),
  url_context: google.tools.urlContext({}),
},
```

## Token Minimums (Official Docs)

| Model | Min Tokens |
|-------|-----------|
| Gemini 3 Flash Preview | 1024 |
| Gemini 3 Pro Preview | 4096 |
| Gemini 2.5 Flash | 1024 |
| Gemini 2.5 Pro | 4096 |

## Options Evaluated

### 1. Accept No Caching (Current)
- Pros: No code changes, tools remain functional
- Cons: Higher costs, no latency benefits

### 2. Switch to Claude
- Pros: Automatic prompt caching works with tools
- Cons: Lose `googleSearch` and `urlContext` built-in tools

### 3. Use Gemini 2.5 Flash
- Pros: May have more stable implicit caching
- Cons: Still has tools limitation, older model

### 4. Explicit Caching Workaround
- Pros: Guaranteed cache hits
- Cons: Complex setup, must strip tools when referencing cache

## Issues Filed

- Upstream: https://github.com/vercel/ai/issues/11513
- Local: https://github.com/fyang0507/skill-forge/issues/1

## Code Changes Made

1. Added `usage` event type to SSEEvent interface
2. Added cache debugging logs per iteration
3. Frontend receives usage stats via SSE

## References

- [AI SDK Google Provider Docs](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)
- [Gemini Context Caching Docs](https://ai.google.dev/gemini-api/docs/caching)
- [GitHub Issue #3212 - Context Caching](https://github.com/vercel/ai/issues/2181)
- [GitHub Issue #3333 - Caching breaks with tools](https://github.com/vercel/ai/issues/3333)
- [Google Forum - Gemini 3 caching issues](https://discuss.ai.google.dev/t/implicit-context-caching-does-not-work-with-gemini-3-pro-preview/111253)
