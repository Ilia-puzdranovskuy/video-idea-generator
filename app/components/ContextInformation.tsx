import { NewsArticle, RedditPost } from '../types';
import NewsArticlesList from './NewsArticlesList';
import RedditPostsList from './RedditPostsList';

interface ContextInformationProps {
  newsArticles: NewsArticle[];
  redditPosts: RedditPost[];
}

export default function ContextInformation({ newsArticles, redditPosts }: ContextInformationProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NewsArticlesList articles={newsArticles} />
      <RedditPostsList posts={redditPosts} />
    </div>
  );
}

