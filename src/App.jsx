import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bell,
  Bot,
  Camera,
  CheckCheck,
  ChevronRight,
  Download,
  FileUp,
  Gauge,
  Github,
  Globe2,
  Image as ImageIcon,
  Laptop,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  Moon,
  MoreHorizontal,
  Phone,
  PhoneOff,
  Pin,
  Plus,
  Radio,
  Search,
  Send,
  Settings,
  Shield,
  Smile,
  Sparkles,
  Sun,
  UserPlus,
  Users,
  Video,
  WandSparkles,
  X
} from 'lucide-react';
import { io } from 'socket.io-client';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';
import { analytics, callParticipants, notifications, rooms, suggestions, users } from './data/mockData';
import { useCommunicationStore } from './store/useCommunicationStore';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function App() {
  const { activeRoom, setActiveRoom, messages, addMessage, updateMessage, presence, setPresence } = useCommunicationStore();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isLight, setIsLight] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [callActive, setCallActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);

  const activeRoomInfo = rooms.find((room) => room.id === activeRoom) || rooms[0];
  const filteredMessages = useMemo(
    () => messages.filter((message) => message.roomId === activeRoom && message.content.toLowerCase().includes(query.toLowerCase())),
    [activeRoom, messages, query]
  );

  useEffect(() => {
    const socket = io(API_URL, { autoConnect: true, auth: { token: localStorage.getItem('nexus_token') || '' } });
    socketRef.current = socket;
    socket.emit('room:join', { roomId: activeRoom });
    socket.on('message:new', (message) => addMessage(normalizeIncomingMessage(message)));
    socket.on('message:typing', ({ user, isTyping }) => {
      setTypingUsers((current) => isTyping ? [...new Set([...current, user.name])] : current.filter((name) => name !== user.name));
    });
    socket.on('presence:update', (members) => setPresence(mergePresence(users, members)));
    return () => socket.disconnect();
  }, [addMessage, setPresence]);

  useEffect(() => {
    socketRef.current?.emit('room:join', { roomId: activeRoom });
  }, [activeRoom]);

  const sendMessage = (text = input) => {
    const content = text.trim();
    if (!content) return;
    const optimistic = {
      id: crypto.randomUUID(),
      roomId: activeRoom,
      authorId: 'u1',
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      reactions: []
    };
    addMessage(optimistic);
    setInput('');
    socketRef.current?.emit('message:send', { ...optimistic, encrypted: true }, (ack) => {
      if (ack?.message) updateMessage(optimistic.id, { status: 'delivered' });
    });
  };

  const handleTyping = (value) => {
    setInput(value);
    socketRef.current?.emit('message:typing', { roomId: activeRoom, isTyping: value.length > 0 });
  };

  return (
    <div className={isLight ? 'light' : ''}>
      <main className="mesh-bg min-h-screen overflow-hidden text-slate-100 light:text-slate-950">
        <FloatingOrbs />
        <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col p-3 md:p-5">
          <TopNav isLight={isLight} setIsLight={setIsLight} setSidebarOpen={setSidebarOpen} />
          <section className="grid flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
            <AnimatePresence>
              {(sidebarOpen || window.matchMedia?.('(min-width: 1024px)').matches) && (
                <Sidebar activeRoom={activeRoom} setActiveRoom={setActiveRoom} close={() => setSidebarOpen(false)} />
              )}
            </AnimatePresence>

            <div className="grid min-h-[calc(100vh-7.5rem)] gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
              <LandingStrip />
              <section className="glass-panel flex min-h-[640px] flex-col overflow-hidden rounded-[2rem]">
                <ChatHeader room={activeRoomInfo} query={query} setQuery={setQuery} callActive={callActive} setCallActive={setCallActive} />
                <div className="hide-scrollbar flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
                  {filteredMessages.map((message) => <ChatMessage key={message.id} message={message} user={users.find((item) => item.id === message.authorId)} />)}
                  {typingUsers.length > 0 && <TypingIndicator names={typingUsers} />}
                </div>
                <Composer input={input} setInput={handleTyping} sendMessage={sendMessage} />
              </section>
            </div>

            <RightPanel
              presence={presence}
              callActive={callActive}
              setCallActive={setCallActive}
              muted={muted}
              setMuted={setMuted}
              cameraOn={cameraOn}
              setCameraOn={setCameraOn}
              sendMessage={sendMessage}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function TopNav({ isLight, setIsLight, setSidebarOpen }) {
  return (
    <header className="glass-panel sticky top-3 z-30 mb-4 flex items-center justify-between rounded-[2rem] px-4 py-3">
      <div className="flex items-center gap-3">
        <button className="rounded-2xl p-2 hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-violet-500 to-emerald-400 shadow-lg shadow-cyan-500/30"><Sparkles size={22} /></div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200 light:text-cyan-700">Nexus Connect</p>
          <h1 className="text-lg font-black md:text-2xl">Realtime Chat + HD Calls</h1>
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <Pill icon={Shield} label="E2E ready" />
        <Pill icon={Gauge} label="42ms latency" />
        <Pill icon={Radio} label="Live" />
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/20" aria-label="GitHub OAuth"><Github size={18} /></button>
        <button onClick={() => setIsLight(!isLight)} className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/20" aria-label="Toggle theme">{isLight ? <Moon size={18} /> : <Sun size={18} />}</button>
      </div>
    </header>
  );
}

function LandingStrip() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel relative overflow-hidden rounded-[2rem] p-5 md:p-7">
      <div className="max-w-4xl">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-200 light:text-cyan-700"><WandSparkles size={18} /> Discord-grade rooms • WhatsApp-fast DMs • Telegram-smooth channels</p>
        <h2 className="neon-text text-3xl font-black tracking-tight md:text-5xl">A premium futuristic communication command center.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700 md:text-base">Socket.IO messaging, WebRTC signaling, encrypted room architecture, AI suggestions, moderation tooling, push-ready PWA support, and responsive glassmorphism UI built for production scaling.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.map((item) => <StatCard key={item.label} {...item} />)}
      </div>
    </motion.section>
  );
}

