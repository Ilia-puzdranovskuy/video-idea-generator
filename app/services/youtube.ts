import { google } from 'googleapis';
import { YouTubeVideo } from '../types';
import { YOUTUBE_CONFIG } from '../utils/constants';

const youtube = google.youtube({
  version: YOUTUBE_CONFIG.API_VERSION,
  auth: process.env.YOUTUBE_API_KEY,
});

function parseDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || YOUTUBE_CONFIG.DEFAULTS.VIEW_COUNT);
  const minutes = parseInt(match[2] || YOUTUBE_CONFIG.DEFAULTS.VIEW_COUNT);
  const seconds = parseInt(match[3] || YOUTUBE_CONFIG.DEFAULTS.VIEW_COUNT);
  
  return hours * YOUTUBE_CONFIG.DURATION.SECONDS_IN_HOUR + 
         minutes * YOUTUBE_CONFIG.DURATION.SECONDS_IN_MINUTE + 
         seconds;
}

export async function getChannelIdFromUrl(channelUrl: string): Promise<string> {
  
  let channelId = '';
  
  try {
    if (channelUrl.includes(YOUTUBE_CONFIG.URL_PATTERNS.USERNAME)) {
      const username = channelUrl
        .split(YOUTUBE_CONFIG.URL_PATTERNS.USERNAME)[1]
        .split('/')[0]
        .split('?')[0];
      const response = await youtube.search.list({
        part: ['id'],
        q: username,
        type: ['channel'],
        maxResults: 1,
      });
      
      if (response.data.items && response.data.items.length > 0) {
        channelId = response.data.items[0].id?.channelId || '';
      }
    } else if (channelUrl.includes(YOUTUBE_CONFIG.URL_PATTERNS.CHANNEL)) {
      channelId = channelUrl
        .split(YOUTUBE_CONFIG.URL_PATTERNS.CHANNEL)[1]
        .split('/')[0]
        .split('?')[0];
    } else if (channelUrl.includes(YOUTUBE_CONFIG.URL_PATTERNS.CUSTOM)) {
      const customUrl = channelUrl
        .split(YOUTUBE_CONFIG.URL_PATTERNS.CUSTOM)[1]
        .split('/')[0]
        .split('?')[0];
      const response = await youtube.search.list({
        part: ['id'],
        q: customUrl,
        type: ['channel'],
        maxResults: 1,
      });
      
      if (response.data.items && response.data.items.length > 0) {
        channelId = response.data.items[0].id?.channelId || '';
      }
    } else if (channelUrl.includes(YOUTUBE_CONFIG.URL_PATTERNS.USER)) {
      const username = channelUrl
        .split(YOUTUBE_CONFIG.URL_PATTERNS.USER)[1]
        .split('/')[0]
        .split('?')[0];
      const response = await youtube.channels.list({
        part: ['id'],
        forUsername: username,
      });
      
      if (response.data.items && response.data.items.length > 0) {
        channelId = response.data.items[0].id || '';
      }
    }
    
    if (!channelId) {
      throw new Error('Could not extract channel ID from URL');
    }
    
    return channelId;
  } catch (error) {
    console.error('Error extracting channel ID:', error);
    throw new Error('Invalid YouTube channel URL');
  }
}

export async function getLatestVideos(channelId: string, maxResults = 10): Promise<YouTubeVideo[]> {
  try {
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });
    
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Channel not found');
    }
    
    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist');
    }
    
    const fetchLimit = Math.min(
      maxResults * YOUTUBE_CONFIG.FETCH.MULTIPLIER, 
      YOUTUBE_CONFIG.FETCH.MAX_RESULTS
    );
    
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: fetchLimit,
    });
    
    if (!playlistResponse.data.items) {
      return [];
    }
    
    const videoIds = playlistResponse.data.items
      .map(item => item.contentDetails?.videoId)
      .filter((id): id is string => !!id);
    
    // Get detailed video information including duration
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: videoIds,
    });
    
    if (!videosResponse.data.items) {
      return [];
    }
    
    const regularVideos = videosResponse.data.items.filter(item => {
      const duration = item.contentDetails?.duration || '';
      const durationSeconds = parseDurationToSeconds(duration);
      return durationSeconds > YOUTUBE_CONFIG.DURATION.SHORTS_MAX_SECONDS;
    });
    
    const videos: YouTubeVideo[] = regularVideos
      .slice(0, maxResults)
      .map(item => ({
        id: item.id || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
        publishedAt: item.snippet?.publishedAt || '',
        viewCount: item.statistics?.viewCount || YOUTUBE_CONFIG.DEFAULTS.VIEW_COUNT,
        likeCount: item.statistics?.likeCount || YOUTUBE_CONFIG.DEFAULTS.LIKE_COUNT,
        tags: item.snippet?.tags || [],
      }));
    
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos from YouTube');
  }
}

