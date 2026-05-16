import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video', 'audio', 'file', 'gif'], default: 'file' },
    url: String,
    name: String,
    size: Number,
    mimeType: String
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['user', 'assistant', 'system'], default: 'user' },
    content: { type: String, required: true },
    ciphertext: String,
    encrypted: { type: Boolean, default: true },
    attachments: [attachmentSchema],
    reactions: [{ emoji: String, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    replyTo: { type: mongoose.Schema.Types.ObjectId },
    pinned: { type: Boolean, default: false },
    editedAt: Date,
    deletedAt: Date,
    deliveredTo: [{ userId: mongoose.Schema.Types.ObjectId, at: Date }],
    readBy: [{ userId: mongoose.Schema.Types.ObjectId, at: Date }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'New secure room' },
    type: { type: String, enum: ['direct', 'group', 'channel', 'ai'], default: 'group' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    participants: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, default: 'member' }, mutedUntil: Date }],
    avatarGradient: { type: String, default: 'from-cyan-300 to-violet-500' },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pinnedMessageIds: [mongoose.Schema.Types.ObjectId],
    encryption: { algorithm: { type: String, default: 'AES-256-GCM + X25519 key exchange' }, keyRotationDays: { type: Number, default: 30 } },
    model: { type: String, default: 'gpt-4.1-mini' },
    messages: [messageSchema],
    lastMessageAt: Date
  },
  { timestamps: true }
);

conversationSchema.index({ title: 'text', 'messages.content': 'text' });
conversationSchema.index({ type: 1, updatedAt: -1 });

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
