# Plan: Skill Agent Test Bootstrapping

## Goal
Create a dev utility to quickly test the skill agent by harvesting completed tasks from conversation history, without re-running the task agent.

## Current State
- **Conversations**: Persisted in SQLite DB at `./data/skillforge.db`
- **Sandbox files**: Persist in `.sandbox/default/` directory (local dev uses shared `default` sandbox)
- **Skill agent trigger**: Currently requires clicking "Codify Skill" in UI after task completes

## Approach: CLI Test Script

Create a standalone Node.js script (tsx) that:
1. Lists completed task conversations from the local SQLite DB
2. Accepts a conversation ID argument (or shows picker)
3. Runs the skill agent with full streaming output to console

### Implementation

**File: `scripts/test-skill-agent.ts`**

```typescript
import { createClient } from '@libsql/client';
import { skillAgent } from '../src/lib/agent/skill-agent';
import { runWithRequestContext } from '../src/lib/agent/request-context';

const db = createClient({ url: 'file:./data/skillforge.db' });

async function main() {
  const conversationId = process.argv[2];

  if (!conversationId) {
    // List recent task conversations for selection
    const result = await db.execute(`
      SELECT id, title, datetime(updated_at/1000, 'unixepoch') as updated
      FROM conversations WHERE mode = 'task'
      ORDER BY updated_at DESC LIMIT 10
    `);
    console.log('Recent tasks:');
    result.rows.forEach(r => console.log(`  ${r.id}  ${r.title}  (${r.updated})`));
    console.log('\nUsage: npx tsx scripts/test-skill-agent.ts <conversation-id>');
    return;
  }

  console.log(`Testing skill agent with conversation: ${conversationId}\n`);

  // Run skill agent with request context (provides conversationId/sandboxId to tools)
  await runWithRequestContext(
    { conversationId, sandboxId: 'default' },
    async () => {
      const result = await skillAgent.stream({
        messages: [{ role: 'user', content: 'Start' }],
      });

      // Stream output to console
      for await (const part of result.fullStream) {
        switch (part.type) {
          case 'text-delta':
            process.stdout.write(part.text);
            break;
          case 'tool-call':
            console.log(`\n[Tool: ${part.toolName}]`);
            break;
          case 'tool-result':
            console.log(`[Result: ${String(part.result).slice(0, 200)}...]\n`);
            break;
        }
      }
      console.log('\n--- Done ---');
    }
  );
}

main().catch(console.error);
```

### Key Implementation Details

1. **Direct DB access**: Uses `@libsql/client` directly to query local SQLite
2. **Sandbox ID**: Always `'default'` for local dev (shared sandbox directory)
3. **Request context**: Uses `runWithRequestContext` to inject conversationId/sandboxId
4. **Streaming**: Outputs skill agent's response in real-time to console

### Files to Create

| File | Action |
|------|--------|
| `scripts/test-skill-agent.ts` | **Create** - Main CLI script |

### Usage

```bash
# List available completed tasks
npx tsx scripts/test-skill-agent.ts

# Test skill agent with specific conversation
npx tsx scripts/test-skill-agent.ts <conversation-id>
```

### Verification

1. Complete a task through the UI (or have existing tasks in history)
2. Run `npx tsx scripts/test-skill-agent.ts` to see available conversations
3. Run `npx tsx scripts/test-skill-agent.ts <id>` to trigger skill agent
4. Observe transcript processing and skill codification decision
5. Check `.skills/` directory if skill was created
