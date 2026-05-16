import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  BrainCircuit,
  ChevronDown,
  Download,
  FileText,
  Globe2,
  Image as ImageIcon,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Mic,
  Moon,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  UserRound,
  WandSparkles,
  X
} from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';
import { analytics, initialMessages, languages, rooms, suggestions } from './data/mockData';
import { exportAsPdf, exportAsTxt } from './utils/exportChat';
import './index.css';

const capabilities = [
  { icon: BrainCircuit, title: 'Reasoning Copilot', text: 'Plan, debug, summarize, and learn with context-aware AI workflows.' },
  { icon: FileText, title: 'Document Analysis', text: 'Upload PDFs, contracts, specs, or notes for instant structured insights.' },
  { icon: ImageIcon, title: 'Image Generation', text: 'Create campaign visuals and concept art from polished prompt recipes.' },
  { icon: ShieldCheck, title: 'Secure Workspace', text: 'JWT-ready auth, encrypted sessions, admin analytics, and scalable APIs.' }
];

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [activeRoom, setActiveRoom] = useState('launch');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('English');
  const [isDesktop, setIsDesktop] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.matchMedia('(min-width: 1024px)').matches);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const roomMessages = useMemo(
    () => messages.filter((message) => message.room === activeRoom && message.content.toLowerCase().includes(search.toLowerCase())),
    [activeRoom, messages, search]
  );

  const sendMessage = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      room: activeRoom,
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          room: activeRoom,
          content: buildSmartReply(trimmed, language),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 850);
  };

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput('Voice input is ready for browsers that support the Web Speech API. Try Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.start();
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    sendMessage(`Analyze uploaded file: ${file.name}. Extract summary, risks, action items, and questions.`);
  };

  return (
    <div className={isLight ? 'light' : ''}>
      <main className="mesh-bg min-h-screen text-slate-100 light:text-slate-950">
        <FloatingOrbs />
        <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col p-3 md:p-5">
          <header className="glass-panel no-print sticky top-3 z-30 mb-4 flex items-center justify-between rounded-[2rem] px-4 py-3">
            <div className="flex items-center gap-3">
              <button className="rounded-2xl p-2 hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 shadow-lg shadow-cyan-500/30">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200 light:text-cyan-700">Nexus AI</p>
                <h1 className="text-lg font-bold md:text-2xl">Intelligent Chatbot Platform</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Pill icon={LockKeyhole} label="JWT Auth" />
              <Pill icon={Globe2} label={language} />
            </div>
            <div className="flex items-center gap-2">
              <select className="hidden rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none md:block" value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map((item) => <option className="bg-slate-950" key={item}>{item}</option>)}
              </select>
              <button onClick={() => setIsLight((value) => !value)} className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/20" aria-label="Toggle theme">
                {isLight ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </header>

          <section className="grid flex-1 gap-4 lg:grid-cols-[290px_minmax(0,1fr)_330px]">
            <AnimatePresence>
              {(sidebarOpen || isDesktop) && (
                <Sidebar activeRoom={activeRoom} setActiveRoom={setActiveRoom} close={() => setSidebarOpen(false)} />
              )}
            </AnimatePresence>

            <div className="flex min-h-[78vh] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/10 shadow-2xl shadow-black/20 light:bg-white/30">
              <Hero />
              <div className="no-print flex flex-wrap items-center gap-2 border-y border-white/10 px-4 py-3">
                <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
                  <Search size={16} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inside conversations..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                </div>
                <ActionButton icon={Download} label="TXT" onClick={() => exportAsTxt(roomMessages)} />
                <ActionButton icon={Download} label="PDF" onClick={() => exportAsPdf(roomMessages)} />
              </div>

              <div className="hide-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
                {roomMessages.map((message) => <ChatMessage key={message.id} message={message} />)}
                {isTyping && <TypingIndicator />}
              </div>

              <div className="no-print border-t border-white/10 p-3 md:p-4">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => sendMessage(suggestion)} className="shrink-0 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs transition hover:border-cyan-300/60 hover:bg-cyan-300/10">
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="glass-panel flex items-end gap-2 rounded-[1.7rem] p-2">
                  <button onClick={() => fileInputRef.current?.click()} className="rounded-2xl p-3 hover:bg-white/10" aria-label="Upload file"><Paperclip size={19} /></button>
                  <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept=".pdf,.txt,.md,.doc,.docx,.csv" />
                  <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Ask Nexus AI to code, write, analyze documents, plan strategy, or generate prompts..." rows="1" className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none placeholder:text-slate-400" />
                  <button onClick={handleVoice} className="rounded-2xl p-3 hover:bg-white/10" aria-label="Voice input"><Mic size={19} /></button>
                  <button onClick={() => sendMessage()} className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 p-3 text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105" aria-label="Send message"><Send size={19} /></button>
                </div>
              </div>
            </div>

            <RightPanel />
          </section>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ activeRoom, setActiveRoom, close }) {
  return (
    <motion.aside initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="glass-panel no-print fixed inset-y-3 left-3 z-40 flex w-[290px] flex-col rounded-[2rem] p-4 lg:static lg:z-auto lg:w-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold">Workspaces</h2>
        <button onClick={close} className="rounded-xl p-2 hover:bg-white/10 lg:hidden"><X size={18} /></button>
      </div>
      <button className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 font-semibold text-white"><Plus size={18} /> New AI Room</button>
      <div className="space-y-2">
        {rooms.map((room) => (
          <button key={room.id} onClick={() => { setActiveRoom(room.id); close(); }} className={`w-full rounded-2xl p-3 text-left transition ${activeRoom === room.id ? 'bg-white/[0.18] ring-1 ring-cyan-300/40' : 'hover:bg-white/10'}`}>
            <div className="flex items-center justify-between"><span className="font-medium">{room.name}</span>{room.unread > 0 && <span className="rounded-full bg-cyan-300 px-2 text-xs text-slate-950">{room.unread}</span>}</div>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-600">{room.tag}</p>
          </button>
        ))}
      </div>
      <div className="mt-auto space-y-2 pt-6">
        <NavItem icon={LayoutDashboard} label="Profile dashboard" />
        <NavItem icon={BarChart3} label="Admin analytics" />
        <NavItem icon={Settings} label="Model settings" />
      </div>
    </motion.aside>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden px-5 py-6 md:px-7">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-200 light:text-cyan-700"><WandSparkles size={17} /> GPT/Gemini-ready API architecture</p>
        <h2 className="neon-text text-3xl font-black tracking-tight md:text-5xl">Ask anything. Build faster. Think clearer.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 light:text-slate-700 md:text-base">A premium AI assistant for natural language chat, coding, writing, learning, business planning, voice workflows, file analysis, image generation, and multilingual productivity.</p>
      </motion.div>
    </div>
  );
}

