// server/app.ts
import express from "express";

// server/middleware/request-id.middleware.ts
import crypto from "crypto";
function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers["x-request-id"];
  const requestId = incomingId || `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  req.id = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

// server/core/logger/logger.ts
var Logger = class {
  formatTimestamp() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  colorize(level, text) {
    const colors = {
      debug: "\x1B[36m",
      // Cyan
      info: "\x1B[32m",
      // Green
      warn: "\x1B[33m",
      // Yellow
      error: "\x1B[31m"
      // Red
    };
    const reset = "\x1B[0m";
    return `${colors[level] || ""}${text}${reset}`;
  }
  output(level, message, context) {
    const timestamp = this.formatTimestamp();
    const formattedLevel = `[${level.toUpperCase()}]`.padEnd(7);
    const coloredLevel = this.colorize(level, formattedLevel);
    const reqInfo = context?.requestId ? `[${context.requestId}] ` : "";
    const ctxString = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : "";
    const line = `${timestamp} ${coloredLevel} ${reqInfo}${message}${ctxString}`;
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
  debug(message, context) {
    if (process.env.NODE_ENV !== "production") {
      this.output("debug", message, context);
    }
  }
  info(message, context) {
    this.output("info", message, context);
  }
  warn(message, context) {
    this.output("warn", message, context);
  }
  error(message, error, context) {
    const enrichedContext = {
      ...context,
      errorMessage: error?.message || error,
      stack: error?.stack
    };
    this.output("error", message, enrichedContext);
  }
};
var logger = new Logger();

// server/middleware/request-logger.middleware.ts
function requestLoggerMiddleware(req, res, next) {
  if (!req.originalUrl.startsWith("/api")) {
    return next();
  }
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const context = {
      requestId: req.id,
      method,
      path: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip
    };
    if (statusCode >= 500) {
      logger.error(`HTTP ${method} ${originalUrl} ${statusCode} in ${duration}ms`, null, context);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${method} ${originalUrl} ${statusCode} in ${duration}ms`, context);
    } else {
      logger.info(`HTTP ${method} ${originalUrl} ${statusCode} in ${duration}ms`, context);
    }
  });
  next();
}

// server/routes/index.ts
import { Router as Router11 } from "express";

// server/routes/v1/index.ts
import { Router as Router10 } from "express";

// server/routes/v1/auth.routes.ts
import { Router } from "express";

// server/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// server/config/env.config.ts
import dotenv from "dotenv";
dotenv.config();
var DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_ILdc98mRjtzF@ep-wispy-leaf-axnkhdil.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
var config = {
  env: process.env.NODE_ENV || "development",
  port: 3e3,
  host: "0.0.0.0",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",
  database: {
    url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || "10000", 10)
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    enabled: Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
    defaultTtlSecs: parseInt(process.env.REDIS_DEFAULT_TTL || "300", 10)
  },
  jwt: {
    accessSecret: process.env.JWT_SECRET || "instavibe_jwt_production_access_key_9823478912",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "instavibe_jwt_refresh_secure_key_1928374981",
    accessExpiresIn: "15m",
    refreshExpiresInDays: 30
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "zqh0eatl",
    apiKey: process.env.CLOUDINARY_API_KEY || "679815779374465",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "v-2_Fz6m8oA-kQY1Q9Z2y_5r1y8",
    isConfigured: Boolean(process.env.CLOUDINARY_API_SECRET || "v-2_Fz6m8oA-kQY1Q9Z2y_5r1y8")
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-3.7-flash"
  },
  rateLimit: {
    windowMs: 60 * 1e3,
    // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "120", 10)
  },
  app: {
    name: "InstaVibe Scalable API",
    version: "1.0.0",
    apiVersion: "v1",
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000"
  }
};

// server/core/database/pool.ts
import { Pool } from "pg";

// server/core/errors/app-error.ts
var AppError = class extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR" /* INTERNAL_SERVER_ERROR */, details, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
};
var BadRequestError = class extends AppError {
  constructor(message = "Bad request", details) {
    super(message, 400, "BAD_REQUEST" /* BAD_REQUEST */, details);
  }
};
var ValidationError = class extends AppError {
  constructor(message = "Validation failed", details) {
    super(message, 422, "VALIDATION_ERROR" /* VALIDATION_ERROR */, details);
  }
};
var UnauthorizedError = class extends AppError {
  constructor(message = "Unauthorized access", details) {
    super(message, 401, "UNAUTHORIZED" /* UNAUTHORIZED */, details);
  }
};
var NotFoundError = class extends AppError {
  constructor(resource = "Resource", details) {
    super(`${resource} not found`, 404, "NOT_FOUND" /* NOT_FOUND */, details);
  }
};
var ConflictError = class extends AppError {
  constructor(message = "Resource conflict", details) {
    super(message, 409, "CONFLICT" /* CONFLICT */, details);
  }
};
var TooManyRequestsError = class extends AppError {
  constructor(message = "Too many requests, please slow down", details) {
    super(message, 429, "TOO_MANY_REQUESTS" /* TOO_MANY_REQUESTS */, details);
  }
};
var DatabaseError = class extends AppError {
  constructor(message = "Database operation failed", details) {
    super(message, 500, "DATABASE_ERROR" /* DATABASE_ERROR */, details, true);
  }
};

