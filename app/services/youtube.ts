import { google } from 'googleapis';
import { YouTubeVideo } from '../types';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

function parseDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

export async function getChannelIdFromUrl(channelUrl: string): Promise<string> {
  
  let channelId = '';
  
  try {
    if (channelUrl.includes('/@')) {
      // Handle @username format
      const username = channelUrl.split('/@')[1].split('/')[0].split('?')[0];
      const response = await youtube.search.list({
        part: ['id'],
        q: username,
        type: ['channel'],
        maxResults: 1,
      });
      
      if (response.data.items && response.data.items.length > 0) {
        channelId = response.data.items[0].id?.channelId || '';
      }
    } else if (channelUrl.includes('/channel/')) {
      // Direct channel ID
      channelId = channelUrl.split('/channel/')[1].split('/')[0].split('?')[0];
    } else if (channelUrl.includes('/c/')) {
      // Custom URL format
      const customUrl = channelUrl.split('/c/')[1].split('/')[0].split('?')[0];
      const response = await youtube.search.list({
        part: ['id'],
        q: customUrl,
        type: ['channel'],
        maxResults: 1,
      });
      
      if (response.data.items && response.data.items.length > 0) {
        channelId = response.data.items[0].id?.channelId || '';
      }
    } else if (channelUrl.includes('/user/')) {
      // Legacy username format
      const username = channelUrl.split('/user/')[1].split('/')[0].split('?')[0];
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
    
    // Fetch more videos to account for Shorts filtering
    const fetchLimit = Math.min(maxResults * 3, 50);
    
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
    
    // Filter out Shorts (videos 60 seconds or less)
    const regularVideos = videosResponse.data.items.filter(item => {
      const duration = item.contentDetails?.duration || '';
      const durationSeconds = parseDurationToSeconds(duration);
      return durationSeconds > 60;
    });
    
    // Map to YouTubeVideo type and limit to requested amount
    const videos: YouTubeVideo[] = regularVideos
      .slice(0, maxResults)
      .map(item => ({
        id: item.id || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
        publishedAt: item.snippet?.publishedAt || '',
        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
        tags: item.snippet?.tags || [],
      }));
    
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos from YouTube');
  }
}

