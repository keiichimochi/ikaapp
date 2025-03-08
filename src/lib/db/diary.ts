import { D1Database } from '@cloudflare/workers-types';
import { NewsArticle } from '../news/brave-api';

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

export async function saveDiary(
  db: D1Database,
  content: string,
  news: NewsArticle[]
): Promise<DiaryRecord> {
  const id = crypto.randomUUID();
  const date = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // トランザクションで日記とニュースを保存
  await db.batch([
    // 日記の保存
    db.prepare(
      'INSERT INTO diaries (id, date, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, date, content, now, now),

    // ニュースの保存
    ...news.map(article =>
      db.prepare(
        'INSERT INTO news_sources (id, diary_id, title, description, url, source) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        crypto.randomUUID(),
        id,
        article.title,
        article.description,
        article.url,
        article.source
      )
    ),
  ]);

  // 保存した日記を取得
  const diary = await db
    .prepare('SELECT * FROM diaries WHERE id = ?')
    .bind(id)
    .first<DiaryRecord>();

  if (!diary) {
    throw new Error('Failed to save diary');
  }

  return diary;
}

export async function getLatestDiaries(
  db: D1Database,
  limit: number = 10
): Promise<DiaryRecord[]> {
  return db
    .prepare(
      'SELECT * FROM diaries ORDER BY date DESC LIMIT ?'
    )
    .bind(limit)
    .all<DiaryRecord>()
    .then(result => result.results);
}

export async function getDiaryWithNews(
  db: D1Database,
  id: string
): Promise<{ diary: DiaryRecord; news: NewsSourceRecord[] }> {
  const diary = await db
    .prepare('SELECT * FROM diaries WHERE id = ?')
    .bind(id)
    .first<DiaryRecord>();

  if (!diary) {
    throw new Error('Diary not found');
  }

  const news = await db
    .prepare('SELECT * FROM news_sources WHERE diary_id = ?')
    .bind(id)
    .all<NewsSourceRecord>()
    .then(result => result.results);

  return { diary, news };
} 