function Sidebar({ activeRoom, setActiveRoom, close }) {
  return (
    <motion.aside initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} className="glass-panel fixed inset-y-3 left-3 z-40 flex w-[300px] flex-col rounded-[2rem] p-4 lg:static lg:z-auto lg:w-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Workspace</h2>
        <button className="rounded-xl p-2 hover:bg-white/10 lg:hidden" onClick={close} aria-label="Close navigation"><X size={18} /></button>
      </div>
      <button className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20"><Plus size={18} /> New room</button>
      <div className="space-y-2">
        {rooms.map((room) => (
          <button key={room.id} onClick={() => { setActiveRoom(room.id); close(); }} className={`w-full rounded-3xl p-3 text-left transition ${activeRoom === room.id ? 'bg-white/[0.18] ring-1 ring-cyan-300/40' : 'hover:bg-white/10'}`}>
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${room.gradient} text-sm font-black text-white`}>{room.name.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className="truncate font-semibold">{room.name}</span>{room.unread > 0 && <span className="rounded-full bg-cyan-300 px-2 text-xs text-slate-950">{room.unread}</span>}</div><p className="truncate text-xs text-slate-400 light:text-slate-600">{room.type} • {room.tag}</p></div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-auto space-y-2 pt-5">
        <NavItem icon={Bell} label="Notifications center" />
        <NavItem icon={UserPlus} label="Friend requests" />
        <NavItem icon={Settings} label="Privacy & admin" />
      </div>
    </motion.aside>
  );
}

function ChatHeader({ room, query, setQuery, callActive, setCallActive }) {
  return (
    <div className="border-b border-white/10 p-4 md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${room.gradient} font-black text-white shadow-lg`}>{room.name.slice(0, 2).toUpperCase()}</div>
          <div><h3 className="text-xl font-black">{room.name}</h3><p className="text-sm text-slate-400 light:text-slate-600"><LockKeyhole className="mr-1 inline" size={14} /> E2E encrypted • typing indicators • read receipts</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chat" className="w-32 bg-transparent text-sm outline-none placeholder:text-slate-400" /></div>
          <button className="rounded-2xl bg-white/10 p-3 hover:bg-white/20" aria-label="Pinned messages"><Pin size={18} /></button>
          <button onClick={() => setCallActive(!callActive)} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20"><Video size={18} /> {callActive ? 'View call' : 'Start call'}</button>
        </div>
      </div>
    </div>
  );
}

function Composer({ input, setInput, sendMessage }) {
  const fileRef = useRef(null);
  return (
    <div className="border-t border-white/10 p-4 md:p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.slice(0, 3).map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)} className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs transition hover:border-cyan-300/50 hover:bg-cyan-300/10">{suggestion}</button>)}
      </div>
      <div className="flex items-end gap-2 rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-2">
        <button onClick={() => fileRef.current?.click()} className="rounded-2xl p-3 hover:bg-white/10" aria-label="Upload"><FileUp size={20} /></button>
        <input ref={fileRef} className="hidden" type="file" multiple />
        <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Message with encryption, @mentions, GIFs, files, voice notes..." className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-3 outline-none placeholder:text-slate-400" />
        <button className="rounded-2xl p-3 hover:bg-white/10" aria-label="Emoji"><Smile size={20} /></button>
        <button className="rounded-2xl p-3 hover:bg-white/10" aria-label="Voice note"><Mic size={20} /></button>
        <button onClick={() => sendMessage()} className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 p-3 text-white shadow-lg shadow-cyan-500/20" aria-label="Send"><Send size={20} /></button>
      </div>
    </div>
  );
}

