import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { LocalStorage } from '../local-storage';

const TEST_SKILLS_DIR = '.skills-test';

describe('LocalStorage', () => {
  let storage: LocalStorage;

  beforeEach(async () => {
    storage = new LocalStorage(TEST_SKILLS_DIR);
    // Clean up test directory before each test
    try {
      await fs.rm(TEST_SKILLS_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(TEST_SKILLS_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  describe('set', () => {
    it('should create a skill', async () => {
      const content = `---
name: test-skill
description: A test skill
---

# Test Skill

This is a test skill.`;

      await storage.set('test-skill', content);

      // Verify file was created
      const filePath = path.join(TEST_SKILLS_DIR, 'test-skill', 'SKILL.md');
      const savedContent = await fs.readFile(filePath, 'utf-8');
      expect(savedContent).toBe(content);
    });
  });

  describe('get', () => {
    it('should retrieve a skill', async () => {
      const content = `---
name: test-skill
description: A test skill
---

# Test Skill`;

      await storage.set('test-skill', content);
      const skill = await storage.get('test-skill');

      expect(skill).not.toBeNull();
      expect(skill?.name).toBe('test-skill');
      expect(skill?.description).toBe('A test skill');
      expect(skill?.content).toBe(content);
      expect(skill?.files).toEqual([]);
    });

    it('should return null for non-existent skill', async () => {
      const skill = await storage.get('non-existent');
      expect(skill).toBeNull();
    });
  });

  describe('list', () => {
    it('should list all skills', async () => {
      await storage.set('skill-1', `---
name: skill-1
description: First skill
---
# Skill 1`);

      await storage.set('skill-2', `---
name: skill-2
description: Second skill
---
# Skill 2`);

      const skills = await storage.list();

      expect(skills.length).toBe(2);
      expect(skills.map(s => s.name)).toContain('skill-1');
      expect(skills.map(s => s.name)).toContain('skill-2');
    });

    it('should return empty array when no skills exist', async () => {
      const skills = await storage.list();
      expect(skills).toEqual([]);
    });
  });

  describe('search', () => {
    it('should find skills by keyword', async () => {
      await storage.set('react-hooks', `---
name: react-hooks
description: How to use React hooks
---
# React Hooks`);

      await storage.set('vue-components', `---
name: vue-components
description: Vue component patterns
---
# Vue Components`);

      const results = await storage.search('react');

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('react-hooks');
    });

    it('should return empty array for no matches', async () => {
      await storage.set('test-skill', `---
name: test-skill
description: A test
---
# Test`);

      const results = await storage.search('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a skill', async () => {
      await storage.set('to-delete', `---
name: to-delete
description: Will be deleted
---
# Delete me`);

      // Verify it exists
      let skill = await storage.get('to-delete');
      expect(skill).not.toBeNull();

      // Delete it
      await storage.delete('to-delete');

      // Verify it's gone
      skill = await storage.get('to-delete');
      expect(skill).toBeNull();
    });

    it('should not throw for non-existent skill', async () => {
      // Should not throw
      await expect(storage.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('addFile', () => {
    it('should add a file to a skill', async () => {
      await storage.set('with-files', `---
name: with-files
description: Skill with files
---
# Skill`);

      await storage.addFile('with-files', 'script.py', 'print("hello")');

      const skill = await storage.get('with-files');
      expect(skill?.files).toContain('script.py');

      const fileContent = await storage.getFile('with-files', 'script.py');
      expect(fileContent).toBe('print("hello")');
    });

    it('should reject path traversal attempts', async () => {
      await storage.set('secure', `---
name: secure
description: Secure skill
---
# Skill`);

      await expect(storage.addFile('secure', '../evil.txt', 'bad')).rejects.toThrow();
      await expect(storage.addFile('secure', '/etc/passwd', 'bad')).rejects.toThrow();
    });
  });

  describe('listFiles', () => {
    it('should list all files in a skill directory', async () => {
      await storage.set('multi-file', `---
name: multi-file
description: Multi file skill
---
# Skill`);

      await storage.addFile('multi-file', 'script.py', 'print("hello")');
      await storage.addFile('multi-file', 'config.json', '{}');

      const files = await storage.listFiles('multi-file');
      expect(files).toContain('script.py');
      expect(files).toContain('config.json');
      expect(files).not.toContain('SKILL.md');
    });
  });
});
