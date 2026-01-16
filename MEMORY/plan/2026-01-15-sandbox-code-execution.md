# Plan: Sandbox Code Execution

## Scope

Code execution infrastructure for taskAgent:
1. **`.sandbox/` directory** - Dedicated location for generated code
2. **Code-to-skill pipeline** - Move verified code into skill storage for reuse

**Design constraint**: Must be compatible with Vercel Sandbox for production deployment.

---

## 1. `.sandbox/` Directory

**Problem**: Generated code goes to project root, doesn't work with Vercel Sandbox in production.

### Files to modify

- [task-agent.ts](src/lib/agent/task-agent.ts) - Agent instructions
- [skill-commands.ts](src/lib/tools/skill-commands.ts) - Sandbox commands
- `.gitignore` - Ignore `.sandbox/`

### Cleanup

Remove `skill add-file` command - workflow is now: write to `.sandbox/` → `sandbox add-to-skill`

### Task Agent Instructions

Add to `TASK_AGENT_INSTRUCTIONS`:

```markdown
# Execution Workspace

All generated code MUST be placed in `.sandbox/`:
- Scripts: `.sandbox/script.py`, `.sandbox/fetch_data.py`
- Output: `.sandbox/output.json`, `.sandbox/result.csv`

Example:
<shell>cat > .sandbox/create_page.py << 'EOF'
import requests
...
EOF</shell>
<shell>python3 .sandbox/create_page.py</shell>

NEVER write files to project root.
```

### New Sandbox Commands

Add to skill-commands.ts:

```typescript
'sandbox list': async () => {
  const files = await fs.readdir('.sandbox').catch(() => []);
  return files.length ? files.map(f => `- ${f}`).join('\n') : '(empty)';
},

'sandbox clean': async () => {
  await fs.rm('.sandbox', { recursive: true, force: true });
  await fs.mkdir('.sandbox', { recursive: true });
  return 'Sandbox cleaned';
},
```

Auto-create `.sandbox/` when any command references it:

```typescript
async function ensureSandboxDir() {
  await fs.mkdir('.sandbox', { recursive: true }).catch(() => {});
}
```

---

## 2. Code-to-Skill Pipeline

**Problem**: Verified code doesn't persist into skill storage. On re-run, agent rewrites everything.

### Files to modify

- [skill-commands.ts](src/lib/tools/skill-commands.ts) - New commands
- [skill-agent.ts](src/lib/agent/skill-agent.ts) - Code extraction instructions
- [task-agent.ts](src/lib/agent/task-agent.ts) - Skill code retrieval

### New Skill Commands

```typescript
// Get code file from skill
'skill get-file': async (args) => {
  // skill get-file <skill-name> <filename>
  const match = args.match(/^(\S+)\s+(\S+)$/);
  if (!match) return 'Usage: skill get-file <skill-name> <filename>';
  const [, skillName, filename] = match;
  const storage = getStorage();
  const content = await storage.getFile(skillName, filename);
  return content || `File "${filename}" not found in skill "${skillName}"`;
},

// Copy skill code to sandbox
'skill copy-to-sandbox': async (args) => {
  // skill copy-to-sandbox <skill-name> <filename>
  const match = args.match(/^(\S+)\s+(\S+)$/);
  if (!match) return 'Usage: skill copy-to-sandbox <skill-name> <filename>';
  const [, skillName, filename] = match;
  const storage = getStorage();
  const content = await storage.getFile(skillName, filename);
  if (!content) return `File not found`;
  await ensureSandboxDir();
  await fs.writeFile(`.sandbox/${filename}`, content);
  return `Copied to .sandbox/${filename}`;
},

// Add sandbox file to skill
'sandbox add-to-skill': async (args) => {
  // sandbox add-to-skill <filename> <skill-name>
  const match = args.match(/^(\S+)\s+(\S+)$/);
  if (!match) return 'Usage: sandbox add-to-skill <filename> <skill-name>';
  const [, filename, skillName] = match;
  const content = await fs.readFile(`.sandbox/${filename}`, 'utf-8');
  const storage = getStorage();
  await storage.addFile(skillName, filename, content);
  return `Added ${filename} to skill "${skillName}"`;
},
```

