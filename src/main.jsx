import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import 'highlight.js/styles/atom-one-dark.css'
import { Bot, BrainCircuit, Code2, Download, FileText, Image, Languages, LayoutDashboard, Lock, LogOut, Menu, Mic, Moon, Plus, Search, Send, Settings, Sparkles, Sun, User, Wand2, X, Zap } from 'lucide-react'
import { api, exportChat } from './lib/api'
import './styles.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)

const suggestions = [
  { icon: Code2, title: 'Debug code', prompt: 'Review this function and suggest a cleaner, safer implementation.' },
  { icon: FileText, title: 'Analyze a doc', prompt: 'Summarize the uploaded document, extract risks, and list next actions.' },
  { icon: Wand2, title: 'Write better', prompt: 'Rewrite this message in a confident executive tone.' },
  { icon: BrainCircuit, title: 'Learn fast', prompt: 'Teach me this topic with examples, analogies, and a quiz.' },
]

const modes = ['chat', 'coding', 'writing', 'learning', 'business', 'productivity']
const langs = { en: 'English', es: 'Español', fr: 'Français', hi: 'हिन्दी', ar: 'العربية', ja: '日本語' }

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => JSON.parse(localStorage.getItem(key) || JSON.stringify(initial)))
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue]
}

function AuthCard({ onAuth }) {
  const [isSignup, setSignup] = useState(true)
  const [form, setForm] = useState({ name: 'Ayaan', email: 'ayaan@example.com', password: 'password123' })
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const data = await api(isSignup ? '/auth/signup' : '/auth/login', { method: 'POST', body: form })
      onAuth(data)
    } catch (err) {
      setError(err.message)
    }
  }
  return <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
    <Aurora />
    <main className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_.9fr]">
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <span className="pill"><Sparkles size={16} /> Production-ready AI workspace</span>
        <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">Build, learn, write, and decide with a futuristic AI copilot.</h1>
        <p className="max-w-2xl text-lg text-slate-300">NexusAI blends real-time chat, document intelligence, voice input, image generation, secure rooms, analytics, and multilingual assistance in one premium interface.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {['Sub-second UX', 'JWT secured', 'Mongo scalable'].map((item) => <div className="glass-card p-5" key={item}><Zap className="mb-3 text-cyan-300" />{item}</div>)}
        </div>
      </motion.section>
      <motion.form initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={submit} className="glass-card relative z-10 space-y-5 p-7 shadow-glow">
        <div><h2 className="text-3xl font-bold">{isSignup ? 'Create your account' : 'Welcome back'}</h2><p className="text-slate-300">Secure authentication for your private AI rooms.</p></div>
        {isSignup && <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <button className="primary-btn w-full"><Lock size={18} /> {isSignup ? 'Launch NexusAI' : 'Sign in'}</button>
        <button type="button" className="w-full text-sm text-cyan-200" onClick={() => setSignup(!isSignup)}>{isSignup ? 'Already have an account?' : 'Need an account?'}</button>
      </motion.form>
    </main>
  </div>
}

function Aurora() {
  return <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute left-[-10%] top-[-10%] h-96 w-96 animate-pulseGlow rounded-full bg-cyan-500/30 blur-3xl" />
    <div className="absolute right-[-10%] top-[10%] h-[30rem] w-[30rem] animate-float rounded-full bg-fuchsia-500/25 blur-3xl" />
    <div className="absolute bottom-[-20%] left-[30%] h-[34rem] w-[34rem] rounded-full bg-indigo-500/20 blur-3xl" />
  </div>
}

function Sidebar({ rooms, activeId, setActiveId, createRoom, collapsed, setCollapsed }) {
  return <aside className={`${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-80'} fixed inset-y-0 left-0 z-30 border-r border-white/10 bg-slate-950/80 p-4 backdrop-blur-2xl transition-all lg:relative`}>
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3"><div className="logo"><Bot /></div>{!collapsed && <b className="text-xl">NexusAI</b>}</div>
      <button onClick={() => setCollapsed(!collapsed)} className="icon-btn"><Menu size={18} /></button>
    </div>
    <button onClick={createRoom} className="primary-btn mb-5 w-full justify-center"><Plus size={18} /> {!collapsed && 'New room'}</button>
    <div className="space-y-2">
      {rooms.map((room) => <button key={room._id} onClick={() => setActiveId(room._id)} className={`room-btn ${activeId === room._id ? 'room-active' : ''}`}><Sparkles size={16} />{!collapsed && <span className="truncate">{room.title}</span>}</button>)}
    </div>
  </aside>
}

