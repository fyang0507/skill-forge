# Plan: Clarify Skills vs Sandbox Separation in Agent Instructions

## Problem
Both agents lack clear documentation about:
1. **Skills** = persistent storage (files can't be executed directly)
2. **Sandbox** = execution environment (ephemeral, session-scoped)
3. The bidirectional flow between them

Current state:
- Task Agent documents `copy-to-sandbox` but doesn't explain WHY it's needed
- Skill Agent (after recent edit) lists commands but doesn't document `copy-to-sandbox` at all
- Neither agent explains the conceptual separation clearly

## Changes

### 1. `src/lib/agent/task-agent.ts`
Add a conceptual section explaining skills vs sandbox:

```markdown
# Skill Storage vs Sandbox Execution
- **Skills** = persistent library of reusable procedures and code (read-only during tasks)
- **Sandbox** = your execution workspace (ephemeral, cleared between sessions)
- Skill files CANNOT be executed directly - copy them to sandbox first
- Flow: `skill copy-to-sandbox` → modify if needed → execute
```

### 2. `src/lib/agent/skill-agent.ts`
Add the same conceptual section plus document `copy-to-sandbox`:

```markdown
# Skill Storage vs Sandbox Execution
- **Skills** = persistent library (files stored here for future reuse)
- **Sandbox** = execution workspace (where Task Agent ran code)
- To use skill code later: Task Agent runs `skill copy-to-sandbox` → executes in sandbox
- To save sandbox code: you run `skill add-file` → persists to skill storage
```

Also add `copy-to-sandbox` to the available commands list (for completeness).

## Files to Modify
- `src/lib/agent/task-agent.ts` - Add conceptual section before "# Action Mechanisms"
- `src/lib/agent/skill-agent.ts` - Add conceptual section + `copy-to-sandbox` command

## Verification
1. Run a task that creates a script in sandbox
2. Trigger skill codification
3. Verify skillAgent uses `<shell>` literal syntax (not function call)
4. Start new conversation, search for skill, use `copy-to-sandbox` to load and execute