// server/core/database/pool.ts
var poolInstance = null;
function getPool() {
  if (!poolInstance) {
    logger.info("Initializing PostgreSQL connection pool...");
    poolInstance = new Pool({
      connectionString: config.database.url,
      max: config.database.maxConnections,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
      ssl: {
        rejectUnauthorized: false
      }
    });
    poolInstance.on("error", (err) => {
      logger.error("Unexpected idle client error in PostgreSQL pool", err);
    });
    poolInstance.on("connect", () => {
      logger.debug("New client connected to database pool");
    });
  }
  return poolInstance;
}
async function query(text, params, client) {
  const start = Date.now();
  const pool = getPool();
  const executor = client || pool;
  try {
    const res = await executor.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1e3) {
      logger.warn(`Slow database query (${duration}ms): ${text.substring(0, 100)}...`);
    } else {
      logger.debug(`DB Query executed in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    logger.error(`Database query failed: ${text.substring(0, 120)}`, error, {
      params: params ? params.slice(0, 5) : []
    });
    throw new DatabaseError(`Database operation failed: ${error.message}`, {
      query: text.substring(0, 100),
      error: error.message
    });
  }
}
async function checkDatabaseHealth() {
  try {
    const res = await query("SELECT 1 as health");
    return res.rows.length > 0;
  } catch {
    return false;
  }
}

// server/repositories/base.repository.ts
var BaseRepository = class {
  async findById(id) {
    const res = await query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }
  async count(whereClause = "1=1", params = []) {
    const res = await query(`SELECT COUNT(*)::int as count FROM ${this.tableName} WHERE ${whereClause}`, params);
    return parseInt(res.rows[0]?.count || "0", 10);
  }
  async deleteById(id) {
    const res = await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
};

// server/repositories/user.repository.ts
var UserRepository = class extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tableName = "users";
  }
  async findByUsername(username) {
    const res = await query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);
    return res.rows[0] || null;
  }
  async findByEmail(email) {
    const res = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    return res.rows[0] || null;
  }
  async findByLogin(login) {
    const res = await query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)",
      [login]
    );
    return res.rows[0] || null;
  }
  async createUser(user) {
    const res = await query(
      `INSERT INTO users (
        id, username, name, email, password_hash, avatar, bio, is_verified,
        followers_count, following_count, posts_count, website, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        user.id,
        user.username,
        user.name,
        user.email || null,
        user.password_hash || null,
        user.avatar || "",
        user.bio || "",
        user.is_verified || false,
        user.followers_count || 0,
        user.following_count || 0,
        user.posts_count || 0,
        user.website || null,
        user.category || null
      ]
    );
    return res.rows[0];
  }
  async updateProfile(id, updates) {
    const keys = Object.keys(updates).filter((k) => updates[k] !== void 0);
    if (keys.length === 0) return this.findById(id);
    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    const values = keys.map((k) => updates[k]);
    const res = await query(
      `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return res.rows[0] || null;
  }
  async getUserProfileWithStats(targetUserId, currentUserId) {
    const res = await query(
      `SELECT 
        u.*,
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $2 AND blocked_id = u.id) as "isBlocked"
      FROM users u
      WHERE u.id = $1`,
      [targetUserId, currentUserId || "none"]
    );
    return res.rows[0] || null;
  }
  async isFollowing(followerId, followingId) {
    const res = await query("SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2", [
      followerId,
      followingId
    ]);
    return res.rows.length > 0;
  }
  async follow(followerId, followingId) {
    await query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
      followerId,
      followingId
    ]);
  }
  async unfollow(followerId, followingId) {
    await query("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [
      followerId,
      followingId
    ]);
  }
  async getAllUsers(currentUserId, limit = 50) {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.email, u.avatar, u.bio, u.website, u.category,
        u.is_verified as "isVerified",
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as "postsCount",
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as "followersCount",
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as "followingCount",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $1 AND blocked_id = u.id) as "isBlocked"
      FROM users u
      ORDER BY u.created_at ASC
      LIMIT $2`,
      [currentUserId || "none", limit]
    );
    return res.rows;
  }
  async getFollowers(targetUserId, currentUserId) {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.avatar, u.bio, u.is_verified as "isVerified",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing"
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = $1`,
      [targetUserId, currentUserId || "none"]
    );
    return res.rows;
  }
  async getFollowing(targetUserId, currentUserId) {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.avatar, u.bio, u.is_verified as "isVerified",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing"
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = $1`,
      [targetUserId, currentUserId || "none"]
    );
    return res.rows;
  }
  async blockUser(userId, blockedUserId) {
    await query(
      `INSERT INTO blocked_users (blocker_id, blocked_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, blockedUserId]
    );
    await this.unfollow(userId, blockedUserId);
    await this.unfollow(blockedUserId, userId);
  }
  async unblockUser(userId, blockedUserId) {
    await query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
      [userId, blockedUserId]
    );
  }
  async searchUsers(term, limit = 20) {
    const res = await query(
      `SELECT id, username, name, avatar, bio, is_verified, followers_count
       FROM users
       WHERE username ILIKE $1 OR name ILIKE $1
       LIMIT $2`,
      [`%${term}%`, limit]
    );
    return res.rows;
  }
};
var userRepository = new UserRepository();

// server/services/auth.service.ts
var AuthService = class {
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.is_verified || false
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      config.jwt.refreshSecret,
      { expiresIn: `${config.jwt.refreshExpiresInDays}d` }
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.accessExpiresIn
    };
  }
  async signup(data) {
    const username = data.username.toLowerCase().trim();
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictError("Username is already taken");
    }
    const email = data.email && data.email.trim() ? data.email.toLowerCase().trim() : `${username}@instavibe.internal`;
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail && existingEmail.username !== username) {
      throw new ConflictError("Email address is already registered");
    }
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : void 0;
    const defaultAvatar = data.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;
    const user = await userRepository.createUser({
      id: userId,
      username,
      name: data.name.trim(),
      email,
      password_hash: passwordHash,
      avatar: defaultAvatar,
      bio: data.bio || "",
      website: data.website || "",
      is_verified: false
    });
    const tokens = this.generateTokens(user);
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [`rt_${Date.now()}`, user.id, tokens.refreshToken]
    );
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        website: user.website,
        isVerified: user.is_verified,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0
      },
      tokens
    };
  }
  async signin(login, password) {
    const user = await userRepository.findByLogin(login.trim());
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }
    if (password && user.password_hash) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new UnauthorizedError("Invalid credentials");
      }
    }
    const tokens = this.generateTokens(user);
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [`rt_${Date.now()}`, user.id, tokens.refreshToken]
    );
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.is_verified,
        followersCount: user.followers_count || 0,
        followingCount: user.following_count || 0,
        postsCount: user.posts_count || 0
      },
      tokens
    };
  }
  async refreshTokens(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedError("User not found");
      }
      const tokenInDb = await query("SELECT 1 FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()", [
        refreshToken
      ]);
      if (tokenInDb.rows.length === 0) {
        throw new UnauthorizedError("Refresh token expired or revoked");
      }
      return this.generateTokens(user);
    } catch (err) {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }
  async logout(refreshToken) {
    if (refreshToken) {
      await query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    }
  }
  async logoutAll(userId) {
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
    await query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
  }
  async socialAuth(provider, profile) {
    let user = await userRepository.findByEmail(profile.email);
    if (!user) {
      const username = (profile.email.split("@")[0] || `user_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_.]/g, "");
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      user = await userRepository.createUser({
        id: userId,
        username,
        name: profile.name || username,
        email: profile.email.toLowerCase(),
        avatar: profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        bio: `Joined via ${provider.toUpperCase()}`,
        is_verified: false
      });
    }
    const tokens = this.generateTokens(user);
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [`rt_${Date.now()}`, user.id, tokens.refreshToken]
    );
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.is_verified,
        followersCount: user.followers_count || 0,
        followingCount: user.following_count || 0,
        postsCount: user.posts_count || 0
      },
      tokens
    };
  }
  async getSessions(userId) {
    const res = await query(
      `SELECT id, user_id as "userId", device_name as "deviceName", ip_address as "ipAddress",
              location, is_current as "isCurrent", created_at as "createdAt", last_active as "lastActive"
       FROM user_sessions
       WHERE user_id = $1
       ORDER BY last_active DESC`,
      [userId]
    );
    if (res.rows.length === 0) {
      return [
        {
          id: `sess_curr_${userId}`,
          userId,
          deviceName: "Chrome on macOS (Current)",
          ipAddress: "192.168.1.1",
          location: "San Francisco, CA",
          isCurrent: true,
          lastActive: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
    }
    return res.rows;
  }
  async deleteSession(userId, sessionId) {
    await query("DELETE FROM user_sessions WHERE user_id = $1 AND id = $2", [userId, sessionId]);
    return { success: true };
  }
  async getDevices(userId) {
    return [
      {
        id: `dev_${userId}_1`,
        userId,
        name: "Apple iPhone 15 Pro",
        type: "mobile",
        browser: "Safari Mobile",
        os: "iOS 17.5",
        lastUsed: "Just now",
        isCurrent: true,
        trusted: true
      },
      {
        id: `dev_${userId}_2`,
        userId,
        name: 'MacBook Pro 16"',
        type: "desktop",
        browser: "Google Chrome",
        os: "macOS Sonoma",
        lastUsed: "2 hours ago",
        isCurrent: false,
        trusted: true
      }
    ];
  }
  async deleteDevice(userId, deviceId) {
    return { success: true, deviceId };
  }
  async updateDevice(userId, deviceId, data) {
    return { success: true, deviceId, ...data };
  }
  async getSecurityLogs(userId) {
    return [
      {
        id: `log_${Date.now()}_1`,
        userId,
        action: "SIGN_IN_SUCCESS",
        ipAddress: "192.168.1.1",
        location: "San Francisco, CA",
        status: "success",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        device: "Chrome on macOS"
      },
      {
        id: `log_${Date.now()}_2`,
        userId,
        action: "TOKEN_REFRESH",
        ipAddress: "192.168.1.1",
        location: "San Francisco, CA",
        status: "success",
        timestamp: new Date(Date.now() - 36e5).toISOString(),
        device: "Safari on iPhone 15 Pro"
      }
    ];
  }
  async setup2FA(userId) {
    const secret = "JBSWY3DPEHPK3PXP";
    const otpAuthUrl = `otpauth://totp/InstaVibe:${userId}?secret=${secret}&issuer=InstaVibe`;
    return { secret, qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}` };
  }
  async enable2FA(userId, code) {
    await query("UPDATE users SET two_factor_enabled = true WHERE id = $1", [userId]);
    return { success: true, twoFactorEnabled: true };
  }
  async disable2FA(userId) {
    await query("UPDATE users SET two_factor_enabled = false WHERE id = $1", [userId]);
    return { success: true, twoFactorEnabled: false };
  }
  async verify2FALogin(tempToken, code) {
    return { success: true, verified: true };
  }
  async passkeyRegisterOptions(userId) {
    return {
      challenge: "random_challenge_" + Date.now(),
      rp: { name: "InstaVibe" },
      user: { id: userId, name: "user", displayName: "InstaVibe User" }
    };
  }
  async passkeyRegisterVerify(userId, credential) {
    return { success: true, registered: true };
  }
  async passkeySigninOptions(username) {
    return { challenge: "random_challenge_" + Date.now() };
  }
  async passkeySigninVerify(credential) {
    return { success: true, verified: true };
  }
  async forgotPasswordRequest(email) {
    return { success: true, message: "Reset code sent to " + email };
  }
  async forgotPasswordVerify(email, code, newPassword) {
    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      await query("UPDATE users SET password_hash = $1 WHERE email = $2", [hash, email.toLowerCase().trim()]);
    }
    return { success: true, message: "Password reset successful" };
  }
  async sendEmailVerification(email) {
    return { success: true, message: "Verification link sent to " + email };
  }
  async confirmEmailVerification(email, code) {
    await query("UPDATE users SET is_verified = true WHERE email = $1", [email.toLowerCase().trim()]);
    return { success: true, verified: true };
  }
};
var authService = new AuthService();

// server/controllers/auth.controller.ts
var AuthController = class {
  async signup(req, res, next) {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
  async signin(req, res, next) {
    try {
      const { login, identifier, password, rememberMe, clientDevice } = req.body;
      const loginIdentifier = (login || identifier || "").trim();
      const result = await authService.signin(loginIdentifier, password);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      res.json({ success: true, tokens });
    } catch (error) {
      next(error);
    }
  }
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }
  async logoutAll(req, res, next) {
    try {
      const userId = req.body.userId || req.user?.id || "user_current";
      await authService.logoutAll(userId);
      res.json({ success: true, message: "Logged out from all devices" });
    } catch (error) {
      next(error);
    }
  }
  async socialAuthGoogle(req, res, next) {
    try {
      const result = await authService.socialAuth("google", req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
  async socialAuthApple(req, res, next) {
    try {
      const result = await authService.socialAuth("apple", req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
  async getSessions(req, res, next) {
    try {
      const userId = req.query.userId || req.user?.id || "user_current";
      const sessions = await authService.getSessions(userId);
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  }
  async deleteSession(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.query.userId || req.user?.id || "user_current";
      const result = await authService.deleteSession(userId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getDevices(req, res, next) {
    try {
      const userId = req.query.userId || req.user?.id || "user_current";
      const devices = await authService.getDevices(userId);
      res.json(devices);
    } catch (error) {
      next(error);
    }
  }
  async deleteDevice(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.query.userId || req.user?.id || "user_current";
      const result = await authService.deleteDevice(userId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async updateDevice(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.query.userId || req.user?.id || "user_current";
      const result = await authService.updateDevice(userId, id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getSecurityLogs(req, res, next) {
    try {
      const userId = req.query.userId || req.user?.id || "user_current";
      const logs = await authService.getSecurityLogs(userId);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
  async setup2FA(req, res, next) {
    try {
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await authService.setup2FA(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async enable2FA(req, res, next) {
    try {
      const userId = req.body.userId || req.user?.id || "user_current";
      const { code } = req.body;
      const result = await authService.enable2FA(userId, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async disable2FA(req, res, next) {
    try {
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await authService.disable2FA(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async verify2FALogin(req, res, next) {
    try {
      const { tempToken, code } = req.body;
      const result = await authService.verify2FALogin(tempToken, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async resolveSuspiciousAlert(req, res, next) {
    try {
      res.json({ success: true, resolved: true });
    } catch (error) {
      next(error);
    }
  }
  async passkeyRegisterOptions(req, res, next) {
    try {
      const userId = req.query.userId || req.user?.id || "user_current";
      const options = await authService.passkeyRegisterOptions(userId);
      res.json(options);
    } catch (error) {
      next(error);
    }
  }
  async passkeyRegisterVerify(req, res, next) {
    try {
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await authService.passkeyRegisterVerify(userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async passkeySigninOptions(req, res, next) {
    try {
      const username = req.query.username || "";
      const options = await authService.passkeySigninOptions(username);
      res.json(options);
    } catch (error) {
      next(error);
    }
  }
  async passkeySigninVerify(req, res, next) {
    try {
      const result = await authService.passkeySigninVerify(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async forgotPasswordRequest(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPasswordRequest(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async forgotPasswordVerify(req, res, next) {
    try {
      const { email, code, newPassword } = req.body;
      const result = await authService.forgotPasswordVerify(email, code, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async sendEmailVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.sendEmailVerification(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async confirmEmailVerification(req, res, next) {
    try {
      const { email, code } = req.body;
      const result = await authService.confirmEmailVerification(email, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
var authController = new AuthController();

// server/middleware/validate.middleware.ts
import { ZodError } from "zod";
function validate(schemas) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError || error?.name === "ZodError") {
        const issues = error.issues || error.errors || [];
        const details = issues.map((err) => ({
          field: Array.isArray(err.path) ? err.path.join(".") : String(err.path || ""),
          message: err.message,
          rule: err.code
        }));
        return next(new ValidationError("Input validation failed", details));
      }
      next(error);
    }
  };
}

// server/validation/auth.schema.ts
import { z } from "zod";
var SignupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_.]+$/, "Username must only contain letters, numbers, underscores, and dots"),
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  pronouns: z.string().optional(),
  rememberMe: z.boolean().optional(),
  clientDevice: z.any().optional()
});
var SigninSchema = z.object({
  login: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
  clientDevice: z.any().optional()
}).refine((data) => Boolean(data.login || data.identifier), {
  message: "Username or email is required",
  path: ["identifier"]
});
var RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});
var UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().optional(),
  website: z.string().optional(),
  category: z.string().optional()
});
var FollowToggleSchema = z.object({
  currentUserId: z.string().min(1, "Current user ID is required")
});

// server/core/cache/redis-cache.ts
var CacheService = class {
  constructor() {
    this.inMemoryStore = /* @__PURE__ */ new Map();
    this.defaultTtlSecs = config.redis.defaultTtlSecs;
    setInterval(() => this.cleanupExpired(), 6e4);
  }
  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt > 0 && entry.expiresAt <= now) {
        this.inMemoryStore.delete(key);
      }
    }
  }
  async get(key) {
    try {
      const entry = this.inMemoryStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
        this.inMemoryStore.delete(key);
        return null;
      }
      return entry.value;
    } catch (error) {
      logger.warn(`Cache get failed for key: ${key}`, { error });
      return null;
    }
  }
  async set(key, value, ttlSecs = this.defaultTtlSecs) {
    try {
      const expiresAt = ttlSecs > 0 ? Date.now() + ttlSecs * 1e3 : 0;
      this.inMemoryStore.set(key, { value, expiresAt });
    } catch (error) {
      logger.warn(`Cache set failed for key: ${key}`, { error });
    }
  }
  async delete(key) {
    try {
      this.inMemoryStore.delete(key);
    } catch (error) {
      logger.warn(`Cache delete failed for key: ${key}`, { error });
    }
  }
  async deletePattern(pattern) {
    try {
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      for (const key of this.inMemoryStore.keys()) {
        if (regex.test(key)) {
          this.inMemoryStore.delete(key);
        }
      }
    } catch (error) {
      logger.warn(`Cache deletePattern failed for pattern: ${pattern}`, { error });
    }
  }
  async clear() {
    this.inMemoryStore.clear();
  }
  async flush() {
    this.inMemoryStore.clear();
  }
  /**
   * Cache-aside helper: Returns cached data if available, otherwise executes loader, caches result, and returns.
   */
  async cached(key, ttlSecs, loader) {
    const cachedVal = await this.get(key);
    if (cachedVal !== null && cachedVal !== void 0) {
      return cachedVal;
    }
    const fresh = await loader();
    if (fresh !== null && fresh !== void 0) {
      await this.set(key, fresh, ttlSecs);
    }
    return fresh;
  }
};
var cacheService = new CacheService();

// server/core/cache/cache-keys.ts
var CacheKeys = {
  user: (id) => `user:${id}`,
  userProfile: (username) => `user:profile:${username}`,
  userFollowers: (id) => `user:${id}:followers`,
  userFollowing: (id) => `user:${id}:following`,
  post: (id) => `post:${id}`,
  feed: (userId, page) => `feed:${userId}:${page}`,
  explorePosts: (category, page) => `explore:${category}:${page}`,
  reels: (category, page) => `reels:${category}:${page}`,
  storyGroups: () => `stories:groups`,
  storyArchive: (userId) => `stories:archive:${userId}`,
  userHighlights: (userId) => `highlights:${userId}`,
  unreadNotificationsCount: (userId) => `notifications:unread:${userId}`,
  rateLimit: (key) => `ratelimit:${key}`
};

// server/middleware/rate-limiter.middleware.ts
function rateLimiter(options = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const max = options.max || config.rateLimit.maxRequests;
  const defaultKeyGen = (req) => req.user?.id || req.ip || "anonymous";
  const getKey = options.keyGenerator || defaultKeyGen;
  return async (req, res, next) => {
    try {
      const clientKey = getKey(req);
      const cacheKey = CacheKeys.rateLimit(clientKey);
      let record = await cacheService.get(cacheKey);
      const now = Date.now();
      if (!record || record.resetAt <= now) {
        record = {
          count: 1,
          resetAt: now + windowMs
        };
        await cacheService.set(cacheKey, record, Math.ceil(windowMs / 1e3));
      } else {
        record.count++;
        const remainingTtlSecs = Math.max(1, Math.ceil((record.resetAt - now) / 1e3));
        await cacheService.set(cacheKey, record, remainingTtlSecs);
      }
      const remaining = Math.max(0, max - record.count);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetAt / 1e3));
      if (record.count > max) {
        return next(
          new TooManyRequestsError(
            `Rate limit exceeded: maximum ${max} requests per ${Math.ceil(windowMs / 1e3)}s`
          )
        );
      }
      next();
    } catch (error) {
      next();
    }
  };
}

// server/routes/v1/auth.routes.ts
var router = Router();
router.post(
  "/signup",
  rateLimiter({ max: 20 }),
  validate({ body: SignupSchema }),
  authController.signup.bind(authController)
);
router.post(
  "/signin",
  rateLimiter({ max: 30 }),
  validate({ body: SigninSchema }),
  authController.signin.bind(authController)
);
router.post(
  "/refresh",
  validate({ body: RefreshTokenSchema }),
  authController.refreshToken.bind(authController)
);
router.post("/logout", authController.logout.bind(authController));
router.post("/logout-all", authController.logoutAll.bind(authController));
router.post("/google", authController.socialAuthGoogle.bind(authController));
router.post("/apple", authController.socialAuthApple.bind(authController));
router.get("/sessions", authController.getSessions.bind(authController));
router.delete("/sessions/:id", authController.deleteSession.bind(authController));
router.get("/devices", authController.getDevices.bind(authController));
router.delete("/devices/:id", authController.deleteDevice.bind(authController));
router.patch("/devices/:id", authController.updateDevice.bind(authController));
router.put("/devices/:id", authController.updateDevice.bind(authController));
router.get("/security-logs", authController.getSecurityLogs.bind(authController));
router.post("/2fa/setup", authController.setup2FA.bind(authController));
router.post("/2fa/enable", authController.enable2FA.bind(authController));
router.post("/2fa/disable", authController.disable2FA.bind(authController));
router.post("/2fa/verify-login", authController.verify2FALogin.bind(authController));
router.post("/resolve-suspicious-alert", authController.resolveSuspiciousAlert.bind(authController));
router.post("/passkey/register-options", authController.passkeyRegisterOptions.bind(authController));
router.post("/passkey/register-verify", authController.passkeyRegisterVerify.bind(authController));
router.post("/passkey/signin-options", authController.passkeySigninOptions.bind(authController));
router.post("/passkey/signin-verify", authController.passkeySigninVerify.bind(authController));
router.post("/forgot-password/request", authController.forgotPasswordRequest.bind(authController));
router.post("/forgot-password/verify", authController.forgotPasswordVerify.bind(authController));
router.post("/verify-email/send", authController.sendEmailVerification.bind(authController));
router.post("/verify-email/confirm", authController.confirmEmailVerification.bind(authController));
var authRoutes = router;

// server/routes/v1/user.routes.ts
import { Router as Router2 } from "express";

// server/core/queue/queue.ts
var JobQueue = class {
  constructor(autoProcess = true) {
    this.queue = [];
    this.handlers = /* @__PURE__ */ new Map();
    this.concurrency = 3;
    this.activeWorkers = 0;
    this.maxRetries = 3;
    this.completedCount = 0;
    this.failedCount = 0;
    this.autoProcess = true;
    this.autoProcess = autoProcess;
  }
  registerHandler(type, handler2) {
    this.handlers.set(type, handler2);
    logger.info(`Job handler registered for type: ${type}`);
  }
  async add(type, payload, options = {}) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      attempts: 0,
      maxRetries: options.maxRetries ?? this.maxRetries,
      priority: options.priority ?? 0,
      status: "pending",
      createdAt: Date.now()
    };
    const insertIdx = this.queue.findIndex((item) => item.priority < job.priority);
    if (insertIdx === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIdx, 0, job);
    }
    logger.debug(`Enqueued background job: ${job.type} (${job.id})`);
    if (this.autoProcess) {
      this.processNext();
    }
    return job.id;
  }
  async processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }
    const job = this.queue.shift();
    if (!job) return;
    const handler2 = this.handlers.get(job.type);
    if (!handler2) {
      logger.error(`No worker handler registered for job type: ${job.type}`);
      job.status = "failed";
      job.error = "No handler registered";
      this.failedCount++;
      return;
    }
    this.activeWorkers++;
    job.status = "processing";
    job.attempts++;
    job.processedAt = Date.now();
    try {
      logger.debug(`Processing job ${job.type} (${job.id}), attempt ${job.attempts}`);
      await handler2(job.payload);
      job.status = "completed";
      job.completedAt = Date.now();
      this.completedCount++;
      logger.debug(`Successfully completed job ${job.type} (${job.id})`);
    } catch (err) {
      logger.error(`Error executing job ${job.type} (${job.id}): ${err?.message || err}`);
      if (job.attempts < job.maxRetries) {
        const backoffMs = Math.pow(2, job.attempts) * 10;
        setTimeout(() => {
          job.status = "pending";
          this.queue.push(job);
          if (this.autoProcess) {
            this.processNext();
          }
        }, backoffMs);
      } else {
        job.status = "failed";
        job.error = err?.message || "Execution error";
        this.failedCount++;
        logger.error(`Job ${job.type} (${job.id}) permanently failed after ${job.attempts} attempts`);
      }
    } finally {
      this.activeWorkers--;
      if (this.autoProcess) {
        this.processNext();
      }
    }
  }
  getStats() {
    return {
      pending: this.queue.filter((j) => j.status === "pending").length,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency,
      totalRegisteredHandlers: this.handlers.size,
      completed: this.completedCount,
      failed: this.failedCount
    };
  }
};
var jobQueue = new JobQueue();

// server/services/user.service.ts
var UserService = class {
  async getProfile(userId, currentUserId) {
    const user = await userRepository.getUserProfileWithStats(userId, currentUserId);
    if (!user) {
      throw new NotFoundError("User profile");
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio || "",
      website: user.website || "",
      category: user.category || "",
      isVerified: user.is_verified || false,
      followersCount: parseInt(user.followers_count || "0", 10),
      followingCount: parseInt(user.following_count || "0", 10),
      postsCount: parseInt(user.posts_count || "0", 10),
      isFollowing: Boolean(user.isFollowing),
      isBlocked: Boolean(user.isBlocked)
    };
  }
  async updateProfile(userId, updates) {
    const updated = await userRepository.updateProfile(userId, updates);
    if (!updated) {
      throw new NotFoundError("User");
    }
    await cacheService.delete(CacheKeys.user(userId));
    return updated;
  }
  async toggleFollow(currentUserId, targetUserId) {
    if (!currentUserId || currentUserId === targetUserId) {
      throw new BadRequestError("Cannot follow self or invalid user ID");
    }
    const isFollowing = await userRepository.isFollowing(currentUserId, targetUserId);
    let newIsFollowing = false;
    if (isFollowing) {
      await userRepository.unfollow(currentUserId, targetUserId);
      newIsFollowing = false;
    } else {
      await userRepository.follow(currentUserId, targetUserId);
      newIsFollowing = true;
      await jobQueue.add("DISPATCH_NOTIFICATION" /* DISPATCH_NOTIFICATION */, {
        recipientId: targetUserId,
        senderId: currentUserId,
        type: "follow",
        text: "started following you"
      });
    }
    const countRes = await query("SELECT COUNT(*)::int as count FROM follows WHERE following_id = $1", [
      targetUserId
    ]);
    const targetFollowersCount = parseInt(countRes.rows[0]?.count || "0", 10);
    return {
      success: true,
      isFollowing: newIsFollowing,
      targetFollowersCount
    };
  }
  async getAllUsers(currentUserId, limit = 50) {
    return userRepository.getAllUsers(currentUserId, limit);
  }
  async getFollowers(targetUserId, currentUserId) {
    return userRepository.getFollowers(targetUserId, currentUserId);
  }
  async getFollowing(targetUserId, currentUserId) {
    return userRepository.getFollowing(targetUserId, currentUserId);
  }
  async blockUser(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) {
      throw new BadRequestError("User ID and target user ID are required");
    }
    await userRepository.blockUser(currentUserId, targetUserId);
    return { success: true, isBlocked: true };
  }
  async unblockUser(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) {
      throw new BadRequestError("User ID and target user ID are required");
    }
    await userRepository.unblockUser(currentUserId, targetUserId);
    return { success: true, isBlocked: false };
  }
  async search(term, limit = 20) {
    if (!term || !term.trim()) return [];
    return userRepository.searchUsers(term.trim(), limit);
  }
};
var userService = new UserService();

// server/controllers/user.controller.ts
var UserController = class {
  async getAllUsers(req, res, next) {
    try {
      const currentUserId = req.query.currentUserId || req.user?.id;
      const limit = parseInt(req.query.limit, 10) || 50;
      const users = await userService.getAllUsers(currentUserId, limit);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
  async getFollowers(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.query.currentUserId || req.user?.id;
      const followers = await userService.getFollowers(id, currentUserId);
      res.json(followers);
    } catch (error) {
      next(error);
    }
  }
  async getFollowing(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.query.currentUserId || req.user?.id;
      const following = await userService.getFollowing(id, currentUserId);
      res.json(following);
    } catch (error) {
      next(error);
    }
  }
  async blockUser(req, res, next) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.body.currentUserId || req.user?.id || req.query.currentUserId;
      const result = await userService.blockUser(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async unblockUser(req, res, next) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.body.currentUserId || req.user?.id || req.query.currentUserId;
      const result = await userService.unblockUser(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getProfile(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.query.currentUserId || req.user?.id;
      const profile = await userService.getProfile(id, currentUserId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
  async updateProfile(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await userService.updateProfile(id, req.body);
      res.json({ success: true, user: updated });
    } catch (error) {
      next(error);
    }
  }
  async toggleFollow(req, res, next) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.body.currentUserId || req.user?.id;
      const result = await userService.toggleFollow(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async search(req, res, next) {
    try {
      const term = req.query.q || req.query.query || "";
      const limit = parseInt(req.query.limit, 10) || 20;
      const users = await userService.search(term, limit);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
};
var userController = new UserController();

// server/repositories/highlight.repository.ts
var HighlightRepository = class extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tableName = "highlights";
  }
  async getUserHighlights(userId) {
    const hlRes = await query(
      `SELECT id, user_id as "userId", title, cover_url as "coverUrl", created_at as "createdAt"
       FROM highlights
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    if (hlRes.rows.length === 0) return [];
    const highlightIds = hlRes.rows.map((r) => r.id);
    const itemsRes = await query(
      `SELECT id, highlight_id as "highlightId", story_id as "storyId",
              media_url as "mediaUrl", media_type as "mediaType",
              caption, filter, order_index as "orderIndex", created_at as "createdAt"
       FROM highlight_items
       WHERE highlight_id = ANY($1::varchar[])
       ORDER BY order_index ASC, created_at ASC`,
      [highlightIds]
    );
    const itemsByHl = /* @__PURE__ */ new Map();
    itemsRes.rows.forEach((item) => {
      if (!itemsByHl.has(item.highlightId)) {
        itemsByHl.set(item.highlightId, []);
      }
      itemsByHl.get(item.highlightId).push(item);
    });
    return hlRes.rows.map((hl) => ({
      ...hl,
      items: itemsByHl.get(hl.id) || []
    }));
  }
  async createHighlight(userId, title, coverUrl, items = []) {
    const hlId = `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const hlRes = await query(
      `INSERT INTO highlights (id, user_id, title, cover_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id as "userId", title, cover_url as "coverUrl", created_at as "createdAt"`,
      [hlId, userId, title, coverUrl]
    );
    const createdHl = hlRes.rows[0];
    const createdItems = [];
    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      const itemId = `hli_${Date.now()}_${i}`;
      const itmRes = await query(
        `INSERT INTO highlight_items (id, highlight_id, story_id, media_url, media_type, caption, filter, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, highlight_id as "highlightId", story_id as "storyId",
                   media_url as "mediaUrl", media_type as "mediaType",
                   caption, filter, order_index as "orderIndex"`,
        [itemId, hlId, itm.storyId || null, itm.mediaUrl, itm.mediaType || "image", itm.caption || "", itm.filter || "normal", i]
      );
      createdItems.push(itmRes.rows[0]);
    }
    return {
      ...createdHl,
      items: createdItems
    };
  }
  async addItemToHighlight(highlightId, item) {
    const itemId = `hli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const itmRes = await query(
      `INSERT INTO highlight_items (id, highlight_id, story_id, media_url, media_type, caption, filter, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM highlight_items WHERE highlight_id = $2))
       RETURNING id, highlight_id as "highlightId", story_id as "storyId",
                 media_url as "mediaUrl", media_type as "mediaType",
                 caption, filter, order_index as "orderIndex"`,
      [itemId, highlightId, item.storyId || null, item.mediaUrl, item.mediaType || "image", item.caption || "", item.filter || "normal"]
    );
    return itmRes.rows[0];
  }
};
var highlightRepository = new HighlightRepository();

// server/services/highlight.service.ts
var HighlightService = class {
  async getUserHighlights(userId) {
    if (!userId) throw new BadRequestError("User ID is required");
    return highlightRepository.getUserHighlights(userId);
  }
  async createHighlight(data) {
    if (!data.userId || !data.title || !data.coverUrl) {
      throw new BadRequestError("User ID, title, and cover URL are required");
    }
    return highlightRepository.createHighlight(data.userId, data.title, data.coverUrl, data.items || []);
  }
  async addItemToHighlight(highlightId, item) {
    if (!highlightId || !item || !item.mediaUrl) {
      throw new BadRequestError("Highlight ID and item media URL are required");
    }
    return highlightRepository.addItemToHighlight(highlightId, item);
  }
};
var highlightService = new HighlightService();

// server/controllers/highlight.controller.ts
var HighlightController = class {
  async getUserHighlights(req, res, next) {
    try {
      const userId = req.params.id || req.query.userId;
      const highlights = await highlightService.getUserHighlights(userId);
      res.json(highlights);
    } catch (error) {
      next(error);
    }
  }
  async createHighlight(req, res, next) {
    try {
      const created = await highlightService.createHighlight(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }
  async addItemToHighlight(req, res, next) {
    try {
      const { id } = req.params;
      const item = await highlightService.addItemToHighlight(id, req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
};
var highlightController = new HighlightController();

// server/validation/common.schema.ts
import { z as z2 } from "zod";
var PaginationQuerySchema = z2.object({
  page: z2.string().optional().transform((v) => v ? parseInt(v, 10) : 1),
  limit: z2.string().optional().transform((v) => v ? parseInt(v, 10) : 20),
  cursor: z2.string().optional(),
  sortBy: z2.string().optional(),
  sortOrder: z2.enum(["asc", "desc"]).optional(),
  currentUserId: z2.string().optional()
});
var IdParamSchema = z2.object({
  id: z2.string().min(1, "ID parameter is required")
});
var SearchQuerySchema = z2.object({
  q: z2.string().optional(),
  query: z2.string().optional(),
  limit: z2.string().optional().transform((v) => v ? parseInt(v, 10) : 20)
});

// server/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}
function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt2.verify(token, config.jwt.accessSecret);
      req.user = decoded;
    }
  } catch {
  }
  next();
}

// server/routes/v1/user.routes.ts
var router2 = Router2();
router2.get("/", optionalAuth, userController.getAllUsers.bind(userController));
router2.get("/search", validate({ query: SearchQuerySchema }), userController.search.bind(userController));
router2.get(
  "/:id",
  optionalAuth,
  validate({ params: IdParamSchema }),
  userController.getProfile.bind(userController)
);
router2.get("/:id/followers", optionalAuth, userController.getFollowers.bind(userController));
router2.get("/:id/following", optionalAuth, userController.getFollowing.bind(userController));
router2.get("/:id/highlights", highlightController.getUserHighlights.bind(highlightController));
router2.post("/:id/block", optionalAuth, userController.blockUser.bind(userController));
router2.post("/:id/unblock", optionalAuth, userController.unblockUser.bind(userController));
router2.put(
  "/:id",
  validate({ params: IdParamSchema, body: UpdateProfileSchema }),
  userController.updateProfile.bind(userController)
);
router2.post(
  "/:id/follow",
  validate({ params: IdParamSchema, body: FollowToggleSchema }),
  userController.toggleFollow.bind(userController)
);
var userRoutes = router2;

// server/routes/v1/post.routes.ts
import { Router as Router3 } from "express";

// server/repositories/post.repository.ts
var PostRepository = class extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tableName = "posts";
  }
  async getFeedPosts(currentUserId, limit = 20, offset = 0) {
    const res = await query(
      `SELECT 
        p.*,
        u.username as author_username,
        u.name as author_name,
        u.avatar as author_avatar,
        u.bio as author_bio,
        u.is_verified as author_is_verified,
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as author_posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as author_followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as author_following_count,
        (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as "isLiked",
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as "isSaved",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = p.user_id) as "author_is_following"
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [currentUserId || "none", limit, offset]
    );
    return res.rows;
  }
  async getCommentsByPostIds(postIds, currentUserId) {
    if (postIds.length === 0) return [];
    const res = await query(
      `SELECT 
        c.*,
        u.username,
        u.avatar as user_avatar,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $1) as "isLiked"
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ANY($2::varchar[])
      ORDER BY c.created_at ASC`,
      [currentUserId || "none", postIds]
    );
    return res.rows;
  }
  async createPost(post) {
    await query(
      `INSERT INTO posts (id, user_id, caption, location, tags, music_track, media)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        post.id,
        post.userId,
        post.caption,
        post.location,
        JSON.stringify(post.tags || []),
        post.musicTrack ? JSON.stringify(post.musicTrack) : null,
        JSON.stringify(post.media || [])
      ]
    );
    if (post.media && post.media.length > 0) {
      for (let i = 0; i < post.media.length; i++) {
        const m = post.media[i];
        await query(
          `INSERT INTO post_media (id, post_id, url, media_type, aspect_ratio, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [`pm_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`, post.id, m.url, m.type || "image", m.aspectRatio || "square", i]
        );
      }
    }
  }
  async isLiked(postId, userId) {
    const res = await query("SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    return res.rows.length > 0;
  }
  async addLike(postId, userId) {
    await query("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [postId, userId]);
    await query("UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1", [postId]);
  }
  async removeLike(postId, userId) {
    await query("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    await query("UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1", [postId]);
  }
  async isSaved(postId, userId) {
    const res = await query("SELECT 1 FROM saved_posts WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    return res.rows.length > 0;
  }
  async addSave(postId, userId) {
    await query("INSERT INTO saved_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [postId, userId]);
  }
  async removeSave(postId, userId) {
    await query("DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2", [postId, userId]);
  }
  async addComment(commentId, postId, userId, text) {
    await query(
      `INSERT INTO comments (id, post_id, user_id, text, likes_count) VALUES ($1, $2, $3, $4, 0)`,
      [commentId, postId, userId, text]
    );
    await query("UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1", [postId]);
  }
};
var postRepository = new PostRepository();

// server/utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
}
async function uploadToCloudinary(fileBase64OrUrl, folder = "instavibe_uploads") {
  try {
    if (!config.cloudinary.isConfigured || !fileBase64OrUrl.startsWith("data:")) {
      return {
        url: fileBase64OrUrl,
        publicId: `mock_${Date.now()}`
      };
    }
    const result = await cloudinary.uploader.upload(fileBase64OrUrl, {
      folder,
      resource_type: "auto"
    });
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    logger.error("Cloudinary upload error, using raw file as fallback", error);
    return {
      url: fileBase64OrUrl,
      publicId: `fallback_${Date.now()}`
    };
  }
}

// server/services/post.service.ts
var PostService = class {
  async getPosts(currentUserId = "", limit = 20, offset = 0) {
    const rawPosts = await postRepository.getFeedPosts(currentUserId, limit, offset);
    const postIds = rawPosts.map((p) => p.id);
    const rawComments = await postRepository.getCommentsByPostIds(postIds, currentUserId);
    const commentsByPost = {};
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
        isLiked: c.isLiked || false
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
        bio: p.author_bio || "",
        isVerified: p.author_is_verified,
        isFollowing: p.author_is_following,
        followersCount: parseInt(p.author_followers_count || "0", 10),
        followingCount: parseInt(p.author_following_count || "0", 10),
        postsCount: parseInt(p.author_posts_count || "0", 10)
      },
      media: typeof p.media === "string" ? JSON.parse(p.media) : p.media || [],
      caption: p.caption || "",
      location: p.location || "",
      timestamp: p.created_at,
      likesCount: parseInt(p.likes_count || "0", 10),
      commentsCount: parseInt(p.comments_count || "0", 10) || (commentsByPost[p.id]?.length ?? 0),
      isLiked: Boolean(p.isLiked),
      isSaved: Boolean(p.isSaved),
      comments: commentsByPost[p.id] || [],
      tags: typeof p.tags === "string" ? JSON.parse(p.tags) : p.tags || [],
      musicTrack: typeof p.music_track === "string" ? JSON.parse(p.music_track) : p.music_track
    }));
  }
  async createPost(data) {
    if (!data.userId) {
      throw new BadRequestError("User ID is required");
    }
    const processedMedia = [];
    for (const item of data.media) {
      let finalUrl = item.url;
      if (item.url && item.url.startsWith("data:image")) {
        const uploadRes = await uploadToCloudinary(item.url, "instavibe_posts");
        finalUrl = uploadRes.url;
      }
      processedMedia.push({
        ...item,
        url: finalUrl
      });
    }
    const postId = `post_${Date.now()}`;
    await postRepository.createPost({
      id: postId,
      userId: data.userId,
      caption: data.caption || "",
      location: data.location || "",
      tags: data.tags || [],
      musicTrack: data.musicTrack,
      media: processedMedia
    });
    const author = await userRepository.findById(data.userId);
    if (processedMedia[0]?.url) {
      await jobQueue.add("PROCESS_MEDIA" /* PROCESS_MEDIA */, {
        postId,
        mediaUrl: processedMedia[0].url
      });
    }
    return {
      id: postId,
      userId: data.userId,
      author: {
        id: author?.id || data.userId,
        username: author?.username || "user",
        name: author?.name || "User",
        avatar: author?.avatar || "",
        bio: author?.bio || "",
        isVerified: author?.is_verified || false,
        followersCount: author?.followers_count || 0,
        followingCount: author?.following_count || 0,
        postsCount: (author?.posts_count || 0) + 1
      },
      media: processedMedia,
      caption: data.caption || "",
      location: data.location || "",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      tags: data.tags || [],
      musicTrack: data.musicTrack
    };
  }
  async deletePost(postId) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Post");
    }
    await postRepository.deleteById(postId);
    await query("UPDATE users SET posts_count = GREATEST(0, posts_count - 1) WHERE id = $1", [post.user_id]);
    return { success: true, postId };
  }
  async toggleLike(postId, userId) {
    const isLiked = await postRepository.isLiked(postId, userId);
    let newIsLiked = false;
    if (isLiked) {
      await postRepository.removeLike(postId, userId);
      newIsLiked = false;
    } else {
      await postRepository.addLike(postId, userId);
      newIsLiked = true;
      const post2 = await postRepository.findById(postId);
      if (post2 && post2.user_id !== userId) {
        const media = typeof post2.media === "string" ? JSON.parse(post2.media) : post2.media;
        await jobQueue.add("DISPATCH_NOTIFICATION" /* DISPATCH_NOTIFICATION */, {
          recipientId: post2.user_id,
          senderId: userId,
          type: "like",
          postId,
          targetMediaUrl: media?.[0]?.url || "",
          text: "liked your post"
        });
      }
    }
    const post = await postRepository.findById(postId);
    return {
      success: true,
      isLiked: newIsLiked,
      likesCount: post?.likes_count || 0
    };
  }
  async toggleSave(postId, userId) {
    const isSaved = await postRepository.isSaved(postId, userId);
    if (isSaved) {
      await postRepository.removeSave(postId, userId);
      return { success: true, isSaved: false };
    } else {
      await postRepository.addSave(postId, userId);
      return { success: true, isSaved: true };
    }
  }
  async addComment(postId, userId, text) {
    const commentId = `comm_${Date.now()}`;
    await postRepository.addComment(commentId, postId, userId, text.trim());
    const user = await userRepository.findById(userId);
    const post = await postRepository.findById(postId);
    if (post && post.user_id !== userId) {
      const media = typeof post.media === "string" ? JSON.parse(post.media) : post.media;
      await jobQueue.add("DISPATCH_NOTIFICATION" /* DISPATCH_NOTIFICATION */, {
        recipientId: post.user_id,
        senderId: userId,
        type: "comment",
        postId,
        targetMediaUrl: media?.[0]?.url || "",
        text: `commented: "${text.slice(0, 30)}${text.length > 30 ? "..." : ""}"`
      });
    }
    return {
      id: commentId,
      userId,
      username: user?.username || "user",
      userAvatar: user?.avatar || "",
      text: text.trim(),
      timestamp: "Just now",
      likesCount: 0,
      isLiked: false
    };
  }
};
var postService = new PostService();

// server/core/pagination/pagination.ts
function parsePaginationParams(query2, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(query2.page, 10) || 1);
  const requestedLimit = parseInt(query2.limit, 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;
  const cursor = query2.cursor ? String(query2.cursor) : void 0;
  const sortBy = query2.sortBy ? String(query2.sortBy) : void 0;
  const sortOrder = query2.sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";
  return { page, limit, offset, cursor, sortBy, sortOrder };
}

// server/controllers/post.controller.ts
var PostController = class {
  async getPosts(req, res, next) {
    try {
      const { limit, offset } = parsePaginationParams(req.query);
      const currentUserId = req.query.currentUserId || req.user?.id || "";
      const posts = await postService.getPosts(currentUserId, limit, offset);
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }
  async createPost(req, res, next) {
    try {
      const post = await postService.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }
  async deletePost(req, res, next) {
    try {
      const { id } = req.params;
      const result = await postService.deletePost(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async toggleLike(req, res, next) {
    try {
      const postId = req.params.id;
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await postService.toggleLike(postId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async toggleSave(req, res, next) {
    try {
      const postId = req.params.id;
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await postService.toggleSave(postId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async addComment(req, res, next) {
    try {
      const postId = req.params.id;
      const { userId = req.user?.id || "user_current", text } = req.body;
      const comment = await postService.addComment(postId, userId, text);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }
};
var postController = new PostController();

// server/validation/post.schema.ts
import { z as z3 } from "zod";
var CreatePostSchema = z3.object({
  userId: z3.string().min(1, "User ID is required"),
  caption: z3.string().max(2200).optional().default(""),
  location: z3.string().max(200).optional().default(""),
  media: z3.array(
    z3.object({
      url: z3.string().min(1, "Media URL is required"),
      type: z3.enum(["image", "video"]).optional().default("image"),
      aspectRatio: z3.string().optional().default("square")
    })
  ).min(1, "At least one media item is required"),
  tags: z3.array(z3.string()).optional().default([]),
  musicTrack: z3.object({
    title: z3.string(),
    artist: z3.string(),
    coverUrl: z3.string().optional(),
    audioUrl: z3.string().optional()
  }).nullable().optional()
});
var CreateCommentSchema = z3.object({
  userId: z3.string().min(1, "User ID is required"),
  text: z3.string().min(1, "Comment text cannot be empty").max(1e3)
});

// server/routes/v1/post.routes.ts
var router3 = Router3();
router3.get("/", optionalAuth, validate({ query: PaginationQuerySchema }), postController.getPosts.bind(postController));
router3.post("/", validate({ body: CreatePostSchema }), postController.createPost.bind(postController));
router3.delete("/:id", validate({ params: IdParamSchema }), postController.deletePost.bind(postController));
router3.post("/:id/like", validate({ params: IdParamSchema }), postController.toggleLike.bind(postController));
router3.post("/:id/save", validate({ params: IdParamSchema }), postController.toggleSave.bind(postController));
router3.post(
  "/:id/comments",
  validate({ params: IdParamSchema, body: CreateCommentSchema }),
  postController.addComment.bind(postController)
);
var postRoutes = router3;

// server/routes/v1/story.routes.ts
import { Router as Router4 } from "express";

// server/repositories/story.repository.ts
var StoryRepository = class extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tableName = "stories";
  }
  async getAllStoriesWithUsers(currentUserId) {
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
      ORDER BY s.created_at DESC`,
      [currentUserId || "user_current"]
    );
    return res.rows;
  }
  async createStory(story) {
    await query(
      `INSERT INTO stories (id, user_id, media_url, media_type, caption, filter, link)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [story.id, story.userId, story.mediaUrl, story.mediaType, story.caption, story.filter, story.link]
    );
  }
  async recordView(storyId, userId) {
    await query(
      `INSERT INTO story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [storyId, userId]
    );
  }
  async toggleLike(storyId, userId) {
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
  async getViewers(storyId) {
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
  async getUserArchive(userId) {
    const res = await query(
      `SELECT * FROM stories WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }
  async getUserHighlights(userId) {
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
        storiesCount: items.rows.length
      });
    }
    return highlights;
  }
};
var storyRepository = new StoryRepository();

// server/services/story.service.ts
var StoryService = class {
  async getStoryGroups(currentUserId = "user_current") {
    const rawStories = await storyRepository.getAllStoriesWithUsers(currentUserId);
    const groupedMap = {};
    for (const s of rawStories) {
      if (!groupedMap[s.user_id]) {
        groupedMap[s.user_id] = {
          userId: s.user_id,
          username: s.username,
          name: s.name,
          avatar: s.avatar,
          isVerified: s.is_verified,
          hasUnseen: false,
          items: []
        };
      }
      const isSeen = s.isSeen || false;
      if (!isSeen && s.user_id !== currentUserId) {
        groupedMap[s.user_id].hasUnseen = true;
      }
      let timeAgo = "Just now";
      if (s.created_at) {
        const diffSecs = Math.max(0, Math.floor((Date.now() - new Date(s.created_at).getTime()) / 1e3));
        if (diffSecs < 60) timeAgo = "Just now";
        else if (diffSecs < 3600) timeAgo = `${Math.floor(diffSecs / 60)}m`;
        else if (diffSecs < 86400) timeAgo = `${Math.floor(diffSecs / 3600)}h`;
        else if (diffSecs < 604800) timeAgo = `${Math.floor(diffSecs / 86400)}d`;
        else timeAgo = `${Math.floor(diffSecs / 604800)}w`;
      }
      groupedMap[s.user_id].items.push({
        id: s.id,
        mediaUrl: s.media_url,
        mediaType: s.media_type || "image",
        timestamp: timeAgo,
        rawTimestamp: s.created_at,
        caption: s.caption || "",
        filter: s.filter || "normal",
        seen: isSeen,
        isLiked: Boolean(s.isLiked),
        viewsCount: s.viewsCount || 0,
        likesCount: s.likesCount || 0,
        link: s.link || ""
      });
    }
    return Object.values(groupedMap);
  }
  async createStory(data) {
    let finalMediaUrl = data.mediaUrl;
    if (data.mediaUrl && data.mediaUrl.startsWith("data:image")) {
      const uploadRes = await uploadToCloudinary(data.mediaUrl, "instavibe_stories");
      finalMediaUrl = uploadRes.url;
    }
    const storyId = `story_${Date.now()}`;
    await storyRepository.createStory({
      id: storyId,
      userId: data.userId,
      mediaUrl: finalMediaUrl,
      mediaType: data.mediaType || "image",
      caption: data.caption || "",
      filter: data.filter || "normal",
      link: data.link || ""
    });
    return {
      id: storyId,
      userId: data.userId,
      mediaUrl: finalMediaUrl,
      mediaType: data.mediaType || "image",
      caption: data.caption || "",
      filter: data.filter || "normal",
      link: data.link || "",
      timestamp: "Just now",
      rawTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
      seen: false,
      isLiked: false,
      viewsCount: 0,
      likesCount: 0
    };
  }
  async recordView(storyId, userId) {
    await storyRepository.recordView(storyId, userId);
    return { success: true };
  }
  async toggleLike(storyId, userId) {
    const isLiked = await storyRepository.toggleLike(storyId, userId);
    if (isLiked) {
      const story = await storyRepository.findById(storyId);
      if (story && story.user_id !== userId) {
        await jobQueue.add("DISPATCH_NOTIFICATION" /* DISPATCH_NOTIFICATION */, {
          recipientId: story.user_id,
          senderId: userId,
          type: "story_like",
          targetMediaUrl: story.media_url,
          text: "liked your story."
        });
      }
    }
    return { success: true, isLiked };
  }
  async getViewers(storyId) {
    return storyRepository.getViewers(storyId);
  }
  async deleteStory(storyId) {
    await storyRepository.deleteById(storyId);
    return { success: true };
  }
  async getArchive(userId) {
    return storyRepository.getUserArchive(userId);
  }
  async getHighlights(userId) {
    return storyRepository.getUserHighlights(userId);
  }
};
var storyService = new StoryService();

// server/controllers/story.controller.ts
var StoryController = class {
  async getStories(req, res, next) {
    try {
      const currentUserId = req.query.currentUserId || req.user?.id || "user_current";
      const stories = await storyService.getStoryGroups(currentUserId);
      res.json(stories);
    } catch (error) {
      next(error);
    }
  }
  async createStory(req, res, next) {
    try {
      const story = await storyService.createStory(req.body);
      res.status(201).json(story);
    } catch (error) {
      next(error);
    }
  }
  async recordView(req, res, next) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || "user_current" } = req.body;
      const result = await storyService.recordView(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async toggleLike(req, res, next) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || "user_current" } = req.body;
      const result = await storyService.toggleLike(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getViewers(req, res, next) {
    try {
      const { id } = req.params;
      const viewers = await storyService.getViewers(id);
      res.json(viewers);
    } catch (error) {
      next(error);
    }
  }
  async deleteStory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await storyService.deleteStory(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getArchive(req, res, next) {
    try {
      const { id } = req.params;
      const archive = await storyService.getArchive(id);
      res.json(archive);
    } catch (error) {
      next(error);
    }
  }
  async getHighlights(req, res, next) {
    try {
      const { id } = req.params;
      const highlights = await storyService.getHighlights(id);
      res.json(highlights);
    } catch (error) {
      next(error);
    }
  }
};
var storyController = new StoryController();

// server/validation/story.schema.ts
import { z as z4 } from "zod";
var CreateStorySchema = z4.object({
  userId: z4.string().min(1, "User ID is required"),
  mediaUrl: z4.string().min(1, "Media URL is required"),
  mediaType: z4.enum(["image", "video"]).optional().default("image"),
  caption: z4.string().max(500).optional().default(""),
  filter: z4.string().optional().default("normal"),
  link: z4.string().optional().default("")
});
var CreateHighlightSchema = z4.object({
  userId: z4.string().min(1, "User ID is required"),
  title: z4.string().min(1, "Title is required").max(50),
  coverUrl: z4.string().optional(),
  items: z4.array(z4.any()).optional().default([])
});

// server/routes/v1/story.routes.ts
var router4 = Router4();
router4.get("/", optionalAuth, storyController.getStories.bind(storyController));
router4.post("/", validate({ body: CreateStorySchema }), storyController.createStory.bind(storyController));
router4.post("/:id/view", validate({ params: IdParamSchema }), storyController.recordView.bind(storyController));
router4.post("/:id/like", validate({ params: IdParamSchema }), storyController.toggleLike.bind(storyController));
router4.get("/:id/viewers", validate({ params: IdParamSchema }), storyController.getViewers.bind(storyController));
router4.delete("/:id", validate({ params: IdParamSchema }), storyController.deleteStory.bind(storyController));
var storyRoutes = router4;

// server/routes/v1/reel.routes.ts
import { Router as Router5 } from "express";

// server/repositories/reel.repository.ts
var ReelRepository = class extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tableName = "reels";
  }
  async getReels(options) {
    const { currentUserId = "none", category = "for_you", limit, offset } = options;
    let filterClause = "";
    const params = [currentUserId || "none"];
    if (category === "following" && currentUserId && currentUserId !== "none") {
      filterClause = `AND EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.following_id = r.user_id)`;
    } else if (category === "saved" && currentUserId && currentUserId !== "none") {
      filterClause = `AND EXISTS(SELECT 1 FROM reel_saved rs WHERE rs.reel_id = r.id AND rs.user_id = $1)`;
    }
    let orderByClause = "ORDER BY r.created_at DESC";
    if (category === "trending") {
      orderByClause = "ORDER BY (COALESCE(r.views_count, 0) + (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) * 10) DESC";
    }
    const res = await query(
      `SELECT 
        r.*,
        u.username,
        u.name,
        u.avatar,
        u.bio,
        u.is_verified,
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as author_posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as author_followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as author_following_count,
        (SELECT COUNT(*)::int FROM reel_likes WHERE reel_id = r.id) as likes_count,
        (SELECT COUNT(*)::int FROM reel_comments WHERE reel_id = r.id) as comments_count,
        (SELECT COUNT(*)::int FROM reel_saved WHERE reel_id = r.id) as shares_count,
        EXISTS(SELECT 1 FROM reel_likes WHERE reel_id = r.id AND user_id = $1) as "isLiked",
        EXISTS(SELECT 1 FROM reel_saved WHERE reel_id = r.id AND user_id = $1) as "isSaved",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = r.user_id) as "author_is_following"
      FROM reels r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 ${filterClause}
      ${orderByClause}
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return res.rows;
  }
  async createReel(reel) {
    await query(
      `INSERT INTO reels (id, user_id, video_url, poster_url, caption, music_track, tags, views_count, duration_secs, qualities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9)`,
      [
        reel.id,
        reel.userId,
        reel.videoUrl,
        reel.posterUrl,
        reel.caption,
        reel.musicTrack ? JSON.stringify(reel.musicTrack) : null,
        JSON.stringify(reel.tags),
        reel.duration,
        JSON.stringify(reel.qualities)
      ]
    );
  }
  async toggleLike(reelId, userId) {
    const check = await query("SELECT 1 FROM reel_likes WHERE reel_id = $1 AND user_id = $2", [reelId, userId]);
    let isLiked = false;
    if (check.rows.length > 0) {
      await query("DELETE FROM reel_likes WHERE reel_id = $1 AND user_id = $2", [reelId, userId]);
      isLiked = false;
    } else {
      await query("INSERT INTO reel_likes (reel_id, user_id) VALUES ($1, $2)", [reelId, userId]);
      isLiked = true;
    }
    const countRes = await query("SELECT COUNT(*)::int as count FROM reel_likes WHERE reel_id = $1", [reelId]);
    return { isLiked, likesCount: parseInt(countRes.rows[0].count || "0", 10) };
  }
  async toggleSave(reelId, userId) {
    const check = await query("SELECT 1 FROM reel_saved WHERE reel_id = $1 AND user_id = $2", [reelId, userId]);
    if (check.rows.length > 0) {
      await query("DELETE FROM reel_saved WHERE reel_id = $1 AND user_id = $2", [reelId, userId]);
      return false;
    } else {
      await query("INSERT INTO reel_saved (reel_id, user_id) VALUES ($1, $2)", [reelId, userId]);
      return true;
    }
  }
  async getComments(reelId, currentUserId) {
    const res = await query(
      `SELECT 
        rc.id,
        rc.user_id as "userId",
        u.username,
        u.avatar as "userAvatar",
        rc.text,
        rc.created_at,
        rc.likes_count as "likesCount",
        EXISTS(SELECT 1 FROM reel_comment_likes rcl WHERE rcl.comment_id = rc.id AND rcl.user_id = $2) as "isLiked"
      FROM reel_comments rc
      JOIN users u ON rc.user_id = u.id
      WHERE rc.reel_id = $1
      ORDER BY rc.created_at DESC`,
      [reelId, currentUserId || "none"]
    );
    return res.rows;
  }
  async addComment(commentId, reelId, userId, text) {
    await query(
      `INSERT INTO reel_comments (id, reel_id, user_id, text, likes_count) VALUES ($1, $2, $3, $4, 0)`,
      [commentId, reelId, userId, text]
    );
  }
  async recordWatch(reelId, userId, watchDurationSecs, progressPercent) {
    await query("UPDATE reels SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1", [reelId]);
    if (userId && userId !== "none" && userId !== "guest_user") {
      const historyId = `rwh_${userId}_${reelId}`;
      await query(
        `INSERT INTO reel_watch_history (id, reel_id, user_id, watch_duration_secs, progress_percent, watched_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET 
           watch_duration_secs = EXCLUDED.watch_duration_secs,
           progress_percent = EXCLUDED.progress_percent,
           watched_at = NOW()`,
        [historyId, reelId, userId, watchDurationSecs, progressPercent]
      );
    }
  }
  async getWatchHistory(userId) {
    const res = await query(
      `SELECT 
        rwh.id as history_id,
        rwh.watched_at,
        rwh.watch_duration_secs,
        rwh.progress_percent,
        r.*,
        u.username,
        u.name,
        u.avatar,
        u.is_verified,
        (SELECT COUNT(*)::int FROM reel_likes WHERE reel_id = r.id) as likes_count,
        (SELECT COUNT(*)::int FROM reel_comments WHERE reel_id = r.id) as comments_count,
        EXISTS(SELECT 1 FROM reel_likes WHERE reel_id = r.id AND user_id = $1) as "isLiked",
        EXISTS(SELECT 1 FROM reel_saved WHERE reel_id = r.id AND user_id = $1) as "isSaved"
      FROM reel_watch_history rwh
      JOIN reels r ON rwh.reel_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE rwh.user_id = $1
      ORDER BY rwh.watched_at DESC
      LIMIT 50`,
      [userId]
    );
    return res.rows;
  }
};
var reelRepository = new ReelRepository();

// server/services/reel.service.ts
var ReelService = class {
  async getReels(options) {
    const rawReels = await reelRepository.getReels(options);
    return rawReels.map((r) => {
      const defaultQualities = [
        { label: "Auto (1080p)", resolution: "1080p", bitrate: "6.2 Mbps", url: r.video_url },
        { label: "High (720p)", resolution: "720p", bitrate: "3.8 Mbps", url: r.video_url },
        { label: "Medium (480p)", resolution: "480p", bitrate: "1.9 Mbps", url: r.video_url },
        { label: "Data Saver (360p)", resolution: "360p", bitrate: "0.8 Mbps", url: r.video_url }
      ];
      let parsedQualities = defaultQualities;
      if (r.qualities) {
        parsedQualities = typeof r.qualities === "string" ? JSON.parse(r.qualities) : r.qualities;
      }
      return {
        id: r.id,
        userId: r.user_id,
        author: {
          id: r.user_id,
          username: r.username,
          name: r.name,
          avatar: r.avatar,
          bio: r.bio || "",
          isVerified: r.is_verified,
          isFollowing: Boolean(r.author_is_following),
          followersCount: parseInt(r.author_followers_count || "0", 10),
          followingCount: parseInt(r.author_following_count || "0", 10),
          postsCount: parseInt(r.author_posts_count || "0", 10)
        },
        videoUrl: r.video_url,
        posterUrl: r.poster_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
        caption: r.caption || "",
        musicTrack: typeof r.music_track === "string" ? JSON.parse(r.music_track) : r.music_track || { title: "Original Audio", artist: r.username },
        likesCount: parseInt(r.likes_count || "0", 10),
        commentsCount: parseInt(r.comments_count || "0", 10),
        sharesCount: parseInt(r.shares_count || "0", 10) + Math.floor(parseInt(r.likes_count || "0", 10) * 0.15),
        viewsCount: parseInt(r.views_count || "0", 10) || 1200,
        duration: parseInt(r.duration_secs || "15", 10),
        isLiked: Boolean(r.isLiked),
        isSaved: Boolean(r.isSaved),
        tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags || [],
        qualities: parsedQualities,
        createdAt: r.created_at
      };
    });
  }
  async createReel(data) {
    let finalPoster = data.posterUrl;
    if (data.posterUrl && data.posterUrl.startsWith("data:image")) {
      const uploadRes = await uploadToCloudinary(data.posterUrl, "instavibe_reels");
      finalPoster = uploadRes.url;
    }
    if (!finalPoster) {
      finalPoster = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";
    }
    const reelId = `reel_${Date.now()}`;
    const qualities = [
      { label: "Auto (1080p)", resolution: "1080p", bitrate: "6.2 Mbps", url: data.videoUrl },
      { label: "High (720p)", resolution: "720p", bitrate: "3.8 Mbps", url: data.videoUrl },
      { label: "Medium (480p)", resolution: "480p", bitrate: "1.9 Mbps", url: data.videoUrl },
      { label: "Data Saver (360p)", resolution: "360p", bitrate: "0.8 Mbps", url: data.videoUrl }
    ];
    await reelRepository.createReel({
      id: reelId,
      userId: data.userId,
      videoUrl: data.videoUrl,
      posterUrl: finalPoster,
      caption: data.caption || "",
      musicTrack: data.musicTrack,
      tags: data.tags || [],
      duration: data.duration || 15,
      qualities
    });
    const author = await userRepository.findById(data.userId);
    return {
      id: reelId,
      userId: data.userId,
      author: {
        id: author?.id || data.userId,
        username: author?.username || "user",
        name: author?.name || "User",
        avatar: author?.avatar || "",
        bio: author?.bio || "",
        isVerified: author?.is_verified || false,
        isFollowing: false,
        followersCount: author?.followers_count || 0,
        followingCount: author?.following_count || 0,
        postsCount: author?.posts_count || 0
      },
      videoUrl: data.videoUrl,
      posterUrl: finalPoster,
      caption: data.caption || "",
      musicTrack: data.musicTrack || { title: "Original Audio", artist: author?.username || "user" },
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      duration: data.duration || 15,
      isLiked: false,
      isSaved: false,
      tags: data.tags || [],
      qualities,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async toggleLike(reelId, userId) {
    const res = await reelRepository.toggleLike(reelId, userId);
    if (res.isLiked) {
      const reel = await reelRepository.findById(reelId);
      if (reel && reel.user_id !== userId) {
        await jobQueue.add("DISPATCH_NOTIFICATION" /* DISPATCH_NOTIFICATION */, {
          recipientId: reel.user_id,
          senderId: userId,
          type: "like",
          targetMediaUrl: reel.poster_url,
          text: "liked your reel."
        });
      }
    }
    return res;
  }
  async toggleSave(reelId, userId) {
    const isSaved = await reelRepository.toggleSave(reelId, userId);
    return { success: true, isSaved };
  }
  async getComments(reelId, currentUserId) {
    return reelRepository.getComments(reelId, currentUserId);
  }
  async addComment(reelId, userId, text) {
    const commentId = `rc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await reelRepository.addComment(commentId, reelId, userId, text);
    const user = await userRepository.findById(userId);
    const reel = await reelRepository.findById(reelId);
    if (reel && reel.user_id !== userId) {
      await jobQueue.add("DISPATCH_NOTIFICATION" /* DISPATCH_NOTIFICATION */, {
        recipientId: reel.user_id,
        senderId: userId,
        type: "comment",
        targetMediaUrl: reel.poster_url,
        text: `commented on your reel: "${text.trim().slice(0, 30)}${text.length > 30 ? "..." : ""}"`
      });
    }
    return {
      id: commentId,
      userId,
      username: user?.username || "user",
      userAvatar: user?.avatar || "",
      text: text.trim(),
      timestamp: "Just now",
      likesCount: 0,
      isLiked: false
    };
  }
  async recordWatch(reelId, userId, watchDurationSecs, progressPercent) {
    await reelRepository.recordWatch(reelId, userId, watchDurationSecs, progressPercent);
    return { success: true };
  }
  async getHistory(userId) {
    return reelRepository.getWatchHistory(userId);
  }
  async clearHistory(userId) {
    await query("DELETE FROM reel_watch_history WHERE user_id = $1", [userId]);
    return { success: true };
  }
  async getSuggested(reelId, currentUserId) {
    const reels = await this.getReels({
      currentUserId: currentUserId || "none",
      category: "trending",
      limit: 10,
      offset: 0
    });
    return reelId ? reels.filter((r) => r.id !== reelId) : reels;
  }
  async toggleCommentLike(commentId, userId) {
    const checkRes = await query(
      "SELECT 1 FROM reel_comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, userId]
    );
    let isLiked = false;
    if (checkRes.rows.length > 0) {
      await query("DELETE FROM reel_comment_likes WHERE comment_id = $1 AND user_id = $2", [
        commentId,
        userId
      ]);
      await query("UPDATE reel_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1", [
        commentId
      ]);
      isLiked = false;
    } else {
      await query(
        "INSERT INTO reel_comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [commentId, userId]
      );
      await query("UPDATE reel_comments SET likes_count = likes_count + 1 WHERE id = $1", [commentId]);
      isLiked = true;
    }
    return { success: true, isLiked };
  }
};
var reelService = new ReelService();

// server/controllers/reel.controller.ts
var ReelController = class {
  async getReels(req, res, next) {
    try {
      const { limit, offset } = parsePaginationParams(req.query);
      const currentUserId = req.query.currentUserId || req.user?.id || "none";
      const category = req.query.category || "for_you";
      const reels = await reelService.getReels({
        currentUserId,
        category,
        limit,
        offset
      });
      res.json(reels);
    } catch (error) {
      next(error);
    }
  }
  async createReel(req, res, next) {
    try {
      const reel = await reelService.createReel(req.body);
      res.status(201).json(reel);
    } catch (error) {
      next(error);
    }
  }
  async toggleLike(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await reelService.toggleLike(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async toggleSave(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await reelService.toggleSave(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getComments(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.query.currentUserId || req.user?.id || "none";
      const comments = await reelService.getComments(id, currentUserId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  }
  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || "user_current", text } = req.body;
      const comment = await reelService.addComment(id, userId, text);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }
  async recordWatch(req, res, next) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || "user_current", watchDurationSecs = 0, progressPercent = 0 } = req.body;
      const result = await reelService.recordWatch(id, userId, watchDurationSecs, progressPercent);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getHistory(req, res, next) {
    try {
      const currentUserId = req.query.currentUserId || req.user?.id || "";
      const history = await reelService.getHistory(currentUserId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
  async clearHistory(req, res, next) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id || req.query.currentUserId;
      const result = await reelService.clearHistory(currentUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async getSuggested(req, res, next) {
    try {
      const reelId = req.query.reelId;
      const currentUserId = req.query.currentUserId || req.user?.id;
      const suggested = await reelService.getSuggested(reelId, currentUserId);
      res.json(suggested);
    } catch (error) {
      next(error);
    }
  }
  async toggleCommentLike(req, res, next) {
    try {
      const commentId = req.params.commentId || req.params.id;
      const userId = req.body.userId || req.user?.id || "user_current";
      const result = await reelService.toggleCommentLike(commentId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
var reelController = new ReelController();

// server/validation/reel.schema.ts
import { z as z5 } from "zod";
var CreateReelSchema = z5.object({
  userId: z5.string().min(1, "User ID is required"),
  videoUrl: z5.string().min(1, "Video URL is required"),
  posterUrl: z5.string().optional(),
  caption: z5.string().max(2200).optional().default(""),
  musicTrack: z5.any().optional(),
  tags: z5.array(z5.string()).optional().default([]),
  duration: z5.number().min(1).max(300).optional().default(15)
});
var CreateReelCommentSchema = z5.object({
  userId: z5.string().min(1, "User ID is required"),
  text: z5.string().min(1, "Comment text cannot be empty").max(1e3)
});
var RecordWatchHistorySchema = z5.object({
  userId: z5.string().optional().default("user_current"),
  watchDurationSecs: z5.number().optional().default(0),
  progressPercent: z5.number().min(0).max(100).optional().default(0)
});

// server/routes/v1/reel.routes.ts
var router5 = Router5();
router5.get("/", optionalAuth, validate({ query: PaginationQuerySchema }), reelController.getReels.bind(reelController));
router5.get("/suggested", optionalAuth, reelController.getSuggested.bind(reelController));
router5.post("/", validate({ body: CreateReelSchema }), reelController.createReel.bind(reelController));
router5.get("/history", optionalAuth, reelController.getHistory.bind(reelController));
router5.post("/history", optionalAuth, reelController.clearHistory.bind(reelController));
router5.delete("/history", optionalAuth, reelController.clearHistory.bind(reelController));
router5.post("/comments/:commentId/like", optionalAuth, reelController.toggleCommentLike.bind(reelController));
router5.post("/:id/like", validate({ params: IdParamSchema }), reelController.toggleLike.bind(reelController));
router5.post("/:id/save", validate({ params: IdParamSchema }), reelController.toggleSave.bind(reelController));
router5.get("/:id/comments", validate({ params: IdParamSchema }), reelController.getComments.bind(reelController));
router5.post(
  "/:id/comments",
  validate({ params: IdParamSchema, body: CreateReelCommentSchema }),
  reelController.addComment.bind(reelController)
);
router5.post(
  "/:id/watch",
  validate({ params: IdParamSchema, body: RecordWatchHistorySchema }),
  reelController.recordWatch.bind(reelController)
);
var reelRoutes = router5;

// server/routes/v1/message.routes.ts
import { Router as Router6 } from "express";

// server/repositories/message.repository.ts
var MessageRepository = class extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tableName = "messages";
  }
  async getUserMessages(currentUserId) {
    const res = await query(
      `SELECT 
        m.*,
        su.username as sender_username, su.avatar as sender_avatar,
        ru.username as receiver_username, ru.avatar as receiver_avatar
      FROM messages m
      JOIN users su ON m.sender_id = su.id
      JOIN users ru ON m.receiver_id = ru.id
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY m.created_at ASC`,
      [currentUserId]
    );
    return res.rows;
  }
  async createMessage(message) {
    await query(
      `INSERT INTO messages (id, sender_id, receiver_id, text, media_url, is_seen)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [message.id, message.senderId, message.receiverId, message.text, message.mediaUrl || null]
    );
  }
  async markChatSeen(chatId, currentUserId) {
    if (chatId && chatId.startsWith("chat_")) {
      const parts = chatId.replace("chat_", "").split("_");
      if (parts.length >= 2) {
        const otherUserId = parts[0] === currentUserId ? parts[1] : parts[0];
        await query(
          `UPDATE messages SET is_seen = true WHERE receiver_id = $1 AND sender_id = $2`,
          [currentUserId, otherUserId]
        );
        return;
      }
    }
    await query(
      `UPDATE messages SET is_seen = true WHERE receiver_id = $1`,
      [currentUserId]
    );
  }
};
var messageRepository = new MessageRepository();

// server/services/message.service.ts
var MessageService = class {
  async getMessagesGroupedByChat(currentUserId = "user_current") {
    const rawMessages = await messageRepository.getUserMessages(currentUserId);
    const threadsMap = {};
    for (const m of rawMessages) {
      const otherUserId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
      const sortedIds = [m.sender_id, m.receiver_id].sort();
      const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;
      if (!threadsMap[chatId]) {
        const isSenderMe = m.sender_id === currentUserId;
        threadsMap[chatId] = {
          id: chatId,
          participant: {
            id: otherUserId,
            username: isSenderMe ? m.receiver_username : m.sender_username,
            name: isSenderMe ? m.receiver_username : m.sender_username,
            avatar: isSenderMe ? m.receiver_avatar : m.sender_avatar,
            bio: "",
            followersCount: 0,
            followingCount: 0,
            postsCount: 0
          },
          lastMessage: m.text,
          lastMessageTime: m.created_at,
          unreadCount: 0,
          messages: []
        };
      }
      threadsMap[chatId].lastMessage = m.text;
      threadsMap[chatId].lastMessageTime = m.created_at;
      if (!m.is_seen && m.receiver_id === currentUserId) {
        threadsMap[chatId].unreadCount += 1;
      }
      threadsMap[chatId].messages.push({
        id: m.id,
        senderId: m.sender_id,
        text: m.text,
        mediaUrl: m.media_url,
        timestamp: m.created_at,
        isSeen: m.is_seen,
        reaction: m.reaction,
        isAudio: m.is_audio
      });
    }
    return Object.values(threadsMap);
  }
  async sendMessage(data) {
    if (!data.receiverId || !data.text) {
      throw new BadRequestError("Receiver ID and message text are required");
    }
    let finalMedia = data.mediaUrl;
    if (data.mediaUrl && data.mediaUrl.startsWith("data:image")) {
      const uploadRes = await uploadToCloudinary(data.mediaUrl, "instavibe_messages");
      finalMedia = uploadRes.url;
    }
    const msgId = `msg_${Date.now()}`;
    await messageRepository.createMessage({
      id: msgId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      text: data.text,
      mediaUrl: finalMedia
    });
    return {
      id: msgId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      text: data.text,
      mediaUrl: finalMedia,
      timestamp: "Just now",
      isSeen: false
    };
  }
  async markChatAsSeen(chatId, currentUserId = "user_current") {
    await messageRepository.markChatSeen(chatId, currentUserId);
  }
};
var messageService = new MessageService();

// server/controllers/message.controller.ts
var MessageController = class {
  async getMessages(req, res, next) {
    try {
      const currentUserId = req.query.currentUserId || req.user?.id || "user_current";
      const messages = await messageService.getMessagesGroupedByChat(currentUserId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
  async sendMessage(req, res, next) {
    try {
      const senderId = req.body.senderId || req.user?.id || "user_current";
      const message = await messageService.sendMessage({
        ...req.body,
        senderId
      });
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }
  async markChatSeen(req, res, next) {
    try {
      const currentUserId = req.body.currentUserId || req.query.currentUserId || req.user?.id || "user_current";
      const chatId = req.params.chatId || req.body.chatId;
      await messageService.markChatAsSeen(chatId, currentUserId);
      res.json({ success: true, chatId });
    } catch (error) {
      next(error);
    }
  }
};
var messageController = new MessageController();

// server/routes/v1/message.routes.ts
var router6 = Router6();
router6.get("/", optionalAuth, messageController.getMessages.bind(messageController));
router6.post("/", messageController.sendMessage.bind(messageController));
router6.post("/seen", messageController.markChatSeen.bind(messageController));
router6.patch("/:chatId/seen", messageController.markChatSeen.bind(messageController));
var messageRoutes = router6;

// server/routes/v1/notification.routes.ts
import { Router as Router7 } from "express";

// server/repositories/notification.repository.ts
var NotificationRepository = class extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tableName = "notifications";
  }
  async getNotifications(recipientId, limit = 20, offset = 0) {
    const res = await query(
      `SELECT 
        n.*,
        u.username,
        u.name,
        u.avatar,
        u.is_verified,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.following_id = u.id) as is_following
      FROM notifications n
      JOIN users u ON n.sender_id = u.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3`,
      [recipientId, limit, offset]
    );
    return res.rows;
  }
  async markAllAsRead(recipientId) {
    await query("UPDATE notifications SET is_read = true WHERE recipient_id = $1", [recipientId]);
  }
  async markAsRead(id, isRead = true) {
    await query("UPDATE notifications SET is_read = $1 WHERE id = $2", [isRead, id]);
  }
  async createNotification(notif) {
    await query(
      `INSERT INTO notifications (id, recipient_id, sender_id, type, post_id, target_media_url, text, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())`,
      [notif.id, notif.recipientId, notif.senderId, notif.type, notif.postId || null, notif.targetMediaUrl || null, notif.text]
    );
  }
};
var notificationRepository = new NotificationRepository();

// server/services/notification.service.ts
var NotificationService = class {
  async getNotifications(currentUserId = "user_current", limit = 20, offset = 0) {
    const rawRows = await notificationRepository.getNotifications(currentUserId, limit, offset);
    return rawRows.map((n) => {
      let timeAgo = "Just now";
      if (n.created_at) {
        const diffSecs = Math.floor((Date.now() - new Date(n.created_at).getTime()) / 1e3);
        if (diffSecs < 60) timeAgo = "Just now";
        else if (diffSecs < 3600) timeAgo = `${Math.floor(diffSecs / 60)}m`;
        else if (diffSecs < 86400) timeAgo = `${Math.floor(diffSecs / 3600)}h`;
        else if (diffSecs < 604800) timeAgo = `${Math.floor(diffSecs / 86400)}d`;
        else timeAgo = `${Math.floor(diffSecs / 604800)}w`;
      }
      return {
        id: n.id,
        type: n.type,
        user: {
          id: n.sender_id,
          username: n.username,
          name: n.name,
          avatar: n.avatar,
          isVerified: n.is_verified,
          isFollowing: Boolean(n.is_following),
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          bio: ""
        },
        actors: [
          {
            id: n.sender_id,
            username: n.username,
            name: n.name,
            avatar: n.avatar,
            isVerified: n.is_verified,
            isFollowing: Boolean(n.is_following)
          }
        ],
        totalActorsCount: 1,
        isGrouped: false,
        targetPostId: n.post_id,
        targetMediaUrl: n.target_media_url,
        text: n.text,
        timestamp: timeAgo,
        rawTimestamp: n.created_at,
        isRead: Boolean(n.is_read)
      };
    });
  }
  async markAllAsRead(currentUserId = "user_current") {
    await notificationRepository.markAllAsRead(currentUserId);
    return { success: true };
  }
  async markAsRead(id, isRead = true) {
    await notificationRepository.markAsRead(id, isRead);
    return { success: true, id, isRead };
  }
  async deleteNotification(id) {
    await query("DELETE FROM notifications WHERE id = $1", [id]);
    return { success: true, id };
  }
  async replyToNotification(id, currentUserId, text, postId) {
    if (!text || !currentUserId) {
      throw new BadRequestError("Reply text and currentUserId are required");
    }
    if (postId) {
      const commentId = `comm_${Date.now()}`;
      await query(
        `INSERT INTO comments (id, post_id, user_id, text, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [commentId, postId, currentUserId, text]
      );
    }
    await notificationRepository.markAsRead(id, true);
    return { success: true, repliedText: text };
  }
  async simulateNotification(currentUserId = "user_current", type = "like") {
    const otherUsers = await query("SELECT * FROM users WHERE id != $1 ORDER BY RANDOM() LIMIT 1", [currentUserId]);
    if (otherUsers.rows.length === 0) {
      throw new BadRequestError("No other users found to simulate notification");
    }
    const sender = otherUsers.rows[0];
    const notifId = `notif_sim_${Date.now()}`;
    const sampleTexts = {
      like: "liked your recent photo.",
      comment: 'commented: "Obsessed with these tones! \u{1F31F}\u2728"',
      follow: "started following you.",
      story_like: "liked your story.",
      mention: 'mentioned you in a post: "@you check this vibe out!"',
      tag: "tagged you in a new photo."
    };
    const text = sampleTexts[type] || "interacted with your profile.";
    const mediaUrl = type === "follow" ? null : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80";
    await notificationRepository.createNotification({
      id: notifId,
      recipientId: currentUserId,
      senderId: sender.id,
      type,
      targetMediaUrl: mediaUrl,
      text
    });
    return {
      id: notifId,
      type,
      user: {
        id: sender.id,
        username: sender.username,
        name: sender.name,
        avatar: sender.avatar,
        isVerified: sender.is_verified,
        isFollowing: false
      },
      text,
      targetMediaUrl: mediaUrl,
      timestamp: "Just now",
      isRead: false
    };
  }
};
var notificationService = new NotificationService();

// server/controllers/notification.controller.ts
var NotificationController = class {
  async getNotifications(req, res, next) {
    try {
      const { limit, offset } = parsePaginationParams(req.query);
      const currentUserId = req.query.currentUserId || req.user?.id || "user_current";
      const notifications = await notificationService.getNotifications(currentUserId, limit, offset);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }
  async markAllAsRead(req, res, next) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id || "user_current";
      const result = await notificationService.markAllAsRead(currentUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const { isRead = true } = req.body;
      const result = await notificationService.markAsRead(id, isRead);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const result = await notificationService.deleteNotification(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async reply(req, res, next) {
    try {
      const { id } = req.params;
      const { currentUserId = req.user?.id || "user_current", text, postId } = req.body;
      const result = await notificationService.replyToNotification(id, currentUserId, text, postId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async simulate(req, res, next) {
    try {
      const { currentUserId = req.user?.id || "user_current", type = "like" } = req.body;
      const notif = await notificationService.simulateNotification(currentUserId, type);
      res.status(201).json(notif);
    } catch (error) {
      next(error);
    }
  }
};
var notificationController = new NotificationController();

// server/routes/v1/notification.routes.ts
var router7 = Router7();
router7.get("/", optionalAuth, validate({ query: PaginationQuerySchema }), notificationController.getNotifications.bind(notificationController));
router7.post("/read", notificationController.markAllAsRead.bind(notificationController));
router7.delete("/:id", validate({ params: IdParamSchema }), notificationController.deleteNotification.bind(notificationController));
router7.patch("/:id/read", validate({ params: IdParamSchema }), notificationController.markAsRead.bind(notificationController));
router7.post("/:id/reply", validate({ params: IdParamSchema }), notificationController.reply.bind(notificationController));
router7.post("/simulate", notificationController.simulate.bind(notificationController));
var notificationRoutes = router7;

// server/routes/v1/highlight.routes.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.post("/", highlightController.createHighlight.bind(highlightController));
router8.post("/:id/add", highlightController.addItemToHighlight.bind(highlightController));
var highlightRoutes = router8;

// server/routes/v1/ai.routes.ts
import { Router as Router9 } from "express";

// server/services/ai.service.ts
import { GoogleGenAI } from "@google/genai";
var geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && config.gemini.apiKey) {
    geminiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return geminiClient;
}
var AIService = class {
  async generateCaption(topic, tone = "aesthetic", keywords = "", style = "trendy") {
    const ai = getGeminiClient();
    if (!ai) {
      const fallbacks = {
        aesthetic: [
          `Chasing golden hours and timeless moments \u2728\u{1F33F} #${topic ? topic.replace(/\s+/g, "") : "vibes"} #aesthetic #visualdiary`,
          `Finding magic in the mundane \u2601\uFE0F\u{1F4AB} #${topic ? topic.replace(/\s+/g, "") : "lifestyle"} #moments #wanderlust`,
          `Soft light, calm soul \u{1F54A}\uFE0F\u{1F319} #${topic ? topic.replace(/\s+/g, "") : "mood"} #stillness #goldenhour`
        ],
        witty: [
          `I told myself I wouldn\u2019t post this, but here we are \u{1F602}\u{1F481}\u200D\u2640\uFE0F #${topic ? topic.replace(/\s+/g, "") : "mood"} #livingmybestlife`,
          `Reality called, so I hung up \u{1F4DE}\u270C\uFE0F #${topic ? topic.replace(/\s+/g, "") : "vibes"} #sorrynotsorry`
        ],
        travel: [
          `Collecting passport stamps & unforgettable views \u{1F30D}\u2708\uFE0F #${topic ? topic.replace(/\s+/g, "") : "travel"} #wanderlust`
        ]
      };
      const selectedList = fallbacks[tone] || fallbacks.aesthetic;
      const randomFallback = selectedList[Math.floor(Math.random() * selectedList.length)];
      return { caption: randomFallback, source: "smart-template" };
    }
    const prompt = `Write an engaging, trendy, viral Instagram caption for a post about "${topic || "a stunning moment"}".
Tone: ${tone}.
Style: ${style}.
Keywords/Details to include: ${keywords || "none"}.
Include relevant emoji, 1-2 punchy lines, and 3-5 high-performing Instagram hashtags at the end.
Return ONLY the caption text without quotes or explanations.`;
    try {
      const responsePromise = ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          systemInstruction: "You are an expert social media copywriter specializing in viral Instagram captions, aesthetic storytelling, and engagement hooks."
        }
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI generation timed out")), 8e3)
      );
      const response = await Promise.race([responsePromise, timeoutPromise]);
      const caption = response.text?.trim() || "Capturing moments that take my breath away \u2728\u{1F4F8} #vibes #aesthetic";
      return { caption, source: config.gemini.model };
    } catch (err) {
      logger.warn("Gemini caption generation timed out or failed, using smart template fallback", err);
      return {
        caption: `Chasing golden hours and timeless moments \u2728\u{1F33F} #${topic ? topic.replace(/\s+/g, "") : "vibes"} #aesthetic #visualdiary`,
        source: "smart-template-fallback"
      };
    }
  }
  async suggestComments(postCaption, postTopic) {
    const ai = getGeminiClient();
    if (!ai || process.env.NODE_ENV === "test") {
      return {
        suggestions: [
          "Obsessed with this vibe! \u{1F525}\u{1F60D}",
          "The aesthetic here is immaculate \u2728\u{1F90D}",
          "Frame this immediately \u{1F4F8}\u{1F4AB}",
          "Such an inspiring shot! \u{1F33F}\u{1F64C}"
        ]
      };
    }
    const prompt = `Given this Instagram post caption: "${postCaption}" (Topic: "${postTopic}"), provide 4 distinct, engaging, short Instagram comment suggestions that real users would leave. Include appropriate emojis.
Return as a clean JSON array of strings: ["comment1", "comment2", "comment3", "comment4"].`;
    try {
      const responsePromise = ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI suggestions timed out")), 8e3)
      );
      const response = await Promise.race([responsePromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { suggestions: parsed.slice(0, 4) };
      }
    } catch (err) {
      logger.warn("Failed parsing Gemini comment suggestions, using fallback", err);
    }
    return {
      suggestions: [
        "Pure aesthetic perfection! \u2728\u{1F44F}",
        "This lighting is everything \u{1F525}\u{1F4F8}",
        "Stunning as always! \u{1F90D}",
        "Major mood right here \u{1F64C}\u{1F4AB}"
      ]
    };
  }
  async generateChatReply(contactName, contactBio, messageHistory, userMessage) {
    const ai = getGeminiClient();
    if (!ai) {
      const cannedReplies = [
        "Hey! Thanks so much for reaching out! Loved your latest post by the way \u2728",
        "Haha totally agree! Are you going to that photography workshop this weekend? \u{1F4F8}",
        "That looks insane! Send me the location pin if you can \u{1F4CD}\u2728",
        "Appreciate the love! Hope you're having an awesome week \u{1F64C}"
      ];
      return {
        reply: cannedReplies[Math.floor(Math.random() * cannedReplies.length)]
      };
    }
    const prompt = `You are roleplaying as @${contactName || "alex_creator"} on Instagram Direct Messages.
Your persona/bio: ${contactBio || "Photographer and visual artist based in NYC"}.
Recent chat history:
${JSON.stringify(messageHistory || [])}
The user just messaged: "${userMessage}"

Respond naturally in character as an Instagram creator/friend in 1-2 friendly sentences. Use casual modern social media language and emojis naturally.`;
    const response = await ai.models.generateContent({
      model: config.gemini.model,
      contents: prompt
    });
    return { reply: response.text?.trim() || "Hey there! Thanks for the message! \u2728\u{1F64C}" };
  }
  async generateExploreRecommendations(userInterests, recentTags, activeCategory) {
    const ai = getGeminiClient();
    if (!ai) {
      return {
        clusters: [
          {
            title: "Golden Hour Aesthetics",
            reason: "Trending in visual photography",
            tags: ["#goldenhour", "#filmphotography", "#aesthetic", "#portrait"],
            emoji: "\u{1F305}",
            description: "Warm, sun-drenched captures and organic silhouettes from top creators."
          },
          {
            title: "Nordic & Minimal Architecture",
            reason: "Popular in design communities",
            tags: ["#architecture", "#minimalism", "#scandinaviandesign", "#interiors"],
            emoji: "\u{1F3DB}\uFE0F",
            description: "Clean geometry, neutral palettes, and intentional spatial composition."
          },
          {
            title: "Streetwear & Urban Culture",
            reason: "Surging across style creators",
            tags: ["#streetwear", "#tokyofashion", "#outfitinspo", "#streetstyle"],
            emoji: "\u{1F45F}",
            description: "Contemporary urban aesthetics and high-contrast street portraits."
          },
          {
            title: "Artisanal Cafe & Culinary",
            reason: "Hot in lifestyle & travel",
            tags: ["#coffeeculture", "#matcha", "#bakery", "#cafestagram"],
            emoji: "\u2615",
            description: "Cozy morning light, specialty brews, and culinary craftsmanship."
          }
        ],
        smartPrompt: "Discovering visual trends curated for your aesthetic profile.",
        source: "local-smart-engine"
      };
    }
    const prompt = `You are an AI discovery engine for InstaVibe, a high-end visual social platform.
User Category Context: "${activeCategory}"
User Interests / Followed Topics: ${JSON.stringify(userInterests)}
Recent Tags: ${JSON.stringify(recentTags)}

Generate 4 curated AI recommendation clusters for the Explore page.
Each cluster must have:
- "title": catchy aesthetic title
- "reason": concise explanation why it's recommended
- "tags": array of 3-4 hashtag strings
- "emoji": single matching emoji
- "description": 1 sentence describing the visual mood
Also provide "smartPrompt": 1 short friendly sentence summarizing what AI synthesized for the user.

Return ONLY a valid JSON object matching this schema.`;
    try {
      const response = await ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      if (parsed.clusters && Array.isArray(parsed.clusters)) {
        return {
          clusters: parsed.clusters,
          smartPrompt: parsed.smartPrompt || "AI-curated discovery matching your creative visual taste.",
          source: config.gemini.model
        };
      }
    } catch (err) {
      logger.warn("Failed parsing Gemini Explore recommendations, using fallback", err);
    }
    return {
      clusters: [
        {
          title: "Cinematic Mood & Shadows",
          reason: "High engagement in creative feeds",
          tags: ["#cinematic", "#moodygrams", "#visualsoflife", "#film"],
          emoji: "\u{1F3AC}",
          description: "Rich contrast, film grains, and storytelling visuals."
        }
      ],
      smartPrompt: "Curated creative visuals tailored for you.",
      source: "fallback"
    };
  }
  async smartSearch(searchQuery) {
    const ai = getGeminiClient();
    if (!ai || !searchQuery.trim()) {
      return {
        keywords: searchQuery.toLowerCase().split(/\s+/).filter(Boolean),
        tags: [`#${searchQuery.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`],
        suggestedCategories: ["Photography", "Lifestyle"],
        aiInsight: `Showing top matches for "${searchQuery}"`
      };
    }
    const prompt = `A user is searching on a visual social media app with the natural query: "${searchQuery}".
Analyze this query and return:
1. "keywords": list of 3-5 normalized search terms / synonyms
2. "tags": list of 3-5 relevant hashtags
3. "suggestedCategories": list of 1-3 categories
4. "aiInsight": 1 short sentence summarizing the visual aesthetic match
Return ONLY valid JSON matching this schema.`;
    try {
      const response = await ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch {
      return {
        keywords: [searchQuery.toLowerCase()],
        tags: [`#${searchQuery.replace(/\s+/g, "")}`],
        suggestedCategories: ["For You"],
        aiInsight: `Discovering matches for "${searchQuery}"`
      };
    }
  }
};
var aiService = new AIService();

// server/controllers/ai.controller.ts
var AIController = class {
  async generateCaption(req, res, next) {
    try {
      const { topic, tone = "aesthetic", keywords = "", style = "trendy" } = req.body;
      const result = await aiService.generateCaption(topic, tone, keywords, style);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async suggestComments(req, res, next) {
    try {
      const { postCaption = "", postTopic = "" } = req.body;
      const result = await aiService.suggestComments(postCaption, postTopic);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async chatReply(req, res, next) {
    try {
      const { contactName, contactBio, messageHistory, userMessage } = req.body;
      const result = await aiService.generateChatReply(contactName, contactBio, messageHistory, userMessage);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async exploreRecommendations(req, res, next) {
    try {
      const { userInterests = [], recentTags = [], activeCategory = "For You" } = req.body;
      const result = await aiService.generateExploreRecommendations(userInterests, recentTags, activeCategory);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async smartSearch(req, res, next) {
    try {
      const { query: searchQuery = "" } = req.body;
      const result = await aiService.smartSearch(searchQuery);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
var aiController = new AIController();

// server/routes/v1/ai.routes.ts
var router9 = Router9();
router9.post("/generate-caption", rateLimiter({ max: 40 }), aiController.generateCaption.bind(aiController));
router9.post("/suggest-comments", rateLimiter({ max: 40 }), aiController.suggestComments.bind(aiController));
router9.post("/chat-reply", rateLimiter({ max: 40 }), aiController.chatReply.bind(aiController));
router9.post("/explore-recommendations", rateLimiter({ max: 40 }), aiController.exploreRecommendations.bind(aiController));
router9.post("/smart-search", rateLimiter({ max: 60 }), aiController.smartSearch.bind(aiController));
var aiRoutes = router9;

// server/config/swagger.config.ts
var swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "InstaVibe Backend Architecture API",
    version: "1.0.0",
    description: `Scalable Enterprise-grade RESTful API specification for InstaVibe.
    
### Architectural Highlights:
- **Modular Layering**: Controllers -> Services -> Repositories -> Database Pool with Transactions
- **Security**: JWT Authentication (Access + Refresh tokens), sliding-window Rate Limiting
- **Resilience**: Redis & In-Memory caching, Async background job queues with exponential backoff
- **Observability**: Structured JSON logging, Request Correlation IDs (\`x-request-id\`), Performance metrics
- **Validation**: Strict schema validation powered by Zod`,
    contact: {
      name: "InstaVibe Engineering Team",
      url: config.app.clientUrl
    }
  },
  servers: [
    {
      url: "/api/v1",
      description: "API Version 1 (Current Primary)"
    },
    {
      url: "/api",
      description: "Backward-compatible alias"
    }
  ],
  tags: [
    { name: "Auth", description: "Authentication, registration, sessions, and tokens" },
    { name: "Users", description: "User profiles, social graph, following/followers, and discovery" },
    { name: "Posts", description: "Feed generation, post creation, multi-media uploads, likes, and comments" },
    { name: "Stories", description: "24-hour ephemeral stories, view tracking, highlights, and archives" },
    { name: "Reels", description: "Short-form high-bitrate video engine, watch history, and interactions" },
    { name: "Messages", description: "Direct messaging and real-time chat threads" },
    { name: "Notifications", description: "Social activity alerts, batch mark read, and simulations" },
    { name: "AI & Gemini", description: "Generative AI captioning, smart comment suggestions, and search" },
    { name: "System", description: "Health probes, queue metrics, and cache statistics" }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "System and database health check",
        responses: {
          "200": {
            description: "System healthy",
            content: { "application/json": { schema: { type: "object" } } }
          }
        }
      }
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Register new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "name", "email", "password"],
                properties: {
                  username: { type: "string", example: "alex_visuals" },
                  name: { type: "string", example: "Alex Morgan" },
                  email: { type: "string", example: "alex@example.com" },
                  password: { type: "string", example: "Secr3tP@ssword" },
                  avatar: { type: "string" },
                  bio: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "User registered and tokens issued" },
          "409": { description: "Username or email already exists" }
        }
      }
    },
    "/auth/signin": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate with username/email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["login", "password"],
                properties: {
                  login: { type: "string", example: "alex_visuals" },
                  password: { type: "string", example: "Secr3tP@ssword" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Authentication successful" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "Retrieve paginated feed posts with like and comment aggregations",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "currentUserId", in: "query", schema: { type: "string" } }
        ],
        responses: { "200": { description: "List of posts" } }
      },
      post: {
        tags: ["Posts"],
        summary: "Create a new media post",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "media"],
                properties: {
                  userId: { type: "string" },
                  caption: { type: "string" },
                  location: { type: "string" },
                  media: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        type: { type: "string", enum: ["image", "video"] },
                        aspectRatio: { type: "string" }
                      }
                    }
                  },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Post created" } }
      }
    },
    "/reels": {
      get: {
        tags: ["Reels"],
        summary: "Retrieve video reels by category",
        parameters: [
          { name: "category", in: "query", schema: { type: "string", enum: ["for_you", "following", "trending", "saved"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: { "200": { description: "List of reels" } }
      }
    },
    "/gemini/generate-caption": {
      post: {
        tags: ["AI & Gemini"],
        summary: "Generate viral AI caption with tags and tone selection",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  topic: { type: "string", example: "Sunset over Tokyo skyline" },
                  tone: { type: "string", enum: ["aesthetic", "witty", "travel", "minimalist"] },
                  keywords: { type: "string", example: "golden hour, rooftop, fujifilm" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Generated caption and source model" } }
      }
    }
  }
};

// server/controllers/docs.controller.ts
var DocsController = class {
  getSwaggerJson(req, res) {
    res.json(swaggerSpec);
  }
  getSwaggerUI(req, res) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>InstaVibe Scalable API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .swagger-ui .topbar { background-color: #1e293b; border-bottom: 1px solid #334155; }
    .swagger-ui .topbar a { font-weight: 700; color: #38bdf8; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui img { filter: invert(100%) hue-rotate(180deg); }
    .header-banner { background: linear-gradient(135deg, #6366f1, #ec4899); padding: 1.5rem 2rem; color: white; }
    .header-banner h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; }
    .header-banner p { margin: 0; opacity: 0.9; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>InstaVibe Backend Architecture API</h1>
    <p>Enterprise scalable RESTful architecture with Controllers, Services, Repositories, Redis Cache, Worker Queue & Gemini AI</p>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }
};
var docsController = new DocsController();

// server/routes/v1/index.ts
var router10 = Router10();
router10.get("/health", async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  const queueStats = jobQueue.getStats();
  res.json({
    status: dbHealthy ? "healthy" : "degraded",
    database: dbHealthy ? "connected" : "error",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptimeSecs: Math.floor(process.uptime()),
    queue: queueStats
  });
});
router10.get("/swagger.json", docsController.getSwaggerJson.bind(docsController));
router10.get("/docs", docsController.getSwaggerUI.bind(docsController));
router10.use("/auth", authRoutes);
router10.use("/users", userRoutes);
router10.use("/posts", postRoutes);
router10.use("/stories", storyRoutes);
router10.use("/reels", reelRoutes);
router10.use("/messages", messageRoutes);
router10.use("/notifications", notificationRoutes);
router10.use("/highlights", highlightRoutes);
router10.use("/gemini", aiRoutes);
var v1Router = router10;

// server/routes/index.ts
var apiRouter = Router11();
apiRouter.use("/v1", v1Router);
apiRouter.get("/docs", (req, res) => res.redirect("/api/v1/docs"));
apiRouter.get("/swagger.json", (req, res) => res.redirect("/api/v1/swagger.json"));
apiRouter.use("/", v1Router);

// server/app.ts
function createExpressApp() {
  const app2 = express();
  app2.use((req, res, next) => {
    if (typeof req.body === "string" && req.body.trim().startsWith("{")) {
      try {
        req.body = JSON.parse(req.body);
      } catch {
      }
    }
    next();
  });
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app2.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-DNS-Prefetch-Control", "on");
    res.setHeader("X-Download-Options", "noopen");
    res.removeHeader("X-Powered-By");
    next();
  });
  app2.use(requestIdMiddleware);
  app2.use(requestLoggerMiddleware);
  app2.use("/api", apiRouter);
  app2.use("/", apiRouter);
  return app2;
}

// server/core/database/migrations.ts
var initDatabase = runDatabaseMigrations;
async function runDatabaseMigrations() {
  logger.info("Executing database schema migrations & initialization...");
  try {
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
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  `);
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
    await query(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id)
    );
  `);
    await query(`
    CREATE TABLE IF NOT EXISTS blocked_users (
      blocker_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (blocker_id, blocked_id)
    );
  `);
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
    await query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      post_id VARCHAR(255) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id)
    );
  `);
    await query(`
    CREATE TABLE IF NOT EXISTS saved_posts (
      post_id VARCHAR(255) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id)
    );
  `);
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
    await query(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      comment_id VARCHAR(255) NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (comment_id, user_id)
    );
  `);
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
    await query(`
    CREATE TABLE IF NOT EXISTS story_views (
      story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (story_id, user_id)
    );
  `);
    await query(`
    CREATE TABLE IF NOT EXISTS story_likes (
      story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (story_id, user_id)
    );
  `);
    await query(`
    CREATE TABLE IF NOT EXISTS highlights (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      cover_url TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
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
    logger.info("Database migrations completed successfully");
  } catch (err) {
    logger.warn(`Database migration encountered warning or is delayed: ${err?.message || err}`);
  }
}

// server/core/queue/job-handlers.ts
function initializeJobHandlers() {
  logger.info("Registering background job queue workers...");
  jobQueue.registerHandler("DISPATCH_NOTIFICATION" /* DISPATCH_NOTIFICATION */, async (payload) => {
    logger.debug(`[Worker] Dispatching notification to ${payload.recipientId}`);
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO notifications (id, recipient_id, sender_id, type, post_id, target_media_url, text, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())`,
      [
        notifId,
        payload.recipientId,
        payload.senderId,
        payload.type,
        payload.postId || null,
        payload.targetMediaUrl || null,
        payload.text
      ]
    );
  });
  jobQueue.registerHandler("PROCESS_MEDIA" /* PROCESS_MEDIA */, async (payload) => {
    logger.debug(`[Worker] Async media processing completed for url: ${payload.mediaUrl}`);
  });
  jobQueue.registerHandler("SEND_EMAIL_VERIFICATION" /* SEND_EMAIL_VERIFICATION */, async (payload) => {
    logger.info(`[Worker] Sent verification email simulation to: ${payload.email}`);
  });
  jobQueue.registerHandler("RECORD_METRIC" /* RECORD_METRIC */, async (payload) => {
    logger.debug(`[Worker] Metric recorded: ${payload.event}`, { metadata: payload.metadata });
  });
  jobQueue.registerHandler("PRE_GENERATE_AI_CACHE" /* PRE_GENERATE_AI_CACHE */, async (payload) => {
    logger.debug(`[Worker] Pre-generating AI Explore cluster cache for user ${payload.userId}`);
  });
}

// server/middleware/error-handler.middleware.ts
function errorHandlerMiddleware(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorCode = isAppError ? err.code : "INTERNAL_SERVER_ERROR" /* INTERNAL_SERVER_ERROR */;
  const message = isAppError ? err.message : config.isProduction ? "Internal server error" : err.message || "Unknown error";
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      details: isAppError ? err.details : void 0,
      requestId: req.id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      path: req.originalUrl,
      stack: !config.isProduction ? err.stack : void 0
    }
  };
  logger.error(
    `[ErrorHandler] ${req.method} ${req.originalUrl} - ${statusCode} ${errorCode}: ${err.message}`,
    err,
    {
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      statusCode
    }
  );
  res.status(statusCode).json(errorResponse);
}
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND" /* NOT_FOUND */,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      requestId: req.id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      path: req.originalUrl
    }
  });
}

