import React, { useState } from 'react';
import {
  Clock,
  Heart,
  MessageCircle,
  Trash2,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Post } from '../../../types';

export const SettingsActivityView: React.FC = () => {
  const { posts, currentUser, toggleLikePost, setSelectedPostForDetail } = useApp();
  const [activeTab, setActiveTab] = useState<'time' | 'likes' | 'comments' | 'deleted'>('time');
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(45);
  const [dailyLimitEnabled, setDailyLimitEnabled] = useState(false);
  const [breakReminderMinutes, setBreakReminderMinutes] = useState(20);
  const [breakReminderEnabled, setBreakReminderEnabled] = useState(true);

  // Mock deleted items stored in local state for restoration
  const [deletedPosts, setDeletedPosts] = useState<Post[]>([
    {
      id: 'del_1',
      userId: currentUser.id,
      author: currentUser,
      media: [
        {
          url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
        },
      ],
      caption: 'Old memory from last summer 🏖️',
      timestamp: '14 days ago',
      likesCount: 12,
      commentsCount: 2,
      isLiked: false,
      isSaved: false,
      comments: [],
    },
  ]);

  const likedPosts = posts.filter((p) => p.isLiked);

  // Collect user's comments across posts
  const userComments: { post: Post; comment: any }[] = [];
  posts.forEach((p) => {
    p.comments.forEach((c) => {
      if (c.userId === currentUser.id) {
        userComments.push({ post: p, comment: c });
      }
    });
  });

  const weekDays = [
    { day: 'M', time: '35m', height: '60%' },
    { day: 'T', time: '42m', height: '75%' },
    { day: 'W', time: '28m', height: '48%' },
    { day: 'T', time: '50m', height: '90%' },
    { day: 'F', time: '65m', height: '100%' },
    { day: 'S', time: '30m', height: '52%' },
    { day: 'S', time: '20m', height: '35%' },
  ];

  const handleRestore = (delId: string) => {
    setDeletedPosts((prev) => prev.filter((p) => p.id !== delId));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-neutral-100 dark:border-neutral-800">
        {[
          { id: 'time', label: 'Time spent' },
          { id: 'likes', label: `Likes (${likedPosts.length})` },
          { id: 'comments', label: `Comments (${userComments.length})` },
          { id: 'deleted', label: `Recently deleted (${deletedPosts.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Time Spent Tab */}
      {activeTab === 'time' && (
        <div className="space-y-4">
          {/* Daily Average Card */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Daily Average
              </span>
              <span className="text-xs text-neutral-500 font-medium">Last 7 days</span>
            </div>

            <div>
              <p className="text-3xl font-bold text-neutral-950 dark:text-white">38m</p>
              <p className="text-xs text-neutral-500">
                The average time you spent per day using InstaVibe in the past week.
              </p>
            </div>

            {/* Bar chart */}
            <div className="h-28 flex items-end justify-between pt-4 px-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
              {weekDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] text-neutral-400 font-medium">{d.time}</span>
                  <div
                    style={{ height: d.height }}
                    className="w-5 bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                  />
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Manage Your Time */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
              Manage Your Time
            </h4>

            {/* Set Daily Limit */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Set daily time limit
                  </p>
                  <p className="text-xs text-neutral-500">
                    Get a reminder to close the app when you hit {dailyLimitMinutes} min.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dailyLimitEnabled}
                  onChange={(e) => setDailyLimitEnabled(e.target.checked)}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
              </div>

              {dailyLimitEnabled && (
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={dailyLimitMinutes}
                    onChange={(e) => setDailyLimitMinutes(Number(e.target.value))}
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-blue-500 min-w-[50px] text-right">
                    {dailyLimitMinutes} min
                  </span>
                </div>
              )}
            </div>

            {/* Take a Break Reminder */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Set break reminders
                  </p>
                  <p className="text-xs text-neutral-500">
                    Remind yourself to step away every {breakReminderMinutes} min.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={breakReminderEnabled}
                  onChange={(e) => setBreakReminderEnabled(e.target.checked)}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Likes Tab */}
      {activeTab === 'likes' && (
        <div className="space-y-3">
          {likedPosts.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Heart size={32} className="mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm font-semibold">No liked posts yet</p>
              <p className="text-xs text-neutral-500">
                Posts you like from your feed will show up here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {likedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostForDetail(post)}
                  className="relative aspect-square group bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer"
                >
                  <img
                    src={post.media[0]?.url}
                    alt="Liked post"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    <Heart size={16} className="fill-red-500 text-red-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-2">
          {userComments.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <MessageCircle size={32} className="mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm font-semibold">No comments yet</p>
              <p className="text-xs text-neutral-500">
                Comments you post across InstaVibe will be organized here.
              </p>
            </div>
          ) : (
            userComments.map(({ post, comment }) => (
              <div
                key={comment.id}
                onClick={() => setSelectedPostForDetail(post)}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start justify-between gap-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-950 dark:text-white">
                    On @{post.author.username}&apos;s post
                  </p>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">
                    &ldquo;{comment.text}&rdquo;
                  </p>
                  <p className="text-[10px] text-neutral-400">{comment.timestamp}</p>
                </div>
                <img
                  src={post.media[0]?.url}
                  alt="Post preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Recently Deleted Tab */}
      {activeTab === 'deleted' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900/50">
            Deleted posts stay in your Recently Deleted folder for 30 days before permanent deletion.
          </div>

          {deletedPosts.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Trash2 size={32} className="mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm font-semibold">Trash is empty</p>
              <p className="text-xs text-neutral-500">You have no recently deleted content.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deletedPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.media[0]?.url}
                      alt="Deleted item"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-neutral-950 dark:text-white truncate">
                        {post.caption}
                      </p>
                      <p className="text-[10px] text-neutral-400">Deleted {post.timestamp}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(post.id)}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <RotateCcw size={12} />
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
