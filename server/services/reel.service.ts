import { reelRepository } from '../repositories/reel.repository';
import { userRepository } from '../repositories/user.repository';
import { uploadToCloudinary } from '../utils/cloudinary';
import { jobQueue } from '../core/queue/queue';
import { JobType } from '../core/queue/job-types';
import { query } from '../core/database/pool';

export class ReelService {
  async getReels(options: {
    currentUserId?: string;
    category?: string;
    limit: number;
    offset: number;
  }) {
    const rawReels = await reelRepository.getReels(options);

    return rawReels.map((r) => {
      const defaultQualities = [
        { label: 'Auto (1080p)', resolution: '1080p', bitrate: '6.2 Mbps', url: r.video_url },
        { label: 'High (720p)', resolution: '720p', bitrate: '3.8 Mbps', url: r.video_url },
        { label: 'Medium (480p)', resolution: '480p', bitrate: '1.9 Mbps', url: r.video_url },
        { label: 'Data Saver (360p)', resolution: '360p', bitrate: '0.8 Mbps', url: r.video_url },
      ];

      let parsedQualities = defaultQualities;
      if (r.qualities) {
        parsedQualities = typeof r.qualities === 'string' ? JSON.parse(r.qualities) : r.qualities;
      }

      return {
        id: r.id,
        userId: r.user_id,
        author: {
          id: r.user_id,
          username: r.username,
          name: r.name,
          avatar: r.avatar,
          bio: r.bio || '',
          isVerified: r.is_verified,
          isFollowing: Boolean(r.author_is_following),
          followersCount: parseInt(r.author_followers_count || '0', 10),
          followingCount: parseInt(r.author_following_count || '0', 10),
          postsCount: parseInt(r.author_posts_count || '0', 10),
        },
        videoUrl: r.video_url,
        posterUrl: r.poster_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        caption: r.caption || '',
        musicTrack: typeof r.music_track === 'string' ? JSON.parse(r.music_track) : r.music_track || { title: 'Original Audio', artist: r.username },
        likesCount: parseInt(r.likes_count || '0', 10),
        commentsCount: parseInt(r.comments_count || '0', 10),
        sharesCount: parseInt(r.shares_count || '0', 10) + Math.floor(parseInt(r.likes_count || '0', 10) * 0.15),
        viewsCount: parseInt(r.views_count || '0', 10) || 1200,
        duration: parseInt(r.duration_secs || '15', 10),
        isLiked: Boolean(r.isLiked),
        isSaved: Boolean(r.isSaved),
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [],
        qualities: parsedQualities,
        createdAt: r.created_at,
      };
    });
  }

  async createReel(data: {
    userId: string;
    videoUrl: string;
    posterUrl?: string;
    caption?: string;
    musicTrack?: any;
    tags?: string[];
    duration?: number;
  }) {
    let finalPoster = data.posterUrl;
    if (data.posterUrl && data.posterUrl.startsWith('data:image')) {
      const uploadRes = await uploadToCloudinary(data.posterUrl, 'instavibe_reels');
      finalPoster = uploadRes.url;
    }
    if (!finalPoster) {
      finalPoster = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
    }

    const reelId = `reel_${Date.now()}`;
    const qualities = [
      { label: 'Auto (1080p)', resolution: '1080p', bitrate: '6.2 Mbps', url: data.videoUrl },
      { label: 'High (720p)', resolution: '720p', bitrate: '3.8 Mbps', url: data.videoUrl },
      { label: 'Medium (480p)', resolution: '480p', bitrate: '1.9 Mbps', url: data.videoUrl },
      { label: 'Data Saver (360p)', resolution: '360p', bitrate: '0.8 Mbps', url: data.videoUrl },
    ];

    await reelRepository.createReel({
      id: reelId,
      userId: data.userId,
      videoUrl: data.videoUrl,
      posterUrl: finalPoster,
      caption: data.caption || '',
      musicTrack: data.musicTrack,
      tags: data.tags || [],
      duration: data.duration || 15,
      qualities,
    });

    const author = await userRepository.findById(data.userId);

    return {
      id: reelId,
      userId: data.userId,
      author: {
        id: author?.id || data.userId,
        username: author?.username || 'user',
        name: author?.name || 'User',
        avatar: author?.avatar || '',
        bio: author?.bio || '',
        isVerified: author?.is_verified || false,
        isFollowing: false,
        followersCount: author?.followers_count || 0,
        followingCount: author?.following_count || 0,
        postsCount: author?.posts_count || 0,
      },
      videoUrl: data.videoUrl,
      posterUrl: finalPoster,
      caption: data.caption || '',
      musicTrack: data.musicTrack || { title: 'Original Audio', artist: author?.username || 'user' },
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      duration: data.duration || 15,
      isLiked: false,
      isSaved: false,
      tags: data.tags || [],
      qualities,
      createdAt: new Date().toISOString(),
    };
  }

