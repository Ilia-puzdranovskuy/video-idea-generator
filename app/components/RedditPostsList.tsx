import { RedditPost } from '../types';

interface RedditPostsListProps {
  posts: RedditPost[];
}

export default function RedditPostsList({ posts }: RedditPostsListProps) {
  if (posts.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Reddit Discussions ({posts.length})
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {posts.slice(0, 5).map((post) => (
          <div key={post.url} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              {post.title}
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              r/{post.subreddit} • {post.score} upvotes
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

