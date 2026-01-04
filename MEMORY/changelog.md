# Changelog

Last Updated: 2026-01-04

## 2025-01-04: Shell Commands + Chat Interface

- Implemented shell command auto-execution: agent outputs `<shell>` tags, system executes commands and feeds results back
- Built full chat UI with `useForgeChat` hook supporting SSE streaming, message history, and abort handling
- Fixed KV cache preservation by using proper `ModelMessage[]` arrays instead of concatenated prompt strings
- Added `ChatMessage` component with special rendering for shell commands and terminal output blocks


## 2026-01-03 - Initial MVP Implementation

- Built complete SkillForge MVP: YouTube URL → AI analysis → SKILL.md generation
- Implemented skill command system (list/search/get/set) with Fuse.js fuzzy search
- Created streaming API endpoint with automatic skill extraction and persistence
- Demo UI with terminal-style output for real-time agent feedback
