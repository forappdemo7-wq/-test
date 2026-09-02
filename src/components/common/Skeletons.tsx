import React from 'react';

export const Skeleton: React.FC<{ className?: string; 'aria-hidden'?: boolean }> = ({
  className = '',
  'aria-hidden': ariaHidden = true,
}) => {
  return (
    <div
      aria-hidden={ariaHidden}
      className={`relative overflow-hidden bg-neutral-200/80 dark:bg-neutral-800/80 rounded-2xl ${className}`}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
};

export const StoriesBarSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 py-4 px-3 overflow-x-hidden" aria-label="Loading stories">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-[66px] h-[66px] rounded-full p-[2.5px] bg-neutral-200/80 dark:bg-neutral-800/80 relative overflow-hidden">
            <div className="w-full h-full rounded-full bg-neutral-300/80 dark:bg-neutral-700/80 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          </div>
          <Skeleton className="w-12 h-2.5 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <div
      className="w-full bg-white dark:bg-neutral-900 sm:rounded-3xl border-b sm:border border-neutral-200/80 dark:border-neutral-800/80 mb-4 overflow-hidden shadow-soft p-4 space-y-3.5"
      aria-label="Loading post"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-3.5 rounded-md" />
            <Skeleton className="w-16 h-2.5 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Media */}
      <Skeleton className="w-full aspect-square rounded-2xl" />

      {/* Action bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="w-7 h-7 rounded-full" />
        </div>
        <Skeleton className="w-7 h-7 rounded-full" />
      </div>

      {/* Captions */}
      <div className="space-y-2 pt-1">
        <Skeleton className="w-24 h-3 rounded-md" />
        <Skeleton className="w-4/5 h-3 rounded-md" />
        <Skeleton className="w-1/2 h-3 rounded-md" />
      </div>
    </div>
  );
};

export const FeedListSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto flex gap-8 justify-center pb-24 sm:pb-12 pt-0 sm:pt-4 px-0 sm:px-4">
      <div className="w-full max-w-[470px]">
        <StoriesBarSkeleton />
        <div className="space-y-4 pt-2">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
      <div className="hidden lg:block w-80 space-y-5 pt-1">
        <Skeleton className="w-full h-20 rounded-3xl" />
        <Skeleton className="w-full h-64 rounded-3xl" />
      </div>
    </div>
  );
};

export const ExploreSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 space-y-4" aria-label="Loading explore feed">
      <div className="flex gap-2 overflow-hidden py-1">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="w-24 h-8 rounded-xl flex-shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`relative rounded-xl sm:rounded-2xl overflow-hidden ${
              i % 7 === 1 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
            }`}
          >
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReelsSkeleton: React.FC = () => {
  return (
    <div className="w-full h-[calc(100vh-60px)] sm:h-[88vh] sm:max-h-[820px] max-w-sm sm:max-w-md mx-auto my-0 sm:my-3 relative flex items-center justify-center select-none pb-20 sm:pb-0" aria-label="Loading reel">
      <div className="w-full h-full bg-neutral-900 sm:rounded-[36px] overflow-hidden relative shadow-soft-lg flex flex-col justify-between p-6">
        <Skeleton className="w-full h-full absolute inset-0 rounded-none sm:rounded-[36px]" />
      </div>
    </div>
  );
};

export const MessagesSkeleton: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-70px)] sm:h-[calc(100vh-40px)] flex bg-white dark:bg-neutral-900 sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden shadow-soft m-0 sm:m-4" aria-label="Loading messages">
      <div className="w-full sm:w-80 border-r border-neutral-200/80 dark:border-neutral-800/80 p-4 space-y-4">
        <Skeleton className="w-full h-10 rounded-2xl" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-24 h-3.5 rounded-md" />
                <Skeleton className="w-36 h-2.5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden sm:flex flex-1 flex-col items-center justify-center p-8">
        <Skeleton className="w-16 h-16 rounded-full mb-3" />
        <Skeleton className="w-40 h-4 rounded-md" />
      </div>
    </div>
  );
};

export const NotificationsSkeleton: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-4" aria-label="Loading notifications">
      <Skeleton className="w-32 h-6 rounded-lg mb-4" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="w-40 h-3.5 rounded-md" />
                <Skeleton className="w-20 h-2.5 rounded-md" />
              </div>
            </div>
            <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" aria-label="Loading profile">
      <div className="flex items-center gap-8 px-4">
        <Skeleton className="w-20 h-20 sm:w-32 sm:h-32 rounded-full" />
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-32 h-6 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-xl" />
          </div>
          <div className="flex gap-6">
            <Skeleton className="w-16 h-4 rounded-md" />
            <Skeleton className="w-16 h-4 rounded-md" />
            <Skeleton className="w-16 h-4 rounded-md" />
          </div>
          <Skeleton className="w-48 h-3.5 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 sm:gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
};
