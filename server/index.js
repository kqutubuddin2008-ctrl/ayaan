import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import multer from 'multer'
import OpenAI from 'openai'
import { randomUUID } from 'node:crypto'
import User from './models/User.js'
import Room from './models/Room.js'

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const memory = { users: new Map(), rooms: new Map() }
let mongoReady = false

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'], credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }))

const sign = (user) => jwt.sign({ id: user.id || user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: '7d' })
const safeUser = (user) => ({ id: String(user.id || user._id), name: user.name, email: user.email, role: user.role, language: user.language || 'en', plan: user.plan || 'Pro Trial' })

async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ message: 'Missing token' })
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me')
    req.user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

async function connectMongo() {
  if (!process.env.MONGODB_URI) return
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    mongoReady = true
    console.log('MongoDB connected')
  } catch (error) {
    console.warn('MongoDB unavailable; using in-memory demo store:', error.message)
  }
}

const systemPrompt = `You are NexusAI, a secure, concise, production-grade assistant for coding, writing, learning, business, productivity, and document analysis. Use markdown, explain assumptions, and adapt to the user's language.`

function demoReply(message, attachments = []) {
  const docs = attachments.length ? `\n\nI also detected ${attachments.length} uploaded document(s) and can summarize, extract action items, compare clauses, or answer questions about them.` : ''
  return `I’m running in secure demo mode because no AI API key is configured. Here’s how I can help with: “${message}”.\n\n- Break the request into clear next steps\n- Draft polished content or code\n- Explain concepts with examples\n- Create productivity plans and business briefs\n- Analyze uploaded files once an API key is connected${docs}\n\nAdd OPENAI_API_KEY to enable live model responses.`
}

async function getRoom(userId, roomId) {
  if (mongoReady) return Room.findOne({ _id: roomId, owner: userId })
  return memory.rooms.get(roomId)
}

async function listRooms(userId) {
  if (mongoReady) return Room.find({ owner: userId, archived: false }).sort({ updatedAt: -1 }).limit(50)
  return [...memory.rooms.values()].filter((room) => room.owner === userId && !room.archived).sort((a, b) => b.updatedAt - a.updatedAt)
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mongoReady, aiReady: Boolean(openai) }))

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, valid email, and 8+ character password required.' })
  const passwordHash = await bcrypt.hash(password, 12)
  if (mongoReady) {
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already registered.' })
    const user = await User.create({ name, email, passwordHash })
    return res.status(201).json({ user: safeUser(user), token: sign(user) })
  }
  if ([...memory.users.values()].some((u) => u.email === email)) return res.status(409).json({ message: 'Email already registered.' })
  const user = { id: randomUUID(), name, email, passwordHash, role: 'user', language: 'en', plan: 'Pro Trial' }
  memory.users.set(user.id, user)
  res.status(201).json({ user: safeUser(user), token: sign(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = mongoReady ? await User.findOne({ email }) : [...memory.users.values()].find((u) => u.email === email)
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Invalid credentials.' })
  res.json({ user: safeUser(user), token: sign(user) })
})

app.get('/api/rooms', auth, async (req, res) => res.json(await listRooms(String(req.user.id))))

app.post('/api/rooms', auth, async (req, res) => {
  const title = req.body.title || 'New AI Room'
  if (mongoReady) return res.status(201).json(await Room.create({ owner: req.user.id, title, category: req.body.category || 'general', messages: [] }))
  const room = { _id: randomUUID(), owner: String(req.user.id), title, category: req.body.category || 'general', messages: [], archived: false, createdAt: Date.now(), updatedAt: Date.now() }
  memory.rooms.set(room._id, room)
  res.status(201).json(room)
})

app.post('/api/chat', auth, upload.array('files', 4), async (req, res) => {
  const { roomId, message, mode = 'chat', language = 'en' } = req.body
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required.' })
  let room = roomId ? await getRoom(String(req.user.id), roomId) : null
  if (!room) {
    room = mongoReady
      ? await Room.create({ owner: req.user.id, title: message.slice(0, 48), category: mode, messages: [] })
      : { _id: randomUUID(), owner: String(req.user.id), title: message.slice(0, 48), category: mode, messages: [], archived: false, createdAt: Date.now(), updatedAt: Date.now() }
    if (!mongoReady) memory.rooms.set(room._id, room)
  }
  const attachments = (req.files || []).map((file) => ({ name: file.originalname, mimetype: file.mimetype, size: file.size, text: file.buffer.toString('utf8').slice(0, 12_000) }))
  const userMessage = { role: 'user', content: message, mode, attachments, createdAt: new Date() }
  room.messages.push(userMessage)

  let content = demoReply(message, attachments)
  if (openai) {
    const recent = room.messages.slice(-12).map((m) => ({ role: m.role, content: `${m.content}${m.attachments?.length ? `\n\nAttached context:\n${m.attachments.map((a) => `${a.name}: ${a.text}`).join('\n')}` : ''}` }))
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: `${systemPrompt}\nRespond in language code: ${language}. Mode: ${mode}.` }, ...recent],
      temperature: 0.65,
    })
    content = completion.choices[0]?.message?.content || content
  }

  const assistantMessage = { role: 'assistant', content, mode, createdAt: new Date() }
  room.messages.push(assistantMessage)
  room.updatedAt = new Date()
  if (mongoReady) await room.save()
  res.json({ roomId: String(room._id), message: assistantMessage, room })
})

app.get('/api/rooms/:id/search', auth, async (req, res) => {
  const room = await getRoom(String(req.user.id), req.params.id)
  if (!room) return res.status(404).json({ message: 'Room not found.' })
  const q = (req.query.q || '').toString().toLowerCase()
  res.json(room.messages.filter((m) => m.content.toLowerCase().includes(q)))
})

app.post('/api/images', auth, async (req, res) => {
  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ message: 'Prompt required.' })
  if (!openai) return res.json({ url: `https://placehold.co/1024x1024/111827/67e8f9?text=${encodeURIComponent('NexusAI Image')}`, prompt })
  const image = await openai.images.generate({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size: '1024x1024' })
  res.json({ url: `data:image/png;base64,${image.data[0].b64_json}`, prompt })
})

app.get('/api/admin/analytics', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only.' })
  const rooms = mongoReady ? await Room.find({}) : [...memory.rooms.values()]
  const users = mongoReady ? await User.countDocuments({}) : memory.users.size
  res.json({ users, rooms: rooms.length, messages: rooms.reduce((sum, room) => sum + room.messages.length, 0), uptime: process.uptime() })
})

await connectMongo()
const port = process.env.PORT || 5174
app.listen(port, () => console.log(`NexusAI API running on http://localhost:${port}`))
