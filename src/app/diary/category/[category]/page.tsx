import { getDiariesByCategory, getAllCategories } from '@/lib/diary/parser';
import { DiaryEntry } from '@/components/diary/DiaryEntry';

type CategoryParams = Promise<{ category: string }>;

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({
    category,
  }));
}

export default async function CategoryPage({ params }: { params: CategoryParams }) {
  const { category } = await params;
  const entries = getDiariesByCategory(category);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            カテゴリー: {category}
          </h1>
          <p className="mt-2 text-gray-600">
            「{category}」に関連する記事一覧
          </p>
        </header>

        <div className="space-y-8">
          {entries.map((entry) => (
            <DiaryEntry key={entry.date} entry={entry} />
          ))}
        </div>

        <div className="mt-8">
          <a
            href="/diary"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← 日記一覧に戻る
          </a>
        </div>
      </div>
    </main>
  );
} 