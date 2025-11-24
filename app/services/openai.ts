import OpenAI from 'openai';
import { YouTubeVideo, ChannelAnalysis, SearchQueries, VideoIdea } from '../types';
import { SYSTEM_PROMPTS, USER_PROMPTS, DEFAULTS } from '../config/prompts';
import {
  getCurrentDateInfo,
  validateVideoIdeas,
  createFallbackQueries,
  extractTopicsString
} from '../utils/openai-helpers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeThumbnailStyle(videos: YouTubeVideo[]): Promise<string> {
  const thumbnailUrls = videos.slice(0, 5).map(v => v.thumbnailUrl).filter(url => url);

  if (thumbnailUrls.length === 0) {
    return DEFAULTS.THUMBNAIL_STYLE;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.THUMBNAIL_ANALYST,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: USER_PROMPTS.ANALYZE_THUMBNAILS(),
            },
            ...thumbnailUrls.map(url => ({
              type: 'image_url' as const,
              image_url: { url, detail: 'high' as const },
            })),
          ],
        },
      ],
      max_tokens: 3000,
      temperature: 0.2,
    });

    const styleAnalysis = response.choices[0].message.content || DEFAULTS.THUMBNAIL_STYLE;
    
    return styleAnalysis;
  } catch (error) {
    console.error('Error analyzing thumbnails with vision:', error);
    return DEFAULTS.THUMBNAIL_STYLE;
  }
}

export async function analyzeChannelContent(videos: YouTubeVideo[]): Promise<ChannelAnalysis> {
  const thumbnailStyle = await analyzeThumbnailStyle(videos);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.CHANNEL_ANALYST,
        },
        {
          role: 'user',
          content: USER_PROMPTS.ANALYZE_CHANNEL(videos),
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);

    const analysis: ChannelAnalysis = {
      topics: Array.isArray(parsed.topics) ? parsed.topics : DEFAULTS.TOPICS,
      style: parsed.style || DEFAULTS.STYLE,
      tone: parsed.tone || DEFAULTS.TONE,
      targetAudience: parsed.targetAudience || DEFAULTS.TARGET_AUDIENCE,
      thumbnailStyle: thumbnailStyle,
      contentFormat: parsed.contentFormat || DEFAULTS.CONTENT_FORMAT,
    };

    return analysis;
  } catch (error) {
    console.error('Error analyzing channel content:', error);
    throw new Error('Failed to analyze channel content');
  }
}

export async function generateSearchQueries(analysis: ChannelAnalysis): Promise<SearchQueries> {
  const topics = extractTopicsString(analysis.topics);
  const { currentYear, currentMonth, currentDate } = getCurrentDateInfo();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.SEARCH_QUERY_AGENT(currentDate, currentYear),
        },
        {
          role: 'user',
          content: USER_PROMPTS.GENERATE_SEARCH_QUERIES(
            topics,
            analysis.style || DEFAULTS.STYLE,
            analysis.targetAudience || DEFAULTS.TARGET_AUDIENCE,
            currentDate,
            currentYear,
            currentMonth
          ),
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);

    const queries: SearchQueries = {
      newsQueries: Array.isArray(parsed.newsQueries) && parsed.newsQueries.length > 0
        ? parsed.newsQueries
        : createFallbackQueries(topics).newsQueries,
      redditQueries: Array.isArray(parsed.redditQueries) && parsed.redditQueries.length > 0
        ? parsed.redditQueries
        : createFallbackQueries(topics).redditQueries,
    };

    return queries;
  } catch (error) {
    console.error('Error generating search queries:', error);
    throw new Error('Failed to generate search queries');
  }
}

export async function generateVideoIdeas(
  analysis: ChannelAnalysis,
  videos: YouTubeVideo[],
  newsContext: string,
  redditContext: string
): Promise<Omit<VideoIdea, 'thumbnailUrl'>[]> {
  const topics = extractTopicsString(analysis.topics);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.VIDEO_STRATEGIST,
        },
        {
          role: 'user',
          content: USER_PROMPTS.GENERATE_VIDEO_IDEAS(
            topics,
            analysis.style || DEFAULTS.STYLE,
            analysis.tone || DEFAULTS.TONE,
            analysis.targetAudience || DEFAULTS.TARGET_AUDIENCE,
            analysis.thumbnailStyle || DEFAULTS.THUMBNAIL_STYLE,
            analysis.contentFormat || DEFAULTS.CONTENT_FORMAT,
            videos,
            newsContext,
            redditContext
          ),
        },
      ],
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);

    if (!result.ideas || !Array.isArray(result.ideas) || result.ideas.length === 0) {
      throw new Error('Invalid response structure: missing or empty ideas array');
    }

    const validatedIdeas = validateVideoIdeas(result.ideas);

    return validatedIdeas.slice(0, 5);
  } catch (error) {
    console.error('Error generating video ideas:', error);
    throw new Error('Failed to generate video ideas');
  }
}

export async function generateThumbnail(
  thumbnailIdea: string, 
  channelStyle: string
): Promise<string> {
  try {
    const finalPrompt = USER_PROMPTS.GENERATE_THUMBNAIL(channelStyle, thumbnailIdea);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: finalPrompt,
      n: 1,
      size: '1792x1024',
      quality: 'hd',
      style: 'natural',
    });

    if (!response.data || !response.data[0]?.url) {
      throw new Error('No image URL returned from DALL-E');
    }

    return response.data[0].url;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
    throw new Error('Failed to generate thumbnail');
  }
}

