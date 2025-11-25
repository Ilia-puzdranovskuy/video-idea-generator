import OpenAI from 'openai';
import { YouTubeVideo, ChannelAnalysis, SearchQueries, VideoIdea } from '../types';
import { SYSTEM_PROMPTS, USER_PROMPTS, DEFAULTS } from '../config/prompts';
import { OPENAI_CONFIG, ANALYSIS_CONFIG } from '../utils/constants';
import {
  getCurrentDateInfo,
  validateVideoIdeas,
  createFallbackQueries,
  extractTopicsString
} from '../utils/openai-helpers';

// OPENAI CLIENT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// THUMBNAIL ANALYSIS
async function analyzeThumbnailStyle(videos: YouTubeVideo[]): Promise<string> {
  const thumbnailUrls = videos
    .slice(0, ANALYSIS_CONFIG.THUMBNAILS.ANALYSIS_COUNT)
    .map(v => v.thumbnailUrl)
    .filter(url => url);

  if (thumbnailUrls.length === 0) {
    return DEFAULTS.THUMBNAIL_STYLE;
  }

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODELS.GPT_4O,
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
              image_url: { url, detail: OPENAI_CONFIG.IMAGE.DETAIL },
            })),
          ],
        },
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS.THUMBNAIL_ANALYSIS,
      temperature: OPENAI_CONFIG.TEMPERATURE.LOW,
    });

    const styleAnalysis = response.choices[0].message.content || DEFAULTS.THUMBNAIL_STYLE;
    
    return styleAnalysis;
  } catch (error) {
    console.error('Error analyzing thumbnails with vision:', error);
    return DEFAULTS.THUMBNAIL_STYLE;
  }
}

// CHANNEL CONTENT ANALYSIS
export async function analyzeChannelContent(videos: YouTubeVideo[]): Promise<ChannelAnalysis> {
  const thumbnailStyle = await analyzeThumbnailStyle(videos);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODELS.GPT_4O,
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
      temperature: OPENAI_CONFIG.TEMPERATURE.MEDIUM,
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

// SEARCH QUERIES GENERATION
export async function generateSearchQueries(analysis: ChannelAnalysis): Promise<SearchQueries> {
  const topics = extractTopicsString(analysis.topics);
  const { currentYear, currentMonth, currentDate } = getCurrentDateInfo();

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODELS.GPT_4O_MINI,
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
      temperature: OPENAI_CONFIG.TEMPERATURE.HIGH,
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

// VIDEO IDEAS GENERATION
export async function generateVideoIdeas(
  analysis: ChannelAnalysis,
  videos: YouTubeVideo[],
  newsContext: string,
  redditContext: string
): Promise<Omit<VideoIdea, 'thumbnailUrl'>[]> {
  const topics = extractTopicsString(analysis.topics);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODELS.GPT_4O,
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
      temperature: OPENAI_CONFIG.TEMPERATURE.CREATIVE,
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

    return validatedIdeas.slice(0, ANALYSIS_CONFIG.VIDEO_IDEAS.MAX_COUNT);
  } catch (error) {
    console.error('Error generating video ideas:', error);
    throw new Error('Failed to generate video ideas');
  }
}

// THUMBNAIL GENERATION
export async function generateThumbnail(
  thumbnailIdea: string, 
  channelStyle: string
): Promise<string> {
  try {
    const finalPrompt = USER_PROMPTS.GENERATE_THUMBNAIL(channelStyle, thumbnailIdea);

    const response = await openai.images.generate({
      model: OPENAI_CONFIG.MODELS.DALLE_3,
      prompt: finalPrompt,
      n: 1,
      size: OPENAI_CONFIG.IMAGE.SIZE,
      quality: OPENAI_CONFIG.IMAGE.QUALITY,
      style: OPENAI_CONFIG.IMAGE.STYLE,
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