// server/serverless.ts
var app = createExpressApp();
app.use(errorHandlerMiddleware);
var isReady = false;
var initPromise = null;
async function ensureInitialized() {
  if (isReady) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initDatabase();
        initializeJobHandlers();
      } catch (err) {
        console.error("Database migration/init notice in serverless runtime:", err);
      } finally {
        isReady = true;
      }
    })();
  }
  await initPromise;
}
async function handler(req, res) {
  try {
    await ensureInitialized();
  } catch (initErr) {
    console.warn("Initialization notice:", initErr);
  }
  return new Promise((resolve) => {
    if (res.writableEnded || res.finished) {
      return resolve(void 0);
    }
    res.once("finish", () => resolve(void 0));
    res.once("close", () => resolve(void 0));
    res.once("error", (err) => {
      console.error("Serverless response stream error:", err);
      resolve(void 0);
    });
    app(req, res, (err) => {
      if (err) {
        errorHandlerMiddleware(err, req, res, () => {
          if (!res.headersSent) {
            res.status(500).json({ success: false, error: { message: "Internal Server Error" } });
          }
          resolve(void 0);
        });
      } else if (!res.headersSent) {
        notFoundHandler(req, res);
        resolve(void 0);
      }
    });
  });
}
export {
  handler as default
};
