import dotenv from 'dotenv';

dotenv.config();

export interface EnvironmentConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  host: string;
  isProduction: boolean;
  isDevelopment: boolean;
  database: {
    url: string;
    maxConnections: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  redis: {
    url?: string;
    host: string;
    port: number;
    password?: string;
    enabled: boolean;
    defaultTtlSecs: number;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresInDays: number;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    isConfigured: boolean;
  };
  gemini: {
    apiKey?: string;
    model: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  app: {
    name: string;
    version: string;
    apiVersion: string;
    clientUrl: string;
  };
}

const DEFAULT_DATABASE_URL =
  'postgresql://neondb_owner:npg_ILdc98mRjtzF@ep-wispy-leaf-axnkhdil.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

export const config: EnvironmentConfig = {
  env: (process.env.NODE_ENV as any) || 'development',
  port: 3000,
  host: '0.0.0.0',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  database: {
    url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '10000', 10),
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    enabled: Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
    defaultTtlSecs: parseInt(process.env.REDIS_DEFAULT_TTL || '300', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_SECRET || 'instavibe_jwt_production_access_key_9823478912',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'instavibe_jwt_refresh_secure_key_1928374981',
    accessExpiresIn: '15m',
    refreshExpiresInDays: 30,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'zqh0eatl',
    apiKey: process.env.CLOUDINARY_API_KEY || '679815779374465',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'v-2_Fz6m8oA-kQY1Q9Z2y_5r1y8',
    isConfigured: Boolean(process.env.CLOUDINARY_API_SECRET || 'v-2_Fz6m8oA-kQY1Q9Z2y_5r1y8'),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-3.7-flash',
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
  },
  app: {
    name: 'InstaVibe Scalable API',
    version: '1.0.0',
    apiVersion: 'v1',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },
};
