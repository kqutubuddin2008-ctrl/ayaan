import 'dotenv/config';
import http from 'node:http';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import { attachRealtimeServer } from './realtime/socket.js';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '4mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 180, standardHeaders: true, legacyHeaders: false }));

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (error) => console.warn('Redis unavailable; continuing without cache:', error.message));
}

app.locals.redis = redisClient;

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'nexus-connect-api', realtime: true, timestamp: new Date().toISOString() });
});

app.get('/api/config/webrtc', (_request, response) => {
  response.json({
    iceServers: [
      { urls: process.env.TURN_URL || 'stun:stun.l.google.com:19302' },
      ...(process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL
        ? [{ urls: process.env.TURN_URL, username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL }]
        : [])
    ],
    media: { video: { width: 1280, height: 720, frameRate: 30 }, audio: { echoCancellation: true, noiseSuppression: true } }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

attachRealtimeServer(server, { clientUrl });

async function startServer() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } else {
    console.log('MONGODB_URI not provided; API will run with in-memory/demo fallbacks where possible.');
  }

  if (redisClient) {
    try {
      await redisClient.connect();
      console.log('Redis connected');
    } catch (error) {
      console.warn('Redis connection skipped:', error.message);
    }
  }

  server.listen(port, () => console.log(`Nexus Connect API + Socket.IO running on http://localhost:${port}`));
}

startServer().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
