import { Post, Reel, User } from '../types';

export interface SearchSuggestionItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'user' | 'hashtag' | 'location' | 'topic' | 'audio';
  avatar?: string;
  isVerified?: boolean;
  count?: number;
  badge?: string;
  data?: any;
}

export interface RecentSearchItem {
  id: string;
  query: string;
  type: 'query' | 'user' | 'hashtag' | 'location';
  timestamp: number;
  user?: User;
  subtitle?: string;
}

export interface AdvancedFilterOptions {
  mediaType: 'all' | 'photo' | 'reel' | 'carousel';
  sortBy: 'trending' | 'latest' | 'likes' | 'comments';
  dateRange: 'all' | 'today' | 'week' | 'month';
  hasLocationOnly: boolean;
  verifiedOnly: boolean;
}

export const DEFAULT_FILTERS: AdvancedFilterOptions = {
  mediaType: 'all',
  sortBy: 'trending',
  dateRange: 'all',
  hasLocationOnly: false,
  verifiedOnly: false,
};

export class FastSearchEngine {
  private userIndex: Map<string, User> = new Map();
  private hashtagIndex: Map<string, { tag: string; count: number; posts: (Post | Reel)[] }> = new Map();
  private locationIndex: Map<string, { location: string; count: number; posts: Post[] }> = new Map();
  private wordInvertedIndex: Map<string, Set<string>> = new Map();
  private itemMap: Map<string, { type: 'post' | 'reel'; item: Post | Reel; text: string }> = new Map();

