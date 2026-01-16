# Skills vs Sandbox Clarity - Agent Prompt Improvements

Last Updated: 2026-01-15

## Problem

1. **Skill agent using wrong syntax**: Called `execute_shell_command` as a function instead of outputting `<shell>ls</shell>` literal text
2. **Conceptual confusion**: Neither agent explained the skills/sandbox separation clearly
3. **No generalization**: Skill agent copied sandbox code verbatim instead of parameterizing

## Root Cause

Task agent had explicit documentation:
```
## 2. Shell Commands (Literal Text)
- To run shell commands, output the exact text <shell>command</shell>
- NEVER call shell as a function
```

Skill agent lacked this - just showed example `<shell>` tags without explaining they're literal output.

## Changes

### `src/lib/agent/skill-agent.ts`

Added three new sections:

1. **Shell Commands (Literal Text)** - Explicit instruction that `<shell>` is text output, not a function call. Lists all available commands including `copy-to-sandbox`.

2. **Skills vs Sandbox** - Explains the two storage areas and the flow:
   - Skills = persistent library (survives sessions)
   - Sandbox = ephemeral execution workspace
   - Skill files CANNOT execute directly - must copy to sandbox first

3. **Code Extraction & Generalization** - Updated to instruct agent to:
   - Read file with `cat`
   - Replace hardcoded values with env vars/parameters
   - Include generalized code in skill markdown
   - Document required env vars and usage

### `src/lib/agent/task-agent.ts`

Replaced verbose "Execution Workspace" + "Using Skill Code" sections with consolidated "Skills vs Sandbox" section explaining the same concepts.

## Files Modified

- `src/lib/agent/skill-agent.ts` - Added shell syntax docs, skills/sandbox separation, generalization guidance
- `src/lib/agent/task-agent.ts` - Consolidated workspace docs into Skills vs Sandbox section
- `MEMORY/plan/skill-sandbox-separation.md` - Implementation plan

## Verification

1. Run task that creates script in sandbox
2. Trigger skill codification
3. Verify skill agent uses `<shell>` literal syntax (not function call)
4. Verify skill agent parameterizes code before saving
