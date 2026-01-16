import { getStorage } from '../skills/storage';
import { getSandboxExecutor, type SandboxExecutor } from '../sandbox/executor';

const MAX_OUTPUT_LENGTH = 5000;

export type CommandHandler = (args: string) => string | Promise<string>;

let cachedExecutor: SandboxExecutor | null = null;

async function getExecutor(): Promise<SandboxExecutor> {
  if (!cachedExecutor) {
    cachedExecutor = await getSandboxExecutor();
  }
  return cachedExecutor;
}

async function runShellCommand(command: string): Promise<string> {
  const executor = await getExecutor();

  // Parse command and args
  const parts = command.trim().split(/\s+/);
  const [cmd, ...args] = parts;

  const result = await executor.execute(cmd, args);

  if (result.exitCode !== 0) {
    if (result.stderr) {
      return `Error: ${result.stderr}`;
    }
    return `Command failed with exit code ${result.exitCode}`;
  }

  return [result.stdout, result.stderr].filter(Boolean).join('\n').trim() || '(no output)';
}

function truncate(output: string): string {
  if (output.length <= MAX_OUTPUT_LENGTH) return output;
  return output.slice(0, MAX_OUTPUT_LENGTH) + '\n... (truncated)';
}

/**
 * Execute a command - tries skill commands first, then shell commands
 */
export async function executeCommand(command: string): Promise<string> {
  const skillCommands = createSkillCommands();
  const sortedCommands = Object.keys(skillCommands).sort((a, b) => b.length - a.length);

  // Try skill commands first
  for (const cmd of sortedCommands) {
    if (command === cmd || command.startsWith(cmd + ' ')) {
      const args = command.slice(cmd.length).trim();
      const result = await skillCommands[cmd](args);
      return truncate(result);
    }
  }

  // Fall back to shell execution
  const result = await runShellCommand(command);
  return truncate(result);
}

export function createSkillCommands(): Record<string, CommandHandler> {
  const storage = getStorage();

  return {
    'skill help': () => `Skill commands:
  skill list                              - List all skills
  skill search <keyword>                  - Search skills by keyword
  skill get <name>                        - Read a skill (includes file list)
  skill set <name> "..."                  - Write/update a skill
  skill get-file <name> <filename>        - Read a file from skill
  skill copy-to-sandbox <name> <filename> - Copy skill file to .sandbox/
  skill suggest "..." [--update="name"]   - Suggest codifying a learned procedure

Sandbox commands:
  sandbox list                            - List files in .sandbox/
  sandbox clean                           - Clear .sandbox/ directory
  sandbox add-to-skill <filename> <name>  - Add sandbox file to a skill`,

    'skill list': async () => {
      const skills = await storage.list();
      if (skills.length === 0) return '(no skills found)';
      return skills.map((s) => `- ${s.name}: ${s.description}`).join('\n');
    },

    'skill search': async (keyword) => {
      if (!keyword.trim()) return 'Usage: skill search <keyword>';
      const results = await storage.search(keyword);
      if (results.length === 0) return `No skills matching "${keyword}"`;
      return results.map((s) => `- ${s.name}: ${s.description}`).join('\n');
    },

    'skill get': async (name) => {
      if (!name.trim()) return 'Usage: skill get <name>';
      const skill = await storage.get(name.trim());
      if (!skill) return `Skill "${name}" not found`;

      let output = skill.content;
      if (skill.files.length > 0) {
        output += '\n\n---\n## Skill Files\n';
        output += skill.files.map((f) => `- ${name}/${f}`).join('\n');
      }
      return output;
    },

    'skill set': async (args) => {
      // Parse: skill set <name> "<content>"
      const match = args.match(/^(\S+)\s+"([\s\S]+)"$/);
      if (!match) return 'Usage: skill set <name> "<content>"';

      const [, name, content] = match;
      await storage.set(name, content);
      return `Skill "${name}" saved`;
    },

    'skill get-file': async (args) => {
      // skill get-file <skill-name> <filename>
      const match = args.match(/^(\S+)\s+(\S+)$/);
      if (!match) return 'Usage: skill get-file <skill-name> <filename>';
      const [, skillName, filename] = match;
      const content = await storage.getFile(skillName, filename);
      return content || `File "${filename}" not found in skill "${skillName}"`;
    },

    'skill copy-to-sandbox': async (args) => {
      // skill copy-to-sandbox <skill-name> <filename>
      const match = args.match(/^(\S+)\s+(\S+)$/);
      if (!match) return 'Usage: skill copy-to-sandbox <skill-name> <filename>';
      const [, skillName, filename] = match;
      const content = await storage.getFile(skillName, filename);
      if (!content) return `File "${filename}" not found in skill "${skillName}"`;

      const executor = await getExecutor();
      await executor.writeFile(filename, content);
      return `Copied to .sandbox/${filename}`;
    },

    'skill suggest': (args) => {
      // Parse: skill suggest "description" [--update="skill-name"]
      const match = args.match(/^"([^"]+)"(?:\s+--update="([^"]+)")?$/);
      if (!match) {
        return JSON.stringify({
          type: 'skill-suggestion-error',
          error: 'Usage: skill suggest "description" [--update="skill-name"]',
        });
      }

      const [, learned, skillToUpdate] = match;
      return JSON.stringify({
        type: 'skill-suggestion',
        learned,
        skillToUpdate: skillToUpdate || null,
      });
    },

    // Sandbox commands
    'sandbox list': async () => {
      const executor = await getExecutor();
      const files = await executor.listFiles();
      if (files.length === 0) return '(empty)';
      return files.map((f) => `- ${f}`).join('\n');
    },

    'sandbox clean': async () => {
      const executor = await getExecutor();
      await executor.cleanup();
      return 'Sandbox cleaned';
    },

    'sandbox add-to-skill': async (args) => {
      // sandbox add-to-skill <filename> <skill-name>
      const match = args.match(/^(\S+)\s+(\S+)$/);
      if (!match) return 'Usage: sandbox add-to-skill <filename> <skill-name>';
      const [, filename, skillName] = match;

      const executor = await getExecutor();
      const content = await executor.readFile(filename);
      if (!content) {
        return `File "${filename}" not found in .sandbox/`;
      }

      await storage.addFile(skillName, filename, content);
      return `Added ${filename} to skill "${skillName}"`;
    },
  };
}
