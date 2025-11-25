import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { validateEnvironmentVariables, formatZodError } from '@/app/utils/validation';
import { AnalyzeChannelRequestSchema } from '@/app/config/schemas';
import { AnalysisResult } from '@/app/types';
import { performChannelAnalysis } from '@/app/services/channel-analysis';
import { HTTP_STATUS } from '@/app/utils/constants';

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
        { status: HTTP_STATUS.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
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
        { status: HTTP_STATUS.INTERNAL_ERROR, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid request';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
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
        const result = await performChannelAnalysis(channelUrl, sendProgress);
        sendComplete(result);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          console.error('Response validation error:', formatZodError(validationError));
          sendError(`Data validation error: ${formatZodError(validationError)}`);
        } else {
          console.error('Error in analyze-channel-stream:', validationError);
          const errorMessage = validationError instanceof Error 
            ? validationError.message 
            : 'An error occurred during analysis';
          sendError(errorMessage);
        }
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

