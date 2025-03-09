export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedTime: string;
}

// APIキーの取得
function getApiKey(): string {
  // Cloudflare環境ではcontext.envから取得
  if (typeof context !== 'undefined' && context.env) {
    return context.env.BRAVE_API_KEY || '';
  }
  // ローカル環境ではprocess.envから取得
  if (typeof process !== 'undefined' && process.env) {
    return process.env.BRAVE_API_KEY || '';
  }
  return '';
}

export async function fetchNews(keywords: string[], env?: { BRAVE_API_KEY: string }): Promise<NewsArticle[]> {
  // キーワードを日本語でAND検索するクエリを作成
  const query = keywords.join(' AND ');
  const apiKey = env?.BRAVE_API_KEY;
  
  if (!apiKey) {
    throw new Error('BRAVE_API_KEY is not set');
  }

  const response = await fetch(`https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=5&lang=ja&freshness=month`, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Brave API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Failed to fetch news: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.results || !Array.isArray(data.results)) {
    console.error('Unexpected API response:', data);
    throw new Error('Invalid API response format');
  }

  return data.results.map((article: any) => ({
    title: article.title || '',
    description: article.description || '',
    url: article.url || '',
    publishedTime: article.publishedTime || new Date().toISOString(),
  }));
} 