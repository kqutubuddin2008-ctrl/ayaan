import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, default: 'New AI Room' },
    model: { type: String, default: 'gpt-4.1-mini' },
    messages: [messageSchema]
  },
  { timestamps: true }
);

conversationSchema.index({ title: 'text', 'messages.content': 'text' });

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
