import { VideoIdea } from '../types';
import VideoIdeaCard from './VideoIdeaCard';

interface VideoIdeasListProps {
  ideas: VideoIdea[];
}

export default function VideoIdeasList({ ideas }: VideoIdeasListProps) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">5 AI-Generated Video Ideas</h2>
      <div className="grid grid-cols-1 gap-6">
        {ideas.map((idea, i) => (
          <VideoIdeaCard key={`${idea.title}-${idea.thumbnailUrl}`} idea={idea} index={i} />
        ))}
      </div>
    </div>
  );
}

