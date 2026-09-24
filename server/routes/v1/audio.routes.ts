import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../core/database/pool';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

const DEFAULT_SOUNDTRACKS = [
  {
    id: 'track_1',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    category: 'Trending',
    useCount: '2.4M',
    isTrending: true,
  },
  {
    id: 'track_2',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/soft_morning_birds.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
    category: 'Pop & Vibes',
    useCount: '1.8M',
    isTrending: true,
  },
  {
    id: 'track_3',
    title: 'Good Luck, Babe!',
    artist: 'Chappell Roan',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/musical_instruments/acoustic_guitar_strumming.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    category: 'Trending',
    useCount: '950K',
    isTrending: true,
  },
  {
    id: 'track_4',
    title: 'As It Was',
    artist: 'Harry Styles',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/musical_instruments/funky_synth_bass.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    category: 'Feel Good',
    useCount: '3.1M',
    isTrending: true,
  },
  {
    id: 'track_5',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/weather/summer_gentle_rain.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80',
    category: 'Pop & Vibes',
    useCount: '4.2M',
    isTrending: false,
  },
  {
    id: 'track_6',
    title: 'Midnight City (Synth Chill)',
    artist: 'M83 Aesthetic Edit',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/deep_space_pulse.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
    category: 'Aesthetic & Lo-Fi',
    useCount: '1.2M',
    isTrending: true,
  },
  {
    id: 'track_7',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/transportation/subway_train_moving_fast.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
    category: 'Night Drive',
    useCount: '2.9M',
    isTrending: false,
  },
  {
    id: 'track_8',
    title: 'Golden Hour (Lofi Piano)',
    artist: 'JVKE',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/musical_instruments/harp_sweep_up.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
    category: 'Aesthetic & Lo-Fi',
    useCount: '1.5M',
    isTrending: true,
  },
  {
    id: 'track_9',
    title: 'Daylight',
    artist: 'David Kushner',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/forest_wind_rustle.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&auto=format&fit=crop&q=80',
    category: 'Cinematic & Mood',
    useCount: '820K',
    isTrending: false,
  },
  {
    id: 'track_10',
    title: 'Greedy',
    artist: 'Tate McRae',
    duration: 30,
    audioUrl: 'https://actions.google.com/sounds/v1/musical_instruments/percussion_hip_hop_loop.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
    category: 'Trending',
    useCount: '2.1M',
    isTrending: true,
  },
];

// GET /api/audio - list all popular sounds
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = (req.query.currentUserId as string) || req.user?.id || '';

    // Check saved audios for user
    let savedTrackIds: string[] = [];
    if (currentUserId) {
      const savedRes = await query(`SELECT track_id FROM saved_audios WHERE user_id = $1`, [currentUserId]);
      savedTrackIds = savedRes.rows.map((r) => r.track_id);
    }

    const enrichedTracks = DEFAULT_SOUNDTRACKS.map((t) => ({
      ...t,
      isSaved: savedTrackIds.includes(t.id),
    }));

    res.json(enrichedTracks);
  } catch (error) {
    next(error);
  }
});