  async toggleLike(reelId: string, userId: string) {
    const res = await reelRepository.toggleLike(reelId, userId);
    if (res.isLiked) {
      const reel = await reelRepository.findById(reelId);
      if (reel && reel.user_id !== userId) {
        await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
          recipientId: reel.user_id,
          senderId: userId,
          type: 'like',
          targetMediaUrl: reel.poster_url,
          text: 'liked your reel.',
        });
      }
    }
    return res;
  }

  async toggleSave(reelId: string, userId: string) {
    const isSaved = await reelRepository.toggleSave(reelId, userId);
    return { success: true, isSaved };
  }

  async getComments(reelId: string, currentUserId: string) {
    return reelRepository.getComments(reelId, currentUserId);
  }

  async addComment(reelId: string, userId: string, text: string) {
    const commentId = `rc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await reelRepository.addComment(commentId, reelId, userId, text);

    const user = await userRepository.findById(userId);
    const reel = await reelRepository.findById(reelId);

    if (reel && reel.user_id !== userId) {
      await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
        recipientId: reel.user_id,
        senderId: userId,
        type: 'comment',
        targetMediaUrl: reel.poster_url,
        text: `commented on your reel: "${text.trim().slice(0, 30)}${text.length > 30 ? '...' : ''}"`,
      });
    }

    return {
      id: commentId,
      userId,
      username: user?.username || 'user',
      userAvatar: user?.avatar || '',
      text: text.trim(),
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
    };
  }

  async recordWatch(reelId: string, userId: string, watchDurationSecs: number, progressPercent: number) {
    await reelRepository.recordWatch(reelId, userId, watchDurationSecs, progressPercent);
    return { success: true };
  }

  async getHistory(userId: string) {
    return reelRepository.getWatchHistory(userId);
  }

  async clearHistory(userId: string) {
    await query('DELETE FROM reel_watch_history WHERE user_id = $1', [userId]);
    return { success: true };
  }

  async getSuggested(reelId?: string, currentUserId?: string) {
    const reels = await this.getReels({
      currentUserId: currentUserId || 'none',
      category: 'trending',
      limit: 10,
      offset: 0,
    });
    return reelId ? reels.filter((r) => r.id !== reelId) : reels;
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const checkRes = await query(
      'SELECT 1 FROM reel_comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );
    let isLiked = false;
    if (checkRes.rows.length > 0) {
      await query('DELETE FROM reel_comment_likes WHERE comment_id = $1 AND user_id = $2', [
        commentId,
        userId,
      ]);
      await query('UPDATE reel_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [
        commentId,
      ]);
      isLiked = false;
    } else {
      await query(
        'INSERT INTO reel_comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [commentId, userId]
      );
      await query('UPDATE reel_comments SET likes_count = likes_count + 1 WHERE id = $1', [commentId]);
      isLiked = true;
    }
    return { success: true, isLiked };
  }
}

export const reelService = new ReelService();
