import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { CloudStorage } from '../cloud-storage';
import { initDb } from '../../db';

// Skip tests if no BLOB_READ_WRITE_TOKEN (CI without secrets or local dev without token)
const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
const hasTurso = !!process.env.TURSO_DATABASE_URL;

describe.skipIf(!hasToken || !hasTurso)('CloudStorage', () => {
  let storage: CloudStorage;
  const testSkillNames: string[] = [];

  beforeAll(async () => {
    // Initialize DB tables (includes skills tables)
    await initDb();
    storage = new CloudStorage();
  });

  beforeEach(() => {
    // Track skill names for cleanup
  });

  afterAll(async () => {
    // Clean up all test skills
    for (const name of testSkillNames) {
      try {
        await storage.delete(name);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  // Helper to create unique test skill names
  function testSkillName(base: string): string {
    const name = `test-${base}-${Date.now()}`;
    testSkillNames.push(name);
    return name;
  }

  describe('set and get', () => {
    it('should create and retrieve a skill', async () => {
      const name = testSkillName('basic');
      const content = `---
name: ${name}
description: A test skill for cloud storage
---

# Test Skill

This is a test skill stored in Vercel Blob.`;

      await storage.set(name, content);
      const skill = await storage.get(name);

      expect(skill).not.toBeNull();
      expect(skill?.name).toBe(name);
      expect(skill?.description).toBe('A test skill for cloud storage');
      expect(skill?.content).toBe(content);
    });

    it('should return null for non-existent skill', async () => {
      const skill = await storage.get('non-existent-skill-12345');
      expect(skill).toBeNull();
    });

    it('should update an existing skill', async () => {
      const name = testSkillName('update');
      const content1 = `---
name: ${name}
description: Original description
---
# Original`;

      await storage.set(name, content1);

      const content2 = `---
name: ${name}
description: Updated description
---
# Updated`;

      await storage.set(name, content2);

      const skill = await storage.get(name);
      expect(skill?.description).toBe('Updated description');
      expect(skill?.content).toBe(content2);
    });
  });

  describe('list', () => {
    it('should list skills', async () => {
      const name1 = testSkillName('list-1');
      const name2 = testSkillName('list-2');

      await storage.set(name1, `---
name: ${name1}
description: First skill
---
# Skill 1`);

      await storage.set(name2, `---
name: ${name2}
description: Second skill
---
# Skill 2`);

      const skills = await storage.list();

      expect(skills.length).toBeGreaterThanOrEqual(2);
      expect(skills.map(s => s.name)).toContain(name1);
      expect(skills.map(s => s.name)).toContain(name2);
    });
  });

  describe('search', () => {
    it('should find skills by keyword', async () => {
      const name = testSkillName('searchable-unique');

      await storage.set(name, `---
name: ${name}
description: A very searchable skill
---
# Searchable`);

      const results = await storage.search('searchable');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.map(s => s.name)).toContain(name);
    });
  });

  describe('delete', () => {
    it('should delete a skill', async () => {
      const name = testSkillName('to-delete');

      await storage.set(name, `---
name: ${name}
description: Will be deleted
---
# Delete me`);

      // Verify it exists
      let skill = await storage.get(name);
      expect(skill).not.toBeNull();

      // Delete it
      await storage.delete(name);

      // Verify it's gone
      skill = await storage.get(name);
      expect(skill).toBeNull();

      // Remove from cleanup list since already deleted
      const index = testSkillNames.indexOf(name);
      if (index > -1) testSkillNames.splice(index, 1);
    });
  });

  describe('addFile and getFile', () => {
    it('should add and retrieve a file', async () => {
      const name = testSkillName('with-files');

      await storage.set(name, `---
name: ${name}
description: Skill with files
---
# Skill`);

      await storage.addFile(name, 'script.py', 'print("hello from cloud")');

      const fileContent = await storage.getFile(name, 'script.py');
      expect(fileContent).toBe('print("hello from cloud")');
    });

    it('should list files', async () => {
      const name = testSkillName('multi-file');

      await storage.set(name, `---
name: ${name}
description: Multi file skill
---
# Skill`);

      await storage.addFile(name, 'script.py', 'print("hello")');
      await storage.addFile(name, 'config.json', '{}');

      const files = await storage.listFiles(name);
      expect(files).toContain('script.py');
      expect(files).toContain('config.json');
    });

    it('should reject path traversal attempts', async () => {
      const name = testSkillName('secure');

      await storage.set(name, `---
name: ${name}
description: Secure skill
---
# Skill`);

      await expect(storage.addFile(name, '../evil.txt', 'bad')).rejects.toThrow();
      await expect(storage.addFile(name, '/etc/passwd', 'bad')).rejects.toThrow();
    });
  });
});

// Unit tests that don't require actual cloud resources
describe('CloudStorage - Unit', () => {
  it('should be constructable', () => {
    // Just verify the class can be instantiated
    const storage = new CloudStorage();
    expect(storage).toBeInstanceOf(CloudStorage);
  });
});
