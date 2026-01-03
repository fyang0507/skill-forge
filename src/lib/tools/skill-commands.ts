import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import Fuse from 'fuse.js';

const SKILLS_DIR = '.forge/skills';

export type CommandHandler = (args: string) => string | Promise<string>;

export function createSkillCommands(): Record<string, CommandHandler> {
  return {
    'skill help': () => `Available commands:
  skill list              - List all skills
  skill search <keyword>  - Search skills by keyword
  skill get <name>        - Read a skill
  skill set <name> "..."  - Write a skill`,

    'skill list': async () => {
      const skills = await scanSkills();
      if (skills.length === 0) return '(no skills found)';
      return skills.map(s => `- ${s.name}: ${s.description}`).join('\n');
    },

    'skill search': async (keyword) => {
      if (!keyword.trim()) return 'Usage: skill search <keyword>';
      const skills = await scanSkills();
      if (skills.length === 0) return `No skills matching "${keyword}"`;
      const fuse = new Fuse(skills, { keys: ['name', 'description'], threshold: 0.4 });
      const results = fuse.search(keyword);
      if (results.length === 0) return `No skills matching "${keyword}"`;
      return results.map(r => `- ${r.item.name}: ${r.item.description}`).join('\n');
    },

    'skill get': async (name) => {
      if (!name.trim()) return 'Usage: skill get <name>';
      const skillPath = path.join(SKILLS_DIR, name.trim(), 'SKILL.md');
      try {
        return await fs.readFile(skillPath, 'utf-8');
      } catch {
        return `Skill "${name}" not found`;
      }
    },

    'skill set': async (args) => {
      // Parse: skill set <name> "<content>"
      const match = args.match(/^(\S+)\s+"([\s\S]+)"$/);
      if (!match) return 'Usage: skill set <name> "<content>"';

      const [, name, content] = match;
      const skillDir = path.join(SKILLS_DIR, name);
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), content);
      return `Skill "${name}" saved to ${skillDir}/SKILL.md`;
    },
  };
}

async function scanSkills(): Promise<Array<{ name: string; description: string }>> {
  try {
    const dirs = await fs.readdir(SKILLS_DIR);
    const skills = [];

    for (const dir of dirs) {
      try {
        const content = await fs.readFile(path.join(SKILLS_DIR, dir, 'SKILL.md'), 'utf-8');
        const { data } = matter(content);
        if (data.name && data.description) {
          skills.push({ name: data.name, description: data.description });
        }
      } catch { /* skip */ }
    }

    return skills;
  } catch {
    return [];
  }
}
