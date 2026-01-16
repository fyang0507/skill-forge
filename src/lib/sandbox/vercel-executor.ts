import type { Sandbox } from '@vercel/sandbox';
import type { SandboxExecutor, CommandResult, ExecuteOptions } from './executor';

const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes for Vercel sandbox
const WORK_DIR = '/vercel/sandbox';

export class VercelSandboxExecutor implements SandboxExecutor {
  private sandbox: Sandbox | null = null;
  private workDir: string;

  constructor(workDir: string = WORK_DIR) {
    this.workDir = workDir;
  }

  private async ensureSandbox(): Promise<Sandbox> {
    if (!this.sandbox) {
      // Dynamic import to avoid loading @vercel/sandbox in local environment
      const { Sandbox } = await import('@vercel/sandbox');
      this.sandbox = await Sandbox.create({
        runtime: 'python3.13',
        timeout: DEFAULT_TIMEOUT_MS,
      });
    }
    return this.sandbox;
  }

  async execute(command: string, options?: ExecuteOptions): Promise<CommandResult> {
    const sandbox = await this.ensureSandbox();

    // Parse command string - use sh -c for shell operators, otherwise split
    const hasShellOperators = /[|><&;`$]|\|\||&&/.test(command);
    let cmd: string;
    let args: string[];

    if (hasShellOperators) {
      cmd = 'sh';
      args = ['-c', command];
    } else {
      const parts = command.trim().split(/\s+/);
      [cmd, ...args] = parts;
    }

    const result = await sandbox.runCommand({
      cmd,
      args,
      cwd: options?.cwd ?? this.workDir,
      env: options?.env,
      sudo: options?.sudo,
    });

    return {
      stdout: await result.stdout(),
      stderr: await result.stderr(),
      exitCode: result.exitCode,
    };
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    const sandbox = await this.ensureSandbox();
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    const fullPath = `${this.workDir}/${filePath}`;

    await sandbox.writeFiles([{ path: fullPath, content: buffer }]);
  }

  async readFile(filePath: string): Promise<string | null> {
    const sandbox = await this.ensureSandbox();
    const fullPath = `${this.workDir}/${filePath}`;

    try {
      const stream = await sandbox.readFile({ path: fullPath });
      if (!stream) return null;

      // Convert ReadableStream to string
      const reader = (stream as unknown as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      return Buffer.concat(chunks).toString('utf-8');
    } catch {
      return null;
    }
  }

  async listFiles(subPath?: string): Promise<string[]> {
    const sandbox = await this.ensureSandbox();
    const dir = subPath ? `${this.workDir}/${subPath}` : this.workDir;

    try {
      const result = await sandbox.runCommand({
        cmd: 'ls',
        args: ['-1', dir],
      });

      const stdout = await result.stdout();
      return stdout
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);
    } catch {
      return [];
    }
  }

  async cleanup(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.stop();
      this.sandbox = null;
    }
  }
}
