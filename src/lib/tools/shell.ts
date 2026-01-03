import { tool } from 'ai';
import { z } from 'zod';
import { createSkillCommands } from './skill-commands';

export function createShellTool() {
  const commands = createSkillCommands();
  const helpText = commands['skill help']('');

  return tool({
    description: `Execute skill commands.

${helpText}`,
    inputSchema: z.object({
      command: z.string().describe('Command to execute'),
    }),
    execute: async ({ command }: { command: string }) => {
      // Find matching command handler
      const sortedCommands = Object.keys(commands).sort((a, b) => b.length - a.length);

      for (const cmd of sortedCommands) {
        if (command === cmd || command.startsWith(cmd + ' ')) {
          const args = command.slice(cmd.length).trim();
          const handler = commands[cmd];
          return await handler(args);
        }
      }

      return `Unknown command. Run "skill help" for available commands.`;
    },
  });
}
