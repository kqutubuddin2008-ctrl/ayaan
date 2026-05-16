# NexusAI Chatbot Platform

A modern AI chatbot website with a futuristic glassmorphism UI, secure authentication, multi-room conversations, document-aware chat, voice input, image generation, exports, search, analytics, and OpenAI-ready backend integration.

## Stack

- React + Vite frontend
- Tailwind CSS and Framer Motion animations
- Node.js + Express API
- MongoDB with in-memory demo fallback
- JWT authentication, Helmet, CORS, and rate limiting
- OpenAI chat and image generation integration

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Set `OPENAI_API_KEY`, `JWT_SECRET`, and `MONGODB_URI` in `.env` for production-like AI and persistence. Without those values, the app runs in demo mode with in-memory storage and safe mocked AI responses.

## Production notes

- Configure strong secrets and HTTPS-only deployment.
- Use MongoDB Atlas or a managed MongoDB cluster.
- Restrict `CLIENT_ORIGIN` to trusted domains.
- Put uploaded files behind malware scanning and object storage for high-volume deployments.
- Replace the lightweight PDF export placeholder with a server-side PDF renderer for branded reports.
