import { YouTubeVideo } from '../types';

// SYSTEM PROMPTS - All system messages
export const SYSTEM_PROMPTS = {
  THUMBNAIL_ANALYST: `You are a visual style extraction expert creating specifications for DALL-E image generation.
Analyze the provided thumbnails and create a PRECISE, REPRODUCIBLE style guide.
Focus ONLY on patterns that are CONSISTENT across ALL thumbnails - these define the channel's visual identity.
Your output will be used directly by DALL-E to generate new thumbnails that match this exact style.
Be extremely specific about colors, typography, composition, and visual treatment.
Write as if giving direct instructions to an artist who has never seen these thumbnails.`,
  
  CHANNEL_ANALYST: 'You are a YouTube content analyst. You MUST respond with valid JSON matching the exact structure requested. All field names must be exactly as specified.',
  
  SEARCH_QUERY_AGENT: (currentDate: string, currentYear: number) => 
    `You are a search query optimization agent operating on ${currentDate}. You MUST use the current year ${currentYear} in all date-specific queries. NEVER use outdated years. You MUST respond with valid JSON matching the exact structure requested with arrays of exactly 5 strings each.`,
  
  VIDEO_STRATEGIST: 'You are a creative YouTube content strategist. You MUST respond with valid JSON containing exactly 5 video ideas with complete details.',
} as const;

