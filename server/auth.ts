import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'instavibe_secure_jwt_secret_2026_x89f_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'instavibe_refresh_jwt_secret_2026_q47z_key';

export interface DeviceInfo {
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  fingerprint?: string;
}

export function parseDeviceInfo(userAgent: string = '', ip: string = '127.0.0.1', clientInfo?: Partial<DeviceInfo>): DeviceInfo {
  let browser = clientInfo?.browser || 'Chrome';
  let os = clientInfo?.os || 'macOS';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = clientInfo?.deviceType || 'desktop';
  let location = clientInfo?.location || 'San Francisco, US';

  if (!clientInfo?.browser) {
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
    else if (userAgent.includes('Chrome') && !userAgent.includes('Edg/')) browser = 'Google Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Apple Safari';
    else if (userAgent.includes('Mobile') || userAgent.includes('Android')) browser = 'Mobile Safari';
  }

  if (!clientInfo?.os) {
    if (userAgent.includes('iPhone')) {
      os = 'iOS';
      deviceType = 'mobile';
    } else if (userAgent.includes('iPad')) {
      os = 'iPadOS';
      deviceType = 'tablet';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
      deviceType = 'mobile';
    } else if (userAgent.includes('Mac OS')) {
      os = 'macOS';
      deviceType = 'desktop';
    } else if (userAgent.includes('Windows')) {
      os = 'Windows 11';
      deviceType = 'desktop';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
      deviceType = 'desktop';
    }
  }

  const deviceName = clientInfo?.deviceName || `${browser} on ${os}`;

  return {
    deviceName,
    deviceType,
    browser,
    os,
    ipAddress: ip,
    location,
    fingerprint: clientInfo?.fingerprint,
  };
}

export function generateTokens(userId: string, rememberMe: boolean = true) {
  const accessExpiry = '15m';
  const refreshExpiry = rememberMe ? '30d' : '1d';
  const refreshExpiryMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const accessToken = jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: accessExpiry });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: refreshExpiry });

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    refreshExpiresAt: new Date(Date.now() + refreshExpiryMs),
  };
}

export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload && payload.userId && payload.type === 'access') {
      return { userId: payload.userId };
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    if (payload && payload.userId && payload.type === 'refresh') {
      return { userId: payload.userId };
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  userId: string,
  refreshToken: string,
  deviceInfo: DeviceInfo,
  rememberMe: boolean = true
) {
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

  await query(
    `INSERT INTO user_sessions (id, user_id, refresh_token_hash, device_name, device_type, browser, os, ip_address, location, is_current, last_active_at, expires_at, is_revoked)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW(), $10, FALSE)`,
    [
      sessionId,
      userId,
      tokenHash,
      deviceInfo.deviceName,
      deviceInfo.deviceType,
      deviceInfo.browser,
      deviceInfo.os,
      deviceInfo.ipAddress,
      deviceInfo.location,
      expiresAt,
    ]
  );

  // Register device in trusted_devices if not already present
  if (deviceInfo.fingerprint) {
    const existing = await query(
      'SELECT id FROM trusted_devices WHERE user_id = $1 AND fingerprint = $2',
      [userId, deviceInfo.fingerprint]
    );

    if (existing.rows.length === 0) {
      const devId = `dev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await query(
        `INSERT INTO trusted_devices (id, user_id, fingerprint, device_name, device_type, browser, os, ip_address, is_trusted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
        [
          devId,
          userId,
          deviceInfo.fingerprint,
          deviceInfo.deviceName,
          deviceInfo.deviceType,
          deviceInfo.browser,
          deviceInfo.os,
          deviceInfo.ipAddress,
        ]
      );
    } else {
      await query(
        'UPDATE trusted_devices SET last_active_at = NOW(), ip_address = $1 WHERE id = $2',
        [deviceInfo.ipAddress, existing.rows[0].id]
      );
    }
  }

  return sessionId;
}

export async function detectSuspiciousLogin(
  userId: string,
  deviceInfo: DeviceInfo
): Promise<{ isSuspicious: boolean; reasons: string[]; severity: 'low' | 'medium' | 'high' }> {
  const reasons: string[] = [];

  // Check recent successful sessions
  const pastSessions = await query(
    'SELECT * FROM user_sessions WHERE user_id = $1 AND is_revoked = FALSE ORDER BY created_at DESC LIMIT 10',
    [userId]
  );

  // If user has previous sessions
  if (pastSessions.rows.length > 0) {
    const knownLocations = new Set(pastSessions.rows.map((s) => s.location.toLowerCase()));
    const knownBrowsers = new Set(pastSessions.rows.map((s) => s.browser.toLowerCase()));
    const knownOS = new Set(pastSessions.rows.map((s) => s.os.toLowerCase()));

    // Check location anomaly
    if (deviceInfo.location && !knownLocations.has(deviceInfo.location.toLowerCase())) {
      reasons.push(`Unrecognized location: ${deviceInfo.location}`);
    }

    // Check OS/Browser anomaly
    if (!knownBrowsers.has(deviceInfo.browser.toLowerCase()) && !knownOS.has(deviceInfo.os.toLowerCase())) {
      reasons.push(`New device operating system & browser (${deviceInfo.os} - ${deviceInfo.browser})`);
    }
  }

  // Check recent failed attempts in past 10 minutes
  const recentFailed = await query(
    `SELECT COUNT(*)::int as count FROM login_activity_logs 
     WHERE user_id = $1 AND status IN ('failed', 'blocked') AND created_at > NOW() - INTERVAL '10 minutes'`,
    [userId]
  );

  const failCount = recentFailed.rows[0]?.count || 0;
  if (failCount >= 3) {
    reasons.push(`Multiple recent failed sign-in attempts (${failCount} within 10 min)`);
  }

  const isSuspicious = reasons.length > 0;
  let severity: 'low' | 'medium' | 'high' = 'low';
  if (reasons.length >= 2 || failCount >= 4) {
    severity = 'high';
  } else if (reasons.length === 1) {
    severity = 'medium';
  }

  return { isSuspicious, reasons, severity };
}

export function generateOtpCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = Math.floor(1000 + Math.random() * 9000).toString();
    const part2 = Math.floor(1000 + Math.random() * 9000).toString();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export function generateTotpSecret(): { secret: string; uri: string } {
  // 16 bytes base32 string
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const bytes = crypto.randomBytes(20);
  for (let i = 0; i < 16; i++) {
    secret += base32Chars[bytes[i] % 32];
  }
  const uri = `otpauth://totp/InstaVibe:account?secret=${secret}&issuer=InstaVibe&algorithm=SHA1&digits=6&period=30`;
  return { secret, uri };
}

export function verifyTotpCode(secret: string, code: string): boolean {
  if (!secret || !code) return false;
  const cleanCode = code.trim().replace(/\s|-/g, '');
  if (cleanCode.length !== 6) return false;

  // Compute TOTP counter for current time window (+/- 1 step for clock drift)
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(currentTime / timeStep);

  for (let step = -1; step <= 1; step++) {
    const counter = currentCounter + step;
    const computed = computeTotpToken(secret, counter);
    if (computed === cleanCode) {
      return true;
    }
  }
  return false;
}

function base32ToBuffer(base32: string): Buffer {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < base32.length; i++) {
    const val = base32Chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

function computeTotpToken(secret: string, counter: number): string {
  try {
    const key = base32ToBuffer(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  } catch (err) {
    return '000000';
  }
}
