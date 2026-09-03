import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Post,
  StoryGroup,
  Reel,
  ReelWatchHistoryItem,
  ChatThread,
  DirectMessage,
  AppNotification,
  TabType,
  Comment,
  PostMedia,
  ChatTheme,
  UserSession,
  TrustedDevice,
  LoginActivityLog,
  SuspiciousLoginAlert,
  TwoFactorConfig,
} from '../types';
import confetti from 'canvas-confetti';
import {
  storeAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredSessionId,
  clearAuthSession,
  getClientDeviceInfo,
  registerPasskeyOnDevice,
  authenticateWithPasskey,
} from '../lib/authClient';
import {
  syncUserToFirestore,
  listenToFirestoreUsers,
  listenToUserChats,
  sendMessageToFirestore,
  deleteMessageFromFirestore,
  deleteMessageForEveryoneInFirestore,
  reactToMessageWithEmojiInFirestore,
  updateUserNoteInFirestore,
  getDeterministicChatId,
  setTypingStatusInFirestore,
  updateChatThemeInFirestore,
  markChatAsSeenInFirestore,
  blockUserInFirestore,
  unblockUserInFirestore,
  listenToBlockedUsers,
} from '../lib/firestoreChat';
import {
  listenToUserNotifications,
  setNotificationReadInFirestore,
  markAllNotificationsReadInFirestore,
  deleteNotificationFromFirestore,
} from '../lib/firestoreNotifications';

interface SignUpData {
  username: string;
  name: string;
  email?: string;
  password: string;
  bio?: string;
  avatar?: string;
  website?: string;
  pronouns?: string;
}