function RightPanel({ presence, callActive, setCallActive, muted, setMuted, cameraOn, setCameraOn, sendMessage }) {
  return (
    <aside className="hidden space-y-4 xl:block">
      <AnimatePresence>{callActive && <VideoCallPanel muted={muted} setMuted={setMuted} cameraOn={cameraOn} setCameraOn={setCameraOn} endCall={() => setCallActive(false)} />}</AnimatePresence>
      <Panel title="Online now" action="Manage">
        <div className="space-y-3">{presence.slice(0, 5).map((user) => <Member key={user.id} user={user} />)}</div>
      </Panel>
      <Panel title="AI + engagement" action="Open">
        <div className="grid gap-2">
          {['Smart replies', 'Live translation', 'Polls & voting', 'Scheduled sends'].map((item) => <button key={item} onClick={() => sendMessage(item)} className="flex items-center justify-between rounded-2xl bg-white/[0.07] px-3 py-3 text-left text-sm hover:bg-white/10"><span>{item}</span><ChevronRight size={16} /></button>)}
        </div>
      </Panel>
      <Panel title="Notifications" action="Mute">
        <div className="space-y-2">{notifications.map((item) => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.07] p-3"><p className="font-semibold">{item.title}</p><p className="text-xs text-slate-400 light:text-slate-600">{item.text}</p></div>)}</div>
      </Panel>
    </aside>
  );
}

function VideoCallPanel({ muted, setMuted, cameraOn, setCameraOn, endCall }) {
  return (
    <motion.section initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="glass-panel overflow-hidden rounded-[2rem] p-4">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.24em] text-emerald-200 light:text-emerald-700">HD group call</p><h3 className="text-lg font-black">Launch War Room</h3></div><Pill icon={Activity} label="Excellent" /></div>
      <div className="grid grid-cols-2 gap-3">
        {callParticipants.map((participant, index) => <div key={participant.name} className={`relative overflow-hidden rounded-3xl border border-white/10 ${index === 0 ? 'col-span-2 h-40' : 'h-28'} bg-gradient-to-br from-slate-900 to-slate-800 p-3`}><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.35),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,.28),transparent_38%)]" /><div className="relative flex h-full flex-col justify-between"><span className="w-fit rounded-full bg-black/30 px-2 py-1 text-xs">{participant.quality}</span><div className="flex items-center justify-between"><strong>{participant.name}</strong>{participant.muted ? <MicOff size={16} /> : <Mic size={16} />}</div></div></div>)}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        <CallButton active={!muted} onClick={() => setMuted(!muted)} icon={muted ? MicOff : Mic} label="Mute" />
        <CallButton active={cameraOn} onClick={() => setCameraOn(!cameraOn)} icon={Camera} label="Cam" />
        <CallButton active icon={Laptop} label="Share" />
        <CallButton active icon={Download} label="Record" />
        <button onClick={endCall} className="grid place-items-center rounded-2xl bg-rose-500 p-3 text-white shadow-lg shadow-rose-500/25" aria-label="End call"><PhoneOff size={19} /></button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 light:text-slate-600"><span>12:48 call timer</span><span>Adaptive bitrate • background blur ready</span></div>
    </motion.section>
  );
}

function StatCard({ label, value, delta }) { return <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-400 light:text-slate-600">{label}</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl">{value}</strong><span className="text-sm text-emerald-300 light:text-emerald-700">{delta}</span></div></div>; }
function Panel({ title, action, children }) { return <section className="glass-panel rounded-[2rem] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">{title}</h3><button className="text-xs text-cyan-200 light:text-cyan-700">{action}</button></div>{children}</section>; }
function Member({ user }) { return <div className="flex items-center gap-3"><div className={`relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${user.accent || 'from-cyan-300 to-violet-500'} text-xs font-black text-white`}><span>{user.avatar || user.name?.slice(0, 2)}</span><span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 ${user.status === 'online' ? 'bg-emerald-400' : user.status === 'idle' ? 'bg-amber-300' : 'bg-slate-500'}`} /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-xs text-slate-400 light:text-slate-600">{user.role || user.handle}</p></div><MoreHorizontal size={17} /></div>; }
function NavItem({ icon: Icon, label }) { return <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 light:text-slate-700"><Icon size={18} /> {label}</button>; }
function Pill({ icon: Icon, label }) { return <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold"><Icon size={14} /> {label}</span>; }
function CallButton({ icon: Icon, label, active = false, onClick }) { return <button onClick={onClick} className={`grid place-items-center rounded-2xl p-3 text-xs transition ${active ? 'bg-white/15 text-cyan-100' : 'bg-white/5 text-slate-400'}`} aria-label={label}><Icon size={18} /></button>; }
function FloatingOrbs() { return <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden"><div className="orb left-[8%] top-[12%] bg-cyan-400/20" /><div className="orb right-[7%] top-[20%] bg-violet-500/20 animation-delay-2000" /><div className="orb bottom-[8%] left-[45%] bg-emerald-400/10 animation-delay-4000" /></div>; }
function normalizeIncomingMessage(message) { return { id: message.id, roomId: message.roomId, authorId: message.author?.id === 'u1' ? 'u1' : 'u3', content: message.content, createdAt: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: message.status, reactions: message.reactions || [] }; }
function mergePresence(current, members) { const mapped = members.map((member) => ({ id: member.id, name: member.name, role: member.role, status: member.status, avatar: member.name?.slice(0, 2).toUpperCase(), accent: 'from-cyan-300 to-violet-500' })); return [...mapped, ...current.filter((user) => !mapped.some((member) => member.id === user.id))]; }
