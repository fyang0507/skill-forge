import { executeSkillCommand } from './skill-commands';
import { executeShellCommand } from './shell-executor';

export interface CommandOptions {
  env?: Record<string, string>;
}

export async function executeCommand(command: string, options?: CommandOptions): Promise<string> {
  if (command.startsWith('skill ')) {
    return executeSkillCommand(command.slice(6).trim());
  }
  return executeShellCommand(command, options);
}
