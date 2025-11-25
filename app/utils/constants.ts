// Frontend storage keys
export const STORAGE_KEY = 'youtube_analysis_results';
export const STORAGE_URL_KEY = 'youtube_analysis_last_url';
export const API_ENDPOINT = '/api/analyze-channel-stream';

// HTTP status codes
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  TOO_MANY_REQUESTS: 429,
  FORBIDDEN: 403,
} as const;

// OpenAI configuration
export const OPENAI_CONFIG = {
  MODELS: {
    GPT_4O: 'gpt-4o',
    GPT_4O_MINI: 'gpt-4o-mini',
    DALLE_3: 'dall-e-3',
  },
  TEMPERATURE: {
    LOW: 0.2,
    MEDIUM: 0.7,
    HIGH: 0.8,
    CREATIVE: 0.9,
  },
  MAX_TOKENS: {
    THUMBNAIL_ANALYSIS: 3000,
  },
  IMAGE: {
    SIZE: '1792x1024',
    QUALITY: 'hd',
    STYLE: 'natural',
    DETAIL: 'high',
  },
} as const;

// YouTube configuration
export const YOUTUBE_CONFIG = {
  API_VERSION: 'v3',
  DURATION: {
    SHORTS_MAX_SECONDS: 60,
    SECONDS_IN_MINUTE: 60,
    SECONDS_IN_HOUR: 3600,
  },
  FETCH: {
    MULTIPLIER: 3,
    MAX_RESULTS: 50,
  },
  URL_PATTERNS: {
    USERNAME: '/@',
    CHANNEL: '/channel/',
    CUSTOM: '/c/',
    USER: '/user/',
  },
  DEFAULTS: {
    VIEW_COUNT: '0',
    LIKE_COUNT: '0',
  },
} as const;

// News API configuration
export const NEWS_API_CONFIG = {
  BASE_URL: 'https://newsapi.org/v2/everything',
  DAYS_AGO: 7,
  PAGE_SIZE: 5,
  MAX_ARTICLES: 15,
  LANGUAGE: 'en',
  SORT_BY: 'publishedAt',
} as const;

// Reddit API configuration
export const REDDIT_CONFIG = {
  BASE_URL: 'https://www.reddit.com',
  SEARCH_URL: 'https://www.reddit.com/search.json',
  USER_AGENT: 'VideoIdeaGenerator/1.0',
  SEARCH_LIMIT: 10,
  MAX_POSTS: 15,
  TIME_RANGE: 'week',
  SORT_BY: 'relevance',
  UNIX_TO_MS: 1000,
  DELAY_BETWEEN_REQUESTS_MS: 1000,
} as const;

// Analysis configuration
export const ANALYSIS_CONFIG = {
  VIDEOS: {
    FETCH_COUNT: 10,
    DISPLAY_COUNT: 5,
  },
  NEWS: {
    DISPLAY_COUNT: 10,
  },
  REDDIT: {
    DISPLAY_COUNT: 10,
  },
  VIDEO_IDEAS: {
    MAX_COUNT: 5,
  },
  THUMBNAILS: {
    ANALYSIS_COUNT: 5,
  },
} as const;

