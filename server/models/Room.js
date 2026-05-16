import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    mode: { type: String, default: 'chat' },
    attachments: [{ name: String, mimetype: String, size: Number, text: String }],
  },
  { timestamps: true },
)

const RoomSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New AI Room' },
    category: { type: String, default: 'general' },
    messages: [MessageSchema],
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.models.Room || mongoose.model('Room', RoomSchema)