// USER PROMPTS - All user prompts as template functions
export const USER_PROMPTS = {
  ANALYZE_THUMBNAILS: () => `You are analyzing YouTube thumbnails to create a precise visual style guide for DALL-E image generation.

Your task: Identify the CONSISTENT patterns across ALL thumbnails. Focus ONLY on what repeats in every thumbnail.

Provide a detailed style specification in this format:

**COLOR PALETTE:**
List exact colors: "bright red", "electric blue #00A3FF", "neon yellow"
Background treatment: "solid blue gradient", "blurred photo", "bright colored backdrop"
Saturation: "heavily oversaturated", "natural colors", "muted pastels"

**TEXT STYLE:**
Font: "extremely bold sans-serif", "thick blocky letters", "modern rounded font"
Size: "text fills 40% of thumbnail", "large dominant headline", "small subtitle"
Placement: "centered at top", "diagonal across center", "bottom-left corner"
Effects: "thick white outline + black shadow", "3D extrusion", "glowing effect", "none"
Colors: "white text on dark background", "yellow with black outline"

**LAYOUT & COMPOSITION:**
Subject placement: "person on right 1/3", "centered close-up face", "full-body left side"
Subject size: "face fills 50% of frame", "small figure in corner", "split 50/50"
Background: "solid gradient", "blurred scene", "clean studio backdrop", "busy pattern"
Elements arrangement: "text above, subject below", "subject left, text right"

**PHOTOGRAPHY STYLE:**
Image type: "professional photo", "3D render", "illustrated cartoon", "screenshot"
Angle: "straight-on eye level", "slight upward angle", "dramatic low angle"
Lighting: "high-key bright", "dramatic side light", "soft even lighting"
Treatment: "high contrast sharp", "slightly soft", "heavy color grading"

**GRAPHIC ELEMENTS:**
Recurring additions: "large red arrow pointing", "yellow circle highlights", "emoji reactions"
Borders/frames: "thin white border", "rounded corners", "vignette edges"
Badges: "red 'NEW' badge top-right", "number counter bottom-left"

Write as direct DALL-E instructions (400-600 words). Be specific and prescriptive. Every detail should be reproducible.`,

  ANALYZE_CHANNEL: (videos: YouTubeVideo[]) => `Analyze these YouTube videos from a channel and provide a detailed analysis:

Videos:
${videos.map((v, i) => `
${i + 1}. Title: ${v.title}
   Description: ${v.description.substring(0, 500)}
   Tags: ${v.tags?.join(', ') || 'None'}
   Views: ${v.viewCount}
`).join('\n')}

You MUST respond with a JSON object in this EXACT format:
{
  "topics": ["topic1", "topic2", "topic3"],
  "style": "Educational",
  "tone": "Professional",
  "targetAudience": "description of target audience",
  "contentFormat": "description of content format"
}

Requirements:
- topics: Array of 3-5 main topics covered (MUST be an array of strings)
- style: Overall content style (e.g., "Educational", "Entertainment", "Tutorial", "Review", "Commentary")
- tone: Communication tone (e.g., "Professional", "Casual", "Humorous", "Energetic", "Calm")
- targetAudience: Detailed description of who watches this content (age, interests, expertise level)
- contentFormat: Format and structure of videos (e.g., "Long-form tutorials", "Quick tips", "Story-driven", "List format")

Analyze the patterns in titles, topics, and how content is presented.
Respond ONLY with valid JSON in the exact format shown above, no other text.`,

  GENERATE_SEARCH_QUERIES: (topics: string, style: string, targetAudience: string, currentDate: string, currentYear: number, currentMonth: string) => 
    `CURRENT DATE: ${currentDate} (${currentYear})

Based on this YouTube channel analysis, generate optimized search queries for TODAY:

Channel Analysis:
- Topics: ${topics}
- Style: ${style}
- Target Audience: ${targetAudience}

Generate search queries that will help find:
1. Recent news articles related to these topics (published TODAY or within last 24 hours)
2. Reddit discussions about these topics (active TODAY)

CRITICAL REQUIREMENTS:
- Generate exactly 5 news queries and 5 reddit queries
- ALL queries MUST use current year ${currentYear} or "${currentMonth} ${currentYear}" if date-specific
- Use terms like "latest", "today", "recent", ${currentYear} 
- News queries should find BREAKING/TRENDING news from ${currentDate}
- Reddit queries should find ACTIVE discussions happening NOW
- Mix broad and specific terms
- Consider synonyms and related topics
- Make queries diverse to cover different aspects
- DO NOT use outdated dates

EXAMPLES OF GOOD QUERIES:
- "latest AI breakthroughs ${currentMonth} ${currentYear}"
- "trending technology news today"
- "AI developments ${currentYear}"

You MUST respond with JSON in this EXACT format:
{
  "newsQueries": ["query1", "query2", "query3", "query4", "query5"],
  "redditQueries": ["query1", "query2", "query3", "query4", "query5"]
}

Both arrays MUST contain exactly 5 strings each.
Respond ONLY with valid JSON, no other text.`,

  GENERATE_VIDEO_IDEAS: (topics: string, style: string, tone: string, targetAudience: string, thumbnailStyle: string, contentFormat: string, videos: YouTubeVideo[], newsContext: string, redditContext: string) =>
    `You are a YouTube content strategist. Generate 5 creative video ideas for this channel.

Channel Analysis:
- Topics: ${topics}
- Style: ${style}
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Thumbnail Style: ${thumbnailStyle}
- Content Format: ${contentFormat}

Recent Channel Videos (for reference):
${videos.slice(0, 5).map((v, i) => `${i + 1}. ${v.title}`).join('\n')}

Current News Context:
${newsContext}

Reddit Discussions Context:
${redditContext}

Generate 5 video ideas that:
1. Align with the channel's style and topics
2. Leverage current news and trending discussions
3. Are relevant to the target audience
4. Follow the same title format/style as existing videos
5. Would get high engagement

You MUST respond with JSON in this EXACT format:
{
  "ideas": [
    {
      "title": "Compelling video title",
      "thumbnailPrompt": "DALL-E visual prompt",
      "videoDescription": "3-paragraph description with hook, main points, and call to action"
    }
  ]
}

Generate EXACTLY 5 ideas in the ideas array.
Each idea MUST have all three fields: title, thumbnailPrompt, videoDescription.

CRITICAL - thumbnailPrompt requirements:
- Maximum 100 words (strictly enforce - be VERY concise)
- Focus ONLY on the SPECIFIC content for THIS video (what's different from other videos)
- DO NOT repeat the channel's general style - it will be automatically applied
- Describe only: main subject, key text, specific visual metaphors, unique elements
- Use ultra-compact language: "Python code screen, frustrated developer, red error messages"
- NO style descriptions (colors, fonts, effects) - those come from channel style
- Think: "What makes THIS thumbnail unique?"

GOOD example: "Glowing AI chip center, text 'GPT-5 LEAKED', shocked tech expert pointing, comparison chart old vs new models"

BAD example: "Vibrant blue gradient background with bold yellow text saying GPT-5 LEAKED using sans-serif font with drop shadow..."

The thumbnailPrompt should describe CONTENT, not STYLE. Style comes from channel analysis.

The videoDescription should be 3 detailed paragraphs.

Respond ONLY with valid JSON, no other text.`,

  GENERATE_THUMBNAIL: (channelStyle: string, thumbnailIdea: string) => 
    `YouTube video thumbnail, 16:9 widescreen format, professional quality.

MANDATORY STYLE SPECIFICATIONS (DO NOT DEVIATE):
${channelStyle}

THUMBNAIL CONTENT:
${thumbnailIdea}

STRICT INSTRUCTIONS:
You MUST replicate the exact visual style described above. This is critical:
- Use ONLY the colors specified in the style reference
- Apply the EXACT typography (font weight, placement, effects) as described
- Follow the EXACT composition and layout pattern specified
- Match the EXACT image treatment (saturation, contrast, lighting style)
- Include the same type of graphic elements (arrows/highlights/badges) if mentioned
- Maintain the same photography or illustration approach described
- The final result must look indistinguishable from the channel's existing thumbnails

Focus on visual consistency with the established style. Do not add creative interpretations beyond what's specified.`,
} as const;

export const DEFAULTS = {
  THUMBNAIL_STYLE: 'Bold text overlays, vibrant colors, high contrast, eye-catching composition',
  TOPICS: ['General Content'],
  STYLE: 'Entertainment',
  TONE: 'Casual',
  TARGET_AUDIENCE: 'General audience',
  CONTENT_FORMAT: 'Standard videos',
} as const;

