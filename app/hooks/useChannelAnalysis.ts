import { useState } from 'react';
import { AnalysisResult } from '../types';
import { API_ENDPOINT } from '../utils/constants';

interface UseChannelAnalysisReturn {
  loading: boolean;
  error: string;
  progress: string;
  progressStep: string;
  analyzeChannel: (channelUrl: string) => Promise<AnalysisResult | null>;
}

export function useChannelAnalysis(): UseChannelAnalysisReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const [progressStep, setProgressStep] = useState<string>('');

  const analyzeChannel = async (channelUrl: string): Promise<AnalysisResult | null> => {
    if (!channelUrl.trim()) {
      setError('Please enter a YouTube channel URL');
      return null;
    }

    setLoading(true);
    setError('');
    setProgress('Starting analysis...');
    setProgressStep('');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelUrl }),
      });

      if (!response.ok) {
        throw new Error('Server connection error');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get stream');
      }

      let buffer = '';
      let result: AnalysisResult | null = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'progress') {
              setProgressStep(data.step);
              setProgress(data.message);
            } else if (data.type === 'complete') {
              result = data.data;
              setProgress('');
              setProgressStep('');
              setLoading(false);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during analysis';
      setError(errorMessage);
      setProgress('');
      setProgressStep('');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    progress,
    progressStep,
    analyzeChannel,
  };
}