const DEFAULT_GUEST_USER: User = {
  id: 'guest_user',
  username: 'guest',
  name: 'Welcome Guest',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  bio: 'Sign in or create an account to start sharing posts and connecting! ✨',
  website: '',
  pronouns: '',
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  isVerified: false,
};

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  savedAccounts: User[];
  removeSavedAccount: (userId: string) => void;
  switchProfile: (user: User) => void;
  updateProfile: (updated: Partial<User>) => Promise<void>;
  availableProfiles: User[];

  // Authentication & Security Methods
  signIn: (identifier: string, password: string, rememberMe?: boolean) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    requires2Fa?: boolean;
    tempToken?: string;
    method?: string;
    isSuspicious?: boolean;
    suspicionAlert?: SuspiciousLoginAlert;
  }>;
  signUp: (data: SignUpData, rememberMe?: boolean) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    emailVerificationCode?: string;
  }>;
  signInWithGoogle: (payload: { email: string; name: string; avatar?: string; googleId?: string }, rememberMe?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  signInWithApple: (payload: { email?: string; name?: string; appleUserId?: string }, rememberMe?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  signInWithPasskey: (rememberMe?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  registerPasskey: () => Promise<{ success: boolean; error?: string }>;
  verify2FALogin: (tempToken: string, code: string, isBackupCode?: boolean, rememberMe?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: (options?: { allDevices?: boolean }) => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<{ success: boolean; message?: string; email?: string; debugCode?: string; error?: string }>;
  verifyPasswordReset: (identifier: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  sendEmailVerification: (email?: string) => Promise<{ success: boolean; debugCode?: string; error?: string }>;
  confirmEmailVerification: (code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Security State & Management
  activeSessions: UserSession[];
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  logoutAllOtherSessions: () => Promise<void>;
  trustedDevices: TrustedDevice[];
  fetchTrustedDevices: () => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
  renameDevice: (deviceId: string, newName: string) => Promise<void>;
  securityLogs: LoginActivityLog[];
  fetchSecurityLogs: () => Promise<void>;
  setup2FA: () => Promise<{ success: boolean; secret?: string; qrCodeUrl?: string; backupCodes?: string[]; error?: string }>;
  enable2FA: (code: string, secret: string, backupCodes: string[]) => Promise<{ success: boolean; error?: string }>;
  disable2FA: (password: string) => Promise<{ success: boolean; error?: string }>;
  suspiciousAlert: SuspiciousLoginAlert | null;
  dismissSuspiciousAlert: () => void;
  resolveSuspiciousAlert: (action: 'confirm_me' | 'lock_and_secure') => Promise<void>;

  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup' | 'forgot_password' | 'verify_email' | '2fa_challenge' | 'passkey';
  setAuthModalMode: (mode: 'signin' | 'signup' | 'forgot_password' | 'verify_email' | '2fa_challenge' | 'passkey') => void;
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot_password' | 'verify_email' | '2fa_challenge' | 'passkey') => void;

  // Feed Posts
  posts: Post[];
  savedPostIds: string[];
  toggleLikePost: (postId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  toggleLikeComment: (postId: string, commentId: string) => void;
  createNewPost: (post: {
    media: PostMedia[];
    caption: string;
    location?: string;
    tags?: string[];
    musicTrack?: { title: string; artist: string };
  }) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  // Stories
  stories: StoryGroup[];
  setStories: React.Dispatch<React.SetStateAction<StoryGroup[]>>;
  activeStoryGroupIndex: number | null;
  openStoryViewer: (index: number) => void;
  closeStoryViewer: () => void;
  nextStoryGroup: () => void;
  prevStoryGroup: () => void;
  markStorySeen: (userId: string, storyId: string) => void;
  addNewStory: (storyItem: { mediaUrl: string; caption?: string; filter?: any }) => Promise<void>;
  toggleLikeStory: (storyId: string) => Promise<boolean>;
  deleteStory: (storyId: string) => Promise<void>;

  // Reels
  reels: Reel[];
  toggleLikeReel: (reelId: string) => Promise<void>;
  toggleSaveReel: (reelId: string) => Promise<void>;
  createNewReel: (reelData: {
    videoUrl: string;
    posterUrl?: string;
    caption?: string;
    musicTrack?: { title: string; artist: string };
    tags?: string[];
    duration?: number;
  }) => Promise<void>;
  activeReelIndex: number;
  setActiveReelIndex: (index: number) => void;
  reelCategory: 'for_you' | 'following' | 'trending' | 'saved';
  setReelCategory: (cat: 'for_you' | 'following' | 'trending' | 'saved') => void;
  recordReelWatch: (reelId: string, durationSecs: number, progressPercent: number) => Promise<void>;
  watchHistory: ReelWatchHistoryItem[];
  fetchWatchHistory: () => Promise<void>;
  clearWatchHistory: () => Promise<void>;
  loadMoreReels: () => Promise<void>;
  isLoadingReels: boolean;
  hasMoreReels: boolean;

  // Direct Messages
  threads: ChatThread[];
  activeThreadId: string | null;
  setActiveThreadId: (threadId: string | null) => void;
  activeChatUser: User | null;
  setActiveChatUser: (user: User | null) => void;
  openChatWithUser: (user: User) => void;
  markThreadAsSeen: (threadId: string) => Promise<void>;
  sendMessage: (
    threadId: string,
    text: string,
    mediaUrl?: string,
    isAudio?: boolean,
    audioUrl?: string,
    audioDuration?: number,
    options?: {
      mediaType?: 'image' | 'video' | 'audio' | 'gif';
      videoUrl?: string;
      videoDuration?: number;
      videoThumbnail?: string;
      isSticker?: boolean;
      stickerUrl?: string;
      isGif?: boolean;
      gifUrl?: string;
      replyTo?: any;
      sharedPost?: any;
      isVanish?: boolean;
    }
  ) => Promise<void>;
  deleteMessage: (threadId: string, messageId: string) => Promise<void>;
  updateUserNote: (text: string, emoji?: string) => void;
  updateChatTheme: (threadId: string, theme: ChatTheme) => Promise<void>;
  moveThreadCategory: (threadId: string, category: 'primary' | 'general' | 'requests') => void;
  toggleMuteThread: (threadId: string) => void;
  togglePinThread: (threadId: string) => void;
  pinnedThreadIds: string[];
  reactToMessage: (threadId: string, messageId: string, emoji: string) => Promise<void>;
  deleteMessageForEveryone: (threadId: string, messageId: string) => Promise<void>;
  isUserOnline: (userId: string) => boolean;
  onlineUserIds: string[];
  
  // Push Notifications & In-App Toast
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<void>;
  inAppMessageToast: { threadId: string; sender: User; message: DirectMessage } | null;
  dismissInAppToast: () => void;
  sendInAppToastReply: (threadId: string, text: string) => Promise<void>;

  // Blocked Users
  blockedUserIds: string[];
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => boolean;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => Promise<void>;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;

  // Navigation & Tabs
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openPostDetail: (postId: string) => void;

  // Dark Mode
  isDark: boolean;
  toggleDarkMode: () => void;

  // Modals & Overlays
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  selectedPostForDetail: Post | null;
  setSelectedPostForDetail: (post: Post | null) => void;
  activeCommentsPost: Post | null;
  setActiveCommentsPost: (post: Post | null) => void;
  activeSharePost: Post | null;
  setActiveSharePost: (post: Post | null) => void;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;
  userListModal: { title: string; users: User[] } | null;
  setUserListModal: (data: { title: string; users: User[] } | null) => void;
  selectedUserProfile: User | null;
  setSelectedUserProfile: (user: User | null) => void;
  openFollowersModal: (userId: string) => Promise<void>;
  openFollowingModal: (userId: string) => Promise<void>;

  // Explore selection
  openExplorePost: (postData: any) => void;

  // Follow / Unfollow
  toggleFollowUser: (userId: string) => Promise<void>;
  celebrateAction: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('instavibe_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id && u.id !== 'guest_user') return u;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const isAuthenticated = Boolean(currentUser && currentUser.id && currentUser.id !== 'guest_user');

  const [savedAccounts, setSavedAccounts] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('instavibe_saved_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((u) => u && u.id && u.id !== 'guest_user');
      }
    } catch {}
    const initialSaved: User[] = [];
    try {
      const single = localStorage.getItem('instavibe_user');
      if (single) {
        const u = JSON.parse(single);
        if (u && u.id && u.id !== 'guest_user') initialSaved.push(u);
      }
    } catch {}
    return initialSaved;
  });

  const [availableProfiles, setAvailableProfiles] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [reelCategory, setReelCategory] = useState<'for_you' | 'following' | 'trending' | 'saved'>('for_you');
  const [watchHistory, setWatchHistory] = useState<ReelWatchHistoryItem[]>([]);
  const [isLoadingReels, setIsLoadingReels] = useState(false);
  const [hasMoreReels, setHasMoreReels] = useState(true);
  const [reelsPage, setReelsPage] = useState(1);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('instavibe_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u && u.id && u.id !== 'guest_user') {
          const savedBlocked = localStorage.getItem(`instavibe_blocked_users_${u.id}`);
          if (savedBlocked) return JSON.parse(savedBlocked);
          return u.blockedUserIds || [];
        }
      }
    } catch {}
    return [];
  });

  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('instavibe_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u && u.id && u.id !== 'guest_user') {
          const savedPinned = localStorage.getItem(`instavibe_pinned_threads_${u.id}`);
          if (savedPinned) return JSON.parse(savedPinned);
        }
      }
    } catch {}
    return [];
  });

  // Real-time online users list
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Push Notifications state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // In-app message toast banner
  const [inAppMessageToast, setInAppMessageToast] = useState<{
    threadId: string;
    sender: User;
    message: DirectMessage;
  } | null>(null);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          try {
            new Notification('InstaVibe Notifications Enabled', {
              body: 'You will receive notifications for direct messages and interactions.',
              icon: '/favicon.ico',
            });
          } catch {}
        }
      } catch (e) {
        console.warn('Could not request notification permission:', e);
      }
    }
  };

  const dismissInAppToast = () => {
    setInAppMessageToast(null);
  };

  const isUserOnline = (userId: string): boolean => {
    if (!userId) return false;
    return onlineUserIds.includes(userId) || (Boolean(currentUser?.id) && userId === currentUser?.id);
  };

  const togglePinThread = (threadId: string) => {
    setPinnedThreadIds((prev) => {
      const next = prev.includes(threadId)
        ? prev.filter((id) => id !== threadId)
        : [threadId, ...prev];
      try {
        if (currentUser?.id && currentUser.id !== 'guest_user') {
          localStorage.setItem(`instavibe_pinned_threads_${currentUser.id}`, JSON.stringify(next));
        }
      } catch {}
      return next;
    });

    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, isPinned: !t.isPinned } : t))
    );
  };
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);

  const openChatWithUser = (targetUser: User) => {
    if (!targetUser || !currentUser?.id) return;
    const chatId = getDeterministicChatId(currentUser.id, targetUser.id);

    setThreads((prev) => {
      const existing = prev.find((t) => t.id === chatId || t.participant.id === targetUser.id);
      if (existing) {
        return prev.map((t) => (t.id === existing.id ? { ...t, unreadCount: 0 } : t));
      }
      const newThread: ChatThread = {
        id: chatId,
        participant: targetUser,
        lastMessage: '',
        lastMessageTime: 'Just now',
        unreadCount: 0,
        messages: [],
        category: 'primary',
      };
      return [newThread, ...prev];
    });

    setActiveChatUser(targetUser);
    setActiveThreadId(chatId);
    markThreadAsSeen(chatId);
    setSelectedUserProfile(null);
    setActiveTab('messages');
  };

  useEffect(() => {
    if (activeThreadId) {
      markThreadAsSeen(activeThreadId);
    }
  }, [activeThreadId]);

  // Helper to persist saved accounts for multi-account switching
  const persistSavedAccount = (user: User) => {
    if (!user || !user.id || user.id === 'guest_user') return;
    setSavedAccounts((prev) => {
      const filtered = prev.filter((u) => u.id !== user.id);
      const updated = [user, ...filtered];
      try {
        localStorage.setItem('instavibe_saved_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeSavedAccount = (userId: string) => {
    setSavedAccounts((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem('instavibe_saved_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Auth Modals & Security State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<
    'signin' | 'signup' | 'forgot_password' | 'verify_email' | '2fa_challenge' | 'passkey'
  >('signin');
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [securityLogs, setSecurityLogs] = useState<LoginActivityLog[]>([]);
  const [suspiciousAlert, setSuspiciousAlert] = useState<SuspiciousLoginAlert | null>(null);

  const openAuthModal = (
    mode: 'signin' | 'signup' | 'forgot_password' | 'verify_email' | '2fa_challenge' | 'passkey' = 'signin'
  ) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const dismissSuspiciousAlert = () => {
    setSuspiciousAlert(null);
  };

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<Post | null>(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState<Post | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<Post | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [userListModal, setUserListModal] = useState<{ title: string; users: User[] } | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);

  const celebrateAction = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f09433', '#dc2743', '#bc1888', '#833ab4'],
      });
    } catch {
      // ignore
    }
  };

  // Safe JSON parser helper to prevent '<!doctype...' HTML parsing crashes
  const safeJson = async (res: Response) => {
    try {
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  };

  const safeFetchJson = async (url: string, retries = 2, delayMs = 400): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
            continue;
          }
          return null;
        }
        return await safeJson(res);
      } catch {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
          continue;
        }
        return null;
      }
    }
    return null;
  };

  // Fetch real data from backend
  const refreshData = useCallback(async () => {
    try {
      const currentId = currentUser?.id || 'anonymous';
      const [postsRes, storiesRes, reelsRes, usersRes, msgsRes, notifsRes] = await Promise.allSettled([
        fetch(`/api/posts?currentUserId=${currentId}`),
        fetch(`/api/stories?currentUserId=${currentId}`),
        fetch(`/api/reels?currentUserId=${currentId}`),
        fetch(`/api/users?currentUserId=${currentId}`),
        fetch(`/api/messages?currentUserId=${currentId}`),
        fetch(`/api/notifications?currentUserId=${currentId}`),
      ]);

      if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
        const data = await safeJson(postsRes.value);
        if (Array.isArray(data)) setPosts(data);
      }

      if (storiesRes.status === 'fulfilled' && storiesRes.value.ok) {
        const data = await safeJson(storiesRes.value);
        if (Array.isArray(data)) setStories(data);
      }

      if (reelsRes.status === 'fulfilled' && reelsRes.value.ok) {
        const data = await safeJson(reelsRes.value);
        if (Array.isArray(data)) setReels(data);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const data = await safeJson(usersRes.value);
        if (Array.isArray(data) && data.length > 0) {
          setAvailableProfiles(data);
          // If currentUser is logged in, sync stats only if they actually changed
          if (currentUser?.id && currentUser.id !== 'guest_user') {
            const found = data.find((u: User) => u.id === currentUser.id);
            if (found) {
              if (
                currentUser.followersCount !== found.followersCount ||
                currentUser.followingCount !== found.followingCount ||
                currentUser.postsCount !== found.postsCount ||
                currentUser.name !== found.name ||
                currentUser.avatar !== found.avatar ||
                currentUser.bio !== found.bio
              ) {
                setCurrentUser(found);
                localStorage.setItem('instavibe_user', JSON.stringify(found));
              }
            }
          }
        }
      }

      if (msgsRes.status === 'fulfilled' && msgsRes.value.ok) {
        const data = await safeJson(msgsRes.value);
        if (Array.isArray(data)) setThreads(data);
      }

      if (notifsRes.status === 'fulfilled' && notifsRes.value.ok) {
        const data = await safeJson(notifsRes.value);
        if (Array.isArray(data)) setNotifications(data);
      }
    } catch (error) {
      console.warn('Live data sync encountered non-fatal error:', error);
    }
  }, [currentUser?.id, currentUser?.followersCount, currentUser?.followingCount, currentUser?.postsCount, currentUser?.name, currentUser?.avatar, currentUser?.bio]);

  useEffect(() => {
    refreshData();
    if (currentUser?.id && currentUser.id !== 'guest_user') {
      syncUserToFirestore(currentUser);
    }
  }, [currentUser?.id, refreshData]);

  // Real-time Firestore Listeners for Users and Chats
  useEffect(() => {
    // Reset private session states immediately on user change to prevent state bleeding
    setActiveThreadId(null);
    setThreads([]);
    setNotifications([]);

    if (!currentUser?.id || currentUser.id === 'guest_user') return;

    // Listen to real users created on the platform
    const unsubUsers = listenToFirestoreUsers(currentUser.id, (firestoreUsers) => {
      if (firestoreUsers.length > 0) {
        setAvailableProfiles((prev) => {
          const map = new Map<string, User>();
          prev.forEach((u) => map.set(u.id, u));
          firestoreUsers.forEach((fu) => map.set(fu.id, { ...map.get(fu.id), ...fu }));
          return Array.from(map.values());
        });
      }
    });

    // Listen to real-time chat threads strictly for current user
    const unsubChats = listenToUserChats(currentUser, (firestoreThreads) => {
      setThreads((prevThreads) => {
        const prevMsgMap = new Map<string, DirectMessage[]>();
        prevThreads.forEach((t) => {
          if (t.messages && t.messages.length > 0) {
            prevMsgMap.set(t.id, t.messages);
          }
        });

        return firestoreThreads.map((ft) => ({
          ...ft,
          unreadCount: activeThreadId === ft.id ? 0 : ft.unreadCount,
          messages: prevMsgMap.get(ft.id) || ft.messages || [],
        }));
      });
    });

    // Listen to real-time notifications for current user
    const unsubNotifs = listenToUserNotifications(currentUser.id, (firestoreNotifs) => {
      if (firestoreNotifs.length > 0) {
        setNotifications((prev) => {
          const map = new Map<string, AppNotification>();
          // Combine existing with firestore
          prev.forEach((n) => map.set(n.id, n));
          firestoreNotifs.forEach((fn) => {
            const existing = map.get(fn.id);
            const isRead = Boolean(existing?.isRead || fn.isRead);
            map.set(fn.id, { ...existing, ...fn, isRead });
          });
          return Array.from(map.values()).sort((a, b) => {
            if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
            return 0;
          });
        });
      }
    });

    // Listen to current user's blocked users
    const unsubBlocked = listenToBlockedUsers(currentUser.id, (blocked) => {
      setBlockedUserIds(blocked);
      try {
        localStorage.setItem(`instavibe_blocked_users_${currentUser.id}`, JSON.stringify(blocked));
      } catch {}
    });

    return () => {
      unsubUsers();
      unsubChats();
      unsubNotifs();
      unsubBlocked();
    };
  }, [currentUser?.id]);

  // Auth Operations
  const signIn = async (identifier: string, password: string, rememberMe: boolean = true) => {
    try {
      const clientDevice = getClientDeviceInfo();
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe, clientDevice }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }

      if (data.requires2Fa) {
        return {
          success: true,
          requires2Fa: true,
          tempToken: data.tempToken,
          method: data.method,
        };
      }

      if (data.user) {
        if (data.tokens) {
          storeAuthSession(data.tokens, data.sessionId, rememberMe);
        }
        if (data.isSuspicious && data.suspicionAlert) {
          setSuspiciousAlert(data.suspicionAlert);
        }
        setActiveThreadId(null);
        setThreads([]);
        setNotifications([]);
        setCurrentUser(data.user);
        localStorage.setItem('instavibe_user', JSON.stringify(data.user));
        persistSavedAccount(data.user);
        syncUserToFirestore(data.user);
        celebrateAction();
        refreshData();
        return {
          success: true,
          user: data.user,
          isSuspicious: data.isSuspicious,
          suspicionAlert: data.suspicionAlert,
        };
      }
      return { success: false, error: 'User data not returned' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const signUp = async (signUpData: SignUpData, rememberMe: boolean = true) => {
    try {
      const clientDevice = getClientDeviceInfo();
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signUpData, rememberMe, clientDevice }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create account' };
      }

      if (data.user) {
        if (data.tokens) {
          storeAuthSession(data.tokens, data.sessionId, rememberMe);
        }
        setActiveThreadId(null);
        setThreads([]);
        setNotifications([]);
        setCurrentUser(data.user);
        setAvailableProfiles((prev) => [data.user, ...prev]);
        localStorage.setItem('instavibe_user', JSON.stringify(data.user));
        persistSavedAccount(data.user);
        syncUserToFirestore(data.user);
        celebrateAction();
        refreshData();
        return { success: true, user: data.user, emailVerificationCode: data.emailVerificationCode };
      }
      return { success: false, error: 'Account created but user data missing' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const signInWithGoogle = async (
    payload: { email: string; name: string; avatar?: string; googleId?: string },
    rememberMe: boolean = true
  ) => {
    try {
      const clientDevice = getClientDeviceInfo();
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, rememberMe, clientDevice }),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Google sign-in failed' };

      if (data.user) {
        if (data.tokens) storeAuthSession(data.tokens, data.sessionId, rememberMe);
        setActiveThreadId(null);
        setThreads([]);
        setNotifications([]);
        setCurrentUser(data.user);
        localStorage.setItem('instavibe_user', JSON.stringify(data.user));
        persistSavedAccount(data.user);
        syncUserToFirestore(data.user);
        celebrateAction();
        refreshData();
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Failed to retrieve Google user' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const signInWithApple = async (
    payload: { email?: string; name?: string; appleUserId?: string },
    rememberMe: boolean = true
  ) => {
    try {
      const clientDevice = getClientDeviceInfo();
      const res = await fetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, rememberMe, clientDevice }),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Apple sign-in failed' };

      if (data.user) {
        if (data.tokens) storeAuthSession(data.tokens, data.sessionId, rememberMe);
        setActiveThreadId(null);
        setThreads([]);
        setNotifications([]);
        setCurrentUser(data.user);
        localStorage.setItem('instavibe_user', JSON.stringify(data.user));
        persistSavedAccount(data.user);
        syncUserToFirestore(data.user);
        celebrateAction();
        refreshData();
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Failed to retrieve Apple user' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const signInWithPasskey = async (rememberMe: boolean = true) => {
    try {
      const result = await authenticateWithPasskey(rememberMe);
      if (result.success && result.user) {
        setActiveThreadId(null);
        setThreads([]);
        setNotifications([]);
        setCurrentUser(result.user);
        localStorage.setItem('instavibe_user', JSON.stringify(result.user));
        persistSavedAccount(result.user);
        syncUserToFirestore(result.user);
        celebrateAction();
        refreshData();
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'Passkey verification failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Passkey error' };
    }
  };

  const registerPasskey = async () => {
    if (!currentUser?.id || currentUser.id === 'guest_user') {
      return { success: false, error: 'Please sign in first to register a passkey' };
    }
    const res = await registerPasskeyOnDevice(currentUser.id, currentUser.name || currentUser.username);
    if (res.success && res.credentialId) {
      localStorage.setItem('instavibe_last_passkey_id', res.credentialId);
    }
    return res;
  };

  const verify2FALogin = async (tempToken: string, code: string, isBackupCode: boolean = false, rememberMe: boolean = true) => {
    try {
      const clientDevice = getClientDeviceInfo();
      const res = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code, isBackupCode, rememberMe, clientDevice }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || '2FA verification failed' };

      if (data.user) {
        if (data.tokens) storeAuthSession(data.tokens, data.sessionId, rememberMe);
        setActiveThreadId(null);
        setThreads([]);
        setNotifications([]);
        setCurrentUser(data.user);
        localStorage.setItem('instavibe_user', JSON.stringify(data.user));
        persistSavedAccount(data.user);
        syncUserToFirestore(data.user);
        celebrateAction();
        refreshData();
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Invalid response from 2FA login' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async (options?: { allDevices?: boolean }) => {
    const refreshToken = getStoredRefreshToken();
    const sessionId = getStoredSessionId();

    try {
      if (options?.allDevices && currentUser?.id && currentUser.id !== 'guest_user') {
        await fetch('/api/auth/logout-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
      } else if (currentUser?.id) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken, sessionId, userId: currentUser.id }),
        });
      }
    } catch (e) {
      console.warn('Logout network notice:', e);
    }

    clearAuthSession();
    localStorage.removeItem('instavibe_user');
    setActiveThreadId(null);
    setThreads([]);
    setNotifications([]);
    setCurrentUser(null);
  };

  const requestPasswordReset = async (identifier: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to request password reset' };
      return { success: true, message: data.message, email: data.email, debugCode: data.debugCode };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const verifyPasswordReset = async (identifier: string, code: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to reset password' };
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const sendEmailVerification = async (email?: string) => {
    if (!currentUser?.id) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to send verification code' };
      return { success: true, debugCode: data.debugCode };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const confirmEmailVerification = async (code: string) => {
    if (!currentUser?.id) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, code }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Verification failed' };

      // Update current user
      const updated = { ...currentUser, isEmailVerified: true };
      setCurrentUser(updated);
      localStorage.setItem('instavibe_user', JSON.stringify(updated));
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const fetchSessions = async () => {
    if (!currentUser?.id || currentUser.id === 'guest_user') return;
    try {
      const currentSessionId = getStoredSessionId();
      const res = await fetch(`/api/auth/sessions?userId=${currentUser.id}&currentSessionId=${currentSessionId || ''}`);
      const data = await res.json();
      if (data.sessions) setActiveSessions(data.sessions);
    } catch (e) {
      console.warn('Fetch sessions notice:', e);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!currentUser?.id) return;
    try {
      await fetch(`/api/auth/sessions/${sessionId}?userId=${currentUser.id}`, { method: 'DELETE' });
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e) {
      console.warn('Revoke session notice:', e);
    }
  };

  const logoutAllOtherSessions = async () => {
    if (!currentUser?.id) return;
    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      fetchSessions();
    } catch (e) {
      console.warn('Revoke all sessions notice:', e);
    }
  };

  const fetchTrustedDevices = async () => {
    if (!currentUser?.id || currentUser.id === 'guest_user') return;
    try {
      const res = await fetch(`/api/auth/devices?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.devices) setTrustedDevices(data.devices);
    } catch (e) {
      console.warn('Fetch devices notice:', e);
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      await fetch(`/api/auth/devices/${deviceId}`, { method: 'DELETE' });
      setTrustedDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch (e) {
      console.warn('Revoke device notice:', e);
    }
  };

  const renameDevice = async (deviceId: string, newName: string) => {
    try {
      await fetch(`/api/auth/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: newName }),
      });
      setTrustedDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, deviceName: newName } : d))
      );
    } catch (e) {
      console.warn('Rename device notice:', e);
    }
  };

  const fetchSecurityLogs = async () => {
    if (!currentUser?.id || currentUser.id === 'guest_user') return;
    try {
      const res = await fetch(`/api/auth/security-logs?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.logs) setSecurityLogs(data.logs);
    } catch (e) {
      console.warn('Fetch logs notice:', e);
    }
  };

  const setup2FA = async () => {
    if (!currentUser?.id) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to setup 2FA' };
      return { success: true, secret: data.secret, qrCodeUrl: data.qrCodeUrl, backupCodes: data.backupCodes };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const enable2FA = async (code: string, secret: string, backupCodes: string[]) => {
    if (!currentUser?.id) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, code, secret, backupCodes }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to enable 2FA' };

      const updated = { ...currentUser, twoFactorEnabled: true };
      setCurrentUser(updated);
      localStorage.setItem('instavibe_user', JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const disable2FA = async (password: string) => {
    if (!currentUser?.id) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to disable 2FA' };

      const updated = { ...currentUser, twoFactorEnabled: false };
      setCurrentUser(updated);
      localStorage.setItem('instavibe_user', JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const resolveSuspiciousAlert = async (action: 'confirm_me' | 'lock_and_secure') => {
    if (!suspiciousAlert) return;
    try {
      await fetch('/api/auth/resolve-suspicious-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: suspiciousAlert.id, action, userId: currentUser?.id }),
      });

      if (action === 'lock_and_secure') {
        logout();
      } else {
        setSuspiciousAlert(null);
      }
    } catch (e) {
      console.warn('Resolve alert notice:', e);
    }
  };

  const switchProfile = (user: User) => {
    setActiveThreadId(null);
    setThreads([]);
    setNotifications([]);
    setCurrentUser(user);
    localStorage.setItem('instavibe_user', JSON.stringify(user));
    persistSavedAccount(user);
    syncUserToFirestore(user);
  };

  const updateProfile = async (updated: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    localStorage.setItem('instavibe_user', JSON.stringify(updatedUser));
    persistSavedAccount(updatedUser);
    syncUserToFirestore(updatedUser);
    setAvailableProfiles((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updated } : u))
    );

    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem('instavibe_user', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to persist profile update:', e);
    }
  };

  // Post Actions
  const toggleLikePost = async (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextLiked = !post.isLiked;
          return {
            ...post,
            isLiked: nextLiked,
            likesCount: nextLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
          };
        }
        return post;
      })
    );

    if (selectedPostForDetail?.id === postId) {
      setSelectedPostForDetail((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !prev.isLiked,
              likesCount: !prev.isLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
            }
          : null
      );
    }

    if (!currentUser?.id) return;

    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Error toggling like on server:', err);
    }
  };

  const toggleSavePost = async (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post
      )
    );
    if (selectedPostForDetail?.id === postId) {
      setSelectedPostForDetail((prev) =>
        prev ? { ...prev, isSaved: !prev.isSaved } : null
      );
    }

    if (!currentUser?.id) return;

    try {
      await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Error toggling save on server:', err);
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!text.trim() || !currentUser) return;
    const tempComment: Comment = {
      id: 'comment_' + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      text: text.trim(),
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const updatedComments = [tempComment, ...post.comments];
          return {
            ...post,
            comments: updatedComments,
            commentsCount: post.commentsCount + 1,
          };
        }
        return post;
      })
    );

    if (activeCommentsPost?.id === postId) {
      setActiveCommentsPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [tempComment, ...prev.comments],
              commentsCount: prev.commentsCount + 1,
            }
          : null
      );
    }

    if (selectedPostForDetail?.id === postId) {
      setSelectedPostForDetail((prev) =>
        prev
          ? {
              ...prev,
              comments: [tempComment, ...prev.comments],
              commentsCount: prev.commentsCount + 1,
            }
          : null
      );
    }

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, text: text.trim() }),
      });
      if (res.ok) {
        const savedComment = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === tempComment.id ? savedComment : c
                  ),
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error adding comment to server:', err);
    }
  };

  const toggleLikeComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map((c) => {
              if (c.id === commentId) {
                const nextLiked = !c.isLiked;
                return {
                  ...c,
                  isLiked: nextLiked,
                  likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
                };
              }
              return c;
            }),
          };
        }
        return post;
      })
    );

    if (activeCommentsPost?.id === postId) {
      setActiveCommentsPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) => {
                if (c.id === commentId) {
                  const nextLiked = !c.isLiked;
                  return {
                    ...c,
                    isLiked: nextLiked,
                    likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
                  };
                }
                return c;
              }),
            }
          : null
      );
    }
  };

  const createNewPost = async (postData: {
    media: PostMedia[];
    caption: string;
    location?: string;
    tags?: string[];
    musicTrack?: { title: string; artist: string };
  }) => {
    if (!currentUser) return;
    const tempId = 'post_' + Date.now();
    const optimisticPost: Post = {
      id: tempId,
      userId: currentUser.id,
      author: currentUser,
      media: postData.media,
      caption: postData.caption,
      location: postData.location,
      timestamp: 'Just now',
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      tags: postData.tags,
      musicTrack: postData.musicTrack,
    };

    setPosts((prev) => [optimisticPost, ...prev]);
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        postsCount: prev.postsCount + 1,
      };
    });
    celebrateAction();
    setActiveTab('feed');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          caption: postData.caption,
          location: postData.location,
          media: postData.media,
          tags: postData.tags,
          musicTrack: postData.musicTrack,
        }),
      });

      if (res.ok) {
        const savedPost = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === tempId ? savedPost : p))
        );
        refreshData();
      }
    } catch (err) {
      console.error('Error saving post to backend:', err);
    }
  };

  const deletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPostForDetail?.id === postId) {
      setSelectedPostForDetail(null);
    }
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        postsCount: Math.max(0, prev.postsCount - 1),
      };
    });

    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      refreshData();
    } catch (err) {
      console.error('Error deleting post on server:', err);
    }
  };

  // Story Actions
  const openStoryViewer = (index: number) => {
    setActiveStoryGroupIndex(index);
  };

  const closeStoryViewer = () => {
    setActiveStoryGroupIndex(null);
  };

  const nextStoryGroup = () => {
    if (activeStoryGroupIndex !== null && activeStoryGroupIndex < stories.length - 1) {
      setActiveStoryGroupIndex(activeStoryGroupIndex + 1);
    } else {
      closeStoryViewer();
    }
  };

  const prevStoryGroup = () => {
    if (activeStoryGroupIndex !== null && activeStoryGroupIndex > 0) {
      setActiveStoryGroupIndex(activeStoryGroupIndex - 1);
    }
  };

  const markStorySeen = async (userId: string, storyId: string) => {
    setStories((prev) => {
      const targetGroup = prev.find((g) => g.userId === userId);
      const targetItem = targetGroup?.items.find((i) => i.id === storyId);
      if (!targetGroup || !targetItem || targetItem.seen) {
        return prev;
      }
      return prev.map((group) => {
        if (group.userId === userId) {
          const updatedItems = group.items.map((item) =>
            item.id === storyId ? { ...item, seen: true } : item
          );
          const allSeen = updatedItems.every((item) => item.seen);
          return {
            ...group,
            items: updatedItems,
            hasUnseen: !allSeen,
          };
        }
        return group;
      });
    });

    if (!currentUser?.id) return;

    try {
      await fetch(`/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (e) {
      // ignore
    }
  };

  const addNewStory = async (storyItem: { mediaUrl: string; caption?: string; filter?: any }) => {
    if (!currentUser) return;
    const newItem = {
      id: 'story_' + Date.now(),
      mediaUrl: storyItem.mediaUrl,
      mediaType: 'image' as const,
      timestamp: 'Just now',
      caption: storyItem.caption,
      filter: storyItem.filter,
      seen: false,
    };

    setStories((prev) => {
      const userGroupIndex = prev.findIndex((g) => g.userId === currentUser.id);
      if (userGroupIndex >= 0) {
        const updated = [...prev];
        updated[userGroupIndex] = {
          ...updated[userGroupIndex],
          items: [newItem, ...updated[userGroupIndex].items],
          hasUnseen: false,
        };
        return updated;
      } else {
        const newGroup: StoryGroup = {
          userId: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          avatar: currentUser.avatar,
          isVerified: currentUser.isVerified,
          hasUnseen: false,
          items: [newItem],
        };
        return [newGroup, ...prev];
      }
    });

    celebrateAction();

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          mediaUrl: storyItem.mediaUrl,
          caption: storyItem.caption,
          filter: storyItem.filter,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setStories((prev) =>
          prev.map((g) =>
            g.userId === currentUser.id
              ? {
                  ...g,
                  items: g.items.map((it) => (it.id === newItem.id ? { ...it, ...saved } : it)),
                }
              : g
          )
        );
        refreshData();
      }
    } catch (e) {
      console.error('Error saving story to server:', e);
    }
  };

  const toggleLikeStory = async (storyId: string): Promise<boolean> => {
    let nextIsLiked = false;
    setStories((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((it) => {
          if (it.id === storyId) {
            nextIsLiked = !it.isLiked;
            return {
              ...it,
              isLiked: nextIsLiked,
              likesCount: nextIsLiked ? (it.likesCount || 0) + 1 : Math.max(0, (it.likesCount || 1) - 1),
            };
          }
          return it;
        }),
      }))
    );

    if (!currentUser?.id) return nextIsLiked;

    try {
      const res = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.isLiked;
      }
    } catch (e) {
      console.error('Error liking story:', e);
    }
    return nextIsLiked;
  };

  const deleteStory = async (storyId: string) => {
    setStories((prev) => {
      return prev
        .map((g) => ({
          ...g,
          items: g.items.filter((it) => it.id !== storyId),
        }))
        .filter((g) => g.items.length > 0 || (currentUser?.id && g.userId !== currentUser.id));
    });

    try {
      await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Error deleting story:', e);
    }
  };

  // Reels
  const fetchReelsByCategory = useCallback(async (cat: 'for_you' | 'following' | 'trending' | 'saved') => {
    setIsLoadingReels(true);
    try {
      const currentId = currentUser?.id || 'anonymous';
      const data = await safeFetchJson(`/api/reels?currentUserId=${currentId}&category=${cat}&page=1&limit=15`);
      if (Array.isArray(data)) {
        setReels(data);
        setActiveReelIndex(0);
        setReelsPage(1);
        setHasMoreReels(data.length >= 10);
      }
    } catch {
      // Gracefully retain current reels on network interruption
    } finally {
      setIsLoadingReels(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchReelsByCategory(reelCategory);
  }, [reelCategory, fetchReelsByCategory]);

  const loadMoreReels = async () => {
    if (isLoadingReels || !hasMoreReels) return;
    setIsLoadingReels(true);
    const nextPage = reelsPage + 1;
    try {
      const currentId = currentUser?.id || 'anonymous';
      const data = await safeFetchJson(`/api/reels?currentUserId=${currentId}&category=${reelCategory}&page=${nextPage}&limit=15`);
      if (Array.isArray(data) && data.length > 0) {
        setReels((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newItems = data.filter((r: Reel) => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
        setReelsPage(nextPage);
        setHasMoreReels(data.length >= 10);
      } else {
        setHasMoreReels(false);
      }
    } catch {
      // Gracefully handle network interruption
    } finally {
      setIsLoadingReels(false);
    }
  };

  const toggleLikeReel = async (reelId: string) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          const nextLiked = !reel.isLiked;
          return {
            ...reel,
            isLiked: nextLiked,
            likesCount: nextLiked ? reel.likesCount + 1 : Math.max(0, reel.likesCount - 1),
          };
        }
        return reel;
      })
    );

    if (!currentUser?.id) return;

    try {
      await fetch(`/api/reels/${reelId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (e) {
      console.error('Error liking reel on server:', e);
    }
  };

  const toggleSaveReel = async (reelId: string) => {
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId ? { ...reel, isSaved: !reel.isSaved } : reel
      )
    );

    if (!currentUser?.id) return;

    try {
      await fetch(`/api/reels/${reelId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (e) {
      console.error('Error toggling reel save:', e);
    }
  };

  const recordReelWatch = async (reelId: string, durationSecs: number, progressPercent: number) => {
    if (!currentUser?.id) return;
    try {
      await fetch(`/api/reels/${reelId}/watch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          watchDurationSecs: durationSecs,
          progressPercent,
        }),
      });
    } catch (e) {
      // non-blocking
    }
  };

  const fetchWatchHistory = async () => {
    if (!currentUser?.id || currentUser.id === 'guest_user') return;
    try {
      const res = await fetch(`/api/reels/history?currentUserId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setWatchHistory(data);
      }
    } catch (e) {
      console.error('Error fetching watch history:', e);
    }
  };

  const clearWatchHistory = async () => {
    if (!currentUser?.id) return;
    setWatchHistory([]);
    try {
      await fetch('/api/reels/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id }),
      });
    } catch (e) {
      console.error('Error clearing watch history:', e);
    }
  };

  const createNewReel = async (reelData: {
    videoUrl: string;
    posterUrl?: string;
    caption?: string;
    musicTrack?: { title: string; artist: string };
    tags?: string[];
    duration?: number;
  }) => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          videoUrl: reelData.videoUrl,
          posterUrl: reelData.posterUrl,
          caption: reelData.caption,
          musicTrack: reelData.musicTrack,
          tags: reelData.tags,
          duration: reelData.duration || 15,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setReels((prev) => [saved, ...prev]);
        celebrateAction();
        setActiveTab('reels');
      }
    } catch (e) {
      console.error('Error creating reel:', e);
    }
  };

  // Direct Messages & Real-time Chat
  const markThreadAsSeen = async (threadId: string) => {
    if (!threadId || !currentUser?.id) return;

    // 1. Optimistic UI update: reset unreadCount and mark messages seen
    setThreads((prev) =>
      prev.map((th) => {
        if (th.id === threadId) {
          const updatedMsgs = (th.messages || []).map((m) =>
            m.senderId !== currentUser?.id ? { ...m, isSeen: true } : m
          );
          return {
            ...th,
            unreadCount: 0,
            lastMessageStatus: 'read',
            messages: updatedMsgs,
          };
        }
        return th;
      })
    );

    // 2. Real-time Firestore sync
    try {
      await markChatAsSeenInFirestore(threadId, currentUser.id);
    } catch (fErr) {
      console.warn('Firestore markChatAsSeen fallback:', fErr);
    }

    // 3. Backend PostgreSQL sync
    try {
      await fetch(`/api/messages/${threadId}/seen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id, chatId: threadId }),
      });
    } catch (bErr) {
      console.warn('Backend markChatAsSeen fallback:', bErr);
    }
  };

  const sendMessage = async (
    threadId: string,
    text: string,
    mediaUrl?: string,
    isAudio?: boolean,
    audioUrl?: string,
    audioDuration?: number,
    options?: {
      mediaType?: 'image' | 'video' | 'audio' | 'gif';
      videoUrl?: string;
      videoDuration?: number;
      videoThumbnail?: string;
      isSticker?: boolean;
      stickerUrl?: string;
      isGif?: boolean;
      gifUrl?: string;
      replyTo?: any;
      sharedPost?: any;
      isVanish?: boolean;
    }
  ) => {
    if (!currentUser) return;
    if (
      !text.trim() &&
      !mediaUrl &&
      !audioUrl &&
      !options?.videoUrl &&
      !options?.gifUrl &&
      !options?.stickerUrl &&
      !options?.sharedPost
    )
      return;

    // Find the participant from the thread or deterministic ID
    let targetThread = threads.find((t) => t.id === threadId);
    let receiverUser = targetThread?.participant;

    if (!receiverUser) {
      if (
        activeChatUser &&
        (getDeterministicChatId(currentUser.id, activeChatUser.id) === threadId ||
          activeChatUser.id === threadId)
      ) {
        receiverUser = activeChatUser;
      } else {
        receiverUser = availableProfiles.find((u) => {
          return (
            getDeterministicChatId(currentUser.id, u.id) === threadId ||
            threadId.includes(u.id)
          );
        });
      }
    }

    const newMsg: DirectMessage = {
      id: 'msg_' + Date.now(),
      senderId: currentUser.id,
      receiverId: receiverUser?.id,
      text: text.trim(),
      mediaUrl,
      mediaType:
        options?.mediaType ||
        (options?.videoUrl
          ? 'video'
          : options?.isGif
          ? 'gif'
          : isAudio
          ? 'audio'
          : mediaUrl
          ? 'image'
          : undefined),
      videoUrl: options?.videoUrl,
      videoDuration: options?.videoDuration,
      videoThumbnail: options?.videoThumbnail,
      audioUrl,
      audioDuration,
      isAudio: !!isAudio,
      isSticker: !!options?.isSticker,
      stickerUrl: options?.stickerUrl,
      isGif: !!options?.isGif,
      gifUrl: options?.gifUrl,
      replyTo: options?.replyTo,
      sharedPost: options?.sharedPost,
      isVanish: !!options?.isVanish,
      isDeleted: false,
      status: 'sent',
      timestamp: 'Just now',
      isSeen: true,
    };

    let previewText = text.trim();
    if (!previewText) {
      if (options?.sharedPost) previewText = `Shared a ${options.sharedPost.type || 'post'}`;
      else if (options?.isSticker) previewText = 'Sent a sticker';
      else if (options?.isGif) previewText = 'Sent a GIF';
      else if (options?.videoUrl) previewText = '🎥 Video';
      else if (isAudio) previewText = '🎙️ Voice note';
      else if (mediaUrl) previewText = '📷 Photo';
      else previewText = 'Sent a message';
    }

    // Optimistic UI update
    setThreads((prev) => {
      const exists = prev.some((th) => th.id === threadId);
      if (exists) {
        return prev.map((th) => {
          if (th.id === threadId) {
            return {
              ...th,
              lastMessage: previewText,
              lastMessageTime: 'Just now',
              lastMessageStatus: 'sent',
              messages: [...th.messages, newMsg],
            };
          }
          return th;
        });
      } else if (receiverUser) {
        const newThread: ChatThread = {
          id: threadId,
          participant: receiverUser,
          lastMessage: previewText,
          lastMessageTime: 'Just now',
          lastMessageStatus: 'sent',
          unreadCount: 0,
          messages: [newMsg],
          category: 'primary',
        };
        return [newThread, ...prev];
      }
      return prev;
    });

    // 1. Send to Firebase Firestore in real-time
    if (receiverUser && currentUser.id !== 'guest_user') {
      try {
        await sendMessageToFirestore(
          currentUser,
          receiverUser,
          text,
          mediaUrl,
          isAudio,
          audioUrl,
          audioDuration,
          options
        );
      } catch (fErr) {
        console.warn('Firestore sendMessage fallback:', fErr);
      }
    }

    // 2. Persist to PostgreSQL backend
    if (receiverUser) {
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: receiverUser.id,
            text: text.trim(),
            mediaUrl,
            isAudio,
            audioUrl,
            audioDuration,
            videoUrl: options?.videoUrl,
            videoDuration: options?.videoDuration,
            isSticker: options?.isSticker,
            stickerUrl: options?.stickerUrl,
            isGif: options?.isGif,
            gifUrl: options?.gifUrl,
            replyTo: options?.replyTo,
            sharedPost: options?.sharedPost,
            isVanish: options?.isVanish,
          }),
        });
      } catch (err) {
        console.error('Error saving message to API:', err);
      }
    }
  };

  const reactToMessage = async (threadId: string, messageId: string, emoji: string) => {
    if (!currentUser?.id) return;
    const currentId = currentUser.id;

    // 1. Optimistic UI update
    setThreads((prev) =>
      prev.map((th) => {
        if (th.id === threadId) {
          const updatedMsgs = th.messages.map((m) => {
            if (m.id === messageId) {
              const reactions = { ...(m.reactions || {}) };
              const userList = reactions[emoji] || [];
              if (userList.includes(currentId)) {
                const nextUsers = userList.filter((id) => id !== currentId);
                if (nextUsers.length === 0) delete reactions[emoji];
                else reactions[emoji] = nextUsers;
              } else {
                // Clear existing reactions from this user
                Object.keys(reactions).forEach((k) => {
                  reactions[k] = reactions[k].filter((id) => id !== currentId);
                  if (reactions[k].length === 0) delete reactions[k];
                });
                reactions[emoji] = [...(reactions[emoji] || []), currentId];
              }
              return {
                ...m,
                reactions,
                reaction: Object.keys(reactions)[0] || undefined,
              };
            }
            return m;
          });
          return { ...th, messages: updatedMsgs };
        }
        return th;
      })
    );

    // 2. Persist to Firestore
    try {
      await reactToMessageWithEmojiInFirestore(threadId, messageId, currentId, emoji);
    } catch (err) {
      console.warn('Error saving reaction in Firestore:', err);
    }
  };

  const deleteMessageForEveryone = async (threadId: string, messageId: string) => {
    // 1. Optimistic update
    setThreads((prev) =>
      prev.map((th) => {
        if (th.id === threadId) {
          const updatedMsgs = th.messages.map((m) => {
            if (m.id === messageId) {
              return {
                ...m,
                isDeleted: true,
                text: 'This message was deleted',
                mediaUrl: undefined,
                videoUrl: undefined,
                audioUrl: undefined,
                stickerUrl: undefined,
                gifUrl: undefined,
                reactions: {},
                reaction: undefined,
              };
            }
            return m;
          });
          return { ...th, messages: updatedMsgs };
        }
        return th;
      })
    );

    // 2. Firestore delete for everyone
    try {
      await deleteMessageForEveryoneInFirestore(threadId, messageId);
    } catch (err) {
      console.warn('Error deleting message for everyone:', err);
    }
  };

  const sendInAppToastReply = async (threadId: string, text: string) => {
    await sendMessage(threadId, text);
    dismissInAppToast();
  };

  const moveThreadCategory = (threadId: string, category: 'primary' | 'general' | 'requests') => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, category } : t))
    );
  };

  const toggleMuteThread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, isMuted: !t.isMuted } : t))
    );
  };

  const deleteMessage = async (threadId: string, messageId: string) => {
    // 1. Optimistic removal from local state
    setThreads((prev) =>
      prev.map((th) => {
        if (th.id === threadId) {
          const updatedMsgs = th.messages.filter((m) => m.id !== messageId);
          const lastMsg = updatedMsgs[updatedMsgs.length - 1];
          return {
            ...th,
            messages: updatedMsgs,
            lastMessage: lastMsg ? (lastMsg.text || (lastMsg.isAudio ? '🎙️ Voice note' : '📷 Photo')) : '',
          };
        }
        return th;
      })
    );

    // 2. Delete document from Firestore subcollection for both users
    try {
      await deleteMessageFromFirestore(threadId, messageId);
    } catch (err) {
      console.warn('Error deleting message from Firestore subcollection:', err);
    }
  };

  const updateUserNote = (text: string, emoji: string = '💭') => {
    if (!currentUser?.id) return;
    setThreads((prev) =>
      prev.map((t) => {
        if (t.participant.id === currentUser.id) {
          return { ...t, note: { text, emoji } };
        }
        return t;
      })
    );
    if (currentUser.id && currentUser.id !== 'guest_user') {
      updateUserNoteInFirestore(currentUser.id, text, emoji);
    }
  };

  const updateChatTheme = async (threadId: string, theme: ChatTheme) => {
    // 1. Optimistic update
    setThreads((prev) =>
      prev.map((th) => (th.id === threadId ? { ...th, theme } : th))
    );

    // 2. Save theme to Firestore chat document
    try {
      await updateChatThemeInFirestore(threadId, theme);
    } catch (err) {
      console.error('Error saving chat theme to Firestore:', err);
    }
  };

  const blockUser = async (targetUserId: string) => {
    if (!targetUserId || !currentUser?.id || targetUserId === currentUser.id) return;

    // 1. Optimistic update
    setBlockedUserIds((prev) => {
      if (prev.includes(targetUserId)) return prev;
      const next = [...prev, targetUserId];
      try {
        localStorage.setItem(`instavibe_blocked_users_${currentUser.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Clear active conversation if with blocked user
    const active = threads.find((t) => t.id === activeThreadId);
    if (active && (active.participant.id === targetUserId || active.id.includes(targetUserId))) {
      setActiveThreadId(null);
    }

    // 3. Save to Firestore
    try {
      await blockUserInFirestore(currentUser.id, targetUserId);
    } catch (err) {
      console.warn('Firestore blockUser error:', err);
    }

    // 4. Save to backend PostgreSQL
    try {
      await fetch(`/api/users/${targetUserId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id }),
      });
    } catch {}
  };

  const unblockUser = async (targetUserId: string) => {
    if (!targetUserId || !currentUser?.id) return;

    // 1. Optimistic update
    setBlockedUserIds((prev) => {
      const next = prev.filter((id) => id !== targetUserId);
      try {
        localStorage.setItem(`instavibe_blocked_users_${currentUser.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Remove from Firestore
    try {
      await unblockUserInFirestore(currentUser.id, targetUserId);
    } catch (err) {
      console.warn('Firestore unblockUser error:', err);
    }

    // 3. Remove from backend PostgreSQL
    try {
      await fetch(`/api/users/${targetUserId}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id }),
      });
    } catch {}
  };

  const isUserBlocked = (userId: string) => {
    return blockedUserIds.includes(userId);
  };

  // Notifications
  const markNotificationAsRead = async (id: string) => {
    if (!currentUser?.id) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    // Sync to Firestore
    try {
      await setNotificationReadInFirestore(currentUser.id, id, true);
    } catch (err) {
      console.warn('Firestore markNotificationAsRead error:', err);
    }

    // Sync to backend PostgreSQL
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    // Sync to Firestore
    try {
      await markAllNotificationsReadInFirestore(currentUser.id);
    } catch (err) {
      console.warn('Firestore markAllNotificationsRead error:', err);
    }

    // Sync to backend PostgreSQL
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id }),
      });
    } catch (e) {
      console.error('Error marking notifications read on server:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!currentUser?.id) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // Sync to Firestore
    try {
      await deleteNotificationFromFirestore(currentUser.id, id);
    } catch (err) {
      console.warn('Firestore deleteNotification error:', err);
    }

    // Sync to backend PostgreSQL
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  const openPostDetail = (postId: string) => {
    const foundPost = posts.find((p) => p.id === postId);
    if (foundPost) {
      setSelectedPostForDetail(foundPost);
      return;
    }

    // Try fetching from server if not found in local feed
    const currentId = currentUser?.id || 'anonymous';
    fetch(`/api/posts?currentUserId=${currentId}`)
      .then((res) => res.json())
      .then((data: Post[]) => {
        if (Array.isArray(data)) {
          const match = data.find((p) => p.id === postId);
          if (match) setSelectedPostForDetail(match);
        }
      })
      .catch(() => {});
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const unreadMessagesCount = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  const toggleFollowUser = async (userId: string) => {
    if (!userId || !currentUser?.id || userId === currentUser.id) return;

    // 1. Optimistic calculation: find if currently following
    let willFollow = true;
    const targetInProfiles = availableProfiles.find((u) => u.id === userId);
    const targetInPosts = posts.find((p) => p.author.id === userId)?.author;
    const currentIsFollowing = targetInProfiles?.isFollowing ?? targetInPosts?.isFollowing ?? (selectedUserProfile?.id === userId ? selectedUserProfile.isFollowing : false);
    willFollow = !currentIsFollowing;

    // 2. Optimistic update of availableProfiles
    setAvailableProfiles((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextFollowers = willFollow ? (u.followersCount || 0) + 1 : Math.max(0, (u.followersCount || 0) - 1);
          return {
            ...u,
            isFollowing: willFollow,
            followersCount: nextFollowers,
          };
        }
        return u;
      })
    );

    // 3. Optimistic update of posts author state
    setPosts((prev) =>
      prev.map((p) => {
        if (p.author.id === userId) {
          const nextFollowers = willFollow ? (p.author.followersCount || 0) + 1 : Math.max(0, (p.author.followersCount || 0) - 1);
          return {
            ...p,
            author: {
              ...p.author,
              isFollowing: willFollow,
              followersCount: nextFollowers,
            },
          };
        }
        return p;
      })
    );

    // 4. Optimistic update of selectedPostForDetail
    if (selectedPostForDetail?.author.id === userId) {
      setSelectedPostForDetail((prev) =>
        prev
          ? {
              ...prev,
              author: {
                ...prev.author,
                isFollowing: willFollow,
                followersCount: willFollow
                  ? (prev.author.followersCount || 0) + 1
                  : Math.max(0, (prev.author.followersCount || 0) - 1),
              },
            }
          : null
      );
    }

    // 5. Optimistic update of selectedUserProfile modal if open
    setSelectedUserProfile((prev) => {
      if (prev && prev.id === userId) {
        const nextFollowers = willFollow ? (prev.followersCount || 0) + 1 : Math.max(0, (prev.followersCount || 0) - 1);
        return {
          ...prev,
          isFollowing: willFollow,
          followersCount: nextFollowers,
        };
      }
      return prev;
    });

    // 6. Optimistic update of userListModal (Followers/Following/Suggested lists)
    setUserListModal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        users: prev.users.map((u) => {
          if (u.id === userId) {
            const nextFollowers = willFollow ? (u.followersCount || 0) + 1 : Math.max(0, (u.followersCount || 0) - 1);
            return {
              ...u,
              isFollowing: willFollow,
              followersCount: nextFollowers,
            };
          }
          return u;
        }),
      };
    });

    // 7. Optimistic update of currentUser's followingCount
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const nextFollowingCount = willFollow
        ? (prev.followingCount || 0) + 1
        : Math.max(0, (prev.followingCount || 0) - 1);
      const updated = {
        ...prev,
        followingCount: nextFollowingCount,
      };
      try {
        localStorage.setItem('instavibe_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 8. Optimistic update of notifications if follow notification exists
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.user.id === userId) {
          return {
            ...n,
            user: {
              ...n.user,
              isFollowing: willFollow,
            },
          };
        }
        return n;
      })
    );

    if (willFollow) {
      celebrateAction();
    }

    // 9. Sync to server and refresh data seamlessly
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        // Server returned exact targetFollowersCount and isFollowing
        if (typeof data.isFollowing === 'boolean') {
          const finalFollow = data.isFollowing;
          const finalCount = data.targetFollowersCount;

          setAvailableProfiles((prev) =>
            prev.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    isFollowing: finalFollow,
                    followersCount: finalCount !== undefined ? finalCount : u.followersCount,
                  }
                : u
            )
          );

          setSelectedUserProfile((prev) =>
            prev && prev.id === userId
              ? {
                  ...prev,
                  isFollowing: finalFollow,
                  followersCount: finalCount !== undefined ? finalCount : prev.followersCount,
                }
              : prev
          );
        }
      }
    } catch (e) {
      console.error('Error toggling follow on server:', e);
    }
  };

  // Real Database queries for followers / following lists
  const openFollowersModal = async (userId: string) => {
    try {
      const currentId = currentUser?.id || '';
      const res = await fetch(`/api/users/${userId}/followers?currentUserId=${currentId}`);
      if (res.ok) {
        const users = await res.json();
        setUserListModal({ title: 'Followers', users });
      } else {
        setUserListModal({ title: 'Followers', users: [] });
      }
    } catch {
      setUserListModal({ title: 'Followers', users: [] });
    }
  };

  const openFollowingModal = async (userId: string) => {
    try {
      const currentId = currentUser?.id || '';
      const res = await fetch(`/api/users/${userId}/following?currentUserId=${currentId}`);
      if (res.ok) {
        const users = await res.json();
        setUserListModal({ title: 'Following', users });
      } else {
        setUserListModal({ title: 'Following', users: [] });
      }
    } catch {
      setUserListModal({ title: 'Following', users: [] });
    }
  };

  const openExplorePost = (item: any) => {
    const post: Post = {
      id: item.id || 'exp_' + Date.now(),
      userId: item.userId || item.author?.id || 'creator',
      author: item.author || {
        id: item.userId || 'creator',
        username: item.username || 'creator',
        name: item.name || 'Creator',
        avatar: item.avatar || item.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        bio: '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
      },
      media: item.media || [
        {
          url: item.url || item.videoUrl || item.posterUrl,
          aspectRatio: 'square',
        },
      ],
      caption: item.caption || '',
      location: item.location || '',
      timestamp: item.timestamp || 'Recently',
      likesCount: item.likesCount || item.likes || 0,
      commentsCount: item.commentsCount || (item.comments ? item.comments.length : 0),
      isLiked: item.isLiked || false,
      isSaved: item.isSaved || false,
      comments: item.comments || [],
    };
    setSelectedPostForDetail(post);
  };

  // Global filter to exclude any content from blocked users
  const visiblePosts = posts.filter(
    (p) => !blockedUserIds.includes(p.userId) && !blockedUserIds.includes(p.author?.id)
  );
  const visibleStories = stories.filter((s) => !blockedUserIds.includes(s.userId));
  const visibleReels = reels.filter(
    (r) => !blockedUserIds.includes(r.userId) && !blockedUserIds.includes(r.author?.id)
  );
  const visibleThreads = threads.filter((t) => !blockedUserIds.includes(t.participant?.id));
  const visibleProfiles = availableProfiles.filter((u) => !blockedUserIds.includes(u.id));
  const visibleNotifications = notifications.filter((n) => !blockedUserIds.includes(n.user?.id));

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        savedAccounts,
        removeSavedAccount,
        switchProfile,
        updateProfile,
        availableProfiles: visibleProfiles,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signInWithPasskey,
        registerPasskey,
        verify2FALogin,
        logout,
        requestPasswordReset,
        verifyPasswordReset,
        sendEmailVerification,
        confirmEmailVerification,
        activeSessions,
        fetchSessions,
        revokeSession,
        logoutAllOtherSessions,
        trustedDevices,
        fetchTrustedDevices,
        revokeDevice,
        renameDevice,
        securityLogs,
        fetchSecurityLogs,
        setup2FA,
        enable2FA,
        disable2FA,
        suspiciousAlert,
        dismissSuspiciousAlert,
        resolveSuspiciousAlert,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        posts: visiblePosts,
        savedPostIds: visiblePosts.filter((p) => p.isSaved).map((p) => p.id),
        toggleLikePost,
        toggleSavePost,
        addComment,
        toggleLikeComment,
        createNewPost,
        deletePost,
        stories: visibleStories,
        setStories,
        activeStoryGroupIndex,
        openStoryViewer,
        closeStoryViewer,
        nextStoryGroup,
        prevStoryGroup,
        markStorySeen,
        addNewStory,
        toggleLikeStory,
        deleteStory,
        reels: visibleReels,
        toggleLikeReel,
        toggleSaveReel,
        createNewReel,
        activeReelIndex,
        setActiveReelIndex,
        reelCategory,
        setReelCategory,
        recordReelWatch,
        watchHistory,
        fetchWatchHistory,
        clearWatchHistory,
        loadMoreReels,
        isLoadingReels,
        hasMoreReels,
        threads: visibleThreads,
        activeThreadId,
        setActiveThreadId,
        activeChatUser,
        setActiveChatUser,
        openChatWithUser,
        markThreadAsSeen,
        sendMessage,
        deleteMessage,
        reactToMessage,
        deleteMessageForEveryone,
        updateUserNote,
        updateChatTheme,
        moveThreadCategory,
        toggleMuteThread,
        togglePinThread,
        pinnedThreadIds,
        isUserOnline,
        onlineUserIds,
        notificationPermission,
        requestNotificationPermission,
        inAppMessageToast,
        dismissInAppToast,
        sendInAppToastReply,
        blockedUserIds,
        blockUser,
        unblockUser,
        isUserBlocked,
        notifications: visibleNotifications,
        markNotificationAsRead,
        markAllNotificationsRead,
        deleteNotification,
        unreadNotificationsCount,
        unreadMessagesCount,
        activeTab,
        setActiveTab,
        openPostDetail,
        isDark,
        toggleDarkMode,
        isCreateOpen,
        setIsCreateOpen,
        selectedPostForDetail,
        setSelectedPostForDetail,
        activeCommentsPost,
        setActiveCommentsPost,
        activeSharePost,
        setActiveSharePost,
        isEditProfileOpen,
        setIsEditProfileOpen,
        userListModal,
        setUserListModal,
        selectedUserProfile,
        setSelectedUserProfile,
        openFollowersModal,
        openFollowingModal,
        openExplorePost,
        toggleFollowUser,
        celebrateAction,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
