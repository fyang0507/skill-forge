/**
 * Unified Sandbox Executor Interface
 *
 * Provides a consistent abstraction for executing commands and file operations:
 * - LocalSandboxExecutor: Uses Node.js child_process + filesystem (development)
 * - VercelSandboxExecutor: Uses @vercel/sandbox SDK for isolated microVM (production)
 */

export class SandboxTimeoutError extends Error {
  constructor(message = 'Sandbox timed out due to inactivity') {
    super(message);
    this.name = 'SandboxTimeoutError';
  }
}

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
  execute(command: string, options?: ExecuteOptions): Promise<CommandResult>;

  /** Write a file to the sandbox */
  writeFile(path: string, content: string | Buffer): Promise<void>;

  /** Read a file from the sandbox, returns null if not found */
  readFile(path: string): Promise<string | null>;

  /** List files in the sandbox directory */
  listFiles(path?: string): Promise<string[]>;

  /** Clean up sandbox resources */
  cleanup(): Promise<void>;

  /** Reset the sandbox timeout to the default duration. Returns false if sandbox is dead. */
  resetTimeout(): Promise<boolean>;

  /** Check if sandbox is still alive */
  isAlive(): boolean;

  /** Get the current sandbox ID for reconnection across requests */
  getSandboxId(): string | null;
}

let cachedExecutor: SandboxExecutor | null = null;
let sandboxRootDir: string = '.sandbox';

/**
 * Configure the sandbox root directory. Must be called before getSandboxExecutor().
 * Primarily used for testing to isolate sandbox from production data.
 */
export function configureSandbox(options: { sandboxRoot?: string }): void {
  if (options.sandboxRoot !== undefined) {
    sandboxRootDir = options.sandboxRoot;
  }
}

/**
 * Get the configured sandbox root directory.
 */
export function getSandboxRoot(): string {
  return sandboxRootDir;
}

/**
 * Get the appropriate sandbox executor for the current environment.
 * If sandboxId is provided, reconnects to an existing sandbox (cross-request sharing).
 * Otherwise returns a cached instance for session-scoped sandbox reuse.
 */
export async function getSandboxExecutor(sandboxId?: string): Promise<SandboxExecutor> {
  // If reconnecting to a specific sandbox, create new executor with that ID
  if (sandboxId) {
    if (process.env.VERCEL === '1') {
      const { VercelSandboxExecutor } = await import('./vercel-executor');
      cachedExecutor = new VercelSandboxExecutor(undefined, sandboxId);
    } else {
      const { LocalSandboxExecutor } = await import('./local-executor');
      cachedExecutor = new LocalSandboxExecutor(sandboxId, sandboxRootDir);
    }
    return cachedExecutor;
  }

  if (cachedExecutor) {
    return cachedExecutor;
  }

  if (process.env.VERCEL === '1') {
    const { VercelSandboxExecutor } = await import('./vercel-executor');
    cachedExecutor = new VercelSandboxExecutor();
  } else {
    const { LocalSandboxExecutor } = await import('./local-executor');
    cachedExecutor = new LocalSandboxExecutor('default', sandboxRootDir);
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
