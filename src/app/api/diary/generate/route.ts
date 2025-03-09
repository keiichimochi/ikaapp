import { NextResponse } from 'next/server';
import { generateDiary } from '@/lib/diary/gemini-api';

export async function POST(request: Request) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Keywords must be provided as an array' },
        { status: 400 }
      );
    }

    const diary = await generateDiary(keywords, process.env);

    return NextResponse.json({ diary });
  } catch (error) {
    console.error('Error in diary generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate diary' },
      { status: 500 }
    );
  }
} 