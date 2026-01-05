# UI Improvements

Last Updated: 2026-01-05

## Overview

Rewrote the chat UI to match Claude Code's UX: collapsible tool calls, reasoning traces, markdown rendering, and inline tool execution display.

## Key Changes

### Message Parts Architecture

Changed from simple `content: string` to `parts: MessagePart[]` where each part has a type:
- `text` - Regular assistant text (now rendered as markdown)
- `reasoning` - Thinking traces (collapsible, collapsed by default)
- `tool` - Shell command execution (expanded by default, shows command + output)
- `agent-tool` - Native tools like google_search, url_context (collapsible)
- `sources` - Citation links at message end

### SSE Stream Extensions

Added new event types in `route.ts`:
- `reasoning-delta` → `reasoning` SSE event (not tested because no thinking is triggered under `thinkingLevel: 'low'` for gemini-3-flash)
- `source` → captures Gemini grounding citations
- `agent-tool-call` / `agent-tool-result` → for non-Gemini provider tool calls (not tested)

### Gemini Grounding Tool Detection

Gemini's built-in tools (google_search, url_context) don't emit `tool-call` events - they run transparently. Solutions:
- **Google Search**: Detected via `source` events; synthetic tool part inserted at position 0 (top) via `parts.unshift()`
- **URL Context**: Heuristic detection via URL regex in user message; shows "analyzing..." until response completes

### Markdown Rendering

- Added `react-markdown` for text parts
- Added `@tailwindcss/typography` plugin with `prose prose-invert prose-sm` classes
- Configured in `globals.css` via `@plugin "@tailwindcss/typography"`

## Files Modified

- `src/hooks/useForgeChat.ts` - Parts-based message model, source/reasoning handlers
- `src/components/ChatMessage.tsx` - Collapsible components for each part type
- `src/app/api/agent/route.ts` - Extended fullStream handling for all event types
- `src/app/globals.css` - Typography plugin
- `package.json` - Added react-markdown, @tailwindcss/typography

## Technical Decisions

1. **Synthetic tool parts for grounding**: Since Gemini grounding doesn't emit tool-call events, we create synthetic agent-tool parts when sources arrive
2. **Position 0 insertion**: Google Search goes at top via `unshift()` to match expected UX (search → respond)
3. **URL heuristic**: Not perfect but provides good UX feedback when URLs are present
