import { D1Database, D1PreparedStatement, D1Result, D1ExecResult, D1Meta } from '@cloudflare/workers-types';
import { NewsArticle } from '../news/brave-api';

// メモリ内データストア
const diaries = new Map();
const newsSources = new Map();

// モック用のD1Meta
const mockMeta: D1Meta = {
  duration: 0,
  size_after: 0,
  rows_read: 0,
  rows_written: 0,
  last_row_id: 0,
  changed_db: false,
  changes: 0
};

class MockPreparedStatement implements D1PreparedStatement {
  private params: any[] = [];

  constructor(private sql: string) {}

  bind(...values: any[]): D1PreparedStatement {
    this.params = values;
    return this;
  }

  async raw(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async first<T = any>(): Promise<T | null> {
    console.log('Mock DB: first', { sql: this.sql, params: this.params });
    
    // SELECT * FROM diaries WHERE id = ?
    if (this.sql.includes('SELECT * FROM diaries WHERE id =')) {
      const id = this.params[0];
      return diaries.get(id) as T || null;
    }
    
    return null;
  }

  async all<T = any>(): Promise<D1Result<T>> {
    console.log('Mock DB: all', { sql: this.sql, params: this.params });
    
    // SELECT * FROM news_sources WHERE diary_id = ?
    if (this.sql.includes('SELECT * FROM news_sources WHERE diary_id =')) {
      const diaryId = this.params[0];
      const results = Array.from(newsSources.values())
        .filter(news => news.diary_id === diaryId);
      
      return {
        results: results as T[],
        success: true,
        meta: mockMeta
      };
    }
    
    // SELECT * FROM diaries ORDER BY date DESC LIMIT ?
    if (this.sql.includes('SELECT * FROM diaries ORDER BY date DESC')) {
      const limit = this.params[0] || 10;
      const results = Array.from(diaries.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      
      return {
        results: results as T[],
        success: true,
        meta: mockMeta
      };
    }
    
    return {
      results: [],
      success: true,
      meta: mockMeta
    };
  }

  async run(): Promise<D1Result> {
    console.log('Mock DB: run', { sql: this.sql, params: this.params });
    return {
      success: true,
      results: [],
      meta: mockMeta
    };
  }
}

export class MockD1Database implements D1Database {
  prepare(sql: string): D1PreparedStatement {
    return new MockPreparedStatement(sql);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    console.log('Mock DB: batch', { statementsCount: statements.length });
    
    // 日記の保存処理をシミュレート
    if (statements.length > 0) {
      const id = crypto.randomUUID();
      const date = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      // 日記を保存
      diaries.set(id, {
        id,
        date,
        content: 'Mock diary content',
        created_at: now,
        updated_at: now
      });
      
      // ニュースを保存
      for (let i = 1; i < statements.length; i++) {
        const newsId = crypto.randomUUID();
        newsSources.set(newsId, {
          id: newsId,
          diary_id: id,
          title: `Mock news ${i}`,
          description: `Mock description ${i}`,
          url: `https://example.com/news/${i}`,
          source: 'Mock Source'
        });
      }
    }
    
    return statements.map(() => ({
      results: [],
      success: true,
      meta: {}
    }));
  }

  async exec(sql: string): Promise<D1ExecResult> {
    console.log('Mock DB: exec', { sql });
    return {
      success: true,
      results: [],
      meta: {},
      count: 0,
      duration: 0
    };
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async saveDiary(content: string, news: Omit<NewsSourceRecord, 'id' | 'diary_id'>[]): Promise<DiaryRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const diary: DiaryRecord = {
      id,
      date: now.split('T')[0],
      content,
      created_at: now,
      updated_at: now,
    };

    // 日記を保存
    diaries.set(id, diary);

    // ニュースソースを保存
    const newsRecords = news.map(article => ({
      id: crypto.randomUUID(),
      diary_id: id,
      ...article,
    }));
    newsRecords.forEach(news => newsSources.set(news.id, news));

    return diary;
  }

  async getLatestDiaries(limit: number = 10): Promise<DiaryRecord[]> {
    return Array.from(diaries.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  async getDiaryWithNews(id: string): Promise<{ diary: DiaryRecord; news: NewsSourceRecord[] }> {
    const diary = diaries.get(id);
    if (!diary) {
      throw new Error('Diary not found');
    }

    const news = Array.from(newsSources.values())
      .filter(n => n.diary_id === id);
    return { diary, news };
  }

  // テスト用：データベースをクリア
  clear() {
    diaries.clear();
    newsSources.clear();
  }
}

// シングルトンインスタンス
export const mockDb = new MockD1Database();

export interface DiaryRecord {
  id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NewsSourceRecord {
  id: string;
  diary_id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
} 