import { ZodError } from 'zod';
import { AnalyzeChannelRequestSchema } from '../config/schemas';

export function isValidYouTubeUrl(url: string): boolean {
  try {
    AnalyzeChannelRequestSchema.parse({ channelUrl: url });
    return true;
  } catch {
    return false;
  }
}

export function formatZodError(error: ZodError): string {
  return error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
}

export function validateEnvironmentVariables(): { valid: boolean; missing: string[] } {
  const required = [
    'OPENAI_API_KEY',
    'YOUTUBE_API_KEY',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

