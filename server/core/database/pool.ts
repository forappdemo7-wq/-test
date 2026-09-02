import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../../config/env.config';
import { logger } from '../logger/logger';
import { DatabaseError } from '../errors/app-error';

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (!poolInstance) {
    logger.info('Initializing PostgreSQL connection pool...');
    poolInstance = new Pool({
      connectionString: config.database.url,
      max: config.database.maxConnections,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    poolInstance.on('error', (err: Error) => {
      logger.error('Unexpected idle client error in PostgreSQL pool', err);
    });

    poolInstance.on('connect', () => {
      logger.debug('New client connected to database pool');
    });
  }
  return poolInstance;
}

export async function query<T = any>(
  text: string,
  params?: any[],
  client?: PoolClient
): Promise<QueryResult<T>> {
  const start = Date.now();
  const pool = getPool();
  const executor = client || pool;

  try {
    const res = await executor.query<T>(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn(`Slow database query (${duration}ms): ${text.substring(0, 100)}...`);
    } else {
      logger.debug(`DB Query executed in ${duration}ms, rows: ${res.rowCount}`);
    }

    return res;
  } catch (error: any) {
    logger.error(`Database query failed: ${text.substring(0, 120)}`, error, {
      params: params ? params.slice(0, 5) : [],
    });
    throw new DatabaseError(`Database operation failed: ${error.message}`, {
      query: text.substring(0, 100),
      error: error.message,
    });
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const res = await query('SELECT 1 as health');
    return res.rows.length > 0;
  } catch {
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (poolInstance) {
    logger.info('Closing PostgreSQL database connection pool...');
    await poolInstance.end();
    poolInstance = null;
  }
}
