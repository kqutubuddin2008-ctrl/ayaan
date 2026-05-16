# Nexus AI Chatbot Platform

A modern, futuristic AI chatbot website scaffolded with React, Tailwind CSS, Framer Motion, Express, MongoDB models, JWT authentication, file upload hooks, and OpenAI API integration points.

## Features

- Responsive glassmorphism chat UI with dark/light mode and neon gradients
- Multi-room conversation layout, history search, smart prompt suggestions, and typing animation
- Voice input through the browser Web Speech API
- File upload entry point for AI document analysis workflows
- Code syntax highlighting in AI responses
- TXT/PDF chat export tools
- Image generation, dashboard, admin analytics, multilingual, and secure-auth UX sections
- Express API with JWT auth, MongoDB conversation persistence, upload route, and OpenAI-compatible chat route

## Getting started

```bash
npm install
npm run dev
```

Run the API in another terminal:

```bash
cp .env.example .env
npm run server
```

## Environment

See `.env.example` for server configuration. Without `OPENAI_API_KEY`, the API returns a deterministic fallback response so local development still works.
