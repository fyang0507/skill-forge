/**
 * Storage abstraction for skills
 * - LocalStorage: filesystem-based for development
 * - CloudStorage: Vercel Blob + Turso for production
 */

import { LocalStorage } from './local-storage';
import { CloudStorage } from './cloud-storage';

export interface SkillMeta {
  name: string;
  description: string;
  updatedAt: Date;
}

export interface Skill extends SkillMeta {
  content: string;  // SKILL.md content
  files: string[];  // list of additional files
}

export interface SkillStorage {
  list(): Promise<SkillMeta[]>;
  search(keyword: string): Promise<SkillMeta[]>;
  get(name: string): Promise<Skill | null>;
  set(name: string, content: string): Promise<void>;
  addFile(name: string, filename: string, content: string): Promise<void>;
  getFile(name: string, filename: string): Promise<string | null>;
  delete(name: string): Promise<void>;
  listFiles(name: string): Promise<string[]>;
}

let storageInstance: SkillStorage | null = null;

export function getStorage(): SkillStorage {
  if (storageInstance) return storageInstance;

  // Vercel auto-sets VERCEL=1 in deployed environments
  if (process.env.VERCEL === '1') {
    storageInstance = new CloudStorage();
  } else {
    storageInstance = new LocalStorage();
  }

  return storageInstance;
}

// Reset storage instance (useful for testing)
export function resetStorage(): void {
  storageInstance = null;
}
