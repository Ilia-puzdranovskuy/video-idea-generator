'use client';

import { AnalysisResult } from './types';
import { STORAGE_KEY, STORAGE_URL_KEY } from './utils/constants';
import { useLocalStorage, useChannelAnalysis, useMounted } from './hooks';
import {
  Header,
  ChannelInputForm,
  EmptyState,
  SavedResultsIndicator,
  ChannelAnalysisCard,
  VideoIdeasList,
  ContextInformation,
} from './components';

export default function Home() {
  const mounted = useMounted();
  const [result, setResult, clearResult] = useLocalStorage<AnalysisResult | null>(STORAGE_KEY, null);
  const [channelUrl, setChannelUrl, clearChannelUrl] = useLocalStorage<string>(STORAGE_URL_KEY, '');

  const { loading, error, progress, progressStep, analyzeChannel } = useChannelAnalysis();

  const handleAnalyze = async () => {
    const analysisResult = await analyzeChannel(channelUrl);
    if (analysisResult) {
      setResult(analysisResult);
      setChannelUrl(channelUrl);
    }
  };

  const clearResults = () => {
    clearResult();
    clearChannelUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Header />

        <ChannelInputForm
          channelUrl={mounted ? channelUrl : ''}
          loading={loading}
          error={error}
          progress={progress}
          progressStep={progressStep}
          onChannelUrlChange={setChannelUrl}
          onSubmit={handleAnalyze}
        />

        {mounted && result && (
          <div className="space-y-8">
            <SavedResultsIndicator onClear={clearResults} />
            <ChannelAnalysisCard analysis={result.channelAnalysis} />
            <VideoIdeasList ideas={result.videoIdeas} />
            <ContextInformation
              newsArticles={result.newsArticles}
              redditPosts={result.redditPosts}
            />
          </div>
        )}

        {mounted && !result && !loading && <EmptyState />}
      </div>
    </div>
  );
}
