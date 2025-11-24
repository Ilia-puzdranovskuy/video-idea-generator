import { NewsArticle } from '../types';

interface NewsArticlesListProps {
  articles: NewsArticle[];
}

export default function NewsArticlesList({ articles }: NewsArticlesListProps) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Recent News ({articles.length})
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {articles.slice(0, 5).map((article, i) => (
          <div key={i} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              {article.title}
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {article.source}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

