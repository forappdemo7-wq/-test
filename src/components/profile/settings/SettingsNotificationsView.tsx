import React, { useState } from 'react';
import { Bell, Moon, MessageCircle, Heart, UserPlus, Check } from 'lucide-react';

export const SettingsNotificationsView: React.FC = () => {
  const [pauseAll, setPauseAll] = useState(false);
  const [pauseDuration, setPauseDuration] = useState('1 hour');
  const [quietMode, setQuietMode] = useState(false);
  const [postsOption, setPostsOption] = useState<'everyone' | 'people_i_follow' | 'off'>('everyone');
  const [followsOption, setFollowsOption] = useState<'on' | 'off'>('on');
  const [messagesOption, setMessagesOption] = useState<'everyone' | 'people_i_follow' | 'off'>('everyone');

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
      {/* 1. Pause All */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-950 dark:text-white">
              Pause all notifications
            </p>
            <p className="text-xs text-neutral-500">Temporarily silence all push notifications</p>
          </div>
          <input
            type="checkbox"
            checked={pauseAll}
            onChange={(e) => setPauseAll(e.target.checked)}
            className="w-5 h-5 accent-blue-500 cursor-pointer"
          />
        </div>

        {pauseAll && (
          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 space-y-1.5">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Duration</p>
            <div className="flex flex-wrap gap-1.5">
              {['15 mins', '1 hour', '2 hours', '4 hours', '8 hours'].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setPauseDuration(dur)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    pauseDuration === dur
                      ? 'bg-blue-500 text-white shadow-xs'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Quiet Mode */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon size={20} className="text-purple-500" />
          <div>
            <p className="text-sm font-semibold text-neutral-950 dark:text-white">Quiet Mode</p>
            <p className="text-xs text-neutral-500">Automatically silence notifications from 11 PM to 7 AM</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={quietMode}
          onChange={(e) => setQuietMode(e.target.checked)}
          className="w-5 h-5 accent-purple-600 cursor-pointer"
        />
      </div>

      {/* 3. Posts, Stories and Comments */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Posts, Stories and Comments
        </h4>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
          <p className="text-xs text-neutral-500">Likes and comments on your media</p>
          {[
            { id: 'everyone', label: 'From Everyone' },
            { id: 'people_i_follow', label: 'From People I Follow' },
            { id: 'off', label: 'Off' },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {item.label}
              </span>
              <input
                type="radio"
                name="posts_notifications"
                checked={postsOption === item.id}
                onChange={() => setPostsOption(item.id as any)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 4. Messages & Calls */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Messages
        </h4>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
          <p className="text-xs text-neutral-500">Direct messages and chat requests</p>
          {[
            { id: 'everyone', label: 'From Everyone' },
            { id: 'people_i_follow', label: 'From People I Follow' },
            { id: 'off', label: 'Off' },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {item.label}
              </span>
              <input
                type="radio"
                name="messages_notifications"
                checked={messagesOption === item.id}
                onChange={() => setMessagesOption(item.id as any)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
