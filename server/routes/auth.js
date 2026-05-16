import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (request, response) => {
  const { name, email, password } = request.body;
  if (!name || !email || !password) return response.status(400).json({ message: 'Name, email, and password are required' });
  if (password.length < 8) return response.status(422).json({ message: 'Password must contain at least 8 characters' });

  const existing = await User.findOne({ email });
  if (existing) return response.status(409).json({ message: 'Email is already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, status: 'online' });
  response.status(201).json(createSession(user));
});

router.post('/login', async (request, response) => {
  const { email, password, twoFactorCode } = request.body;
  const user = await User.findOne({ email });
  if (!user) return response.status(401).json({ message: 'Invalid credentials' });

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return response.status(401).json({ message: 'Invalid credentials' });
  if (user.twoFactor?.enabled && !twoFactorCode) return response.status(202).json({ message: 'Two-factor code required', twoFactorRequired: true });

  user.status = 'online';
  user.devices = [
    ...user.devices.slice(-4),
    { label: request.body.deviceLabel || 'Web browser', lastIp: request.ip, userAgent: request.get('user-agent'), trusted: Boolean(request.body.trustedDevice), lastSeenAt: new Date() }
  ];
  await user.save();

  response.json(createSession(user));
});

router.get('/me', requireAuth, async (request, response) => {
  const user = await User.findById(request.user.id).select('-passwordHash -twoFactor.secretRef');
  response.json(user);
});

router.post('/oauth/:provider', async (request, response) => {
  const { provider } = request.params;
  if (!['google', 'github'].includes(provider)) return response.status(400).json({ message: 'Unsupported OAuth provider' });
  response.status(501).json({ message: `${provider} OAuth is scaffolded. Wire Passport/Firebase redirect exchange here for production.` });
});

router.post('/2fa/setup', requireAuth, async (_request, response) => {
  response.json({ provisioningUri: 'otpauth://totp/NexusConnect:user@example.com?issuer=NexusConnect', recoveryCodes: ['NX-ALPHA', 'NX-BRAVO'] });
});

function createSession(user) {
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' });
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, preferredLanguage: user.preferredLanguage } };
}

export default router;
