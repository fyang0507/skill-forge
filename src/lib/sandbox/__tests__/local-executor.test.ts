import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { LocalSandboxExecutor } from '../local-executor';

const TEST_SANDBOX_DIR = '.test-sandbox';

describe('LocalSandboxExecutor', () => {
  let executor: LocalSandboxExecutor;

  beforeEach(async () => {
    await fs.rm(TEST_SANDBOX_DIR, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(TEST_SANDBOX_DIR, { recursive: true });
    executor = new LocalSandboxExecutor(TEST_SANDBOX_DIR);
  });

  afterEach(async () => {
    await fs.rm(TEST_SANDBOX_DIR, { recursive: true, force: true }).catch(() => {});
  });

  describe('execute', () => {
    it('should execute allowed commands', async () => {
      const result = await executor.execute('echo', ['hello', 'world']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('hello world');
    });

    it('should reject disallowed commands', async () => {
      const result = await executor.execute('wget', ['http://example.com']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not allowed');
    });

    it('should handle command without args', async () => {
      const result = await executor.execute('pwd');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    it('should return stdout, stderr, and exitCode', async () => {
      const result = await executor.execute('ls', ['-la', '/nonexistent']);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toBeTruthy();
    });

    it('should handle command timeout', async () => {
      // Use sleep command which is simpler to invoke and test timeout behavior
      const result = await executor.execute('sleep', ['5'], {
        timeout: 100,
      });
      // Exit code varies by platform (124 on Linux, other codes on macOS)
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('timed out');
    });
  });

  describe('writeFile', () => {
    it('should write file to sandbox directory', async () => {
      await executor.writeFile('test.txt', 'hello world');
      const content = await fs.readFile(`${TEST_SANDBOX_DIR}/test.txt`, 'utf-8');
      expect(content).toBe('hello world');
    });

    it('should create parent directories', async () => {
      await executor.writeFile('nested/dir/test.txt', 'nested content');
      const content = await fs.readFile(`${TEST_SANDBOX_DIR}/nested/dir/test.txt`, 'utf-8');
      expect(content).toBe('nested content');
    });

    it('should write Buffer content', async () => {
      const buffer = Buffer.from('binary content');
      await executor.writeFile('binary.bin', buffer);
      const content = await fs.readFile(`${TEST_SANDBOX_DIR}/binary.bin`);
      expect(content.toString()).toBe('binary content');
    });
  });

  describe('readFile', () => {
    it('should read file from sandbox', async () => {
      await fs.writeFile(`${TEST_SANDBOX_DIR}/readable.txt`, 'read me');
      const content = await executor.readFile('readable.txt');
      expect(content).toBe('read me');
    });

    it('should return null for non-existent file', async () => {
      const content = await executor.readFile('nonexistent.txt');
      expect(content).toBeNull();
    });
  });

  describe('listFiles', () => {
    it('should list files in sandbox', async () => {
      await fs.writeFile(`${TEST_SANDBOX_DIR}/file1.txt`, 'content1');
      await fs.writeFile(`${TEST_SANDBOX_DIR}/file2.txt`, 'content2');

      const files = await executor.listFiles();
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });

    it('should return empty array when sandbox is empty', async () => {
      const files = await executor.listFiles();
      expect(files).toEqual([]);
    });

    it('should list files in subdirectory', async () => {
      await fs.mkdir(`${TEST_SANDBOX_DIR}/subdir`, { recursive: true });
      await fs.writeFile(`${TEST_SANDBOX_DIR}/subdir/nested.txt`, 'nested');

      const files = await executor.listFiles('subdir');
      expect(files).toContain('nested.txt');
    });

    it('should return empty array for non-existent directory', async () => {
      const files = await executor.listFiles('nonexistent');
      expect(files).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should remove all files from sandbox', async () => {
      await fs.writeFile(`${TEST_SANDBOX_DIR}/cleanup-test.txt`, 'will be deleted');
      await executor.cleanup();

      const files = await executor.listFiles();
      expect(files).toEqual([]);
    });

    it('should recreate empty sandbox directory', async () => {
      await executor.cleanup();

      // Directory should exist after cleanup
      const stats = await fs.stat(TEST_SANDBOX_DIR);
      expect(stats.isDirectory()).toBe(true);
    });
  });
});
