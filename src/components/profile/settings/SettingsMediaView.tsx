import React, { useState } from 'react';
import { HardDrive, Wifi, Sparkles, Sliders } from 'lucide-react';

export const SettingsMediaView: React.FC = () => {
  const [highQualityUploads, setHighQualityUploads] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = useState(true);
  const [hdrVideoPlayback, setHdrVideoPlayback] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
      {/* 1. Media Quality */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Media Upload Quality
        </h4>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-950 dark:text-white">
                Upload at highest quality
              </p>
              <p className="text-[11px] text-neutral-500">
                Always upload highest quality photos and videos, even if uploads take longer.
              </p>
            </div>
            <input
              type="checkbox"
              checked={highQualityUploads}
              onChange={(e) => setHighQualityUploads(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
            <div>
              <p className="text-xs font-semibold text-neutral-950 dark:text-white">
                HDR video playback
              </p>
              <p className="text-[11px] text-neutral-500">
                Play HDR videos in full dynamic brightness range.
              </p>
            </div>
            <input
              type="checkbox"
              checked={hdrVideoPlayback}
              onChange={(e) => setHdrVideoPlayback(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {/* 2. Cellular Data */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Cellular Data Usage
        </h4>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-950 dark:text-white">
                Use less mobile data
              </p>
              <p className="text-[11px] text-neutral-500">
                When Data Saver is turned on, videos won&apos;t load in advance to help you use less data.
              </p>
            </div>
            <input
              type="checkbox"
              checked={dataSaver}
              onChange={(e) => setDataSaver(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
            <div>
              <p className="text-xs font-semibold text-neutral-950 dark:text-white">
                Auto-play videos
              </p>
              <p className="text-[11px] text-neutral-500">
                Automatically play reels and video posts while scrolling.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoPlayVideos}
              onChange={(e) => setAutoPlayVideos(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
