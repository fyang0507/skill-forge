import { getSandboxExecutor } from '../sandbox/executor';
import type { CommandOptions } from './command-executor';

const MAX_OUTPUT_LENGTH = 5000;

function truncate(output: string): string {
  if (output.length <= MAX_OUTPUT_LENGTH) return output;
  return output.slice(0, MAX_OUTPUT_LENGTH) + '\n... (truncated)';
}

export async function executeShellCommand(command: string, options?: CommandOptions): Promise<string> {
  const executor = await getSandboxExecutor();
  const result = await executor.execute(command, { env: options?.env });

  if (result.exitCode !== 0) {
    if (result.stderr) return `Error: ${result.stderr}`;
    return `Command failed with exit code ${result.exitCode}`;
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim() || '(no output)';
  return truncate(output);
}
