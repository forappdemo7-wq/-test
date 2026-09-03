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

      let poll = s.poll ? (typeof s.poll === 'string' ? JSON.parse(s.poll) : s.poll) : undefined;
      let question = s.question ? (typeof s.question === 'string' ? JSON.parse(s.question) : s.question) : undefined;
      let music = s.music ? (typeof s.music === 'string' ? JSON.parse(s.music) : s.music) : undefined;

      if (poll && Array.isArray(poll.options)) {
        // Calculate userVotedOptionId if current user voted
        const votedOption = poll.options.find((opt: any) =>
          Array.isArray(opt.voterUserIds) && opt.voterUserIds.includes(currentUserId)
        );
        poll.userVotedOptionId = votedOption ? votedOption.id : undefined;
        poll.totalVotes = poll.options.reduce((acc: number, o: any) => acc + (o.votesCount || 0), 0);
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
        poll,
        question,
        music,
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
    poll?: any;
    question?: any;
    music?: any;
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
      poll: data.poll,
      question: data.question,
      music: data.music,
    });

    return {
      id: storyId,
      userId: data.userId,
      mediaUrl: finalMediaUrl,
      mediaType: data.mediaType || 'image',
      caption: data.caption || '',
      filter: data.filter || 'normal',
      link: data.link || '',
      isCloseFriends: Boolean(data.isCloseFriends),
      poll: data.poll,
      question: data.question,
      music: data.music,
      timestamp: 'Just now',
      rawTimestamp: new Date().toISOString(),
      seen: false,
      isLiked: false,
      viewsCount: 0,
      likesCount: 0,
    };
  }

  async votePoll(storyId: string, userId: string, optionId: string) {
    const updatedPoll = await storyRepository.votePoll(storyId, userId, optionId);
    return { success: true, poll: updatedPoll };
  }

  async submitQuestionResponse(
    storyId: string,
    user: { id: string; username: string; avatar: string },
    response: string
  ) {
    const updatedQuestion = await storyRepository.submitQuestionResponse(storyId, user, response);
    return { success: true, question: updatedQuestion };
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
