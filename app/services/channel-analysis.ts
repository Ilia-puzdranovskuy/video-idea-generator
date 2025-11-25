import { getChannelIdFromUrl, getLatestVideos } from './youtube';
import { analyzeChannelContent, generateSearchQueries, generateVideoIdeas, generateThumbnail } from './openai';
import { searchNews } from './news';
import { searchReddit } from './reddit';
import { AnalysisResultSchema } from '@/app/config/schemas';
import { AnalysisResult, VideoIdea, YouTubeVideo, NewsArticle, RedditPost, ChannelAnalysis } from '@/app/types';
import { ANALYSIS_CONFIG } from '@/app/utils/constants';

export async function fetchChannelVideos(
  channelUrl: string, 
  count: number = ANALYSIS_CONFIG.VIDEOS.FETCH_COUNT
): Promise<YouTubeVideo[]> {
  const channelId = await getChannelIdFromUrl(channelUrl);
  const videos = await getLatestVideos(channelId, count);
  
  if (videos.length === 0) {
    throw new Error('No videos found for this channel');
  }
  
  return videos;
}

export function prepareSearchContext(
  newsArticles: NewsArticle[],
  redditPosts: RedditPost[]
): { newsContext: string; redditContext: string } {
  const newsContext = newsArticles.length > 0
    ? newsArticles.slice(0, ANALYSIS_CONFIG.NEWS.DISPLAY_COUNT).map(article => 
        `- ${article.title} (${article.source}): ${article.description}`
      ).join('\n')
    : 'No recent news found.';

  const redditContext = redditPosts.length > 0
    ? redditPosts.slice(0, ANALYSIS_CONFIG.REDDIT.DISPLAY_COUNT).map(post => 
        `- r/${post.subreddit}: ${post.title} (${post.score} upvotes)`
      ).join('\n')
    : 'No recent Reddit discussions found.';

  return { newsContext, redditContext };
}

export async function generateIdeasWithThumbnails(
  videoIdeasWithoutThumbnails: Omit<VideoIdea, 'thumbnailUrl'>[],
  thumbnailStyle: string,
  onProgress?: (current: number, total: number) => void
): Promise<VideoIdea[]> {
  const videoIdeas: VideoIdea[] = [];

  for (let i = 0; i < videoIdeasWithoutThumbnails.length; i++) {
    const idea = videoIdeasWithoutThumbnails[i];
    
    onProgress?.(i + 1, videoIdeasWithoutThumbnails.length);
    
    try {
      const thumbnailUrl = await generateThumbnail(
        idea.thumbnailPrompt,
        thumbnailStyle
      );
      
      videoIdeas.push({
        ...idea,
        thumbnailUrl,
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      videoIdeas.push({
        ...idea,
        thumbnailUrl: '/placeholder-thumbnail.png',
      });
    }
  }

  return videoIdeas;
}

export async function buildFinalResult(
  channelAnalysis: ChannelAnalysis,
  videos: YouTubeVideo[],
  newsArticles: NewsArticle[],
  redditPosts: RedditPost[],
  videoIdeas: VideoIdea[]
): Promise<AnalysisResult> {
  const result: AnalysisResult = {
    channelAnalysis,
    videos: videos.slice(0, ANALYSIS_CONFIG.VIDEOS.DISPLAY_COUNT),
    newsArticles: newsArticles.slice(0, ANALYSIS_CONFIG.NEWS.DISPLAY_COUNT),
    redditPosts: redditPosts.slice(0, ANALYSIS_CONFIG.REDDIT.DISPLAY_COUNT),
    videoIdeas,
  };

  return AnalysisResultSchema.parse(result);
}

export async function performChannelAnalysis(
  channelUrl: string,
  onProgress?: (step: string, message: string) => void
): Promise<AnalysisResult> {
  // Step 1: Fetch videos
  onProgress?.('1/7', 'Fetching videos from YouTube...');
  const videos = await fetchChannelVideos(channelUrl, ANALYSIS_CONFIG.VIDEOS.FETCH_COUNT);
  onProgress?.('1/7', `Found ${videos.length} videos`);

  // Step 2: Analyze content
  onProgress?.('2/7', 'Analyzing channel content and thumbnail style with GPT-4o Vision');
  const channelAnalysis = await analyzeChannelContent(videos);
  onProgress?.('2/7', `Analysis complete: ${channelAnalysis.topics.slice(0, 3).join(', ')}`);

  // Step 3: Generate search queries
  onProgress?.('3/7', 'AI Agent generating search queries');
  const searchQueries = await generateSearchQueries(channelAnalysis);
  onProgress?.('3/7', `Generated ${searchQueries.newsQueries.length + searchQueries.redditQueries.length} queries`);

  // Step 4: Search news
  onProgress?.('4/7', 'Searching for latest news');
  const newsArticles = await searchNews(searchQueries.newsQueries);
  onProgress?.('4/7', `Found ${newsArticles.length} news articles`);

  // Step 5: Search Reddit
  onProgress?.('5/7', 'Searching for Reddit trends');
  const redditPosts = await searchReddit(searchQueries.redditQueries);
  onProgress?.('5/7', `Found ${redditPosts.length} Reddit posts`);

  // Step 6: Generate video ideas
  onProgress?.('6/7', 'Generating video ideas with GPT-4o');
  const { newsContext, redditContext } = prepareSearchContext(newsArticles, redditPosts);
  
  const videoIdeasWithoutThumbnails = await generateVideoIdeas(
    channelAnalysis,
    videos,
    newsContext,
    redditContext
  );
  onProgress?.('6/7', `Generated ${videoIdeasWithoutThumbnails.length} ideas`);

  // Step 7: Generate thumbnails
  const videoIdeas = await generateIdeasWithThumbnails(
    videoIdeasWithoutThumbnails,
    channelAnalysis.thumbnailStyle,
    (current, total) => {
      onProgress?.('7/7', `Generating thumbnail ${current}/${total} with DALL-E 3...`);
    }
  );
  onProgress?.('7/7', 'All thumbnails generated');

  return buildFinalResult(channelAnalysis, videos, newsArticles, redditPosts, videoIdeas);
}

