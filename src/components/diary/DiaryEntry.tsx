import React from 'react';
import { DiaryEntry as DiaryEntryType } from '@/lib/diary/parser';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DiaryEntryProps {
  entry: DiaryEntryType;
}

export const DiaryEntry: React.FC<DiaryEntryProps> = ({ entry }) => {
  const formattedDate = format(new Date(entry.date), 'yyyy年MM月dd日 (E)', {
    locale: ja,
  });

  return (
    <article className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <header className="mb-4">
        <time className="text-sm text-gray-500">{formattedDate}</time>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">{entry.title}</h2>
      </header>
      
      <div className="prose prose-slate max-w-none">
        {entry.content.split('\n').map((line, index) => (
          <p key={index} className="mb-4">
            {line}
          </p>
        ))}
      </div>
      
      <footer className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {entry.categories.map((category) => (
            <span
              key={category}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
            >
              {category}
            </span>
          ))}
        </div>
      </footer>
    </article>
  );
}; 