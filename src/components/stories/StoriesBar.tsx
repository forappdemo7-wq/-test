import React from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StoryRing } from './StoryRing';

export const StoriesBar: React.FC = () => {
  const { stories, openStoryViewer, currentUser, setIsCreateOpen } = useApp();

  return (
    <div className="w-full bg-white dark:bg-neutral-900 sm:rounded-3xl border-b sm:border border-neutral-200/80 dark:border-neutral-800/80 py-4 px-3 sm:px-5 mb-4 shadow-soft transition-colors select-none">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth">
        {/* Your Story button */}
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
          <div className="relative">
            <StoryRing
              avatar={currentUser.avatar}
              username={currentUser.username}
              hasUnseen={false}
              size="md"
              onClick={() => {
                const myIndex = stories.findIndex((s) => s.userId === currentUser.id);
                if (myIndex >= 0 && stories[myIndex].items.length > 0) {
                  openStoryViewer(myIndex);
                } else {
                  setIsCreateOpen(true);
                }
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateOpen(true);
              }}
              title="Add Story"
              className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-soft-xs transition-transform group-hover:scale-110 active:scale-90"
            >
              <Plus size={13} className="stroke-[3]" />
            </button>
          </div>
          <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium mt-1.5 truncate max-w-[70px] text-center group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
            Your story
          </span>
        </div>

        {/* Other Users' Stories */}
        {stories
          .filter((s) => s.userId !== currentUser.id)
          .map((group) => {
            const realIndex = stories.findIndex((s) => s.userId === group.userId);
            return (
              <div
                key={group.userId}
                onClick={() => openStoryViewer(realIndex)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
              >
                <StoryRing
                  avatar={group.avatar}
                  username={group.username}
                  hasUnseen={group.hasUnseen}
                  size="md"
                />
                <span className="text-[11px] text-neutral-800 dark:text-neutral-200 font-medium mt-1.5 truncate max-w-[72px] text-center group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                  {group.username}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
