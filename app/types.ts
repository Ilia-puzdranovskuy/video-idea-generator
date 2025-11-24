// Types for the video idea generator

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount?: string;
  likeCount?: string;
  tags?: string[];
}

export interface ChannelAnalysis {
  topics: string[];
  style: string;
  tone: string;
  targetAudience: string;
  thumbnailStyle: string;
  contentFormat: string;
}

export interface SearchQueries {
  newsQueries: string[];
  redditQueries: string[];
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface RedditPost {
  title: string;
  content: string;
  url: string;
  subreddit: string;
  score: number;
  createdAt: string;
}

export interface VideoIdea {
  title: string;
  thumbnailUrl: string;
  thumbnailPrompt: string;
  videoDescription: string;
}

export interface AnalysisResult {
  channelAnalysis: ChannelAnalysis;
  videos: YouTubeVideo[];
  newsArticles: NewsArticle[];
  redditPosts: RedditPost[];
  videoIdeas: VideoIdea[];
}

export interface ApiResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
  progress?: string;
}

