import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'nexus-ai-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

async function startServer() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } else {
    console.log('MONGODB_URI not provided; API will run with controller-level fallbacks.');
  }

  app.listen(port, () => console.log(`Nexus AI API running on http://localhost:${port}`));
}

startServer().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
