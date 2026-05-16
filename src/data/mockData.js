export const users = [
  { id: 'u1', name: 'Ayaan', handle: '@ayaan', status: 'online', role: 'Product Lead', avatar: 'AY', accent: 'from-cyan-300 to-blue-500' },
  { id: 'u2', name: 'Mira Chen', handle: '@mira', status: 'online', role: 'Designer', avatar: 'MC', accent: 'from-fuchsia-400 to-violet-600' },
  { id: 'u3', name: 'Leo Stone', handle: '@leo', status: 'idle', role: 'Backend', avatar: 'LS', accent: 'from-emerald-300 to-teal-600' },
  { id: 'u4', name: 'Nexus AI', handle: '@assistant', status: 'online', role: 'AI Assistant', avatar: 'AI', accent: 'from-amber-300 to-pink-500' }
];

export const rooms = [
  { id: 'direct-mira', name: 'Mira Chen', type: 'Direct', tag: 'Design sync', unread: 3, gradient: 'from-fuchsia-400 to-violet-600' },
  { id: 'war-room', name: 'Launch War Room', type: 'Group', tag: '12 members • encrypted', unread: 9, gradient: 'from-cyan-300 to-blue-600' },
  { id: 'voice-hub', name: 'Voice Lounge', type: 'Channel', tag: 'Live audio room', unread: 0, gradient: 'from-emerald-300 to-teal-600' },
  { id: 'ai-assistant', name: 'Nexus AI', type: 'AI', tag: 'Suggestions + translate', unread: 1, gradient: 'from-amber-300 to-pink-500' }
];

export const initialMessages = [
  { id: 'm1', roomId: 'war-room', authorId: 'u2', content: 'Final mobile QA passed. I pinned the release checklist and added motion polish to onboarding.', createdAt: '09:41', status: 'seen', reactions: ['🔥', '✅'] },
  { id: 'm2', roomId: 'war-room', authorId: 'u3', content: 'Socket.IO presence and WebRTC signaling are green. TURN config is ready for production failover.', createdAt: '09:42', status: 'delivered', reactions: ['🚀'] },
  { id: 'm3', roomId: 'war-room', authorId: 'u1', content: 'Great. Let’s start a quick HD group call and review the admin moderation flow before launch.', createdAt: '09:43', status: 'seen', reactions: [] },
  { id: 'm4', roomId: 'direct-mira', authorId: 'u2', content: 'I shared the dark/light mode tokens. The glass cards should feel premium but still accessible.', createdAt: '10:04', status: 'seen', reactions: ['💎'] },
  { id: 'm5', roomId: 'ai-assistant', authorId: 'u4', content: 'Smart suggestion: schedule a message to announce the release, then translate it for regional teams.', createdAt: '10:09', status: 'delivered', reactions: ['✨'] }
];

export const callParticipants = [
  { name: 'Ayaan', muted: false, video: true, quality: 'HD' },
  { name: 'Mira', muted: true, video: true, quality: 'HD' },
  { name: 'Leo', muted: false, video: false, quality: 'Good' },
  { name: 'Nexus AI', muted: true, video: false, quality: 'Assist' }
];

export const analytics = [
  { label: 'Latency', value: '42ms', delta: '-18%' },
  { label: 'Online users', value: '18.4K', delta: '+27%' },
  { label: 'Calls today', value: '3,812', delta: '+12%' },
  { label: 'Encrypted msgs', value: '2.8M', delta: '+44%' }
];

export const suggestions = [
  'Start a secure HD call with the launch team',
  'Summarize unread messages and create action items',
  'Translate this thread to Spanish and Hindi',
  'Schedule the release announcement for 9 AM',
  'Create a poll for launch readiness'
];

export const notifications = [
  { title: 'Incoming call', text: 'Mira invited you to Design Sync', tone: 'ringing' },
  { title: 'Mention', text: '@ayaan can you approve the deployment?', tone: 'mention' },
  { title: 'Security', text: 'New trusted device added', tone: 'secure' }
];
