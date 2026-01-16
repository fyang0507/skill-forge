# Transparent Sandbox + Shell Redirection Fix

Last Updated: 2026-01-15

## Summary

Implemented transparent sandbox operations so agents use native shell commands (`ls`, `cat`, `python3`) instead of explicit `sandbox *` commands. Fixed shell operators (`|`, `&&`, `>`) that weren't working on Vercel.

## Architecture

```
executeCommand() [command-executor.ts]
    ├─ "skill *" → executeSkillCommand() [skill-commands.ts]
    └─ else      → executeShellCommand() [shell-executor.ts]
```

## Files Changed

**New Files:**
- `src/lib/tools/command-executor.ts` - Routes commands to skill or shell handlers
- `src/lib/tools/shell-executor.ts` - Executes shell commands via SandboxExecutor

**Major Refactor:**
- `src/lib/tools/skill-commands.ts`
  - Removed: `executeCommand()`, `runShellCommand()`, `sandbox *` commands
  - Renamed: `sandbox add-to-skill` → `skill add-file`
  - Now exports only `executeSkillCommand(args)`

**Interface Simplification:**
- `executor.ts`: Changed `execute(cmd, args?, opts?)` → `execute(cmd, opts?)`
- `local-executor.ts`: Validates first word only, passes full command to `execAsync`
- `vercel-executor.ts`: Parses cmd/args internally (SDK requirement)

**Agent Instructions:**
- `task-agent.ts`: Added execution workspace docs, `skill copy-to-sandbox` command
- `skill-agent.ts`: Added code extraction workflow (`ls` → `skill add-file`)

## Key Decisions

1. **No args splitting at interface** - `execAsync` runs through shell, so JS-level quoting was redundant
2. **VercelSandboxExecutor handles parsing** - SDK requires separate cmd/args, so parsing stays internal
3. **`sh` in allowlist** - Enables `sh -c` for complex shell operations

## Verification

All 37 tests passing. Shell operators tested:
- `echo "hello" | grep hello` ✓
- `cat > file.py << 'EOF'` ✓
