import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { config } from './config';
import { rateLimiter, helmetMiddleware } from './middleware/security';

import authRoutes from './routes/auth';
import classRoutes from './routes/classes';
import meetingRoutes from './routes/meetings';
import assignmentRoutes from './routes/assignments';
import announcementRoutes from './routes/announcements';
import attendanceRoutes from './routes/attendance';
import uploadRoutes from './routes/upload';
import whiteboardRoutes from './routes/whiteboard';

const app = express();

app.use(helmetMiddleware);
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((req, _res, next) => {
  (req as any).requestId = crypto.randomUUID();
  next();
});
app.use(morgan(config.logFormat));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/whiteboard', whiteboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: config.isDev ? err.message : 'Internal server error',
  });
});

if (!process.env.VERCEL) {
  const server = app.listen(config.port, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║  Zoom Classroom API Server                ║
  ║───────────────────────────────────────────║
  ║  Port:    ${String(config.port).padEnd(33)}║
  ║  Env:     ${config.nodeEnv.padEnd(33)}║
  ║  Client:  ${config.clientUrl.padEnd(33)}║
  ╚═══════════════════════════════════════════╝
    `);
  });

  function gracefulShutdown(signal: string) {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;
