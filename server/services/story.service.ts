import { storyRepository } from '../repositories/story.repository';
import { uploadToCloudinary } from '../utils/cloudinary';
import { query } from '../core/database/pool';
import { jobQueue } from '../core/queue/queue';
import { JobType } from '../core/queue/job-types';

export class StoryService {
  async getStoryGroups(currentUserId: string = 'user_current') {
    const rawStories = await storyRepository.getAllStoriesWithUsers(currentUserId);
    const groupedMap: Record<string, any> = {};

    for (const s of rawStories) {
      if (!groupedMap[s.user_id]) {
        groupedMap[s.user_id] = {
          userId: s.user_id,
          username: s.username,
          name: s.name,
          avatar: s.avatar,
          isVerified: s.is_verified,
          hasUnseen: false,
          hasCloseFriends: false,
          items: [],
        };
      }

      const isSeen = s.isSeen || false;
      const isCloseFriends = Boolean(s.is_close_friends);
      if (!isSeen && s.user_id !== currentUserId) {
        groupedMap[s.user_id].hasUnseen = true;
      }
      if (isCloseFriends) {
        groupedMap[s.user_id].hasCloseFriends = true;
      }

      let timeAgo = 'Just now';
      if (s.created_at) {
        const diffSecs = Math.max(0, Math.floor((Date.now() - new Date(s.created_at).getTime()) / 1000));
        if (diffSecs < 60) timeAgo = 'Just now';
        else if (diffSecs < 3600) timeAgo = `${Math.floor(diffSecs / 60)}m`;
        else if (diffSecs < 86400) timeAgo = `${Math.floor(diffSecs / 3600)}h`;
        else if (diffSecs < 604800) timeAgo = `${Math.floor(diffSecs / 86400)}d`;
        else timeAgo = `${Math.floor(diffSecs / 604800)}w`;
      }

      groupedMap[s.user_id].items.push({
        id: s.id,
        mediaUrl: s.media_url,
        mediaType: s.media_type || 'image',
        timestamp: timeAgo,
        rawTimestamp: s.created_at,
        caption: s.caption || '',
        filter: s.filter || 'normal',
        seen: isSeen,
        isLiked: Boolean(s.isLiked),
        isCloseFriends,
        viewsCount: s.viewsCount || 0,
        likesCount: s.likesCount || 0,
        link: s.link || '',
      });
    }

    return Object.values(groupedMap);
  }

  async createStory(data: {
    userId: string;
    mediaUrl: string;
    mediaType?: string;
    caption?: string;
    filter?: string;
    link?: string;
    isCloseFriends?: boolean;
  }) {
    let finalMediaUrl = data.mediaUrl;
    if (data.mediaUrl && data.mediaUrl.startsWith('data:image')) {
      const uploadRes = await uploadToCloudinary(data.mediaUrl, 'instavibe_stories');
      finalMediaUrl = uploadRes.url;
    }

    const storyId = `story_${Date.now()}`;
    await storyRepository.createStory({
      id: storyId,
      userId: data.userId,
      mediaUrl: finalMediaUrl,
      mediaType: data.mediaType || 'image',
      caption: data.caption || '',
      filter: data.filter || 'normal',
      link: data.link || '',
      isCloseFriends: Boolean(data.isCloseFriends),
    });

    return {
      id: storyId,
      userId: data.userId,
      mediaUrl: finalMediaUrl,
      mediaType: data.mediaType || 'image',
      caption: data.caption || '',
      filter: data.filter || 'normal',
      link: data.link || '',
      timestamp: 'Just now',
      rawTimestamp: new Date().toISOString(),
      seen: false,
      isLiked: false,
      viewsCount: 0,
      likesCount: 0,
    };
  }

  async recordView(storyId: string, userId: string) {
    await storyRepository.recordView(storyId, userId);
    return { success: true };
  }

  async toggleLike(storyId: string, userId: string) {
    const isLiked = await storyRepository.toggleLike(storyId, userId);
    if (isLiked) {
      const story = await storyRepository.findById(storyId);
      if (story && story.user_id !== userId) {
        await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
          recipientId: story.user_id,
          senderId: userId,
          type: 'story_like',
          targetMediaUrl: story.media_url,
          text: 'liked your story.',
        });
      }
    }
    return { success: true, isLiked };
  }

  async getViewers(storyId: string) {
    return storyRepository.getViewers(storyId);
  }

  async deleteStory(storyId: string) {
    await storyRepository.deleteById(storyId);
    return { success: true };
  }

  async getArchive(userId: string) {
    return storyRepository.getUserArchive(userId);
  }

  async getHighlights(userId: string) {
    return storyRepository.getUserHighlights(userId);
  }
}

export const storyService = new StoryService();
