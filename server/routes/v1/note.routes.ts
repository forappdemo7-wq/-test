import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../core/database/pool';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/notes - fetch active notes within 24h
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = (req.query.currentUserId as string) || req.user?.id || '';

    let result;
    try {
      result = await query(
        `SELECT n.user_id, n.text, n.emoji, n.music_track, n.audience, n.created_at, n.expires_at,
                u.username, u.name, u.avatar, u.is_verified
         FROM user_notes n
         JOIN users u ON n.user_id = u.id
         WHERE n.expires_at > NOW()
         ORDER BY n.created_at DESC`
      );
    } catch (queryErr: any) {
      if (queryErr?.message?.includes('does not exist') || queryErr?.message?.includes('relation "user_notes"')) {
        await query(`
          CREATE TABLE IF NOT EXISTS user_notes (
            user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            text VARCHAR(60) NOT NULL,
            emoji VARCHAR(16) DEFAULT '💭',
            music_track JSONB DEFAULT NULL,
            audience VARCHAR(32) DEFAULT 'followers_you_follow_back',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
          );
        `);
        res.json([]);
        return;
      }
      throw queryErr;
    }

    const notes = result.rows.map((row) => ({
      userId: row.user_id,
      text: row.text,
      emoji: row.emoji || '💭',
      musicTrack: typeof row.music_track === 'string' ? JSON.parse(row.music_track) : row.music_track,
      audience: row.audience || 'followers_you_follow_back',
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      user: {
        id: row.user_id,
        username: row.username,
        name: row.name,
        avatar: row.avatar,
        isVerified: row.is_verified,
      },
    }));

    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// POST /api/notes - publish or update a note
router.post('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const { text, emoji = '💭', musicTrack = null, audience = 'followers_you_follow_back' } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Note text is required' });
      return;
    }

    const trimmedText = text.trim().slice(0, 60);
    const musicTrackJson = musicTrack ? JSON.stringify(musicTrack) : null;

    let result;
    try {
      result = await query(
        `INSERT INTO user_notes (user_id, text, emoji, music_track, audience, created_at, expires_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), NOW() + INTERVAL '24 hours')
         ON CONFLICT (user_id) DO UPDATE SET
           text = EXCLUDED.text,
           emoji = EXCLUDED.emoji,
           music_track = EXCLUDED.music_track,
           audience = EXCLUDED.audience,
           created_at = NOW(),
           expires_at = NOW() + INTERVAL '24 hours'
         RETURNING *`,
        [userId, trimmedText, emoji, musicTrackJson, audience]
      );
    } catch (insertErr: any) {
      if (insertErr?.message?.includes('does not exist') || insertErr?.message?.includes('relation "user_notes"')) {
        await query(`
          CREATE TABLE IF NOT EXISTS user_notes (
            user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            text VARCHAR(60) NOT NULL,
            emoji VARCHAR(16) DEFAULT '💭',
            music_track JSONB DEFAULT NULL,
            audience VARCHAR(32) DEFAULT 'followers_you_follow_back',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
          );
        `);
        result = await query(
          `INSERT INTO user_notes (user_id, text, emoji, music_track, audience, created_at, expires_at)
           VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), NOW() + INTERVAL '24 hours')
           ON CONFLICT (user_id) DO UPDATE SET
             text = EXCLUDED.text,
             emoji = EXCLUDED.emoji,
             music_track = EXCLUDED.music_track,
             audience = EXCLUDED.audience,
             created_at = NOW(),
             expires_at = NOW() + INTERVAL '24 hours'
           RETURNING *`,
          [userId, trimmedText, emoji, musicTrackJson, audience]
        );
      } else {
        throw insertErr;
      }
    }

    const saved = result.rows[0];
    res.json({
      userId: saved.user_id,
      text: saved.text,
      emoji: saved.emoji,
      musicTrack: typeof saved.music_track === 'string' ? JSON.parse(saved.music_track) : saved.music_track,
      audience: saved.audience,
      createdAt: saved.created_at,
      expiresAt: saved.expires_at,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notes - delete user note
router.delete('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.query.userId as string) || req.user?.id || req.body?.userId;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    try {
      await query(`DELETE FROM user_notes WHERE user_id = $1`, [userId]);
    } catch (delErr: any) {
      if (!delErr?.message?.includes('does not exist')) {
        throw delErr;
      }
    }
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export const noteRoutes = router;