function RightPanel() {
  return (
    <aside className="no-print hidden space-y-4 xl:block">
      <div className="glass-panel rounded-[2rem] p-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Smart Actions</h3><ChevronDown size={18} /></div>
        <div className="grid gap-3">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 transition hover:border-cyan-300/50 hover:bg-cyan-300/10">
              <Icon className="mb-3 text-cyan-200" size={22} />
              <h4 className="font-semibold">{title}</h4>
              <p className="mt-1 text-xs leading-5 text-slate-400 light:text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-panel rounded-[2rem] p-5">
        <h3 className="mb-4 font-semibold">Admin Analytics</h3>
        <div className="grid grid-cols-2 gap-3">
          {analytics.map((item) => (
            <div key={item.label} className="rounded-3xl bg-white/10 p-4">
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-xs text-slate-400 light:text-slate-600">{item.label}</p>
              <p className="mt-2 text-xs text-emerald-300 light:text-emerald-700">{item.delta}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-panel rounded-[2rem] p-5">
        <h3 className="font-semibold">Document Intelligence</h3>
        <div className="mt-4 rounded-3xl border border-dashed border-cyan-300/40 bg-cyan-300/10 p-6 text-center">
          <UploadCloud className="mx-auto mb-3 text-cyan-200" />
          <p className="text-sm">Drop files to summarize, classify, translate, and extract action items.</p>
        </div>
      </div>
    </aside>
  );
}

function FloatingOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {[0, 1, 2].map((item) => (
        <motion.div key={item} animate={{ y: [0, -28, 0], x: [0, item * 14, 0] }} transition={{ duration: 8 + item, repeat: Infinity, ease: 'easeInOut' }} className="absolute h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" style={{ left: `${10 + item * 32}%`, top: `${14 + item * 20}%` }} />
      ))}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }) {
  return <button onClick={onClick} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20"><Icon size={16} /> {label}</button>;
}

function Pill({ icon: Icon, label }) {
  return <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs"><Icon size={14} />{label}</span>;
}

function NavItem({ icon: Icon, label }) {
  return <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 light:text-slate-700"><Icon size={18} />{label}</button>;
}

function buildSmartReply(prompt, language) {
  return `Here is an intelligent ${language} workspace response for: "${prompt}"\n\n1. Clarify the goal and success metrics.\n2. Break the work into secure, scalable modules.\n3. Ship a polished user experience with fast feedback loops.\n4. Track quality with analytics, prompt evaluations, and cost monitoring.\n\n\`\`\`js\nasync function askNexusAI(message) {\n  const response = await fetch('/api/chat', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ message })\n  });\n  return response.json();\n}\n\`\`\``;
}
