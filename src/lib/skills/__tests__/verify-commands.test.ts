import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { executeCommand } from '../../tools/command-executor';
import { resetStorage } from '../storage';

const TEST_SKILLS_DIR = '.skills';
const TEST_SANDBOX_DIR = '.sandbox';

describe('Skill Commands Integration', () => {
  beforeEach(async () => {
    // Reset storage instance to use fresh LocalStorage
    resetStorage();
    // Clean up test directories
    await fs.rm(TEST_SKILLS_DIR, { recursive: true, force: true }).catch(() => {});
    await fs.rm(TEST_SANDBOX_DIR, { recursive: true, force: true }).catch(() => {});
  });

  afterEach(async () => {
    // Clean up test directories
    await fs.rm(TEST_SKILLS_DIR, { recursive: true, force: true }).catch(() => {});
    await fs.rm(TEST_SANDBOX_DIR, { recursive: true, force: true }).catch(() => {});
  });

  it('should show help', async () => {
    const result = await executeCommand('skill help');
    expect(result).toContain('skill list');
    expect(result).toContain('skill search');
    expect(result).toContain('skill get');
    expect(result).toContain('skill set');
  });

  it('should list empty skills', async () => {
    const result = await executeCommand('skill list');
    expect(result).toBe('(no skills found)');
  });

  it('should set and get a skill', async () => {
    const skillContent = `---
name: test-skill
description: A test skill
---

# Test Skill

This is a test skill.`;

    const setResult = await executeCommand(`skill set test-skill "${skillContent}"`);
    expect(setResult).toContain('Skill "test-skill" saved');

    const getResult = await executeCommand('skill get test-skill');
    expect(getResult).toContain('# Test Skill');
    expect(getResult).toContain('A test skill');
  });

  it('should list skills after creation', async () => {
    await executeCommand(`skill set react-hooks "---
name: react-hooks
description: How to use React hooks
---
# React Hooks"`);

    const result = await executeCommand('skill list');
    expect(result).toContain('react-hooks');
    expect(result).toContain('How to use React hooks');
  });

  it('should search skills', async () => {
    await executeCommand(`skill set react-hooks "---
name: react-hooks
description: How to use React hooks
---
# React Hooks"`);

    await executeCommand(`skill set vue-components "---
name: vue-components
description: Vue component patterns
---
# Vue Components"`);

    const result = await executeCommand('skill search react');
    expect(result).toContain('react-hooks');
    expect(result).not.toContain('vue-components');
  });

  it('should add files to a skill via sandbox', async () => {
    // Create skill first
    await executeCommand(`skill set my-skill "---
name: my-skill
description: A skill with files
---
# My Skill"`);

    // Write file to sandbox
    await fs.mkdir(TEST_SANDBOX_DIR, { recursive: true });
    await fs.writeFile(`${TEST_SANDBOX_DIR}/script.py`, 'print("hello")');

    // Add sandbox file to skill using new command
    const addResult = await executeCommand('skill add-file script.py my-skill');
    expect(addResult).toContain('Added script.py to skill');

    // Verify file appears in skill
    const getResult = await executeCommand('skill get my-skill');
    expect(getResult).toContain('script.py');
  });

  it('should copy skill file to sandbox', async () => {
    // Create skill with a file
    await executeCommand(`skill set my-skill "---
name: my-skill
description: A skill with files
---
# My Skill"`);

    await fs.mkdir(TEST_SANDBOX_DIR, { recursive: true });
    await fs.writeFile(`${TEST_SANDBOX_DIR}/script.py`, 'print("hello")');
    await executeCommand('skill add-file script.py my-skill');

    // Clean sandbox manually
    await fs.rm(TEST_SANDBOX_DIR, { recursive: true, force: true });
    await fs.mkdir(TEST_SANDBOX_DIR, { recursive: true });

    // Copy file back to sandbox
    const copyResult = await executeCommand('skill copy-to-sandbox my-skill script.py');
    expect(copyResult).toContain('Copied to sandbox');

    // Verify file exists in sandbox
    const content = await fs.readFile(`${TEST_SANDBOX_DIR}/script.py`, 'utf-8');
    expect(content).toBe('print("hello")');
  });

  it('should execute shell commands in sandbox', async () => {
    // Create sandbox directory
    await fs.mkdir(TEST_SANDBOX_DIR, { recursive: true });

    // Test ls command (should work in sandbox)
    const lsResult = await executeCommand('ls');
    // Empty dir or shows files - either is valid
    expect(typeof lsResult).toBe('string');

    // Test shell operators with pipe (single command with operators)
    const pipeResult = await executeCommand('echo "hello world" | grep hello');
    expect(pipeResult).toContain('hello');
  });
});
