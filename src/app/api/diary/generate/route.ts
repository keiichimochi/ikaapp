import { NextResponse } from 'next/server';
import { fetchNews } from '@/lib/news/brave-api';
import { generateDiary } from '@/lib/diary/claude-api';
import { saveDiary, getDiaryWithNews } from '@/lib/db/diary';
import { mockDb } from '@/lib/db/mock-db';

// 環境に応じたデータベースを取得する関数
function getDatabase() {
  // 開発環境ではモックを使用
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock database in development');
    return mockDb;
  }
  
  // 本番環境ではCloudflare D1を使用
  console.log('Using Cloudflare D1 in production');
  return process.env.DB;
}

export async function POST(request: Request) {
  try {
    const { keywords } = await request.json();

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords must be a non-empty array' },
        { status: 400 }
      );
    }

    // ニュースを取得
    const news = await fetchNews(keywords);

    if (news.length === 0) {
      return NextResponse.json(
        { error: 'No news found for the given keywords' },
        { status: 404 }
      );
    }

    // 日記を生成
    const content = await generateDiary(news);

    // 環境に応じたデータベースを取得
    const db = getDatabase();

    // 日記を保存
    const diary = await saveDiary(db, content, news);

    // 保存した日記とニュースを取得
    const { diary: savedDiary, news: savedNews } = await getDiaryWithNews(db, diary.id);

    return NextResponse.json({
      id: savedDiary.id,
      date: savedDiary.date,
      content: savedDiary.content,
      newsReferences: savedNews,
    });
  } catch (error) {
    console.error('Error generating diary:', error);
    return NextResponse.json(
      { error: 'Failed to generate diary' },
      { status: 500 }
    );
  }
} 