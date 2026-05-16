import { motion } from 'framer-motion';
import { Check, CheckCheck, Copy, LockKeyhole, Pencil, Reply, Smile } from 'lucide-react';

export default function ChatMessage({ message, user }) {
  const mine = message.authorId === 'u1';
  const author = user || { name: 'Nexus User', avatar: 'NU', accent: 'from-cyan-300 to-violet-500' };

  return (
    <motion.article initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && <Avatar user={author} />}
      <div className={`group max-w-[86%] md:max-w-[74%] ${mine ? 'items-end' : 'items-start'}`}>
        {!mine && <p className="mb-1 ml-2 text-xs font-semibold text-slate-400 light:text-slate-600">{author.name}</p>}
        <div className={`rounded-[1.65rem] px-4 py-3 text-sm leading-6 shadow-xl ${mine ? 'bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-cyan-500/20' : 'glass-panel text-slate-100 light:text-slate-900'}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.attachments?.length > 0 && <div className="mt-3 grid gap-2">{message.attachments.map((attachment) => <div key={attachment.name} className="rounded-2xl bg-white/10 p-3 text-xs">{attachment.name}</div>)}</div>}
          <div className="mt-3 flex items-center justify-between gap-4 text-[11px] opacity-75">
            <span className="inline-flex items-center gap-1"><LockKeyhole size={12} /> {message.createdAt}</span>
            <span className="inline-flex items-center gap-1">{message.status === 'seen' ? <CheckCheck size={13} /> : <Check size={13} />} {message.status}</span>
          </div>
        </div>
        <div className={`mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 ${mine ? 'justify-end' : 'justify-start'}`}>
          {[Smile, Reply, Pencil, Copy].map((Icon, index) => <button key={index} className="rounded-full bg-white/10 p-1.5 hover:bg-white/20" aria-label="Message action"><Icon size={13} /></button>)}
          {message.reactions?.map((reaction) => <span key={reaction} className="rounded-full bg-white/10 px-2 py-1 text-xs">{reaction}</span>)}
        </div>
      </div>
      {mine && <Avatar user={author} />}
    </motion.article>
  );
}

function Avatar({ user }) {
  return <div className={`mt-6 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${user.accent} text-xs font-black text-white ring-1 ring-white/20`}>{user.avatar}</div>;
}
