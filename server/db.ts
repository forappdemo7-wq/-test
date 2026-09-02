import { Pool } from 'pg';

const NEON_CONNECTION_STRING =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_ILdc98mRjtzF@ep-wispy-leaf-axnkhdil.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

export const pool = new Pool({
  connectionString: NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (error: any) {
    console.error('Database query error:', { text, error: error.message });
    throw error;
  }
}

export async function initDatabase() {
  try {
    console.log('Verifying & Initializing Neon PostgreSQL Database Tables...');

    // 1. Create Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        email VARCHAR(128) UNIQUE,
        password_hash TEXT,
        avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        bio TEXT DEFAULT '',
        website TEXT DEFAULT '',
        pronouns VARCHAR(32) DEFAULT '',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Ensure columns exist
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(128) UNIQUE;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pronouns VARCHAR(32) DEFAULT '';`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) DEFAULT 'email';`);

    // 1b. Create User Sessions Table
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash TEXT,
        device_name VARCHAR(128) DEFAULT 'Web Browser',
        device_type VARCHAR(32) DEFAULT 'desktop',
        browser VARCHAR(64) DEFAULT 'Chrome',
        os VARCHAR(64) DEFAULT 'macOS',
        ip_address VARCHAR(64) DEFAULT '127.0.0.1',
        location VARCHAR(128) DEFAULT 'San Francisco, US',
        is_current BOOLEAN DEFAULT FALSE,
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 1c. Create Trusted Devices Table
    await query(`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        fingerprint VARCHAR(128) NOT NULL,
        device_name VARCHAR(128) DEFAULT 'Primary Device',
        device_type VARCHAR(32) DEFAULT 'desktop',
        browser VARCHAR(64) DEFAULT 'Chrome',
        os VARCHAR(64) DEFAULT 'macOS',
        ip_address VARCHAR(64) DEFAULT '127.0.0.1',
        is_trusted BOOLEAN DEFAULT TRUE,
        first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 1d. Create Login Activity Logs Table
    await query(`
      CREATE TABLE IF NOT EXISTS login_activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(64) DEFAULT '127.0.0.1',
        location VARCHAR(128) DEFAULT 'San Francisco, US',
        device_name VARCHAR(128) DEFAULT 'Web Browser',
        browser VARCHAR(64) DEFAULT 'Chrome',
        os VARCHAR(64) DEFAULT 'macOS',
        status VARCHAR(32) DEFAULT 'success',
        reasons JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 1e. Create Two-Factor Authentication Table
    await query(`
      CREATE TABLE IF NOT EXISTS user_two_factor (
        user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        is_enabled BOOLEAN DEFAULT FALSE,
        method VARCHAR(32) DEFAULT 'totp',
        secret TEXT,
        backup_codes JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 1f. Create Passkey Credentials Table
    await query(`
      CREATE TABLE IF NOT EXISTS passkey_credentials (
        id VARCHAR(256) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(128) DEFAULT 'Touch ID / Passkey',
        public_key TEXT NOT NULL,
        counter BIGINT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 1g. Create Auth Verification Codes Table (Email OTP, Password Reset, 2FA Challenge)
    await query(`
      CREATE TABLE IF NOT EXISTS auth_verification_codes (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(128),
        code VARCHAR(16) NOT NULL,
        type VARCHAR(32) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Create Posts Table
    await query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        caption TEXT DEFAULT '',
        location VARCHAR(128) DEFAULT '',
        music_track JSONB DEFAULT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Create Post Media Table
    await query(`
      CREATE TABLE IF NOT EXISTS post_media (
        id VARCHAR(64) PRIMARY KEY,
        post_id VARCHAR(64) REFERENCES posts(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        media_type VARCHAR(16) DEFAULT 'image',
        aspect_ratio VARCHAR(16) DEFAULT 'square',
        order_index INT DEFAULT 0
      );
    `);

    // 4. Create Post Likes Table
    await query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id VARCHAR(64) REFERENCES posts(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      );
    `);

    // 5. Create Saved Posts Table
    await query(`
      CREATE TABLE IF NOT EXISTS saved_posts (
        post_id VARCHAR(64) REFERENCES posts(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      );
    `);

    // 6. Create Comments Table
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(64) PRIMARY KEY,
        post_id VARCHAR(64) REFERENCES posts(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 7. Create Comment Likes Table
    await query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        comment_id VARCHAR(64) REFERENCES comments(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (comment_id, user_id)
      );
    `);

    // 8. Create Stories Table
    await query(`
      CREATE TABLE IF NOT EXISTS stories (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        media_url TEXT NOT NULL,
        media_type VARCHAR(16) DEFAULT 'image',
        caption TEXT DEFAULT '',
        filter VARCHAR(32) DEFAULT 'normal',
        link TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 9. Create Story Views Table
    await query(`
      CREATE TABLE IF NOT EXISTS story_views (
        story_id VARCHAR(64) REFERENCES stories(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (story_id, user_id)
      );
    `);

    // 9b. Create Story Likes Table
    await query(`
      CREATE TABLE IF NOT EXISTS story_likes (
        story_id VARCHAR(64) REFERENCES stories(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (story_id, user_id)
      );
    `);

    // 10. Create Follows Table
    await query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        following_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (follower_id, following_id)
      );
    `);

    // 10b. Create Blocked Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        blocker_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        blocked_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (blocker_id, blocked_id)
      );
    `);

    // 11. Create Messages Table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        receiver_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        media_url TEXT DEFAULT NULL,
        is_seen BOOLEAN DEFAULT FALSE,
        reaction VARCHAR(16) DEFAULT NULL,
        is_audio BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 12. Create Notifications Table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        recipient_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(32) NOT NULL,
        post_id VARCHAR(64) DEFAULT NULL,
        target_media_url TEXT DEFAULT NULL,
        text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 13. Create Reels Table
    await query(`
      CREATE TABLE IF NOT EXISTS reels (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        video_url TEXT NOT NULL,
        poster_url TEXT NOT NULL,
        caption TEXT DEFAULT '',
        music_track JSONB DEFAULT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 14. Create Reel Likes Table
    await query(`
      CREATE TABLE IF NOT EXISTS reel_likes (
        reel_id VARCHAR(64) REFERENCES reels(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (reel_id, user_id)
      );
    `);

    // 14b. Create Reel Saved Table
    await query(`
      CREATE TABLE IF NOT EXISTS reel_saved (
        reel_id VARCHAR(64) REFERENCES reels(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (reel_id, user_id)
      );
    `);

    // 14c. Create Reel Comments Table
    await query(`
      CREATE TABLE IF NOT EXISTS reel_comments (
        id VARCHAR(64) PRIMARY KEY,
        reel_id VARCHAR(64) REFERENCES reels(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 14d. Create Reel Comment Likes Table
    await query(`
      CREATE TABLE IF NOT EXISTS reel_comment_likes (
        comment_id VARCHAR(64) REFERENCES reel_comments(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (comment_id, user_id)
      );
    `);

    // 14e. Create Reel Watch History Table
    await query(`
      CREATE TABLE IF NOT EXISTS reel_watch_history (
        id VARCHAR(64) PRIMARY KEY,
        reel_id VARCHAR(64) REFERENCES reels(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        watch_duration_secs INT DEFAULT 0,
        progress_percent INT DEFAULT 0,
        watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 14f. Add columns to reels if missing
    await query(`ALTER TABLE reels ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;`);
    await query(`ALTER TABLE reels ADD COLUMN IF NOT EXISTS duration_secs INT DEFAULT 15;`);
    await query(`ALTER TABLE reels ADD COLUMN IF NOT EXISTS qualities JSONB DEFAULT NULL;`);

    // 15. Create Highlights Table
    await query(`
      CREATE TABLE IF NOT EXISTS highlights (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(64) NOT NULL,
        cover_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 16. Create Highlight Items Table
    await query(`
      CREATE TABLE IF NOT EXISTS highlight_items (
        id VARCHAR(64) PRIMARY KEY,
        highlight_id VARCHAR(64) REFERENCES highlights(id) ON DELETE CASCADE,
        story_id VARCHAR(64) DEFAULT NULL,
        media_url TEXT NOT NULL,
        media_type VARCHAR(16) DEFAULT 'image',
        caption TEXT DEFAULT '',
        filter VARCHAR(32) DEFAULT 'normal',
        order_index INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Clean up any old mock user rows with hardcoded IDs if they exist without real passwords
    await query(`
      DELETE FROM users WHERE id IN ('user_current', 'user_marcus', 'user_luna', 'user_sofia', 'user_kai', 'user_amara', 'user_liam', 'user_chloe') AND password_hash IS NULL;
    `);

    console.log('PostgreSQL tables initialized with real-data schema.');
  } catch (error: any) {
    console.error('Error initializing database schema:', error);
  }
}
