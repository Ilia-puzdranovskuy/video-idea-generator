import ErrorMessage from './ErrorMessage';
import ProgressIndicator from './ProgressIndicator';

interface ChannelInputFormProps {
  channelUrl: string;
  loading: boolean;
  error: string;
  progress: string;
  progressStep: string;
  onChannelUrlChange: (url: string) => void;
  onSubmit: () => void;
}

export default function ChannelInputForm({
  channelUrl,
  loading,
  error,
  progress,
  progressStep,
  onChannelUrlChange,
  onSubmit,
}: ChannelInputFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      onSubmit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <label htmlFor="channelUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          YouTube Channel URL
        </label>
        <div className="flex gap-3">
          <input
            id="channelUrl"
            type="text"
            value={channelUrl}
            onChange={(e) => onChannelUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://www.youtube.com/@channelname"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Analyzing...' : 'Generate Ideas'}
          </button>
        </div>
        <ErrorMessage message={error} />
        <ProgressIndicator progress={progress} progressStep={progressStep} />
      </div>
    </div>
  );
}

