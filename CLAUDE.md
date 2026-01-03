# SkillForge

## Product Vision

Agentic framework where AI agents learn from YouTube tutorials (and/or other online resources) and codify learnings into reusable Claude Code-style skills.

**MVP Scope:** Watch YouTube → Extract Knowledge → Write SKILL.md

**Core Value:** Run 1 = Research + Skill Creation. Run 2 = Skill Lookup + Skip Research.

## Architecture Notes

- **Gemini Built-in Tools**: Use `google.tools.googleSearch({})` and `google.tools.urlContext({})` for research - don't build custom research tools
- **Custom Shell Commands**: Skill operations via command handlers (`skill list/search/get/set`), inspired by [notion-agent](https://github.com/fyang0507/notion-agent/blob/main/src/skills/podcast/index.ts)
- **Skills Storage**: `.forge/skills/[name]/SKILL.md` with YAML frontmatter (name, description)
- **No Gemini Filesystem**: Gemini code execution can't access app filesystem - skill I/O handled server-side

## Project Memory

- `PLAN.md` - Full implementation plan with code snippets
- `docs/PLAYGROUND_TASKS.md` - Future demo task environments (mock APIs, real API alternatives)
