# Plan: Fix Shell Redirection + Transparent Sandbox

## Problems

1. **Bug**: Shell operators (`>`, `>>`, `|`) don't work on Vercel - commands executed directly without shell interpretation
2. **Code smell**: `skill-commands.ts` mixes skill logic + shell execution
3. **Leaky abstraction**: Agent explicitly uses `sandbox *` commands instead of transparent file operations

## Design Goals

- Agent operates transparently in sandbox (no `sandbox *` commands)
- Shell commands auto-route to sandbox directory
- `skill *` commands remain for skill-specific operations
- SkillAgent gets `skill add-file` to copy sandbox files to skill storage

## Architecture

```
api/route.ts
    ↓
executeCommand() [command-executor.ts]
    ↓
├─ "skill *" → skillCommands [skill-commands.ts]
└─ else      → shell [shell-executor.ts] (cwd = sandbox)
```

## Files to Create

### 1. [shell-executor.ts](src/lib/tools/shell-executor.ts) (NEW)

```typescript
import { getSandboxExecutor } from '../sandbox/executor';

const MAX_OUTPUT_LENGTH = 5000;
const SHELL_OPERATORS_REGEX = /[|><&;`$]|\|\||&&/;

function truncate(output: string): string {
  if (output.length <= MAX_OUTPUT_LENGTH) return output;
  return output.slice(0, MAX_OUTPUT_LENGTH) + '\n... (truncated)';
}

export async function executeShellCommand(command: string): Promise<string> {
  const executor = await getSandboxExecutor();
  const hasShellOperators = SHELL_OPERATORS_REGEX.test(command);

  let result;
  if (hasShellOperators) {
    result = await executor.execute('sh', ['-c', command]);
  } else {
    const parts = command.trim().split(/\s+/);
    const [cmd, ...args] = parts;
    result = await executor.execute(cmd, args);
  }

  if (result.exitCode !== 0) {
    if (result.stderr) return `Error: ${result.stderr}`;
    return `Command failed with exit code ${result.exitCode}`;
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim() || '(no output)';
  return truncate(output);
}
```

### 2. [command-executor.ts](src/lib/tools/command-executor.ts) (NEW)

```typescript
import { executeSkillCommand } from './skill-commands';
import { executeShellCommand } from './shell-executor';

export async function executeCommand(command: string): Promise<string> {
  if (command.startsWith('skill ')) {
    return executeSkillCommand(command.slice(6).trim());
  }
  return executeShellCommand(command);
}
```

## Files to Modify

### 3. [skill-commands.ts](src/lib/tools/skill-commands.ts)

**Remove**: `executeCommand()`, `runShellCommand()`, `sandbox *` commands, `MAX_OUTPUT_LENGTH`, `truncate()`

**Rename**: `sandbox add-to-skill` → `skill add-file`

**Export**: `executeSkillCommand(args: string)` that handles:
- `help`, `list`, `search`, `get`, `set`, `get-file`, `copy-to-sandbox`, `suggest`, `add-file`

### 4. [local-executor.ts](src/lib/sandbox/local-executor.ts)

- Add `sh` to `ALLOWED_COMMANDS`
- Change `cwd: options?.cwd` → `cwd: options?.cwd ?? this.sandboxDir` (line 69)

### 5. [api/route.ts](src/app/api/agent/route.ts)

Update import:
```typescript
import { executeCommand } from '@/lib/tools/command-executor';
```

### 6. [skill-agent.ts](src/lib/agent/skill-agent.ts)

Update instructions:
- Change `<shell>sandbox list</shell>` → `<shell>ls</shell>`
- Change `<shell>sandbox add-to-skill script.py skill-name</shell>` → `<shell>skill add-file script.py skill-name</shell>`

### 7. [task-agent.ts](src/lib/agent/task-agent.ts)

Update instructions:
- Remove `sandbox list`, `sandbox clean` from help
- Remove `.sandbox/` prefix from examples (files auto-route)

## Verification

1. Run tests: `pnpm test`
2. Test shell operators: `echo "print('hello')" > test.py && python3 test.py`
3. Test skill commands: `skill list`, `skill get name`, `skill add-file`
4. Deploy to Vercel and test full workflow

## Risk Assessment

- **Medium risk**: Removes explicit `sandbox *` commands
- **Migration**: Update agent instructions
- **Backward compatible**: Skill commands unchanged except rename
