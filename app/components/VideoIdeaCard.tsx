import Image from 'next/image';
import { VideoIdea } from '../types';

interface VideoIdeaCardProps {
  idea: VideoIdea;
  index: number;
}

export default function VideoIdeaCard({ idea, index }: VideoIdeaCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
      <div className="md:flex">
        <div className="md:w-1/3 bg-gray-200 dark:bg-gray-700 relative">
          <Image
            src={idea.thumbnailUrl}
            alt={idea.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <div className="md:w-2/3 p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex-1">
              {index + 1}. {idea.title}
            </h3>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {idea.videoDescription}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700">
                View thumbnail prompt
              </summary>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                {idea.thumbnailPrompt}
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

