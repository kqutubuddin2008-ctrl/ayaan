export default function TypingIndicator({ names = ['Someone'] }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30">•••</div>
      <div className="glass-panel flex items-center gap-3 rounded-3xl px-4 py-4">
        <span className="text-xs text-slate-300 light:text-slate-600">{names.join(', ')} typing</span>
        <span className="typing-dot h-2 w-2 rounded-full bg-cyan-300" />
        <span className="typing-dot h-2 w-2 rounded-full bg-violet-300" />
        <span className="typing-dot h-2 w-2 rounded-full bg-emerald-300" />
      </div>
    </div>
  );
}
