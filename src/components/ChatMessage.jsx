import { motion } from 'framer-motion';
import { Bot, Copy, UserRound } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatMessage({ message }) {
  const isAssistant = message.role === 'assistant';
  const segments = message.content.split(/```/g);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {isAssistant && <Avatar assistant />}
      <div className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-6 md:max-w-[76%] ${isAssistant ? 'glass-panel text-slate-100 light:text-slate-900' : 'bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-2xl shadow-cyan-500/20'}`}>
        <div className="space-y-3 whitespace-pre-wrap">
          {segments.map((segment, index) => {
            const isCode = index % 2 === 1;
            if (!isCode) return <p key={index}>{segment}</p>;
            const code = segment.replace(/^\w+\n/, '');
            const language = segment.match(/^\w+/)?.[0] || 'javascript';
            return (
              <div key={index} className="overflow-hidden rounded-2xl border border-white/10">
                <SyntaxHighlighter language={language} style={oneDark} customStyle={{ margin: 0, fontSize: '0.78rem' }}>
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] opacity-70">
          <span>{message.timestamp}</span>
          <button aria-label="Copy message" className="rounded-full p-1 transition hover:bg-white/10">
            <Copy size={13} />
          </button>
        </div>
      </div>
      {!isAssistant && <Avatar />}
    </motion.article>
  );
}

function Avatar({ assistant = false }) {
  return (
    <div className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${assistant ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30' : 'bg-violet-400/20 text-violet-100 ring-1 ring-violet-200/30'}`}>
      {assistant ? <Bot size={18} /> : <UserRound size={18} />}
    </div>
  );
}
