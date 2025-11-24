# YouTube Video Idea Generator

AI-powered tool that analyzes YouTube channels and generates creative video ideas based on channel content, current news, and Reddit trends.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **AI Models**: 
  - GPT-4o for content analysis and idea generation
  - GPT-4o-mini for search query optimization
  - DALL-E 3 for thumbnail generation
- **APIs**:
  - YouTube Data API v3
  - OpenAI API
  - News API
  - Reddit JSON API

## Prerequisites

You need to obtain the following API keys:

1. **OpenAI API Key** (required)
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Create an API key at [API Keys page](https://platform.openai.com/api-keys)
   - Note: This will be used for GPT-4 and DALL-E 3 (costs apply)

2. **YouTube Data API Key** (required)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create credentials (API Key)

3. **News API Key** (required)
   - Sign up at [NewsAPI.org](https://newsapi.org/register)
   - Free tier includes 100 requests/day

## Installation

1. Clone the repository:
```bash
 git clone <repository-url>
 cd video-idea-generator
```

2. Install dependencies:
```bash
 npm install
```

3. Create `.env.local` file in the root directory:
```bash
 cp .env.example .env.local
```

4. Edit `.env.local` and add your API keys:
```env
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIza...
NEWS_API_KEY=...
```

## Usage

1. Start the development server:
```bash
 npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Enter a YouTube channel URL in one of these formats:
   - `https://www.youtube.com/@channelname`
   - `https://www.youtube.com/channel/UCxxxxx`
   - `https://www.youtube.com/c/customname`

4. Click "Generate Ideas" and wait 1-2 minutes for analysis

## Development

Build for production:
```bash
 npm run build
 npm start
```
