import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export class StoryRepository extends BaseRepository<any> {
  protected tableName = 'stories';

  async getAllStoriesWithUsers(currentUserId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        s.*,
        u.username,
        u.name,
        u.avatar,
        u.is_verified,
        EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND user_id = $1) as "isSeen",
        EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = $1) as "isLiked",
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id)::int as "viewsCount",
        (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id)::int as "likesCount"
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (
        COALESCE(u.is_private, false) = false
        OR s.user_id = $1
        OR EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = s.user_id)
      )
      AND (
        COALESCE(s.is_close_friends, false) = false
        OR s.user_id = $1
        OR EXISTS(SELECT 1 FROM close_friends WHERE user_id = s.user_id AND friend_id = $1)
      )
      AND s.created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY s.created_at DESC`,
      [currentUserId || 'none']
    );
    return res.rows;
  }

  async createStory(story: {
    id: string;
    userId: string;
    mediaUrl: string;
    mediaType: string;
    caption: string;
    filter: string;
    link: string;
    isCloseFriends?: boolean;
    poll?: any;
    question?: any;
    music?: any;
  }): Promise<void> {
    await query(
      `INSERT INTO stories (id, user_id, media_url, media_type, caption, filter, link, is_close_friends, poll, question, music)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        story.id,
        story.userId,
        story.mediaUrl,
        story.mediaType,
        story.caption,
        story.filter,
        story.link,
        Boolean(story.isCloseFriends),
        story.poll ? JSON.stringify(story.poll) : null,
        story.question ? JSON.stringify(story.question) : null,
        story.music ? JSON.stringify(story.music) : null,
      ]
    );
  }

  async votePoll(storyId: string, userId: string, optionId: string): Promise<any> {
    const res = await query(`SELECT poll FROM stories WHERE id = $1`, [storyId]);
    if (!res.rows[0] || !res.rows[0].poll) return null;
    let poll = typeof res.rows[0].poll === 'string' ? JSON.parse(res.rows[0].poll) : res.rows[0].poll;
    if (!poll || !Array.isArray(poll.options)) return null;

    poll.options = poll.options.map((opt: any) => {
      const voters = Array.isArray(opt.voterUserIds) ? opt.voterUserIds.filter((id: string) => id !== userId) : [];
      if (opt.id === optionId) {
        voters.push(userId);
      }
      return {
        ...opt,
        voterUserIds: voters,
        votesCount: voters.length,
      };
    });

    const totalVotes = poll.options.reduce((acc: number, o: any) => acc + (o.votesCount || 0), 0);
    poll.totalVotes = totalVotes;
    poll.userVotedOptionId = optionId;

    await query(`UPDATE stories SET poll = $1 WHERE id = $2`, [JSON.stringify(poll), storyId]);
    return poll;
  }

  async submitQuestionResponse(
    storyId: string,
    user: { id: string; username: string; avatar: string },
    responseText: string
  ): Promise<any> {
    const res = await query(`SELECT question FROM stories WHERE id = $1`, [storyId]);
    if (!res.rows[0] || !res.rows[0].question) return null;
    let question = typeof res.rows[0].question === 'string' ? JSON.parse(res.rows[0].question) : res.rows[0].question;
    if (!question) return null;

    if (!Array.isArray(question.responses)) {
      question.responses = [];
    }

    const newResponse = {
      id: 'qr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      response: responseText,
      timestamp: 'Just now',
    };

    question.responses.unshift(newResponse);

    await query(`UPDATE stories SET question = $1 WHERE id = $2`, [JSON.stringify(question), storyId]);
    return question;
  }

  async recordView(storyId: string, userId: string): Promise<void> {
    await query(
      `INSERT INTO story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [storyId, userId]
    );
  }

  async toggleLike(storyId: string, userId: string): Promise<boolean> {
    const existing = await query(
      `SELECT 1 FROM story_likes WHERE story_id = $1 AND user_id = $2`,
      [storyId, userId]
    );
    if (existing.rows.length > 0) {
      await query(`DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2`, [storyId, userId]);
      return false;
    } else {
      await query(`INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2)`, [storyId, userId]);
      return true;
    }
  }

  async getViewers(storyId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.avatar, u.is_verified, sv.created_at as viewed_at,
        EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = $1 AND sl.user_id = u.id) as has_liked
      FROM story_views sv
      JOIN users u ON sv.user_id = u.id
      WHERE sv.story_id = $1
      ORDER BY sv.created_at DESC`,
      [storyId]
    );
    return res.rows;
  }

  async getUserArchive(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT * FROM stories WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async getUserHighlights(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT * FROM highlights WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const highlights = [];
    for (const h of res.rows) {
      const items = await query(
        `SELECT * FROM highlight_items WHERE highlight_id = $1 ORDER BY order_index ASC, created_at ASC`,
        [h.id]
      );
      highlights.push({
        id: h.id,
        userId: h.user_id,
        title: h.title,
        coverUrl: h.cover_url,
        items: items.rows,
        storiesCount: items.rows.length,
      });
    }
    return highlights;
  }
}

export const storyRepository = new StoryRepository();
