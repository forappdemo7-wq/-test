import { postRepository } from '../repositories/post.repository';
import { userRepository } from '../repositories/user.repository';
import { uploadToCloudinary } from '../utils/cloudinary';
import { jobQueue } from '../core/queue/queue';
import { JobType } from '../core/queue/job-types';
import { query } from '../core/database/pool';
import { NotFoundError, BadRequestError } from '../core/errors/app-error';

export class PostService {
  async getPosts(currentUserId: string = '', limit: number = 20, offset: number = 0) {
    const rawPosts = await postRepository.getFeedPosts(currentUserId, limit, offset);
    const postIds = rawPosts.map((p) => p.id);
    const rawComments = await postRepository.getCommentsByPostIds(postIds, currentUserId);

    const commentsByPost: Record<string, any[]> = {};
    for (const c of rawComments) {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
      commentsByPost[c.post_id].push({
        id: c.id,
        userId: c.user_id,
        username: c.username,
        userAvatar: c.user_avatar,
        text: c.text,
        timestamp: c.created_at,
        likesCount: c.likes_count || 0,
        isLiked: c.isLiked || false,
      });
    }

    return rawPosts.map((p) => ({
      id: p.id,
      userId: p.user_id,
      author: {
        id: p.user_id,
        username: p.author_username,
        name: p.author_name,
        avatar: p.author_avatar,
        bio: p.author_bio || '',
        isVerified: p.author_is_verified,
        isFollowing: p.author_is_following,
        followersCount: parseInt(p.author_followers_count || '0', 10),
        followingCount: parseInt(p.author_following_count || '0', 10),
        postsCount: parseInt(p.author_posts_count || '0', 10),
      },
      media: typeof p.media === 'string' ? JSON.parse(p.media) : p.media || [],
      caption: p.caption || '',
      location: p.location || '',
      timestamp: p.created_at,
      likesCount: parseInt(p.likes_count || '0', 10),
      commentsCount: parseInt(p.comments_count || '0', 10) || (commentsByPost[p.id]?.length ?? 0),
      isLiked: Boolean(p.isLiked),
      isSaved: Boolean(p.isSaved),
      comments: commentsByPost[p.id] || [],
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags || [],
      musicTrack: typeof p.music_track === 'string' ? JSON.parse(p.music_track) : p.music_track,
    }));
  }

  async createPost(data: {
    userId: string;
    caption?: string;
    location?: string;
    media: any[];
    tags?: string[];
    musicTrack?: any;
  }) {
    if (!data.userId) {
      throw new BadRequestError('User ID is required');
    }

    const processedMedia = [];
    for (const item of data.media) {
      let finalUrl = item.url;
      if (item.url && item.url.startsWith('data:image')) {
        const uploadRes = await uploadToCloudinary(item.url, 'instavibe_posts');
        finalUrl = uploadRes.url;
      }
      processedMedia.push({
        ...item,
        url: finalUrl,
      });
    }

    const postId = `post_${Date.now()}`;
    await postRepository.createPost({
      id: postId,
      userId: data.userId,
      caption: data.caption || '',
      location: data.location || '',
      tags: data.tags || [],
      musicTrack: data.musicTrack,
      media: processedMedia,
    });

    const author = await userRepository.findById(data.userId);

    // Queue media optimization job in background
    if (processedMedia[0]?.url) {
      await jobQueue.add(JobType.PROCESS_MEDIA, {
        postId,
        mediaUrl: processedMedia[0].url,
      });
    }

    return {
      id: postId,
      userId: data.userId,
      author: {
        id: author?.id || data.userId,
        username: author?.username || 'user',
        name: author?.name || 'User',
        avatar: author?.avatar || '',
        bio: author?.bio || '',
        isVerified: author?.is_verified || false,
        followersCount: author?.followers_count || 0,
        followingCount: author?.following_count || 0,
        postsCount: (author?.posts_count || 0) + 1,
      },
      media: processedMedia,
      caption: data.caption || '',
      location: data.location || '',
      timestamp: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      tags: data.tags || [],
      musicTrack: data.musicTrack,
    };
  }

  async deletePost(postId: string) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError('Post');
    }
    await postRepository.deleteById(postId);
    await query('UPDATE users SET posts_count = GREATEST(0, posts_count - 1) WHERE id = $1', [post.user_id]);
    return { success: true, postId };
  }

  async toggleLike(postId: string, userId: string) {
    const isLiked = await postRepository.isLiked(postId, userId);
    let newIsLiked = false;

    if (isLiked) {
      await postRepository.removeLike(postId, userId);
      newIsLiked = false;
    } else {
      await postRepository.addLike(postId, userId);
      newIsLiked = true;

      const post = await postRepository.findById(postId);
      if (post && post.user_id !== userId) {
        const media = typeof post.media === 'string' ? JSON.parse(post.media) : post.media;
        await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
          recipientId: post.user_id,
          senderId: userId,
          type: 'like',
          postId,
          targetMediaUrl: media?.[0]?.url || '',
          text: 'liked your post',
        });
      }
    }

    const post = await postRepository.findById(postId);
    return {
      success: true,
      isLiked: newIsLiked,
      likesCount: post?.likes_count || 0,
    };
  }

  async toggleSave(postId: string, userId: string) {
    const isSaved = await postRepository.isSaved(postId, userId);
    if (isSaved) {
      await postRepository.removeSave(postId, userId);
      return { success: true, isSaved: false };
    } else {
      await postRepository.addSave(postId, userId);
      return { success: true, isSaved: true };
    }
  }

  async addComment(postId: string, userId: string, text: string) {
    const commentId = `comm_${Date.now()}`;
    await postRepository.addComment(commentId, postId, userId, text.trim());

    const user = await userRepository.findById(userId);
    const post = await postRepository.findById(postId);

    if (post && post.user_id !== userId) {
      const media = typeof post.media === 'string' ? JSON.parse(post.media) : post.media;
      await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
        recipientId: post.user_id,
        senderId: userId,
        type: 'comment',
        postId,
        targetMediaUrl: media?.[0]?.url || '',
        text: `commented: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`,
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
}

export const postService = new PostService();