// GET /api/audio/:id - detail view with matching posts & reels
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUserId = (req.query.currentUserId as string) || req.user?.id || '';

    // Find in default catalog or fallback
    let track = DEFAULT_SOUNDTRACKS.find(
      (t) => t.id === id || t.title.toLowerCase() === decodeURIComponent(id).toLowerCase()
    );

    if (!track) {
      // Decode title if passed by name
      const decodedName = decodeURIComponent(id);
      track = {
        id: `custom_${encodeURIComponent(decodedName)}`,
        title: decodedName,
        artist: 'Original Audio',
        duration: 30,
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/soft_morning_birds.ogg',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
        category: 'Original',
        useCount: '1.2K',
        isTrending: true,
      };
    }

    // Check isSaved
    let isSaved = false;
    if (currentUserId) {
      try {
        const savedRes = await query(
          `SELECT 1 FROM saved_audios WHERE user_id = $1 AND track_id = $2`,
          [currentUserId, track.id]
        );
        isSaved = (savedRes.rowCount ?? 0) > 0;
      } catch (err: any) {
        if (err?.message?.includes('does not exist')) {
          await query(`
            CREATE TABLE IF NOT EXISTS saved_audios (
              user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              track_id VARCHAR(255) NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (user_id, track_id)
            );
          `);
        }
      }
    }

    // Fetch posts that use this sound
    const postsRes = await query(
      `SELECT p.id, p.caption, p.created_at, p.music_track,
              u.id as user_id, u.username, u.name, u.avatar,
              (SELECT json_agg(json_build_object('url', pm.url, 'media_type', pm.media_type))
               FROM post_media pm WHERE pm.post_id = p.id) as media,
              (SELECT count(*) FROM post_likes WHERE post_id = p.id) as likes_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.music_track IS NOT NULL
         AND (p.music_track->>'title' ILIKE $1 OR p.music_track->>'id' = $2)
       ORDER BY p.created_at DESC
       LIMIT 30`,
      [`%${track.title}%`, track.id]
    );

    // Fetch reels that use this sound
    const reelsRes = await query(
      `SELECT r.id, r.caption, r.video_url, r.poster_url, r.views_count, r.created_at, r.music_track,
              u.id as user_id, u.username, u.name, u.avatar,
              (SELECT count(*) FROM reel_likes WHERE reel_id = r.id) as likes_count
       FROM reels r
       JOIN users u ON r.user_id = u.id
       WHERE r.music_track IS NOT NULL
         AND (r.music_track->>'title' ILIKE $1 OR r.music_track->>'id' = $2)
       ORDER BY r.created_at DESC
       LIMIT 30`,
      [`%${track.title}%`, track.id]
    );

    const posts = postsRes.rows.map((p) => ({
      id: p.id,
      caption: p.caption,
      createdAt: p.created_at,
      likesCount: parseInt(p.likes_count || '0', 10),
      media: typeof p.media === 'string' ? JSON.parse(p.media) : p.media || [],
      author: {
        id: p.user_id,
        username: p.username,
        name: p.name,
        avatar: p.avatar,
      },
    }));

    const reels = reelsRes.rows.map((r) => ({
      id: r.id,
      caption: r.caption,
      videoUrl: r.video_url,
      posterUrl: r.poster_url,
      viewsCount: parseInt(r.views_count || '0', 10),
      likesCount: parseInt(r.likes_count || '0', 10),
      createdAt: r.created_at,
      author: {
        id: r.user_id,
        username: r.username,
        name: r.name,
        avatar: r.avatar,
      },
    }));

    res.json({
      track: {
        ...track,
        isSaved,
      },
      posts,
      reels,
      totalUseCount: posts.length + reels.length,
    });
  } catch (error) {
    next(error);
  }
});

const handleToggleSave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId || req.user?.id;
    const trackId = req.body.trackId || req.params.trackId;

    if (!userId || !trackId) {
      res.status(400).json({ error: 'userId and trackId are required' });
      return;
    }

    let check;
    try {
      check = await query(`SELECT 1 FROM saved_audios WHERE user_id = $1 AND track_id = $2`, [userId, trackId]);
    } catch (tblErr: any) {
      if (tblErr?.message?.includes('does not exist')) {
        await query(`
          CREATE TABLE IF NOT EXISTS saved_audios (
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            track_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, track_id)
          );
        `);
        check = { rowCount: 0 };
      } else {
        throw tblErr;
      }
    }

    if ((check.rowCount ?? 0) > 0) {
      await query(`DELETE FROM saved_audios WHERE user_id = $1 AND track_id = $2`, [userId, trackId]);
      res.json({ saved: false, trackId });
    } else {
      await query(
        `INSERT INTO saved_audios (user_id, track_id, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, track_id) DO NOTHING`,
        [userId, trackId]
      );
      res.json({ saved: true, trackId });
    }
  } catch (error) {
    next(error);
  }
};

router.post('/save', optionalAuth, handleToggleSave);
router.post('/:trackId/save', optionalAuth, handleToggleSave);

export const audioRoutes = router;
