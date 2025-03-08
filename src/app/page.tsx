'use client';

import { useState } from 'react';
import { NewsArticle } from '@/lib/news/brave-api';

interface GeneratedDiary {
  date: string;
  content: string;
  newsReferences: NewsArticle[];
}

export default function Home() {
  const [keywords, setKeywords] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [diary, setDiary] = useState<GeneratedDiary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/diary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.split(',').map(k => k.trim()),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate diary');
      }

      const data = await response.json();
      setDiary(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">KIYOSHI DIARY</h1>
          <p className="text-gray-600">ニュースから面白おかしい日記を自動生成するだべ！</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="キーワードをカンマ区切りで入力（例：AI, 宇宙, イカ）"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? '生成中...' : '日記を生成'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-8 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {diary && (
          <article className="prose prose-slate max-w-none">
            <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
              <time className="text-sm text-gray-500">
                {new Date(diary.date).toLocaleDateString('ja-JP')}
              </time>
              <div className="mt-4 whitespace-pre-wrap">{diary.content}</div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">参考ニュース</h2>
              <ul className="space-y-4">
                {diary.newsReferences.map((news, index) => (
                  <li key={index} className="p-4 bg-gray-50 rounded-lg">
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {news.title}
                    </a>
                    <p className="text-sm text-gray-600 mt-1">{news.description}</p>
                    <p className="text-xs text-gray-500 mt-1">出典: {news.source}</p>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
