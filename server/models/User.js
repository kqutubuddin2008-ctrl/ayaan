import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    label: String,
    lastIp: String,
    userAgent: String,
    trusted: { type: Boolean, default: false },
    lastSeenAt: Date
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: String,
    bio: { type: String, default: 'Building securely on Nexus Connect.' },
    status: { type: String, enum: ['online', 'idle', 'dnd', 'offline'], default: 'offline' },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    preferredLanguage: { type: String, default: 'English' },
    oauthProviders: [{ provider: String, providerUserId: String }],
    twoFactor: { enabled: { type: Boolean, default: false }, secretRef: String },
    privacy: {
      readReceipts: { type: Boolean, default: true },
      onlinePresence: { type: Boolean, default: true },
      callsFrom: { type: String, enum: ['everyone', 'friends', 'none'], default: 'friends' }
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    devices: [deviceSchema]
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
