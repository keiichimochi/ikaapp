export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
}

export async function fetchNews(keywords: string[]): Promise<NewsArticle[]> {
  const query = keywords.join(' OR ');
  const response = await fetch(`https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': process.env.BRAVE_API_KEY || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.results.map((article: any) => ({
    title: article.title,
    description: article.description,
    url: article.url,
    source: article.source,
  }));
} 