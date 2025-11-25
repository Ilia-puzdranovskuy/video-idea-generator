import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { validateEnvironmentVariables, formatZodError } from '@/app/utils/validation';
import { 
  AnalyzeChannelRequestSchema,
  ApiErrorResponse,
  ApiSuccessResponse 
} from '@/app/config/schemas';
import { performChannelAnalysis } from '@/app/services/channel-analysis';
import { HTTP_STATUS } from '@/app/utils/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = AnalyzeChannelRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json<ApiErrorResponse>(
        { 
          success: false, 
          error: 'Invalid request data',
          details: { validation: formatZodError(validationResult.error) }
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { channelUrl } = validationResult.data;

    const envValidation = validateEnvironmentVariables();
    if (!envValidation.valid) {
      return NextResponse.json<ApiErrorResponse>(
        { 
          success: false, 
          error: 'Server configuration error',
          details: { missing: envValidation.missing }
        },
        { status: HTTP_STATUS.INTERNAL_ERROR }
      );
    }

    const result = await performChannelAnalysis(channelUrl);

    return NextResponse.json<ApiSuccessResponse>({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error in analyze-channel API:', error);

    if (error instanceof ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: 'Response validation error',
          details: { validation: formatZodError(error) }
        },
        { status: HTTP_STATUS.INTERNAL_ERROR }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

