import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

export function getPlaygroundEnv(): Record<string, string> {
  // Local dev only: load .env.playground for convenience
  if (!process.env.VERCEL) {
    const envPath = join(process.cwd(), '.env.playground');
    if (existsSync(envPath)) {
      return config({ path: envPath }).parsed || {};
    }
  }
  return {};
}

export function mergePlaygroundEnv(uiEnv?: Record<string, string>): Record<string, string> {
  const baseEnv = getPlaygroundEnv();
  // UI vars take precedence
  return { ...baseEnv, ...uiEnv };
}
