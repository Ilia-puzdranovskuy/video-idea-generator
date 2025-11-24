import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getChannelIdFromUrl, getLatestVideos } from '@/app/services/youtube';
import { analyzeChannelContent, generateSearchQueries, generateVideoIdeas, generateThumbnail } from '@/app/services/openai';
import { searchNews } from '@/app/services/news';
import { searchReddit } from '@/app/services/reddit';
import { validateEnvironmentVariables, formatZodError } from '@/app/utils/validation';
import { 
  AnalyzeChannelRequestSchema, 
  AnalysisResultSchema,
  ApiErrorResponse,
  ApiSuccessResponse 
} from '@/app/config/schemas';
import { AnalysisResult, VideoIdea } from '@/app/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = AnalyzeChannelRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json<ApiErrorResponse>(
        { 
          success: false, 
          error: 'Invalid request data',
          details: { validation: formatZodError(validationResult.error) }
        },
        { status: 400 }
      );
    }

    const { channelUrl } = validationResult.data;

    const envValidation = validateEnvironmentVariables();
    if (!envValidation.valid) {
      return NextResponse.json<ApiErrorResponse>(
        { 
          success: false, 
          error: 'Server configuration error',
          details: { missing: envValidation.missing }
        },
        { status: 500 }
      );
    }

    // Step 1: Extract channel ID and fetch videos
    const channelId = await getChannelIdFromUrl(channelUrl);
    const videos = await getLatestVideos(channelId, 10);

    if (videos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No videos found for this channel' },
        { status: 404 }
      );
    }

    // Step 2: Analyze channel content with GPT-4
    const channelAnalysis = await analyzeChannelContent(videos);

    // Step 3: Generate search queries using AI Agent
    const searchQueries = await generateSearchQueries(channelAnalysis);

    // Step 4: Search news with generated queries
    const newsArticles = await searchNews(searchQueries.newsQueries);

    // Step 5: Search Reddit with generated queries
    const redditPosts = await searchReddit(searchQueries.redditQueries);

    // Step 6: Generate video ideas based on all collected data
    
    // Prepare context for idea generation
    const newsContext = newsArticles.length > 0
      ? newsArticles.slice(0, 10).map(article => 
          `- ${article.title} (${article.source}): ${article.description}`
        ).join('\n')
      : 'No recent news found.';

    const redditContext = redditPosts.length > 0
      ? redditPosts.slice(0, 10).map(post => 
          `- r/${post.subreddit}: ${post.title} (${post.score} upvotes)`
        ).join('\n')
      : 'No recent Reddit discussions found.';

    const videoIdeasWithoutThumbnails = await generateVideoIdeas(
      channelAnalysis,
      videos,
      newsContext,
      redditContext
    );

    // Step 7: Generate thumbnails for each idea using DALL-E 3
    const videoIdeas: VideoIdea[] = [];

    for (let i = 0; i < videoIdeasWithoutThumbnails.length; i++) {
      const idea = videoIdeasWithoutThumbnails[i];
      
      try {
        const thumbnailUrl = await generateThumbnail(
          idea.thumbnailPrompt,
          channelAnalysis.thumbnailStyle
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

    const result: AnalysisResult = {
      channelAnalysis,
      videos: videos.slice(0, 5),
      newsArticles: newsArticles.slice(0, 10),
      redditPosts: redditPosts.slice(0, 10),
      videoIdeas,
    };

    const validatedResult = AnalysisResultSchema.parse(result);

    return NextResponse.json<ApiSuccessResponse>({
      success: true,
      data: validatedResult,
    });

  } catch (error) {
    console.error('Error in analyze-channel API:', error);

    if (error instanceof ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: 'Response validation error',
          details: { validation: formatZodError(error) }
        },
        { status: 500 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

