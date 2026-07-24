import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: (() => {
      const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
      if (b64) return Buffer.from(b64, 'base64').toString('utf-8');
      return (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    })(),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  r2: {
    endpoint: process.env.R2_ENDPOINT || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'zoom-classroom',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  },

  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
    url: process.env.LIVEKIT_URL || '',
  },

  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [process.env.CLIENT_URL || 'http://localhost:5173'],

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  logFormat: process.env.LOG_FORMAT || ((process.env.NODE_ENV || 'development') === 'production' ? 'combined' : 'dev'),

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