function Message({ message }) {
  const isUser = message.role === 'user'
  useEffect(() => { document.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el)) }, [message.content])
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
    {!isUser && <div className="avatar"><Bot size={18} /></div>}
    <div className={`message ${isUser ? 'message-user' : 'message-ai'}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      {!!message.attachments?.length && <div className="mt-3 flex flex-wrap gap-2">{message.attachments.map((a) => <span className="pill" key={a.name}><FileText size={14} />{a.name}</span>)}</div>}
    </div>
    {isUser && <div className="avatar avatar-user"><User size={18} /></div>}
  </motion.div>
}

function ChatApp({ session, setSession }) {
  const [rooms, setRooms] = useState([])
  const [activeId, setActiveId] = useState('')
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('chat')
  const [language, setLanguage] = useState('en')
  const [files, setFiles] = useState([])
  const [typing, setTyping] = useState(false)
  const [dark, setDark] = useLocalStorage('nexus-theme-dark', true)
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [imagePrompt, setImagePrompt] = useState('A neon AI assistant floating above a glass dashboard')
  const [imageUrl, setImageUrl] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const scroller = useRef(null)
  const activeRoom = rooms.find((room) => room._id === activeId) || rooms[0]
  const filteredMessages = useMemo(() => activeRoom?.messages?.filter((m) => m.content.toLowerCase().includes(search.toLowerCase())) || [], [activeRoom, search])

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(() => { api('/rooms', { token: session.token }).then((data) => { setRooms(data); setActiveId(data[0]?._id || '') }) }, [session.token])
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }) }, [filteredMessages.length, typing])

  const createRoom = async () => {
    const room = await api('/rooms', { method: 'POST', token: session.token, body: { title: 'New AI Room', category: mode } })
    setRooms([room, ...rooms]); setActiveId(room._id)
  }
  const send = async (text = input) => {
    if (!text.trim()) return
    const optimistic = { role: 'user', content: text, mode, attachments: files.map((f) => ({ name: f.name })) }
    const tempRoom = activeRoom || { _id: 'temp', title: text.slice(0, 48), messages: [] }
    setRooms((prev) => prev.length ? prev.map((r) => r._id === tempRoom._id ? { ...r, messages: [...r.messages, optimistic] } : r) : [tempRoom])
    setInput(''); setTyping(true)
    const form = new FormData(); form.append('message', text); form.append('mode', mode); form.append('language', language); if (activeRoom?._id) form.append('roomId', activeRoom._id); files.forEach((file) => form.append('files', file))
    try {
      const data = await api('/chat', { method: 'POST', token: session.token, form })
      setRooms((prev) => [data.room, ...prev.filter((room) => room._id !== data.roomId && room._id !== 'temp')])
      setActiveId(data.roomId); setFiles([])
    } finally { setTyping(false) }
  }
  const dictate = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return setInput((v) => `${v} Voice input is unavailable in this browser.`)
    const recognition = new Recognition(); recognition.lang = language; recognition.onresult = (e) => setInput(e.results[0][0].transcript); recognition.start()
  }
  const generateImage = async () => {
    const data = await api('/images', { method: 'POST', token: session.token, body: { prompt: imagePrompt } })
    setImageUrl(data.url)
  }
  const loadAnalytics = async () => {
    try { setAnalytics(await api('/admin/analytics', { token: session.token })) } catch { setAnalytics({ users: 1, rooms: rooms.length, messages: rooms.reduce((s, r) => s + r.messages.length, 0), uptime: 0 }) }
  }

  return <div className="min-h-screen bg-slate-100 text-slate-950 transition dark:bg-slate-950 dark:text-white">
    <Aurora />
    <div className="relative flex min-h-screen">
      <Sidebar rooms={rooms} activeId={activeRoom?._id} setActiveId={setActiveId} createRoom={createRoom} collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex min-w-0 flex-1 flex-col lg:ml-0">
        <header className="sticky top-0 z-20 border-b border-slate-200/20 bg-white/70 px-4 py-3 backdrop-blur-2xl dark:bg-slate-950/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className="icon-btn lg:hidden" onClick={() => setCollapsed(false)}><Menu /></button>
            <div><h1 className="text-xl font-bold">{activeRoom?.title || 'NexusAI Command Center'}</h1><p className="text-sm text-slate-500 dark:text-slate-400">Real-time AI chat, files, voice, image generation, and analytics.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/80 px-3 py-2 dark:bg-slate-900"><Languages size={16} /><select className="bg-transparent text-sm outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>{Object.entries(langs).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select></div>
              <button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>
              <button className="icon-btn" onClick={() => activeRoom && exportChat(activeRoom, 'txt')}><Download /></button>
              <button className="icon-btn" onClick={() => setSession(null)}><LogOut /></button>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-4 p-4 xl:grid-cols-[1fr_360px]">
          <div className="glass-panel flex min-h-[70vh] flex-col overflow-hidden">
            <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">{modes.map((item) => <button key={item} onClick={() => setMode(item)} className={`chip ${mode === item ? 'chip-active' : ''}`}>{item}</button>)}</div>
            <div className="flex items-center gap-2 border-b border-white/10 p-3"><Search size={18} /><input className="search" placeholder="Search inside this conversation..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto p-4">
              {!filteredMessages.length && <div className="grid gap-3 md:grid-cols-2">{suggestions.map(({ icon: Icon, title, prompt }) => <button key={title} onClick={() => send(prompt)} className="suggestion"><Icon className="text-cyan-300" /><b>{title}</b><span>{prompt}</span></button>)}</div>}
              <AnimatePresence>{filteredMessages.map((message, idx) => <Message key={`${message.createdAt || idx}-${idx}`} message={message} />)}</AnimatePresence>
              {typing && <div className="typing"><span /><span /><span /> NexusAI is thinking...</div>}
            </div>
            <div className="border-t border-white/10 p-3">
              {!!files.length && <div className="mb-2 flex flex-wrap gap-2">{files.map((file) => <span className="pill" key={file.name}>{file.name}<X size={14} onClick={() => setFiles(files.filter((f) => f !== file))} /></span>)}</div>}
              <div className="composer"><label className="icon-btn cursor-pointer"><FileText /><input hidden multiple type="file" onChange={(e) => setFiles([...e.target.files])} /></label><button className="icon-btn" onClick={dictate}><Mic /></button><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Ask NexusAI anything..." /><button className="primary-btn" onClick={() => send()}><Send size={18} /> Send</button></div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass-card p-5"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><User /> Profile dashboard</h2><p className="text-2xl font-black">{session.user.name}</p><p className="text-slate-400">{session.user.plan} · {session.user.email}</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><Stat label="Rooms" value={rooms.length} /><Stat label="Msgs" value={rooms.reduce((s, r) => s + r.messages.length, 0)} /><Stat label="Lang" value={language.toUpperCase()} /></div></div>
            <div className="glass-card p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Image /> AI image studio</h2><textarea className="input min-h-24" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} /><button className="primary-btn mt-3 w-full justify-center" onClick={generateImage}>Generate image</button>{imageUrl && <img src={imageUrl} alt="Generated AI visual" className="mt-4 rounded-3xl border border-white/10" />}</div>
            <div className="glass-card p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><LayoutDashboard /> Admin analytics</h2><button className="secondary-btn w-full justify-center" onClick={loadAnalytics}>Refresh analytics</button>{analytics && <div className="mt-4 grid grid-cols-2 gap-2"><Stat label="Users" value={analytics.users} /><Stat label="Rooms" value={analytics.rooms} /><Stat label="Messages" value={analytics.messages} /><Stat label="Uptime" value={`${Math.round(analytics.uptime)}s`} /></div>}</div>
            <div className="glass-card p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Settings /> Production notes</h2><ul className="space-y-2 text-sm text-slate-400"><li>• Express API with JWT, rate limits, Helmet, MongoDB models.</li><li>• OpenAI-ready chat and image endpoints with demo fallback.</li><li>• TXT/PDF export, document upload context, voice input, and syntax highlighting.</li></ul></div>
          </aside>
        </section>
      </main>
    </div>
  </div>
}

function Stat({ label, value }) { return <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><b>{value}</b><p className="text-xs text-slate-400">{label}</p></div> }

function App() {
  const [session, setSession] = useLocalStorage('nexus-session', null)
  return session ? <ChatApp session={session} setSession={setSession} /> : <AuthCard onAuth={setSession} />
}

createRoot(document.getElementById('root')).render(<App />)
