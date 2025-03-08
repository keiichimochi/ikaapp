import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}

export const env = process.env as unknown as Env; 