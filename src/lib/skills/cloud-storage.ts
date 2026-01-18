/**
 * CloudStorage - Vercel Blob + Turso for production
 */

import { put, del } from '@vercel/blob';
import matter from 'gray-matter';
import Fuse from 'fuse.js';
import { getDb } from '../db';
import type { SkillStorage, SkillMeta, Skill, SkillSearchResult } from './storage';

const BLOB_PREFIX = 'skills/';

export class CloudStorage implements SkillStorage {
  async list(): Promise<SkillMeta[]> {
    const db = getDb();
    const result = await db.execute(`
      SELECT name, description, updated_at
      FROM skills
      ORDER BY updated_at DESC
    `);

    return result.rows.map((row) => ({
      name: row.name as string,
      description: row.description as string,
      updatedAt: new Date((row.updated_at as number) * 1000),
    }));
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
    const db = getDb();

    // Get metadata from DB
    const skillResult = await db.execute({
      sql: `SELECT name, description, updated_at FROM skills WHERE name = ?`,
      args: [name],
    });

    if (skillResult.rows.length === 0) {
      return null;
    }

    const row = skillResult.rows[0];

    // Get file list from DB
    const filesResult = await db.execute({
      sql: `SELECT filename, blob_url FROM skill_files WHERE skill_name = ?`,
      args: [name],
    });

    // Find SKILL.md content
    const skillMdFile = filesResult.rows.find(r => r.filename === 'SKILL.md');
    let content = '';

    if (skillMdFile) {
      try {
        const response = await fetch(skillMdFile.blob_url as string);
        if (response.ok) {
          content = await response.text();
        }
      } catch {
        // Fallback to empty content
      }
    }

    const files = filesResult.rows
      .filter(r => r.filename !== 'SKILL.md')
      .map(r => r.filename as string);

    return {
      name: row.name as string,
      description: row.description as string,
      content,
      files,
      updatedAt: new Date((row.updated_at as number) * 1000),
    };
  }

  async set(name: string, content: string): Promise<void> {
    const db = getDb();

    // Parse frontmatter to extract description
    const { data } = matter(content);
    const description = data.description || '';

    // Upload to Vercel Blob
    const blobPath = `${BLOB_PREFIX}${name}/SKILL.md`;
    const blob = await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Upsert skill metadata in DB
    await db.execute({
      sql: `
        INSERT INTO skills (name, description, updated_at)
        VALUES (?, ?, strftime('%s', 'now'))
        ON CONFLICT(name) DO UPDATE SET
          description = excluded.description,
          updated_at = strftime('%s', 'now')
      `,
      args: [name, description],
    });

    // Upsert file reference in DB
    await db.execute({
      sql: `
        INSERT INTO skill_files (skill_name, filename, blob_url)
        VALUES (?, 'SKILL.md', ?)
        ON CONFLICT(skill_name, filename) DO UPDATE SET
          blob_url = excluded.blob_url
      `,
      args: [name, blob.url],
    });
  }

  async addFile(name: string, filename: string, content: string): Promise<void> {
    const db = getDb();

    // Security: prevent path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('Invalid filename (no path traversal allowed)');
    }

    // Check if skill exists
    const skillResult = await db.execute({
      sql: `SELECT name FROM skills WHERE name = ?`,
      args: [name],
    });

    if (skillResult.rows.length === 0) {
      throw new Error(`Skill "${name}" does not exist`);
    }

    // Upload to Vercel Blob
    const blobPath = `${BLOB_PREFIX}${name}/${filename}`;
    const blob = await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Upsert file reference in DB
    await db.execute({
      sql: `
        INSERT INTO skill_files (skill_name, filename, blob_url)
        VALUES (?, ?, ?)
        ON CONFLICT(skill_name, filename) DO UPDATE SET
          blob_url = excluded.blob_url
      `,
      args: [name, filename, blob.url],
    });

    // Update skill's updated_at
    await db.execute({
      sql: `UPDATE skills SET updated_at = strftime('%s', 'now') WHERE name = ?`,
      args: [name],
    });
  }

  async getFile(name: string, filename: string): Promise<string | null> {
    const db = getDb();

    // Security: prevent path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('Invalid filename (no path traversal allowed)');
    }

    const result = await db.execute({
      sql: `SELECT blob_url FROM skill_files WHERE skill_name = ? AND filename = ?`,
      args: [name, filename],
    });

    if (result.rows.length === 0) {
      return null;
    }

    try {
      const response = await fetch(result.rows[0].blob_url as string);
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // File not accessible
    }

    return null;
  }

  async delete(name: string): Promise<void> {
    const db = getDb();

    // Get all file URLs to delete from Blob
    const filesResult = await db.execute({
      sql: `SELECT blob_url FROM skill_files WHERE skill_name = ?`,
      args: [name],
    });

    // Delete from Vercel Blob
    for (const row of filesResult.rows) {
      try {
        await del(row.blob_url as string);
      } catch {
        // Continue even if blob deletion fails
      }
    }

    // Delete from DB (files first due to foreign key)
    await db.execute({
      sql: `DELETE FROM skill_files WHERE skill_name = ?`,
      args: [name],
    });

    await db.execute({
      sql: `DELETE FROM skills WHERE name = ?`,
      args: [name],
    });
  }

  async listFiles(name: string): Promise<string[]> {
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT filename FROM skill_files WHERE skill_name = ? AND filename != 'SKILL.md'`,
      args: [name],
    });

    return result.rows.map(r => r.filename as string);
  }
}
