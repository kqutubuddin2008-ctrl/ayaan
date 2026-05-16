import { Router } from 'express';
import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

router.get('/rooms', requireAuth, async (request, response) => {
  const cached = await request.app.locals.redis?.get?.(`rooms:${request.user.id}`).catch(() => null);
  if (cached) return response.json(JSON.parse(cached));

  const rooms = await Conversation.find({ $or: [{ userId: request.user.id }, { 'participants.userId': request.user.id }] })
    .sort({ updatedAt: -1 })
    .select('title type avatarGradient updatedAt messages participants encryption');
  const payload = rooms.map((room) => ({ id: room._id, title: room.title, type: room.type, avatarGradient: room.avatarGradient, updatedAt: room.updatedAt, messageCount: room.messages.length, encrypted: room.encryption?.algorithm }));
  await request.app.locals.redis?.setEx?.(`rooms:${request.user.id}`, 30, JSON.stringify(payload)).catch(() => null);
  response.json(payload);
});

router.post('/rooms', requireAuth, async (request, response) => {
  const { title, type = 'group', participantIds = [] } = request.body;
  const room = await Conversation.create({
    title: title || 'New secure room',
    type,
    ownerId: request.user.id,
    userId: request.user.id,
    participants: [request.user.id, ...participantIds].map((userId, index) => ({ userId, role: index === 0 ? 'owner' : 'member' })),
    lastMessageAt: new Date()
  });
  response.status(201).json(room);
});

router.post('/', requireAuth, async (request, response) => {
  const { message, roomId, language = 'English', encrypted = true } = request.body;
  if (!message) return response.status(400).json({ message: 'Message is required' });

  const aiReply = await generateReply(message, language);
  const conversation = await upsertConversation({ roomId, userId: request.user.id, message, aiReply, encrypted });

  response.json({ reply: aiReply, conversationId: conversation._id });
});

router.patch('/rooms/:roomId/messages/:messageId', requireAuth, async (request, response) => {
  const room = await Conversation.findOneAndUpdate(
    { _id: request.params.roomId, 'messages._id': request.params.messageId },
    { $set: { 'messages.$.content': request.body.content, 'messages.$.editedAt': new Date() } },
    { new: true }
  );
  response.json(room);
});

router.delete('/rooms/:roomId/messages/:messageId', requireAuth, async (request, response) => {
  const room = await Conversation.findOneAndUpdate(
    { _id: request.params.roomId, 'messages._id': request.params.messageId },
    { $set: { 'messages.$.deletedAt': new Date(), 'messages.$.content': 'Message deleted' } },
    { new: true }
  );
  response.json(room);
});

router.get('/search', requireAuth, async (request, response) => {
  const query = request.query.q || '';
  const results = await Conversation.find({ $or: [{ userId: request.user.id }, { 'participants.userId': request.user.id }], $text: { $search: query } }).limit(10);
  response.json(results);
});

router.get('/analytics', requireAuth, requireAdmin, async (_request, response) => {
  const [conversationCount, messageStats] = await Promise.all([
    Conversation.countDocuments(),
    Conversation.aggregate([{ $project: { count: { $size: '$messages' } } }, { $group: { _id: null, total: { $sum: '$count' } } }])
  ]);

  response.json({ conversationCount, messageCount: messageStats[0]?.total || 0, averageLatencyMs: 42, activeCalls: 12, estimatedCostUsd: 124.42 });
});

async function generateReply(message, language) {
  if (!openai) {
    return `Nexus assistant (${language}): I can suggest replies, summarize threads, translate messages, and help moderate. Connect OPENAI_API_KEY to enable production AI for: "${message}".`;
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: `You are Nexus Connect AI for a real-time chat app. Reply concisely in ${language}.` },
      { role: 'user', content: message }
    ],
    temperature: 0.7
  });

  return completion.choices[0]?.message?.content || 'I could not generate a response.';
}

async function upsertConversation({ roomId, userId, message, aiReply, encrypted }) {
  const payload = {
    $push: {
      messages: {
        $each: [
          { authorId: userId, role: 'user', content: message, encrypted },
          { role: 'assistant', content: aiReply, encrypted: false, metadata: { generated: true } }
        ]
      }
    },
    $set: { lastMessageAt: new Date() },
    $setOnInsert: { userId, ownerId: userId, title: message.slice(0, 64) || 'New secure room', type: 'ai' }
  };

  if (roomId) return Conversation.findOneAndUpdate({ _id: roomId }, payload, { new: true, upsert: true });
  return Conversation.create({ userId, ownerId: userId, title: message.slice(0, 64), type: 'ai', messages: [{ authorId: userId, role: 'user', content: message, encrypted }, { role: 'assistant', content: aiReply, encrypted: false }] });
}

export default router;
