import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  X,
  UserCheck,
  UserPlus,
  UserX,
  Send,
  Grid,
  Clapperboard,
  Bookmark,
  Link as LinkIcon,
  Check,
  ShieldAlert,
  Lock,
  Clock,
  Star,
  ShieldCheck,
  MoreVertical,
} from 'lucide-react';
import { User, Post, Reel } from '../../types';
import { useApp } from '../../context/AppContext';
import { StoryRing } from '../stories/StoryRing';
import { getDeterministicChatId } from '../../lib/firestoreChat';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const {
    currentUser,
    posts,
    reels,
    stories,
    toggleFollowUser,
    openFollowersModal,
    openFollowingModal,
    setSelectedPostForDetail,
    setActiveReelIndex,
    setActiveTab,
    openChatWithUser,
    openStoryViewer,
    blockedUserIds,
    blockUser,
    unblockUser,
    closeFriendIds,
    toggleCloseFriend,
    restrictedUserIds,
    restrictUser,
    unrestrictUser,
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<'grid' | 'reels'>('grid');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProcessingBlock, setIsProcessingBlock] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  if (!user) return null;

  const isCurrentUser = currentUser ? user.id === currentUser.id : false;
  const isBlocked = blockedUserIds.includes(user.id);
  const isCloseFriend = closeFriendIds.includes(user.id);
  const isRestricted = restrictedUserIds.includes(user.id);
  const isPrivateAccount = Boolean(user.isPrivate) && !isCurrentUser && !user.isFollowing;
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const userReels = reels.filter((r) => r.author.id === user.id);
  const userStoryIndex = stories.findIndex((s) => s.userId === user.id);

  const handleMessage = () => {
    if (!user.isFollowing || !user.isFollowedBy) {
      toast.error('You can only message users that you mutually follow.');
      return;
    }
    onClose();
    openChatWithUser(user);
  };

  const handleToggleBlock = async () => {
    setIsProcessingBlock(true);
    try {
      if (isBlocked) {
        await unblockUser(user.id);
        toast.success(`Unblocked @${user.username}`);
      } else {
        await blockUser(user.id);
        toast.success(`Blocked @${user.username}`);
        onClose();
      }
    } catch (err) {
      console.error('Failed to toggle block:', err);
    } finally {
      setIsProcessingBlock(false);
    }
  };

  const handleToggleCloseFriend = async () => {
    const next = await toggleCloseFriend(user.id);
    if (next) {
      toast.success(`Added @${user.username} to Close Friends`, { icon: '⭐' });
    } else {
      toast(`Removed @${user.username} from Close Friends`, { icon: '⭐' });
    }
  };

  const handleToggleRestrict = async () => {
    if (isRestricted) {
      await unrestrictUser(user.id);
      toast.success(`Unrestricted @${user.username}`);
    } else {
      await restrictUser(user.id);
      toast.success(`Restricted @${user.username}. Their comments will require approval.`);
    }
    setShowOptionsMenu(false);
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}?user=${user.username}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {user.isPrivate && (
              <Lock size={14} className="text-slate-500 dark:text-neutral-400 flex-shrink-0" />
            )}
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
              {user.username}
            </span>
            {user.isVerified && (
              <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                ✓
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
          {/* Header row with Avatar + stats */}
          <div className="flex items-center justify-between gap-6">
            <div className="relative flex-shrink-0 cursor-pointer">
              <StoryRing
                avatar={user.avatar}
                username={user.username}
                hasUnseen={!isPrivateAccount && userStoryIndex >= 0 ? stories[userStoryIndex].hasUnseen : false}
                size="lg"
                onClick={() => {
                  if (isPrivateAccount) {
                    toast('This account is private. Follow them to see their stories.', { icon: '🔒' });
                    return;
                  }
                  if (userStoryIndex >= 0 && stories[userStoryIndex].items.length > 0) {
                    onClose();
                    openStoryViewer(userStoryIndex);
                  }
                }}
              />
            </div>

            <div className="flex-1 flex items-center justify-around text-center">
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {user.postsCount !== undefined ? user.postsCount : userPosts.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-neutral-400">posts</span>
              </div>

              <button
                onClick={() => {
                  if (isPrivateAccount) {
                    toast('Follow this account to see their followers.', { icon: '🔒' });
                    return;
                  }
                  onClose();
                  openFollowersModal(user.id);
                }}
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {user.followersCount >= 10000
                    ? `${(user.followersCount / 1000).toFixed(1)}k`
                    : (user.followersCount || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 dark:text-neutral-400">followers</span>
              </button>

              <button
                onClick={() => {
                  if (isPrivateAccount) {
                    toast('Follow this account to see who they follow.', { icon: '🔒' });
                    return;
                  }
                  onClose();
                  openFollowingModal(user.id);
                }}
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {(user.followingCount || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 dark:text-neutral-400">following</span>
              </button>
            </div>
          </div>

          {/* User Bio & Details */}
          <div className="space-y-1 text-left">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</h2>
            {user.bio && (
              <p className="text-xs text-slate-700 dark:text-neutral-200 whitespace-pre-line leading-relaxed">
                {user.bio}
              </p>
            )}
            {user.website && (
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
              >
                <LinkIcon size={12} className="rotate-45" />
                <span>{user.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 relative">
            {!isCurrentUser ? (
              <>
                <button
                  onClick={() => toggleFollowUser(user.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                    user.isFollowing
                      ? 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700'
                      : user.hasRequestedFollow
                      ? 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-300 dark:border-neutral-700'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck size={15} /> Following
                    </>
                  ) : user.hasRequestedFollow ? (
                    <>
                      <Clock size={15} /> Requested
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} /> Follow
                    </>
                  )}
                </button>
                <button
                  onClick={handleMessage}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send size={14} /> Message
                </button>

                {/* Close Friends Toggle */}
                <button
                  onClick={handleToggleCloseFriend}
                  className={`p-2 rounded-xl transition-colors cursor-pointer flex-shrink-0 ${
                    isCloseFriend
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-600 hover:text-emerald-600 dark:text-neutral-300'
                  }`}
                  title={isCloseFriend ? 'Remove from Close Friends' : 'Add to Close Friends'}
                >
                  <Star size={16} className={isCloseFriend ? 'fill-emerald-500 text-emerald-500' : ''} />
                </button>
              </>
            ) : null}

            <button
              onClick={handleShareProfile}
              className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer flex-shrink-0"
              title="Share profile link"
            >
              {copiedLink ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
            </button>

            {!isCurrentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer flex-shrink-0"
                  title="More options"
                >
                  <MoreVertical size={16} />
                </button>

                {showOptionsMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-xl overflow-hidden py-1 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={handleToggleRestrict}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-700/60 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldAlert size={14} className={isRestricted ? 'text-amber-500' : 'text-slate-400'} />
                      <span>{isRestricted ? 'Unrestrict' : 'Restrict'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        handleToggleBlock();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-neutral-700"
                    >
                      <UserX size={14} />
                      <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Badges row if account is restricted or in close friends */}
          {(isCloseFriend || isRestricted) && !isCurrentUser && (
            <div className="flex items-center gap-2 pt-0.5">
              {isCloseFriend && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                  <Star size={11} className="fill-emerald-500 text-emerald-500" /> Close Friends
                </span>
              )}
              {isRestricted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-200 dark:border-amber-800">
                  <ShieldAlert size={11} /> Restricted
                </span>
              )}
            </div>
          )}

          {/* Conditional rendering: If Account is Private & not followed, show Lock message */}
          {isPrivateAccount ? (
            <div className="py-14 px-6 text-center flex flex-col items-center justify-center space-y-3 border-t border-slate-100 dark:border-neutral-800">
              <div className="w-16 h-16 rounded-full border-2 border-slate-900 dark:border-white flex items-center justify-center text-slate-900 dark:text-white mb-1">
                <Lock size={28} />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                This Account is Private
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                Follow this account to see their photos and videos.
              </p>
            </div>
          ) : (
            <>
              {/* Tab Navigation (Posts / Reels) */}
              <div className="flex items-center justify-around border-t border-slate-100 dark:border-neutral-800 pt-3">
                <button
                  onClick={() => setActiveTabLocal('grid')}
                  className={`flex items-center gap-2 pb-2 text-xs font-bold tracking-wider transition-colors cursor-pointer border-b-2 ${
                    activeTab === 'grid'
                      ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300'
                  }`}
                >
                  <Grid size={15} /> POSTS ({userPosts.length})
                </button>
                <button
                  onClick={() => setActiveTabLocal('reels')}
                  className={`flex items-center gap-2 pb-2 text-xs font-bold tracking-wider transition-colors cursor-pointer border-b-2 ${
                    activeTab === 'reels'
                      ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300'
                  }`}
                >
                  <Clapperboard size={15} /> REELS ({userReels.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'grid' ? (
                userPosts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">No posts yet</div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {userPosts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          setSelectedPostForDetail(p);
                        }}
                        className="relative aspect-square group bg-slate-100 dark:bg-neutral-800 overflow-hidden cursor-pointer rounded-lg"
                      >
                        <img
                          src={p.media[0]?.url}
                          alt={p.caption || 'User post'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : userReels.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No reels yet</div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {userReels.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        const rIdx = reels.findIndex((rel) => rel.id === r.id);
                        if (rIdx >= 0) {
                          setActiveReelIndex(rIdx);
                        }
                        onClose();
                        setActiveTab('reels');
                      }}
                      className="relative aspect-[9/16] group bg-slate-100 dark:bg-neutral-800 overflow-hidden cursor-pointer rounded-lg"
                    >
                      <img
                        src={r.posterUrl || r.videoUrl}
                        alt="Reel preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[10px] font-semibold drop-shadow-md">
                        <Clapperboard size={12} />
                        <span>{r.likesCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
