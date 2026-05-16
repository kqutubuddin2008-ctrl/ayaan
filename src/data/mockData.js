export const rooms = [
  { id: 'launch', name: 'Launch Strategy', tag: 'Business', unread: 2 },
  { id: 'code', name: 'Code Copilot', tag: 'Engineering', unread: 0 },
  { id: 'learn', name: 'Study Mentor', tag: 'Learning', unread: 4 },
  { id: 'creative', name: 'Creative Studio', tag: 'Writing', unread: 0 }
];

export const suggestions = [
  'Create a go-to-market plan for a SaaS AI product',
  'Review this React component and improve accessibility',
  'Explain quantum computing like I am a product manager',
  'Draft a persuasive investor update with clear metrics',
  'Generate image prompts for a cyberpunk campaign hero'
];

export const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    room: 'launch',
    content: 'Welcome back to Nexus AI. I can help with product strategy, code, documents, research, writing, and productivity workflows. What are we building today?',
    timestamp: '09:41'
  },
  {
    id: 2,
    role: 'user',
    room: 'launch',
    content: 'Help me outline the advanced features for a premium AI chatbot platform.',
    timestamp: '09:42'
  },
  {
    id: 3,
    role: 'assistant',
    room: 'launch',
    content: `Absolutely. A production-ready platform should combine:\n\n- Secure auth, role-based access, and protected API routes\n- Multi-room chat history with semantic search\n- Voice input, document analysis, code rendering, and export tools\n- Admin analytics for usage, retention, latency, and model costs\n\n\`\`\`js\nconst feature = {\n  realtimeChat: true,\n  documentAnalysis: 'queued',\n  imageGeneration: 'enabled'\n};\n\`\`\``,
    timestamp: '09:43'
  }
];

export const analytics = [
  { label: 'AI replies', value: '48.2K', delta: '+18%' },
  { label: 'Avg latency', value: '0.8s', delta: '-12%' },
  { label: 'Documents read', value: '6.9K', delta: '+31%' },
  { label: 'Active rooms', value: '1,284', delta: '+9%' }
];

export const languages = ['English', 'Spanish', 'French', 'Hindi', 'Japanese', 'Arabic'];
