import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { executeCommand } from '../../tools/skill-commands';
import { resetStorage } from '../storage';

const TEST_SKILLS_DIR = '.skills';

describe('Skill Commands Integration', () => {
  beforeEach(async () => {
    // Reset storage instance to use fresh LocalStorage
    resetStorage();
    // Clean up test directory
    try {
      await fs.rm(TEST_SKILLS_DIR, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_SKILLS_DIR, { recursive: true, force: true });
    } catch {
      // Ignore
    }
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

  it('should add files to a skill', async () => {
    await executeCommand(`skill set my-skill "---
name: my-skill
description: A skill with files
---
# My Skill"`);

    const addResult = await executeCommand('skill add-file my-skill script.py "print(\\"hello\\")"');
    expect(addResult).toContain('File "script.py" added');

    const getResult = await executeCommand('skill get my-skill');
    expect(getResult).toContain('script.py');
  });
});
