import { PoolClient } from 'pg';
import { getPool, query } from './pool';
import { logger } from '../logger/logger';
import { DatabaseError } from '../errors/app-error';

export interface TransactionContext {
  client: PoolClient;
  query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[]; rowCount: number | null }>;
}

/**
 * Executes a unit of work within an isolated database transaction.
 * Automatically handles BEGIN, COMMIT on success, and ROLLBACK on error.
 */
export async function withTransaction<T>(
  work: (ctx: TransactionContext) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logger.debug('Database transaction started');

    const ctx: TransactionContext = {
      client,
      query: async <R = any>(text: string, params?: any[]) => {
        return query<R>(text, params, client);
      },
    };

    const result = await work(ctx);

    await client.query('COMMIT');
    logger.debug('Database transaction committed successfully');
    return result;
  } catch (error: any) {
    logger.warn('Database transaction failed, rolling back...', { error: error.message });
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error('Failed to rollback transaction', rollbackError);
    }
    throw new DatabaseError(`Transaction failed: ${error.message}`, { cause: error });
  } finally {
    client.release();
  }
}
