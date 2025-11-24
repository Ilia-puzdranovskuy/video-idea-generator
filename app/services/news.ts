import axios from 'axios';
import { NewsArticle } from '../types';

interface NewsApiArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsApiResponse {
  articles: NewsApiArticle[];
}

export async function searchNews(queries: string[]): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    console.error('NEWS_API_KEY not set, skipping news search');
    return [];
  }

  const allArticles: NewsArticle[] = [];
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const promises = queries.map(async (query) => {
      try {
        const response = await axios.get<NewsApiResponse>('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            apiKey: apiKey,
            language: 'en',
            sortBy: 'publishedAt',
            from: oneWeekAgo.toISOString(),
            pageSize: 5,
          },
        });

        if (response.data.articles) {
          return response.data.articles.map((article: NewsApiArticle) => ({
            title: article.title,
            description: article.description || '',
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source.name,
          }));
        }
        return [];
      } catch (error) {
        console.error('Error fetching news for query:', error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(articles => allArticles.push(...articles));

    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.url, article])).values()
    );

    return uniqueArticles.slice(0, 15);
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

