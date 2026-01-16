/**
 * Unified Sandbox Executor Interface
 *
 * Provides a consistent abstraction for executing commands and file operations:
 * - LocalSandboxExecutor: Uses Node.js child_process + filesystem (development)
 * - VercelSandboxExecutor: Uses @vercel/sandbox SDK for isolated microVM (production)
 */

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecuteOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  sudo?: boolean;
}

export interface SandboxExecutor {
  /** Execute a command in the sandbox */
  execute(command: string, args?: string[], options?: ExecuteOptions): Promise<CommandResult>;

  /** Write a file to the sandbox */
  writeFile(path: string, content: string | Buffer): Promise<void>;

  /** Read a file from the sandbox, returns null if not found */
  readFile(path: string): Promise<string | null>;

  /** List files in the sandbox directory */
  listFiles(path?: string): Promise<string[]>;

  /** Clean up sandbox resources */
  cleanup(): Promise<void>;
}

let cachedExecutor: SandboxExecutor | null = null;

/**
 * Get the appropriate sandbox executor for the current environment.
 * Returns a cached instance for session-scoped sandbox reuse.
 */
export async function getSandboxExecutor(): Promise<SandboxExecutor> {
  if (cachedExecutor) {
    return cachedExecutor;
  }

  if (process.env.VERCEL === '1') {
    const { VercelSandboxExecutor } = await import('./vercel-executor');
    cachedExecutor = new VercelSandboxExecutor();
  } else {
    const { LocalSandboxExecutor } = await import('./local-executor');
    cachedExecutor = new LocalSandboxExecutor();
  }

  return cachedExecutor;
}

/**
 * Clear the cached executor. Call this when a conversation ends.
 */
export async function clearSandboxExecutor(): Promise<void> {
  if (cachedExecutor) {
    await cachedExecutor.cleanup();
    cachedExecutor = null;
  }
}
