import { Router } from 'express';
import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

router.get('/rooms', requireAuth, async (request, response) => {
  const rooms = await Conversation.find({ userId: request.user.id }).sort({ updatedAt: -1 }).select('title model updatedAt messages');
  response.json(rooms.map((room) => ({ id: room._id, title: room.title, model: room.model, updatedAt: room.updatedAt, messageCount: room.messages.length })));
});

router.post('/', requireAuth, async (request, response) => {
  const { message, roomId, language = 'English' } = request.body;
  if (!message) return response.status(400).json({ message: 'Message is required' });

  const aiReply = await generateReply(message, language);
  const conversation = await upsertConversation({ roomId, userId: request.user.id, message, aiReply });

  response.json({ reply: aiReply, conversationId: conversation._id });
});

router.get('/search', requireAuth, async (request, response) => {
  const query = request.query.q || '';
  const results = await Conversation.find({ userId: request.user.id, $text: { $search: query } }).limit(10);
  response.json(results);
});

router.get('/analytics', requireAuth, requireAdmin, async (_request, response) => {
  const [conversationCount, messageStats] = await Promise.all([
    Conversation.countDocuments(),
    Conversation.aggregate([{ $project: { count: { $size: '$messages' } } }, { $group: { _id: null, total: { $sum: '$count' } } }])
  ]);

  response.json({ conversationCount, messageCount: messageStats[0]?.total || 0, averageLatencyMs: 820, estimatedCostUsd: 124.42 });
});

async function generateReply(message, language) {
  if (!openai) {
    return `Nexus AI fallback response (${language}): I received "${message}". Connect OPENAI_API_KEY to enable production model responses, streaming, tool calls, and image generation.`;
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: `You are Nexus AI, a concise expert assistant. Reply in ${language}.` },
      { role: 'user', content: message }
    ],
    temperature: 0.7
  });

  return completion.choices[0]?.message?.content || 'I could not generate a response.';
}

async function upsertConversation({ roomId, userId, message, aiReply }) {
  const payload = {
    $push: {
      messages: {
        $each: [
          { role: 'user', content: message },
          { role: 'assistant', content: aiReply }
        ]
      }
    },
    $setOnInsert: { userId, title: message.slice(0, 64) || 'New AI Room' }
  };

  if (roomId) {
    return Conversation.findOneAndUpdate({ _id: roomId, userId }, payload, { new: true, upsert: true });
  }

  return Conversation.create({ userId, title: message.slice(0, 64), messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiReply }] });
}

export default router;
