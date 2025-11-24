import { z } from 'zod';

export const AnalyzeChannelRequestSchema = z.object({
  channelUrl: z.string()
    .min(1, { message: 'Channel URL is required' })
    .url({ message: 'Invalid URL format' })
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid YouTube URL' }
    )
    .refine(
      (url) => {
        const validPatterns = [
          /\/@[\w-]+/,
          /\/channel\/[\w-]+/,
          /\/c\/[\w-]+/,
          /\/user\/[\w-]+/,
        ];
        return validPatterns.some(pattern => pattern.test(url));
      },
      { message: 'Must be a valid YouTube channel URL' }
    ),
});

export const VideoIdeaSchema = z.object({
  title: z.string().min(1),
  thumbnailUrl: z.string().url(),
  thumbnailPrompt: z.string().min(1),
  videoDescription: z.string().min(1),
});

export const YouTubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().url(),
  publishedAt: z.string(),
  viewCount: z.string().optional(),
  likeCount: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const ChannelAnalysisSchema = z.object({
  topics: z.array(z.string()).min(1),
  style: z.string(),
  tone: z.string(),
  targetAudience: z.string(),
  thumbnailStyle: z.string(),
  contentFormat: z.string(),
});

export const NewsArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  publishedAt: z.string(),
  source: z.string(),
});

export const RedditPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  url: z.string().url(),
  subreddit: z.string(),
  score: z.number(),
  createdAt: z.string(),
});

export const AnalysisResultSchema = z.object({
  channelAnalysis: ChannelAnalysisSchema,
  videos: z.array(YouTubeVideoSchema),
  newsArticles: z.array(NewsArticleSchema),
  redditPosts: z.array(RedditPostSchema),
  videoIdeas: z.array(VideoIdeaSchema),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});

export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AnalysisResultSchema,
});

export type AnalyzeChannelRequest = z.infer<typeof AnalyzeChannelRequestSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;

