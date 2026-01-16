import { executeSkillCommand } from './skill-commands';
import { executeShellCommand } from './shell-executor';

export async function executeCommand(command: string): Promise<string> {
  if (command.startsWith('skill ')) {
    return executeSkillCommand(command.slice(6).trim());
  }
  return executeShellCommand(command);
}
