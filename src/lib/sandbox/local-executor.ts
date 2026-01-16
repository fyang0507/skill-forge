import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { SandboxExecutor, CommandResult, ExecuteOptions } from './executor';

const execAsync = promisify(exec);

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_BUFFER = 1024 * 1024; // 1MB

const ALLOWED_COMMANDS = [
  'curl',
  'cat',
  'ls',
  'head',
  'tail',
  'find',
  'tree',
  'jq',
  'grep',
  'export',
  'source',
  'python',
  'python3',
  'pip',
  'pip3',
  'cd',
  'rm',
  'mv',
  'cp',
  'echo',
  'touch',
  'mkdir',
  'rmdir',
  'pwd',
  'sleep',
];

export class LocalSandboxExecutor implements SandboxExecutor {
  private sandboxDir: string;

  constructor(sandboxDir: string = '.sandbox') {
    this.sandboxDir = sandboxDir;
  }

  async execute(
    command: string,
    args: string[] = [],
    options?: ExecuteOptions
  ): Promise<CommandResult> {
    const [cmd] = command.trim().split(/\s+/);

    if (!ALLOWED_COMMANDS.includes(cmd)) {
      return {
        stdout: '',
        stderr: `Command "${cmd}" not allowed. Allowed: ${ALLOWED_COMMANDS.join(', ')}`,
        exitCode: 1,
      };
    }

    const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;

    try {
      const { stdout, stderr } = await execAsync(fullCommand, {
        timeout,
        maxBuffer: MAX_BUFFER,
        cwd: options?.cwd,
        env: options?.env ? { ...process.env, ...options.env } : undefined,
      });

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (error) {
      if (error instanceof Error) {
        if ('killed' in error && error.killed) {
          return {
            stdout: '',
            stderr: `Command timed out (${timeout / 1000}s)`,
            exitCode: 124, // Standard timeout exit code
          };
        }

        // Handle exec errors with exit codes
        const execError = error as Error & { code?: number; stdout?: string; stderr?: string };
        return {
          stdout: execError.stdout?.trim() ?? '',
          stderr: execError.stderr?.trim() ?? error.message,
          exitCode: execError.code ?? 1,
        };
      }

      return {
        stdout: '',
        stderr: 'Unknown error',
        exitCode: 1,
      };
    }
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    const fullPath = path.join(this.sandboxDir, filePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  async readFile(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.sandboxDir, filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async listFiles(subPath?: string): Promise<string[]> {
    try {
      const dir = subPath ? path.join(this.sandboxDir, subPath) : this.sandboxDir;
      return await fs.readdir(dir);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    await fs.rm(this.sandboxDir, { recursive: true, force: true });
    await fs.mkdir(this.sandboxDir, { recursive: true });
  }
}
