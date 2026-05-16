import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

router.post('/signup', async (request, response) => {
  const { name, email, password } = request.body;
  if (!name || !email || !password) return response.status(400).json({ message: 'Name, email, and password are required' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  response.status(201).json(createSession(user));
});

router.post('/login', async (request, response) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email });
  if (!user) return response.status(401).json({ message: 'Invalid credentials' });

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return response.status(401).json({ message: 'Invalid credentials' });

  response.json(createSession(user));
});

function createSession(user) {
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' });
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, preferredLanguage: user.preferredLanguage } };
}

export default router;
