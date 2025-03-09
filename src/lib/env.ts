import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}

// Cloudflare環境では process.env が使えないため、
// 環境変数へのアクセスを抽象化する関数を提供
export function getEnv(): Partial<Env> {
  try {
    // Cloudflare環境ではグローバル変数として環境変数が提供される
    return (typeof globalThis !== 'undefined' ? globalThis : {}) as Partial<Env>;
  } catch (e) {
    console.error('環境変数へのアクセスに失敗しました', e);
    return {};
  }
} 