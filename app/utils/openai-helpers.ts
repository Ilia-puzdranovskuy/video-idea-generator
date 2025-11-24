export function getCurrentDateInfo() {
  const now = new Date();
  return {
    currentYear: now.getFullYear(),
    currentMonth: now.toLocaleString('en-US', { month: 'long' }),
    currentDate: now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
  };
}

export function validateVideoIdeas(ideas: unknown[]): Array<{
  title: string;
  thumbnailPrompt: string;
  videoDescription: string;
}> {
  return ideas.map((idea: unknown, index: number) => {
    const ideaObj = idea as { 
      title?: string; 
      thumbnailPrompt?: string; 
      videoDescription?: string;
    };
    
    return {
      title: ideaObj.title || `Video Idea ${index + 1}`,
      thumbnailPrompt: ideaObj.thumbnailPrompt || `Create an eye-catching YouTube thumbnail for: ${ideaObj.title || 'video'}`,
      videoDescription: ideaObj.videoDescription || 'Detailed video description coming soon.',
    };
  });
}

export function createFallbackQueries(topics: string): {
  newsQueries: string[];
  redditQueries: string[];
} {
  return {
    newsQueries: [
      topics,
      `${topics} news`,
      `${topics} updates`,
      `${topics} trends`,
      `latest ${topics}`,
    ],
    redditQueries: [
      topics,
      `${topics} discussion`,
      `${topics} reddit`,
      `${topics} community`,
      `${topics} advice`,
    ],
  };
}

export function extractTopicsString(topics: unknown): string {
  return Array.isArray(topics) ? topics.join(', ') : 'general content';
}

