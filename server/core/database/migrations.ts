import { query } from './pool';
import { logger } from '../logger/logger';

export const initDatabase = runDatabaseMigrations;

export async function runDatabaseMigrations(): Promise<void> {
  logger.info('Executing database schema migrations & initialization...');

  try {
    // 1. Users Table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      avatar TEXT,
      bio TEXT DEFAULT '',
      is_verified BOOLEAN DEFAULT false,
      followers_count INT DEFAULT 0,
      following_count INT DEFAULT 0,
      posts_count INT DEFAULT 0,
      website VARCHAR(255),
      category VARCHAR(100),
      two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret VARCHAR(255),
      passkey_credential_id TEXT,
      passkey_public_key TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS posts_count INT DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS passkey_credential_id TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS passkey_public_key TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  `);

  // 2. Refresh Tokens Table (Secure Session Management)
  await query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) NOT NULL UNIQUE,
      user_agent TEXT,
      ip_address VARCHAR(100),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. User Sessions / Auth Events Table
  await query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_name VARCHAR(255),
      ip_address VARCHAR(100),
      location VARCHAR(255),
      is_current BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Follows Table
  await query(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS follow_requests (
      requester_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (requester_id, target_id)
    );
  `);

  // 5. Blocked Users Table
  await query(`
    CREATE TABLE IF NOT EXISTS blocked_users (
      blocker_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (blocker_id, blocked_id)
    );

    CREATE TABLE IF NOT EXISTS close_friends (
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS restricted_users (
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      restricted_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, restricted_id)
    );

    ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_close_friends BOOLEAN DEFAULT false;
    ALTER TABLE stories ADD COLUMN IF NOT EXISTS poll JSONB DEFAULT NULL;
    ALTER TABLE stories ADD COLUMN IF NOT EXISTS question JSONB DEFAULT NULL;
    ALTER TABLE stories ADD COLUMN IF NOT EXISTS music JSONB DEFAULT NULL;
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
  `);

  // 6. Posts Table
  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      caption TEXT DEFAULT '',
      location VARCHAR(255) DEFAULT '',
      media JSONB DEFAULT '[]'::jsonb,
      tags JSONB DEFAULT '[]'::jsonb,
      music_track JSONB,
      likes_count INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Post Media Table
  await query(`
    CREATE TABLE IF NOT EXISTS post_media (
      id VARCHAR(255) PRIMARY KEY,
      post_id VARCHAR(255) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      media_type VARCHAR(50) DEFAULT 'image',
      aspect_ratio VARCHAR(50) DEFAULT 'square',
      order_index INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Post Likes Table
  await query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      post_id VARCHAR(255) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id)
    );
  `);

  // 9. Saved Posts Table
  await query(`
    CREATE TABLE IF NOT EXISTS saved_posts (
      post_id VARCHAR(255) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id)
    );
  `);

  // 10. Comments Table
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(255) PRIMARY KEY,
      post_id VARCHAR(255) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      likes_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Comment Likes Table
  await query(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      comment_id VARCHAR(255) NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (comment_id, user_id)
    );
  `);

  // 12. Stories Table
  await query(`
    CREATE TABLE IF NOT EXISTS stories (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_url TEXT NOT NULL,
      media_type VARCHAR(50) DEFAULT 'image',
      caption TEXT DEFAULT '',
      filter VARCHAR(50) DEFAULT 'normal',
      link TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 13. Story Views Table
  await query(`
    CREATE TABLE IF NOT EXISTS story_views (
      story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (story_id, user_id)
    );
  `);

  // 14. Story Likes Table
  await query(`
    CREATE TABLE IF NOT EXISTS story_likes (
      story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (story_id, user_id)
    );
  `);

  // 15. Highlights Table
  await query(`
    CREATE TABLE IF NOT EXISTS highlights (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      cover_url TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 16. Highlight Items Table
  await query(`
    CREATE TABLE IF NOT EXISTS highlight_items (
      id VARCHAR(255) PRIMARY KEY,
      highlight_id VARCHAR(255) NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
      story_id VARCHAR(255),
      media_url TEXT NOT NULL,
      media_type VARCHAR(50) DEFAULT 'image',
      caption TEXT DEFAULT '',
      filter VARCHAR(50) DEFAULT 'normal',
      order_index INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 17. Messages Table
  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(255) PRIMARY KEY,
      sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      media_url TEXT,
      is_seen BOOLEAN DEFAULT false,
      reaction VARCHAR(50),
      is_audio BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 18. Notifications Table
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(255) PRIMARY KEY,
      recipient_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      post_id VARCHAR(255),
      target_media_url TEXT,
      text TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 19. Reels Table
  await query(`
    CREATE TABLE IF NOT EXISTS reels (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      video_url TEXT NOT NULL,
      poster_url TEXT,
      caption TEXT DEFAULT '',
      music_track JSONB,
      tags JSONB DEFAULT '[]'::jsonb,
      views_count INT DEFAULT 0,
      duration_secs INT DEFAULT 15,
      qualities JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 20. Reel Likes & Saved Tables
  await query(`
    CREATE TABLE IF NOT EXISTS reel_likes (
      reel_id VARCHAR(255) NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (reel_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reel_saved (
      reel_id VARCHAR(255) NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (reel_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reel_comments (
      id VARCHAR(255) PRIMARY KEY,
      reel_id VARCHAR(255) NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      likes_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reel_comment_likes (
      comment_id VARCHAR(255) NOT NULL REFERENCES reel_comments(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (comment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reel_watch_history (
      id VARCHAR(255) PRIMARY KEY,
      reel_id VARCHAR(255) NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      watch_duration_secs INT DEFAULT 0,
      progress_percent INT DEFAULT 0,
      watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Performance Indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
  `);

    logger.info('Database migrations completed successfully');
  } catch (err: any) {
    logger.warn(`Database migration encountered warning or is delayed: ${err?.message || err}`);
  }
}
