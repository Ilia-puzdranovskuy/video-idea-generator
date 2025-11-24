import axios from 'axios';
import { RedditPost } from '../types';

interface RedditPostData {
  title: string;
  selftext: string;
  permalink: string;
  subreddit: string;
  score: number;
  created_utc: number;
}

interface RedditChild {
  data: RedditPostData;
}

interface RedditResponse {
  data: {
    children: RedditChild[];
  };
}

export async function searchReddit(queries: string[]): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];

  try {
    const promises = queries.map(async (query) => {
      try {
        const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=10&t=week`;
        
        const response = await axios.get<RedditResponse>(searchUrl, {
          headers: {
            'User-Agent': 'VideoIdeaGenerator/1.0',
          },
        });

        if (response.data?.data?.children) {
          return response.data.data.children.map((child: RedditChild) => {
            const post = child.data;
            return {
              title: post.title,
              content: post.selftext || '',
              url: `https://www.reddit.com${post.permalink}`,
              subreddit: post.subreddit,
              score: post.score,
              createdAt: new Date(post.created_utc * 1000).toISOString(),
            };
          });
        }
        return [];
      } catch (error) {
        console.error('Error fetching Reddit posts for query:', error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(posts => allPosts.push(...posts));

    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.url, post])).values()
    );
    
    return uniquePosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  } catch (error) {
    console.error('Error searching Reddit:', error);
    return [];
  }
}

