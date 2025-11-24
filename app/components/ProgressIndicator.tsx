interface ProgressIndicatorProps {
  progress: string;
  progressStep: string;
}

export default function ProgressIndicator({ progress, progressStep }: ProgressIndicatorProps) {
  if (!progress) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 dark:border-blue-400"></div>
        <div>
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            {progressStep && `Step ${progressStep}`}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-400">
            {progress}
          </div>
        </div>
      </div>
      {progressStep && (
        <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(parseInt(progressStep.split('/')[0]) / 7) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

