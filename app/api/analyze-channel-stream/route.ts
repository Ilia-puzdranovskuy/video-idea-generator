import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { getChannelIdFromUrl, getLatestVideos } from '@/app/services/youtube';
import { analyzeChannelContent, generateSearchQueries, generateVideoIdeas, generateThumbnail } from '@/app/services/openai';
import { searchNews } from '@/app/services/news';
import { searchReddit } from '@/app/services/reddit';
import { validateEnvironmentVariables, formatZodError } from '@/app/utils/validation';
import { AnalyzeChannelRequestSchema, AnalysisResultSchema } from '@/app/config/schemas';
import { AnalysisResult, VideoIdea } from '@/app/types';

export async function POST(request: NextRequest) {
  let channelUrl: string;

  try {
    const body = await request.json();

    const validationResult = AnalyzeChannelRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request data',
          details: formatZodError(validationResult.error)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    channelUrl = validationResult.data.channelUrl;

    const envValidation = validateEnvironmentVariables();
    if (!envValidation.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error',
          details: envValidation.missing.join(', ')
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid request';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (step: string, message: string) => {
        const data = JSON.stringify({ type: 'progress', step, message });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const sendError = (error: string) => {
        const data = JSON.stringify({ type: 'error', error });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      };

      const sendComplete = (result: AnalysisResult) => {
        const data = JSON.stringify({ type: 'complete', data: result });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      };

      try {

        // Step 1: Fetch videos
        sendProgress('1/7', 'Fetching videos from YouTube...');
        const channelId = await getChannelIdFromUrl(channelUrl);
        const videos = await getLatestVideos(channelId, 10);

        if (videos.length === 0) {
          sendError('No videos found for this channel');
          return;
        }

        sendProgress('1/7', `Found ${videos.length} videos`);

        // Step 2: Analyze content
        sendProgress('2/7', 'Analyzing channel content and thumbnail style with GPT-4o Vision');
        const channelAnalysis = await analyzeChannelContent(videos);
        sendProgress('2/7', `Analysis complete: ${channelAnalysis.topics.slice(0, 3).join(', ')}`);

        // Step 3: Generate search queries
        sendProgress('3/7', 'AI Agent generating search queries');
        const searchQueries = await generateSearchQueries(channelAnalysis);
        sendProgress('3/7', `Generated ${searchQueries.newsQueries.length + searchQueries.redditQueries.length} queries`);

        // Step 4: Search news
        sendProgress('4/7', 'Searching for latest news');
        const newsArticles = await searchNews(searchQueries.newsQueries);
        sendProgress('4/7', `Found ${newsArticles.length} news articles`);

        // Step 5: Search Reddit
        sendProgress('5/7', 'Searching for Reddit trends');
        const redditPosts = await searchReddit(searchQueries.redditQueries);
        sendProgress('5/7', `Found ${redditPosts.length} Reddit posts`);

        // Step 6: Generate video ideas
        sendProgress('6/7', 'Generating video ideas with GPT-4o');

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

        sendProgress('6/7', `Generated ${videoIdeasWithoutThumbnails.length} ideas`);

        // Step 7: Generate thumbnails
        const videoIdeas: VideoIdea[] = [];

        for (let i = 0; i < videoIdeasWithoutThumbnails.length; i++) {
          const idea = videoIdeasWithoutThumbnails[i];
          
          sendProgress('7/7', `Generating thumbnail ${i + 1}/${videoIdeasWithoutThumbnails.length} with DALL-E 3...`);

          try {
            const thumbnailUrl = await generateThumbnail(
              idea.thumbnailPrompt,
              channelAnalysis.thumbnailStyle
            );

            videoIdeas.push({
              ...idea,
              thumbnailUrl,
            });

            sendProgress('7/7', `Thumbnail ${i + 1}/${videoIdeasWithoutThumbnails.length} ready`);
          } catch (error) {
            console.error('Error generating thumbnail:', error);
            videoIdeas.push({
              ...idea,
              thumbnailUrl: '/placeholder-thumbnail.png',
            });
          }
        }

        sendProgress('7/7', 'All thumbnails generated');

        const result: AnalysisResult = {
          channelAnalysis,
          videos: videos.slice(0, 5),
          newsArticles: newsArticles.slice(0, 10),
          redditPosts: redditPosts.slice(0, 10),
          videoIdeas,
        };

        try {
          const validatedResult = AnalysisResultSchema.parse(result);
          sendComplete(validatedResult);
        } catch (validationError) {
          if (validationError instanceof ZodError) {
            console.error('Response validation error:', formatZodError(validationError));
            sendError(`Data validation error: ${formatZodError(validationError)}`);
          } else {
            throw validationError;
          }
        }
      } catch (error) {
        console.error('Error in analyze-channel-stream:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during analysis';
        sendError(errorMessage);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

