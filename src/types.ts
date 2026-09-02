export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar: string;
  bio: string;
  website?: string;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
  authProvider?: 'email' | 'google' | 'apple' | 'passkey';
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  pronouns?: string;
  blockedUserIds?: string[];
  note?: {
    text: string;
    emoji?: string;
    musicTrack?: string;
    expiresAt?: number;
    createdAt?: string;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
  isRevoked?: boolean;
}

export interface TrustedDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  fingerprint: string;
  firstSeenAt: string;
  lastActiveAt: string;
  isTrusted: boolean;
}

export interface LoginActivityLog {
  id: string;
  userId: string;
  ipAddress: string;
  location: string;
  deviceName: string;
  browser: string;
  os: string;
  method?: string;
  status: 'success' | 'suspicious' | 'failed' | 'blocked';
  reasons?: string[];
  createdAt: string;
  timestamp?: string;
}

export interface TwoFactorConfig {
  isEnabled: boolean;
  method: 'totp' | 'sms' | 'email';
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  verifiedAt?: string;
}

export interface PasskeyCredential {
  id: string;
  name: string;
  publicKey: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SuspiciousLoginAlert {
  id: string;
  userId: string;
  ipAddress: string;
  location: string;
  deviceName: string;
  browser: string;
  os: string;
  reason?: string;
  deviceInfo?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  isResolved: boolean;
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: string;
  rawTimestamp?: string;
  caption?: string;
  filter?: FilterType;
  seen?: boolean;
  isLiked?: boolean;
  viewsCount?: number;
  likesCount?: number;
  link?: string;
}

export interface StoryGroup {
  userId: string;
  username: string;
  name: string;
  avatar: string;
  isVerified?: boolean;
  hasUnseen: boolean;
  items: StoryItem[];
}

export interface PostMedia {
  url: string;
  filter?: FilterType;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  author: User;
  media: PostMedia[];
  caption: string;
  location?: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: Comment[];
  tags?: string[];
  musicTrack?: {
    title: string;
    artist: string;
  };
}

export interface ReelQuality {
  label: string;
  resolution: string;
  bitrate: string;
  url: string;
}

export interface Reel {
  id: string;
  userId: string;
  author: User;
  videoUrl: string;
  posterUrl: string;
  caption: string;
  musicTrack: {
    title: string;
    artist: string;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  duration?: number;
  isLiked: boolean;
  isSaved: boolean;
  tags?: string[];
  qualities?: ReelQuality[];
  createdAt?: string;
}

export interface ReelWatchHistoryItem {
  id: string;
  reelId: string;
  watchedAt: string;
  watchDurationSecs: number;
  progressPercent: number;
  reel: Reel;
}

export interface DirectMessageReply {
  id: string;
  text: string;
  senderUsername: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'gif';
}

export interface DirectMessageSharedPost {
  id: string;
  authorUsername: string;
  authorAvatar: string;
  mediaUrl: string;
  caption: string;
  type?: 'post' | 'reel' | 'story';
}

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'gif';
  videoUrl?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  audioUrl?: string;
  audioDuration?: number;
  timestamp: string;
  isSeen: boolean;
  status?: MessageDeliveryStatus;
  reactions?: Record<string, string[]>; // emoji -> array of userIds who reacted
  reaction?: string; // legacy single reaction
  isAudio?: boolean;
  isSticker?: boolean;
  stickerUrl?: string;
  isGif?: boolean;
  gifUrl?: string;
  replyTo?: DirectMessageReply;
  sharedPost?: DirectMessageSharedPost;
  isVanish?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deliveredAt?: string;
  readAt?: string;
  _sortTime?: number;
}

export interface ChatTheme {
  id?: string;
  name?: string;
  bubbleColor?: string; // CSS class or hex
  bubbleGradient?: string; // e.g. "linear-gradient(135deg, ...)"
  backgroundColor?: string;
  backgroundGradient?: string;
  wallpaperPattern?: string;
  textColor?: string;
  accentColor?: string;
  backgroundUrl?: string; // Custom wallpaper/image URL
  backgroundBlur?: number;
  backgroundOpacity?: number;
  bubbleStylePreset?: string;
}

export interface ChatThread {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageStatus?: MessageDeliveryStatus;
  lastSenderId?: string;
  unreadCount: number;
  messages: DirectMessage[];
  theme?: ChatTheme;
  note?: {
    text: string;
    emoji?: string;
    musicTrack?: string;
  };
  category?: 'primary' | 'general' | 'requests';
  isMuted?: boolean;
  isPinned?: boolean;
  vanishMode?: boolean;
  typingUsers?: string[];
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'story_like'
  | 'tag'
  | 'direct_message';

export interface AppNotification {
  id: string;
  type: NotificationType;
  user: User;
  actors?: User[]; // Grouped multiple users taking the same action (e.g. 4 likes on same post)
  totalActorsCount?: number;
  isGrouped?: boolean;
  actionGroupKey?: string;
  targetPostId?: string;
  targetMediaUrl?: string;
  targetMediaType?: 'image' | 'video';
  text: string;
  commentText?: string;
  timestamp: string;
  rawTimestamp?: string;
  isRead: boolean;
  isLikedBack?: boolean;
  repliedText?: string;
  priority?: 'high' | 'normal' | 'low';
}

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'likes'
  | 'comments'
  | 'follows'
  | 'mentions'
  | 'tags'
  | 'requests';

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  directMessages: boolean;
  storyLikes: boolean;
  soundEnabled: boolean;
  pushEnabled: boolean;
}

export type FilterType =
  | 'normal'
  | 'clarendon'
  | 'gingham'
  | 'juno'
  | 'lark'
  | 'valencia'
  | 'aden'
  | 'moon'
  | 'crema'
  | 'slumber'
  | 'vintage'
  | 'cyber';

export interface FilterOption {
  id: FilterType;
  name: string;
  cssClass: string;
}

export type TabType = 'feed' | 'explore' | 'create' | 'reels' | 'messages' | 'notifications' | 'profile';

export interface HighlightStoryItem {
  id: string;
  highlightId?: string;
  storyId?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  filter?: FilterType;
  timestamp?: string;
}

export interface HighlightItem {
  id: string;
  userId?: string;
  title: string;
  coverUrl: string;
  storiesCount: number;
  items?: HighlightStoryItem[];
  createdAt?: string;
}

export interface ArchivedStoryItem {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  filter?: FilterType;
  timestamp: string;
  rawTimestamp?: string;
}

