/**
 * Centralized Storage Keys & Safe Typed Storage Utilities
 * Provides resilient JSON parsing, typed keys, and fallback migration.
 */

export const STORAGE_KEYS = {
  AUTH_USER: '100gram_user',
  SAVED_ACCOUNTS: '100gram_saved_accounts',
  BLOCKED_USERS_PREFIX: '100gram_blocked_users_',
  CLOSE_FRIENDS_PREFIX: '100gram_close_friends_',
  RESTRICTED_USERS_PREFIX: '100gram_restricted_users_',
  PINNED_THREADS_PREFIX: '100gram_pinned_threads_',
  DRAFTS_PREFIX: '100gram_drafts_',
  GENERIC_DRAFTS: '100gram_drafts',
  LAST_PASSKEY_ID: '100gram_last_passkey_id',
  ACCESS_TOKEN: '100gram_access_token',
  REFRESH_TOKEN: '100gram_refresh_token',
  SESSION_ID: '100gram_session_id',
  REMEMBER_ME: '100gram_remember_me',
  FEED_CACHE: '100gram_feed_cache_v2',
  FEED_CACHE_TIME: '100gram_feed_cache_time',
  SAVED_SOUNDS: '100gram_saved_sounds',
  NOTIF_PREFS: '100gram_notif_prefs',
  RECENT_SEARCHES: '100gram_recent_searches_v2',
  OFFLINE_QUEUE: '100gram_offline_actions_queue',
} as const;

/** Legacy prefix mapping to guarantee seamless migration for existing users */
const LEGACY_PREFIX_MAP: Record<string, string> = {
  '100gram_': 'instavibe_',
};

/**
 * Safely retrieves and parses a JSON payload from localStorage.
 * Automatically attempts a legacy key lookup if the new key is not found.
 */
export function safeGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    let raw = localStorage.getItem(key);
    if (!raw) {
      // Check legacy migration fallback
      for (const [newPref, oldPref] of Object.entries(LEGACY_PREFIX_MAP)) {
        if (key.startsWith(newPref)) {
          const legacyKey = key.replace(newPref, oldPref);
          raw = localStorage.getItem(legacyKey);
          if (raw) {
            // Silently migrate to the new key
            localStorage.setItem(key, raw);
            break;
          }
        }
      }
    }
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely serializes and persists a value to localStorage.
 * Returns true on success, false if quota exceeded or error thrown.
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to save key "${key}":`, err);
    return false;
  }
}

/**
 * Safely removes a key from localStorage.
 */
export function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
    // Also clean up any legacy key if present
    for (const [newPref, oldPref] of Object.entries(LEGACY_PREFIX_MAP)) {
      if (key.startsWith(newPref)) {
        localStorage.removeItem(key.replace(newPref, oldPref));
      }
    }
  } catch {
    // Ignore storage removal errors
  }
}
