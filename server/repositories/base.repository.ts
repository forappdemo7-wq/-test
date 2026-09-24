import { query } from '../core/database/pool';

export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  async findById(id: string): Promise<T | null> {
    const res = await query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return (res.rows[0] as T) || null;
  }

  async count(whereClause: string = '1=1', params: any[] = []): Promise<number> {
    const res = await query(`SELECT COUNT(*)::int as count FROM ${this.tableName} WHERE ${whereClause}`, params);
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  async deleteById(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