  public buildIndex(posts: Post[], reels: Reel[], users: User[]) {
    this.userIndex.clear();
    this.hashtagIndex.clear();
    this.locationIndex.clear();
    this.wordInvertedIndex.clear();
    this.itemMap.clear();

    // 1. Index users
    users.forEach((u) => {
      this.userIndex.set(u.id, u);
      const userTokens = `${u.username} ${u.name} ${u.bio || ''}`.toLowerCase().split(/[\s,._-]+/).filter(Boolean);
      userTokens.forEach((t) => {
        if (!this.wordInvertedIndex.has(t)) {
          this.wordInvertedIndex.set(t, new Set());
        }
        this.wordInvertedIndex.get(t)!.add(`user:${u.id}`);
      });
    });

    // 2. Index posts
    posts.forEach((p) => {
      this.itemMap.set(`post:${p.id}`, {
        type: 'post',
        item: p,
        text: `${p.caption || ''} ${p.author?.username || ''} ${p.location || ''} ${(p.tags || []).join(' ')}`.toLowerCase(),
      });

      // Index tags
      const tags = (p.tags && p.tags.length > 0)
        ? p.tags
        : (p.caption.match(/#[a-zA-Z0-9_]+/g) || []);

      tags.forEach((rawTag) => {
        const cleanTag = rawTag.startsWith('#') ? rawTag.toLowerCase() : `#${rawTag.toLowerCase()}`;
        if (!this.hashtagIndex.has(cleanTag)) {
          this.hashtagIndex.set(cleanTag, { tag: cleanTag, count: 0, posts: [] });
        }
        const entry = this.hashtagIndex.get(cleanTag)!;
        entry.count += 1;
        entry.posts.push(p);
      });

      // Index locations
      if (p.location && p.location.trim()) {
        const loc = p.location.trim();
        const key = loc.toLowerCase();
        if (!this.locationIndex.has(key)) {
          this.locationIndex.set(key, { location: loc, count: 0, posts: [] });
        }
        const entry = this.locationIndex.get(key)!;
        entry.count += 1;
        entry.posts.push(p);
      }

      // Inverted tokens
      const textTokens = `${p.caption || ''} ${p.author?.username || ''} ${p.location || ''}`.toLowerCase().split(/[\s,._#\-!?:;]+/).filter(Boolean);
      textTokens.forEach((t) => {
        if (t.length > 1) {
          if (!this.wordInvertedIndex.has(t)) {
            this.wordInvertedIndex.set(t, new Set());
          }
          this.wordInvertedIndex.get(t)!.add(`post:${p.id}`);
        }
      });
    });

    // 3. Index reels
    reels.forEach((r) => {
      this.itemMap.set(`reel:${r.id}`, {
        type: 'reel',
        item: r,
        text: `${r.caption || ''} ${r.author?.username || ''} ${(r.tags || []).join(' ')} ${r.musicTrack?.title || ''}`.toLowerCase(),
      });

      const tags = (r.tags && r.tags.length > 0)
        ? r.tags
        : (r.caption.match(/#[a-zA-Z0-9_]+/g) || []);

      tags.forEach((rawTag) => {
        const cleanTag = rawTag.startsWith('#') ? rawTag.toLowerCase() : `#${rawTag.toLowerCase()}`;
        if (!this.hashtagIndex.has(cleanTag)) {
          this.hashtagIndex.set(cleanTag, { tag: cleanTag, count: 0, posts: [] });
        }
        const entry = this.hashtagIndex.get(cleanTag)!;
        entry.count += 1;
        entry.posts.push(r);
      });

      const textTokens = `${r.caption || ''} ${r.author?.username || ''} ${r.musicTrack?.title || ''}`.toLowerCase().split(/[\s,._#\-!?:;]+/).filter(Boolean);
      textTokens.forEach((t) => {
        if (t.length > 1) {
          if (!this.wordInvertedIndex.has(t)) {
            this.wordInvertedIndex.set(t, new Set());
          }
          this.wordInvertedIndex.get(t)!.add(`reel:${r.id}`);
        }
      });
    });
  }

  // Get instant suggestions across categories
  public getSuggestions(query: string, limit = 8): SearchSuggestionItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const suggestions: SearchSuggestionItem[] = [];
    const isTagSearch = q.startsWith('#');
    const cleanQ = isTagSearch ? q.substring(1) : q;

    // 1. Hashtags
    for (const [tag, entry] of this.hashtagIndex.entries()) {
      const plainTag = tag.replace('#', '');
      if (plainTag.includes(cleanQ) || tag.includes(q)) {
        suggestions.push({
          id: `tag_${tag}`,
          title: tag,
          subtitle: `${entry.count} ${entry.count === 1 ? 'post' : 'posts'}`,
          type: 'hashtag',
          count: entry.count,
          badge: entry.count > 3 ? '🔥 Trending' : undefined,
          data: { tag },
        });
      }
      if (suggestions.length >= limit) break;
    }

    // 2. Users (if not purely searching for a hash)
    if (!isTagSearch) {
      for (const user of this.userIndex.values()) {
        const matchesHandle = user.username.toLowerCase().includes(q);
        const matchesName = user.name.toLowerCase().includes(q);
        if (matchesHandle || matchesName) {
          suggestions.push({
            id: `user_${user.id}`,
            title: user.username,
            subtitle: user.name,
            type: 'user',
            avatar: user.avatar,
            isVerified: user.isVerified,
            data: { user },
          });
        }
        if (suggestions.length >= limit * 1.5) break;
      }
    }

    // 3. Locations
    if (!isTagSearch) {
      for (const entry of this.locationIndex.values()) {
        if (entry.location.toLowerCase().includes(q)) {
          suggestions.push({
            id: `loc_${entry.location}`,
            title: entry.location,
            subtitle: `${entry.count} photos & videos`,
            type: 'location',
            count: entry.count,
            data: { location: entry.location },
          });
        }
        if (suggestions.length >= limit * 2) break;
      }
    }

    return suggestions.slice(0, limit);
  }

  // Multi-term fast search with scoring
  public search(
    query: string,
    filters: AdvancedFilterOptions,
    posts: Post[],
    reels: Reel[]
  ): (Post | Reel)[] {
    const q = query.toLowerCase().trim();

    let pool: (Post | Reel)[] = [];

    // Filter by media type first
    if (filters.mediaType === 'all') {
      pool = [...posts, ...reels];
    } else if (filters.mediaType === 'photo') {
      pool = posts.filter((p) => p.media.length === 1 && (!p.media[0].url.endsWith('.mp4') && !p.media[0].url.includes('video')));
    } else if (filters.mediaType === 'reel') {
      pool = reels;
    } else if (filters.mediaType === 'carousel') {
      pool = posts.filter((p) => p.media.length > 1);
    }

    // Filter by Verified only
    if (filters.verifiedOnly) {
      pool = pool.filter((item) => item.author?.isVerified);
    }

    // Filter by Has Location
    if (filters.hasLocationOnly) {
      pool = pool.filter((item) => 'location' in item && !!item.location);
    }

    // Filter by Date Range
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      const cutoffMap = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - cutoffMap[filters.dateRange];

      pool = pool.filter((item) => {
        const rawTime = 'timestamp' in item ? (item as Post).timestamp : (item as Reel).createdAt;
        const itemTime = rawTime ? new Date(rawTime).getTime() : Date.now();
        return itemTime >= cutoff;
      });
    }

    // Apply text / keyword query matching if provided
    let results = pool;
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      results = pool.filter((item) => {
        const caption = (item.caption || '').toLowerCase();
        const author = (item.author?.username || '').toLowerCase();
        const name = (item.author?.name || '').toLowerCase();
        const location = ('location' in item ? item.location || '' : '').toLowerCase();
        const tags = (item.tags || []).map((t) => t.toLowerCase());

        return tokens.every(
          (tok) =>
            caption.includes(tok) ||
            author.includes(tok) ||
            name.includes(tok) ||
            location.includes(tok) ||
            tags.some((t) => t.includes(tok))
        );
      });
    }

    // Apply Sorting
    return results.sort((a, b) => {
      const likesA = a.likesCount || 0;
      const likesB = b.likesCount || 0;
      const commentsA = a.commentsCount || 0;
      const commentsB = b.commentsCount || 0;

      if (filters.sortBy === 'trending') {
        const scoreA = likesA * 1.5 + commentsA * 3;
        const scoreB = likesB * 1.5 + commentsB * 3;
        return scoreB - scoreA;
      }
      if (filters.sortBy === 'likes') {
        return likesB - likesA;
      }
      if (filters.sortBy === 'comments') {
        return commentsB - commentsA;
      }
      if (filters.sortBy === 'latest') {
        const rawTimeA = 'timestamp' in a ? (a as Post).timestamp : (a as Reel).createdAt;
        const rawTimeB = 'timestamp' in b ? (b as Post).timestamp : (b as Reel).createdAt;
        const timeA = rawTimeA ? new Date(rawTimeA).getTime() : 0;
        const timeB = rawTimeB ? new Date(rawTimeB).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });
  }

  // Extract top trending hashtags with metrics
  public getTrendingHashtags(limit = 10) {
    const list = Array.from(this.hashtagIndex.values());
    list.sort((a, b) => b.count - a.count);

    const growthLabels = ['+58% today', '+42% surging', '+29% today', '🔥 Hot', '⚡ Viral', '+18% today'];

    return list.slice(0, limit).map((item, idx) => ({
      tag: item.tag,
      count: item.count,
      growth: growthLabels[idx % growthLabels.length],
      rank: idx + 1,
    }));
  }

  // Extract top trending locations
  public getTrendingLocations(limit = 8) {
    const list = Array.from(this.locationIndex.values());
    list.sort((a, b) => b.count - a.count);

    return list.slice(0, limit).map((item, idx) => ({
      location: item.location,
      count: item.count,
      rank: idx + 1,
    }));
  }

  // Extract trending users
  public getTrendingUsers(limit = 6): User[] {
    const users = Array.from(this.userIndex.values());
    return users
      .sort((a, b) => (b.followersCount || 0) + (b.postsCount || 0) * 5 - ((a.followersCount || 0) + (a.postsCount || 0) * 5))
      .slice(0, limit);
  }
}

export const searchEngine = new FastSearchEngine();
