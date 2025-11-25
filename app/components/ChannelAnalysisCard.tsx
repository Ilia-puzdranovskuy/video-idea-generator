import { ChannelAnalysis } from "../types";

interface ChannelAnalysisCardProps {
  analysis: ChannelAnalysis;
}

export default function ChannelAnalysisCard({
  analysis,
}: ChannelAnalysisCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Channel Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.topics.map((topic, index) => (
              <span
                key={`${topic}-${index}`}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Style & Tone
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {analysis.style} • {analysis.tone}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Target Audience
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {analysis.targetAudience}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Content Format
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {analysis.contentFormat}
          </p>
        </div>
      </div>
    </div>
  );
}
