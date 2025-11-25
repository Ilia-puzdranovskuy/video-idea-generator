import axios from 'axios';
import { RedditPost } from '../types';
import { REDDIT_CONFIG } from '../utils/constants';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      try {
        const searchUrl = `${REDDIT_CONFIG.SEARCH_URL}?q=${encodeURIComponent(query)}&sort=${REDDIT_CONFIG.SORT_BY}&limit=${REDDIT_CONFIG.SEARCH_LIMIT}&t=${REDDIT_CONFIG.TIME_RANGE}`;
        
        const response = await axios.get<RedditResponse>(searchUrl, {
          headers: {
            'User-Agent': REDDIT_CONFIG.USER_AGENT,
          },
        });

        if (response.data?.data?.children) {
          const posts = response.data.data.children.map((child: RedditChild) => {
            const post = child.data;
            return {
              title: post.title,
              content: post.selftext || '',
              url: `${REDDIT_CONFIG.BASE_URL}${post.permalink}`,
              subreddit: post.subreddit,
              score: post.score,
              createdAt: new Date(post.created_utc * REDDIT_CONFIG.UNIX_TO_MS).toISOString(),
            };
          });
          allPosts.push(...posts);
        }
        
        if (i < queries.length - 1) {
          await delay(REDDIT_CONFIG.DELAY_BETWEEN_REQUESTS_MS);
        }
      } catch (error) {
        console.error('Error fetching Reddit posts for query:', error);
      }
    }

    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.url, post])).values()
    );
    
    return uniquePosts
      .sort((a, b) => b.score - a.score)
      .slice(0, REDDIT_CONFIG.MAX_POSTS);
  } catch (error) {
    console.error('Error searching Reddit:', error);
    return [];
  }
}

