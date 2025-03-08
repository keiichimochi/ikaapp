import { NextResponse } from 'next/server';
import { mockDb } from '@/lib/db/mock-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const diaries = await mockDb.getLatestDiaries(limit);

    // 各日記のニュースも取得
    const diariesWithNews = await Promise.all(
      diaries.map(async (diary) => {
        const { news } = await mockDb.getDiaryWithNews(diary.id);
        return {
          date: diary.date,
          content: diary.content,
          newsReferences: news,
        };
      })
    );

    return NextResponse.json(diariesWithNews);
  } catch (error) {
    console.error('Error fetching diaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diaries' },
      { status: 500 }
    );
  }
} 