### Skill Agent Instructions

Add to [skill-agent.ts](src/lib/agent/skill-agent.ts):

```markdown
# Code Extraction

When codifying a skill that involved code execution:
1. List sandbox files: <shell>sandbox list</shell>
2. Review code for reusability (remove hardcoded values, add comments)
3. Add to skill: <shell>sandbox add-to-skill script.py skill-name</shell>
4. Document in SKILL.md: reference the file, explain parameters, list env vars
```

### Task Agent Instructions

Add to [task-agent.ts](src/lib/agent/task-agent.ts):

```markdown
## Skill Code Execution

When a skill includes code files (shown in `skill get` output):
1. Copy code to sandbox: <shell>skill copy-to-sandbox skill-name script.py</shell>
2. Modify if needed (update parameters, env vars)
3. Execute: <shell>python3 .sandbox/script.py</shell>

This avoids rewriting code that already exists in the skill.
```

---

## Vercel Sandbox Compatibility

Design abstraction layer for future Vercel Sandbox integration.

### New file: `src/lib/sandbox/executor.ts`

```typescript
export interface SandboxExecutor {
  init(): Promise<void>;
  writeFile(filename: string, content: string): Promise<void>;
  readFile(filename: string): Promise<string | null>;
  listFiles(): Promise<string[]>;
  execute(command: string, timeout?: number): Promise<{ stdout: string; stderr: string }>;
  cleanup(): Promise<void>;
}

// Local development: filesystem + child_process
export class LocalSandboxExecutor implements SandboxExecutor {
  private dir = '.sandbox';

  async init() { await fs.mkdir(this.dir, { recursive: true }); }
  async writeFile(f, c) { await fs.writeFile(`${this.dir}/${f}`, c); }
  async readFile(f) { return fs.readFile(`${this.dir}/${f}`, 'utf-8').catch(() => null); }
  async listFiles() { return fs.readdir(this.dir).catch(() => []); }
  async execute(cmd, timeout = 10000) {
    return execAsync(cmd, { cwd: this.dir, timeout });
  }
  async cleanup() {
    await fs.rm(this.dir, { recursive: true, force: true });
    await this.init();
  }
}

// Production: Vercel Sandbox microVM (future implementation)
export class VercelSandboxExecutor implements SandboxExecutor {
  // Uses @vercel/sandbox SDK
  // Files accumulated in memory, uploaded to VM on execute()
  // Isolated filesystem - cannot access host
}

// Factory
export function getSandboxExecutor(): SandboxExecutor {
  return process.env.VERCEL === '1'
    ? new VercelSandboxExecutor()
    : new LocalSandboxExecutor();
}
```

### Key Vercel Sandbox facts (from docs)
- Firecracker microVMs with isolated filesystem
- Code cannot access host - must be uploaded
- Supports python3.13, node22 runtimes
- Max 45min (Hobby) to 5hr (Pro) execution time
- SDK: `@vercel/sandbox`

---

## Implementation Phases

### Phase 1: Sandbox Directory
1. Add `.sandbox/` to .gitignore
2. Add `ensureSandboxDir()` helper to skill-commands.ts
3. Add `sandbox list` and `sandbox clean` commands
4. Update task-agent.ts instructions for `.sandbox/` usage

### Phase 2: Code-to-Skill Commands
1. Add `skill get-file` command
2. Add `skill copy-to-sandbox` command
3. Add `sandbox add-to-skill` command
4. Update skill-agent.ts for code extraction

### Phase 3: Sandbox Abstraction (Future)
1. Create `src/lib/sandbox/executor.ts`
2. Refactor skill-commands.ts to use executor
3. Add `@vercel/sandbox` and implement VercelSandboxExecutor

---

## Verification

1. **Sandbox directory**: Run task that generates code → verify files in `.sandbox/` not root
2. **Code-to-skill**: Codify skill with code file → `skill get skill-name` shows file list
3. **Code retrieval**: New conversation → `skill copy-to-sandbox` → execute → works without rewriting
