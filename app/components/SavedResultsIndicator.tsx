interface SavedResultsIndicatorProps {
  onClear: () => void;
}

export default function SavedResultsIndicator({ onClear }: SavedResultsIndicatorProps) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Results saved locally (available after page refresh)
        </span>
      </div>
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
      >
        Clear Results
      </button>
    </div>
  );
}

