import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export function loadEnvLocal(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env.local');
  const vars: Record<string, string> = {};

  if (!existsSync(envPath)) {
    return vars;
  }

  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    vars[key] = val;
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }

  return vars;
}

export function requireEnv(keys: string[]): Record<string, string> {
  const env = loadEnvLocal();
  const out: Record<string, string> = {};
  for (const key of keys) {
    const val = process.env[key] || env[key];
    if (!val) {
      throw new Error(`Eksik ortam degiskeni: ${key}`);
    }
    out[key] = val;
  }
  return out;
}
