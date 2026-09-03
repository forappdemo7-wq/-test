import React, { useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Music,
  Sparkles,
  Share2,
  Trash2,
  UserCheck,
  UserPlus,
  Clock,
  Link,
  MapPin,
  Smile,
  Disc,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Post, Comment } from '../../types';
import { useApp } from '../../context/AppContext';
import { DoubleTapHeart } from './DoubleTapHeart';
import { StoryRing } from '../stories/StoryRing';
import { ProgressiveImage } from './ProgressiveImage';
import { FeedVideoPlayer } from './FeedVideoPlayer';
import { POPULAR_SOUNDTRACKS } from '../../data/trendingAudio';

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

const PostCardComponent: React.FC<PostCardProps> = ({ post }) => {
  const {
    currentUser,
    toggleLikePost,
    toggleSavePost,
    addComment,
    toggleLikeComment,
    deletePost,
    setActiveCommentsPost,
    setActiveSharePost,
    openStoryViewer,
    stories,
    toggleFollowUser,
    celebrateAction,
    setSelectedUserProfile,
  } = useApp();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isExpandedCaption, setIsExpandedCaption] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [suggestedComments, setSuggestedComments] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const postAudioRef = useRef<HTMLAudioElement | null>(null);

  const togglePostAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.musicTrack) return;

    if (isPlayingAudio) {
      if (postAudioRef.current) postAudioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    const matchingTrack = POPULAR_SOUNDTRACKS.find(
      (t) =>
        t.title.toLowerCase() === post.musicTrack?.title.toLowerCase() ||
        post.musicTrack?.title.toLowerCase().includes(t.title.toLowerCase())
    );

    const soundUrl =
      matchingTrack?.audioUrl ||
      'https://actions.google.com/sounds/v1/musical_instruments/funky_synth_bass.ogg';

    if (postAudioRef.current) postAudioRef.current.pause();

    const audio = new Audio(soundUrl);
    audio.volume = 0.6;
    audio.play().catch((err) => console.warn('Audio playback error:', err));
    audio.onended = () => setIsPlayingAudio(false);
    postAudioRef.current = audio;
    setIsPlayingAudio(true);
  };

  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = () => {
    if (!post.isLiked) {
      toggleLikePost(post.id);
    }
    setShowHeartAnim(true);
    celebrateAction();
    setTimeout(() => setShowHeartAnim(false), 850);
  };

  const handleFetchSmartComments = async () => {
    if (suggestedComments.length > 0) {
      setSuggestedComments([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch('/api/gemini/suggest-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postCaption: post.caption,
          postTopic: post.location || 'Lifestyle',
        }),
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestedComments(data.suggestions);
      } else {
        setSuggestedComments(['Amazing shot! 🔥', 'Love this aesthetic ✨', 'Incredible vibe! 📸']);
      }
    } catch {
      setSuggestedComments(['Amazing shot! 🔥', 'Love this vibe ✨', 'Incredible lighting! 📸']);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedToast(true);
    setIsMenuOpen(false);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const authorStoryIndex = stories.findIndex((s) => s.userId === post.author.id);
  const currentMedia = post.media[currentMediaIndex] || { url: '', aspectRatio: 'square' };
  const isVideo =
    currentMedia.url.endsWith('.mp4') ||
    currentMedia.url.includes('/video/') ||
    (currentMedia as any).type === 'video';

  const quickEmojis = ['❤️', '🔥', '👏', '😍', '✨', '🙌', '💯', '🥂'];

  return (
    <article className="w-full bg-white dark:bg-neutral-900 sm:rounded-3xl border-b sm:border border-neutral-200/80 dark:border-neutral-800/80 mb-4 overflow-hidden shadow-soft transition-colors select-none">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => {
              if (authorStoryIndex >= 0) {
                openStoryViewer(authorStoryIndex);
              }
            }}
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <StoryRing
              avatar={post.author.avatar}
              username={post.author.username}
              hasUnseen={authorStoryIndex >= 0 ? stories[authorStoryIndex].hasUnseen : false}
              isCloseFriend={
                authorStoryIndex >= 0
                  ? Boolean(
                      stories[authorStoryIndex].hasCloseFriends ||
                        stories[authorStoryIndex].items.some((it) => it.isCloseFriends)
                    )
                  : false
              }
              size="sm"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-tight flex-wrap">
              <span
                onClick={() => setSelectedUserProfile(post.author)}
                className="text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:underline cursor-pointer truncate"
              >
                {post.author.username}
              </span>
              {post.author.isVerified && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] flex-shrink-0 shadow-soft-xs">
                  ✓
                </span>
              )}
              {post.author.id !== currentUser?.id && (
                <>
                  <span className="text-xs text-neutral-400">•</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowUser(post.author.id);
                    }}
                    className={`text-xs font-semibold cursor-pointer transition-colors active:scale-95 ${
                      post.author.isFollowing || post.author.hasRequestedFollow
                        ? 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                        : 'text-blue-500 hover:text-blue-700 font-bold'
                    }`}
                  >
                    {post.author.isFollowing
                      ? 'Following'
                      : post.author.hasRequestedFollow
                      ? 'Requested'
                      : 'Follow'}
                  </button>
                </>
              )}
              <span className="text-xs text-neutral-400">• {post.timestamp}</span>
            </div>
            {post.location && (
              <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                <MapPin size={11} className="text-neutral-400 flex-shrink-0" />
                <span className="truncate">{post.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Options Menu Button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-90 cursor-pointer"
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Options Dropdown */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="absolute right-0 mt-1 w-52 bg-white dark:bg-neutral-800 rounded-2xl shadow-soft-lg border border-neutral-200/80 dark:border-neutral-700/80 py-1.5 z-30 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setActiveSharePost(post);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left cursor-pointer"
                >
                  <Share2 size={16} /> Share Post
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left cursor-pointer"
                >
                  <Link size={16} /> Copy Link
                </button>
                {post.author.id !== currentUser?.id && (
                  <button
                    onClick={() => {
                      toggleFollowUser(post.author.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left cursor-pointer"
                  >
                    {post.author.isFollowing ? (
                      <>
                        <UserCheck size={16} className="text-neutral-400" /> Unfollow
                      </>
                    ) : post.author.hasRequestedFollow ? (
                      <>
                        <Clock size={16} className="text-neutral-400" /> Cancel Request
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="text-blue-500" /> Follow Creator
                      </>
                    )}
                  </button>
                )}
                {currentUser?.id && post.author.id === currentUser.id && (
                  <button
                    onClick={() => {
                      deletePost(post.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left border-t border-neutral-100 dark:border-neutral-700/60 cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete Post
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Media Carousel / Video Player Canvas */}
      <div className="relative w-full overflow-hidden">
        {isVideo ? (
          <FeedVideoPlayer
            videoUrl={currentMedia.url}
            filter={currentMedia.filter}
            aspectRatio={currentMedia.aspectRatio || 'square'}
            onDoubleTap={handleDoubleTap}
          />
        ) : (
          <div
            onClick={() => {
              const now = Date.now();
              const DOUBLE_TAP_DELAY = 280;
              if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
                handleDoubleTap();
                lastTapRef.current = 0;
                return;
              }
              lastTapRef.current = now;
            }}
            className="cursor-pointer select-none relative"
          >
            <ProgressiveImage
              src={currentMedia.url}
              alt={`Post by ${post.author.username}`}
              filter={currentMedia.filter}
              aspectRatio={currentMedia.aspectRatio || 'square'}
            />
          </div>
        )}

        {/* Double Tap Floating Heart Burst */}
        <DoubleTapHeart show={showHeartAnim} />

        {/* Carousel Prev/Next Buttons */}
        {post.media.length > 1 && (
          <>
            {currentMediaIndex > 0 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev - 1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all z-10 shadow-soft"
              >
                <ChevronLeft size={20} />
              </motion.button>
            )}
            {currentMediaIndex < post.media.length - 1 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev + 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all z-10 shadow-soft"
              >
                <ChevronRight size={20} />
              </motion.button>
            )}

            {/* Carousel Counter Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/65 text-white text-xs font-semibold backdrop-blur-md shadow-soft-sm">
              {currentMediaIndex + 1}/{post.media.length}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Heart / Like Button with Spring Micro-Bounce */}
            <motion.button
              whileTap={{ scale: 0.75 }}
              animate={post.isLiked ? { scale: [1, 1.35, 0.95, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              onClick={() => toggleLikePost(post.id)}
              className="group focus:outline-none cursor-pointer"
              title={post.isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                size={26}
                className={`transition-colors duration-150 ${
                  post.isLiked
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-neutral-800 dark:text-neutral-200 group-hover:text-rose-500'
                }`}
              />
            </motion.button>

            {/* Comment Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setActiveCommentsPost(post)}
              className="text-neutral-800 dark:text-neutral-200 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors cursor-pointer"
              title="Comment"
            >
              <MessageCircle size={25} />
            </motion.button>

            {/* Share to Direct Messages Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setActiveSharePost(post)}
              className="text-neutral-800 dark:text-neutral-200 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors cursor-pointer"
              title="Share"
            >
              <Send size={24} />
            </motion.button>
          </div>

          {/* Carousel Dots */}
          {post.media.length > 1 && (
            <div className="flex items-center gap-1.5">
              {post.media.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentMediaIndex
                      ? 'w-4 bg-blue-500'
                      : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Bookmark / Save Button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            animate={post.isSaved ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            onClick={() => toggleSavePost(post.id)}
            className="text-neutral-800 dark:text-neutral-200 hover:text-neutral-500 transition-colors cursor-pointer"
            title={post.isSaved ? 'Remove from Saved' : 'Save'}
          >
            <Bookmark
              size={25}
              className={post.isSaved ? 'text-neutral-900 dark:text-white fill-neutral-900 dark:fill-white' : ''}
            />
          </motion.button>
        </div>

        {/* Likes Count */}
        <div className="mt-2.5 font-bold text-sm text-neutral-900 dark:text-neutral-100">
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Music Track (if attached with Instagram Vinyl Sticker & Play toggle) */}
        {post.musicTrack && (
          <button
            type="button"
            onClick={togglePostAudio}
            className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border transition-all mt-1 cursor-pointer select-none max-w-fit ${
              isPlayingAudio
                ? 'bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400 font-semibold'
                : 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Disc
              size={14}
              className={`text-pink-500 ${isPlayingAudio ? 'animate-spin' : ''}`}
            />
            <span className="truncate max-w-[220px]">
              {post.musicTrack.title} • {post.musicTrack.artist}
            </span>
            {isPlayingAudio ? (
              <Volume2 size={13} className="text-pink-500 animate-pulse flex-shrink-0" />
            ) : (
              <VolumeX size={13} className="text-neutral-400 flex-shrink-0" />
            )}
          </button>
        )}

        {/* Caption */}
        <div className="mt-1.5 text-sm text-neutral-800 dark:text-neutral-200 leading-snug">
          <span
            onClick={() => setSelectedUserProfile(post.author)}
            className="font-bold mr-2 text-neutral-950 dark:text-white cursor-pointer hover:underline"
          >
            {post.author.username}
          </span>
          <span className="whitespace-pre-line">
            {isExpandedCaption || post.caption.length <= 110
              ? post.caption
              : `${post.caption.slice(0, 110)}...`}
          </span>
          {post.caption.length > 110 && !isExpandedCaption && (
            <button
              onClick={() => setIsExpandedCaption(true)}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-semibold ml-1.5 cursor-pointer"
            >
              more
            </button>
          )}
        </div>

        {/* Tags if present */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Inline Top 2 Comments Preview */}
        {post.comments && post.comments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {post.comments.slice(0, 2).map((c: Comment) => (
              <div key={c.id} className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
                <p className="truncate pr-2">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 mr-1.5">
                    {c.username}
                  </span>
                  {c.text}
                </p>
                <button
                  onClick={() => toggleLikeComment(post.id, c.id)}
                  className="text-neutral-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer flex-shrink-0"
                >
                  <Heart
                    size={12}
                    className={c.isLiked ? 'text-rose-500 fill-rose-500' : ''}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* View all comments button */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => setActiveCommentsPost(post)}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 mt-1.5 block font-medium cursor-pointer"
          >
            View all {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* AI Smart Comment Suggestions Bar */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={handleFetchSmartComments}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 text-pink-600 dark:text-pink-400 text-xs font-semibold border border-pink-500/20 flex-shrink-0 transition-all cursor-pointer active:scale-95"
            title="Generate AI Comment Ideas with Gemini"
          >
            <Sparkles size={12} className={isLoadingSuggestions ? 'animate-spin' : ''} />
            {suggestedComments.length > 0 ? 'Hide suggestions' : 'AI Ideas'}
          </button>

          {suggestedComments.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => {
                addComment(post.id, sug);
                setSuggestedComments([]);
              }}
              className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-neutral-700 dark:text-neutral-300 hover:text-pink-600 text-xs flex-shrink-0 border border-neutral-200/80 dark:border-neutral-700/80 transition-all font-medium cursor-pointer active:scale-95 shadow-soft-xs"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Quick Emoji Bar (Collapsible / Toggleable) */}
        {showEmojiPicker && (
          <div className="flex items-center gap-2 pt-2 text-lg overflow-x-auto no-scrollbar">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setCommentInput((prev) => prev + emoji)}
                className="hover:scale-125 transition-transform cursor-pointer active:scale-95 p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Quick Inline Comment Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (commentInput.trim()) {
              addComment(post.id, commentInput);
              setCommentInput('');
              setShowEmojiPicker(false);
            }
          }}
          className="flex items-center gap-2.5 pt-3 pb-1.5 border-t border-neutral-100 dark:border-neutral-800/80 mt-2.5"
        >
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser?.name || currentUser?.username || 'User'}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
          />
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Add a comment..."
            className="w-full text-xs sm:text-sm bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1 cursor-pointer"
          >
            <Smile size={16} />
          </button>

          {commentInput.trim() && (
            <button
              type="submit"
              className="text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors cursor-pointer active:scale-95"
            >
              Post
            </button>
          )}
        </form>
      </div>

      {/* Link Copied Toast */}
      {copiedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-xs px-4 py-2 rounded-full shadow-soft-lg backdrop-blur-md z-50 animate-in fade-in duration-200">
          Link copied to clipboard ✨
        </div>
      )}
    </article>
  );
};

// Memoized export for optimal list rendering speed with thousands of items
export const PostCard = memo(PostCardComponent, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.isLiked === next.post.isLiked &&
    prev.post.isSaved === next.post.isSaved &&
    prev.post.likesCount === next.post.likesCount &&
    prev.post.commentsCount === next.post.commentsCount &&
    prev.post.author.isFollowing === next.post.author.isFollowing &&
    prev.post.comments.length === next.post.comments.length
  );
});
