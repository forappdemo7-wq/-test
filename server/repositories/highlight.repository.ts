import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export interface HighlightItemEntity {
  id: string;
  highlight_id: string;
  story_id?: string;
  media_url: string;
  media_type?: string;
  caption?: string;
  filter?: string;
  order_index?: number;
  created_at?: string;
}

export interface HighlightEntity {
  id: string;
  user_id: string;
  title: string;
  cover_url: string;
  created_at?: string;
  items?: HighlightItemEntity[];
}

export class HighlightRepository extends BaseRepository<HighlightEntity> {
  protected tableName = 'highlights';

  async getUserHighlights(userId: string): Promise<any[]> {
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

    const itemsByHl = new Map<string, any[]>();
    itemsRes.rows.forEach((item) => {
      if (!itemsByHl.has(item.highlightId)) {
        itemsByHl.set(item.highlightId, []);
      }
      itemsByHl.get(item.highlightId)!.push(item);
    });

    return hlRes.rows.map((hl) => ({
      ...hl,
      items: itemsByHl.get(hl.id) || [],
    }));
  }

  async createHighlight(userId: string, title: string, coverUrl: string, items: any[] = []): Promise<any> {
    const hlId = `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const hlRes = await query(
      `INSERT INTO highlights (id, user_id, title, cover_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id as "userId", title, cover_url as "coverUrl", created_at as "createdAt"`,
      [hlId, userId, title, coverUrl]
    );

    const createdHl = hlRes.rows[0];
    const createdItems: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      const itemId = `hli_${Date.now()}_${i}`;
      const itmRes = await query(
        `INSERT INTO highlight_items (id, highlight_id, story_id, media_url, media_type, caption, filter, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, highlight_id as "highlightId", story_id as "storyId",
                   media_url as "mediaUrl", media_type as "mediaType",
                   caption, filter, order_index as "orderIndex"`,
        [itemId, hlId, itm.storyId || null, itm.mediaUrl, itm.mediaType || 'image', itm.caption || '', itm.filter || 'normal', i]
      );
      createdItems.push(itmRes.rows[0]);
    }

    return {
      ...createdHl,
      items: createdItems,
    };
  }

  async addItemToHighlight(highlightId: string, item: any): Promise<any> {
    const itemId = `hli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const itmRes = await query(
      `INSERT INTO highlight_items (id, highlight_id, story_id, media_url, media_type, caption, filter, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM highlight_items WHERE highlight_id = $2))
       RETURNING id, highlight_id as "highlightId", story_id as "storyId",
                 media_url as "mediaUrl", media_type as "mediaType",
                 caption, filter, order_index as "orderIndex"`,
      [itemId, highlightId, item.storyId || null, item.mediaUrl, item.mediaType || 'image', item.caption || '', item.filter || 'normal']
    );
    return itmRes.rows[0];
  }
}

export const highlightRepository = new HighlightRepository();
