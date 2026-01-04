# SkillForge MVP Implementation

Last Updated: 2026-01-03

## Summary

Built the complete SkillForge MVP - an agentic framework where AI agents learn from YouTube tutorials and codify learnings into reusable Claude Code-style skills.

## Architecture

**Tech Stack:**
- Next.js 16 (App Router) + React 19
- Vercel AI SDK 6 with `@ai-sdk/google`
- Gemini 3 Flash model
- Tailwind CSS 4

**Core Design Decisions:**
1. **Gemini Built-in Tools** - Uses `google.tools.googleSearch({})` and `google.tools.urlContext({})` for research instead of custom implementations
2. **Custom Shell Commands** - Skill operations via command handlers inspired by notion-agent pattern
3. **Server-side Skill I/O** - Gemini code execution can't access app filesystem, so skill persistence handled server-side

## Implementation Details

### Skill Command System ([src/lib/tools/skill-commands.ts](src/lib/tools/skill-commands.ts))

| Command | Description |
|---------|-------------|
| `skill list` | List all skills with name + description |
| `skill search <keyword>` | Fuzzy search via Fuse.js (threshold: 0.4) |
| `skill get <name>` | Read full SKILL.md content |
| `skill set <name> "<content>"` | Write/update a skill |

Skills stored at `.forge/skills/[name]/SKILL.md` with YAML frontmatter.

### Shell Tool ([src/lib/tools/shell.ts](src/lib/tools/shell.ts))

Wraps skill commands as AI SDK tool with longest-prefix matching for command routing.

### Forge Agent ([src/lib/agent/forge-agent.ts](src/lib/agent/forge-agent.ts))

- `ToolLoopAgent` with Gemini 3 Flash
- Tools: `google_search`, `url_context`
- Outputs skills in `<skill name="...">` XML tags for extraction
- `saveSkillFromOutput()` parses agent output and persists skills

### API Route ([src/app/api/agent/route.ts](src/app/api/agent/route.ts))

- Streaming endpoint using `TransformStream`
- Captures full output for skill extraction in `flush()` callback
- Returns `text/plain` chunked response

### Demo UI ([src/components/ForgeDemo.tsx](src/components/ForgeDemo.tsx))

- Terminal-style interface with dark theme
- Real-time streaming output display
- Auto-scroll to latest content

## Generated Skills

Two example skills created:
- `claude-code-skills` - Creating modular, reusable skills for Claude Code
- `amazon-cognito-authentication` - AWS Cognito authentication patterns

## MVP Flow

```
User provides YouTube URL
        ↓
ToolLoopAgent (Gemini 3 Flash)
        ↓
url_context analyzes video
        ↓
Extracts key learnings
        ↓
Outputs <skill> XML tag
        ↓
Server extracts and saves SKILL.md
```

## Files Created

```
src/
├── app/
│   ├── page.tsx               # Landing page
│   └── api/agent/route.ts     # Streaming agent endpoint
├── lib/
│   ├── agent/forge-agent.ts   # ToolLoopAgent config
│   └── tools/
│       ├── shell.ts           # Shell executor
│       └── skill-commands.ts  # Command handlers
└── components/
    └── ForgeDemo.tsx          # Demo UI

.forge/skills/                  # Generated skills storage
```

## Next Steps

See [MEMORY/TODO_PLAYGROUND_TASKS.md](MEMORY/TODO_PLAYGROUND_TASKS.md) for future demo task environments.
