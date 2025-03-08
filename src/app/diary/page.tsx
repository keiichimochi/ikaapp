import { getLatestDiaries, getAllCategories } from '@/lib/diary/parser';
import { DiaryEntry } from '@/components/diary/DiaryEntry';

export default function DiaryPage() {
  const entries = getLatestDiaries();
  const categories = getAllCategories();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">KIYOSHI DIARY</h1>
          <p className="mt-2 text-gray-600">日々の記録と学びの記録</p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[3fr_1fr]">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">最新の記事</h2>
            <div className="space-y-8">
              {entries.map((entry) => (
                <DiaryEntry key={entry.date} entry={entry} />
              ))}
            </div>
          </section>

          <aside className="space-y-8">
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">カテゴリー</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <a
                    key={category}
                    href={`/diary/category/${category}`}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {category}
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
} 