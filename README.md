# Nexus Connect — Real-Time Chat & Video Call Application

Nexus Connect is a production-oriented, premium communication app scaffold inspired by Discord, WhatsApp, and Telegram. It includes a futuristic React/Tailwind UI, Socket.IO realtime events, WebRTC signaling endpoints, JWT authentication, MongoDB schemas, Redis-ready caching, uploads, PWA support, and deployment guidance.

## What is included

### Frontend

- React + Vite architecture with mobile-first responsive layouts.
- Tailwind CSS glassmorphism, neon gradients, dark/light mode, floating UI, skeleton-friendly panels, and accessibility-conscious controls.
- Framer Motion micro-interactions for sidebars, panels, messages, and call surfaces.
- Socket.IO client integration for live messages, typing indicators, read/delivery states, and presence.
- PWA manifest and service worker for installability and offline shell caching.
- Production-ready component areas: landing strip, auth/OAuth affordances, dashboard, chat interface, group rooms, video call panel, notifications, profile/member surfaces, and admin/privacy navigation.

### Backend

- Node.js + Express API with Helmet, CORS, compression, JSON limits, and API rate limiting.
- MongoDB/Mongoose schemas for users, devices, privacy settings, conversations, encrypted messages, attachments, reactions, receipts, group admins, and pinned messages.
- JWT login/signup/session endpoints with password hashing and 2FA/OAuth extension points.
- Socket.IO realtime server with authenticated sockets, room joins, presence, typing, reactions, read receipts, incoming calls, and WebRTC offer/answer/ICE signaling.
- Redis-ready room caching and scalable environment configuration.
- Upload route for document/media ingestion and future CDN/object storage integration.

## Folder structure

```text
src/
  App.jsx                    # Premium realtime app shell and dashboard
  components/                # Reusable chat and typing components
  data/mockData.js           # Demo rooms, users, notifications, metrics
  main.jsx                   # React entry + service worker registration
server/
  index.js                   # Express, MongoDB, Redis, Socket.IO bootstrap
  realtime/socket.js         # Socket.IO and WebRTC signaling events
  routes/                    # Auth, chat, upload REST API routes
  models/                    # MongoDB user/conversation schemas
public/
  manifest.webmanifest       # PWA metadata
  sw.js                      # Offline shell service worker
```

## Realtime event architecture

| Event | Direction | Purpose |
| --- | --- | --- |
| `room:join` / `room:leave` | client → server | Subscribe users to direct chats, groups, channels, and call rooms. |
| `message:send` | client → server → room | Broadcast encrypted messages with attachments and delivery acknowledgement. |
| `message:typing` | client → server → room | Low-latency typing indicators. |
| `message:reaction` | client → server → room | Emoji reactions and engagement. |
| `message:read` | client → server → room | Read receipts and seen status. |
| `presence:update` | server → clients | Online/offline activity indicators. |
| `call:invite` / `call:incoming` | client → server → room | Incoming call popup and ringtone hooks. |
| `call:join` / `call:end` | client ↔ server | Group voice/video room lifecycle. |
| `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate` | peer ↔ server ↔ peer | WebRTC signaling for HD voice/video, screen share, and adaptive media. |
| `call:media-state` | client → server → call | Camera/mic/screen-share state synchronization. |

## Environment

Copy the example and replace secrets for production:

```bash
cp .env.example .env
```

Key variables:

- `MONGODB_URI` — MongoDB Atlas or self-hosted MongoDB connection string.
- `JWT_SECRET` — long random secret for API and Socket.IO auth.
- `REDIS_URL` — Redis/Upstash URL for caching and future Socket.IO adapters.
- `CLIENT_URL` — deployed frontend origin.
- `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` — STUN/TURN settings for WebRTC reliability.
- `OPENAI_API_KEY` — optional AI assistant, suggestions, translation, and moderation integration.

## Local development

```bash
npm install
npm run dev
```

Run the API in another terminal:

```bash
npm run server
```

## Production deployment guide

1. Build the frontend with `npm run build` and deploy `dist/` to Vercel, Netlify, Cloudflare Pages, or an S3/CDN edge.
2. Deploy the API to Render, Fly.io, Railway, AWS ECS, or Kubernetes.
3. Use MongoDB Atlas with automated backups and connection pooling.
4. Use Redis for REST caching and add the Socket.IO Redis adapter when horizontally scaling multiple API instances.
5. Put media uploads behind object storage such as S3/R2 plus a CDN, then persist signed URLs in message attachments.
6. Configure HTTPS and secure cookies/tokens. Rotate `JWT_SECRET` and OAuth secrets via the host secret manager.
7. Configure TURN (Twilio/Numb, Cloudflare Calls, Metered, or coturn) for users behind strict NATs.
8. Add CI/CD steps: install, lint/typecheck, `npm run check`, `npm run build`, container image build, and smoke tests.
9. Add monitoring: API latency, Socket.IO connection count, WebRTC call quality, upload failures, MongoDB query times, and Redis hit ratio.
10. Enforce security controls: rate limits, moderation queues, report/block workflows, audit logs, 2FA, and dependency scanning.

## Docker sketch

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 8080
CMD ["npm", "run", "server"]
```

For a complete production deployment, build the Vite frontend separately and serve it via CDN or static hosting.
