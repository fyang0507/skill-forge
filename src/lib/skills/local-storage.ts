/**
 * LocalStorage - filesystem-based skill storage for development
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import Fuse from 'fuse.js';
import type { SkillStorage, SkillMeta, Skill, SkillSearchResult } from './storage';

const SKILLS_DIR = '.skills';

export class LocalStorage implements SkillStorage {
  private skillsDir: string;

  constructor(skillsDir: string = SKILLS_DIR) {
    this.skillsDir = skillsDir;
  }

  async list(): Promise<SkillMeta[]> {
    try {
      const dirs = await fs.readdir(this.skillsDir);
      const skills: SkillMeta[] = [];

      for (const dir of dirs) {
        const skillPath = path.join(this.skillsDir, dir, 'SKILL.md');
        try {
          const content = await fs.readFile(skillPath, 'utf-8');
          const { data } = matter(content);
          const stat = await fs.stat(skillPath);
          if (data.name && data.description) {
            skills.push({
              name: data.name,
              description: data.description,
              updatedAt: stat.mtime,
            });
          }
        } catch {
          // Skip invalid skill directories
        }
      }

      return skills;
    } catch {
      return [];
    }
  }

  async search(keyword: string): Promise<SkillSearchResult[]> {
    const skills = await this.list();
    if (skills.length === 0) return [];

    const fuse = new Fuse(skills, {
      keys: ['name', 'description'],
      threshold: 0.6,  // Allow broader matches for fuzzy search
      includeScore: true,
    });

    return fuse.search(keyword).map(r => ({
      ...r.item,
      score: 1 - (r.score ?? 0),  // Convert Fuse distance (0=perfect) to similarity (1=perfect)
    }));
  }

  async get(name: string): Promise<Skill | null> {
    const skillDir = path.join(this.skillsDir, name);
    const skillPath = path.join(skillDir, 'SKILL.md');

    try {
      const content = await fs.readFile(skillPath, 'utf-8');
      const { data } = matter(content);
      const stat = await fs.stat(skillPath);

      const allFiles = await fs.readdir(skillDir);
      const files = allFiles.filter(f => f !== 'SKILL.md' && !f.startsWith('.'));

      return {
        name: data.name || name,
        description: data.description || '',
        content,
        files,
        updatedAt: stat.mtime,
      };
    } catch {
      return null;
    }
  }

  async set(name: string, content: string): Promise<void> {
    const skillDir = path.join(this.skillsDir, name);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content);
  }

  async addFile(name: string, filename: string, content: string): Promise<void> {
    // Security: prevent path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('Invalid filename (no path traversal allowed)');
    }

    const skillDir = path.join(this.skillsDir, name);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, filename), content);
  }

  async getFile(name: string, filename: string): Promise<string | null> {
    // Security: prevent path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('Invalid filename (no path traversal allowed)');
    }

    const filePath = path.join(this.skillsDir, name, filename);
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async delete(name: string): Promise<void> {
    const skillDir = path.join(this.skillsDir, name);
    try {
      await fs.rm(skillDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  }

  async listFiles(name: string): Promise<string[]> {
    const skillDir = path.join(this.skillsDir, name);
    try {
      const files = await fs.readdir(skillDir);
      return files.filter(f => f !== 'SKILL.md' && !f.startsWith('.'));
    } catch {
      return [];
    }
  }
}
