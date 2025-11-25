import axios from 'axios';
import { NewsArticle } from '../types';
import { NEWS_API_CONFIG } from '../utils/constants';

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
  oneWeekAgo.setDate(oneWeekAgo.getDate() - NEWS_API_CONFIG.DAYS_AGO);

  try {
    const promises = queries.map(async (query) => {
      try {
        const response = await axios.get<NewsApiResponse>(NEWS_API_CONFIG.BASE_URL, {
          params: {
            q: query,
            apiKey: apiKey,
            language: NEWS_API_CONFIG.LANGUAGE,
            sortBy: NEWS_API_CONFIG.SORT_BY,
            from: oneWeekAgo.toISOString(),
            pageSize: NEWS_API_CONFIG.PAGE_SIZE,
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

    return uniqueArticles.slice(0, NEWS_API_CONFIG.MAX_ARTICLES);
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

