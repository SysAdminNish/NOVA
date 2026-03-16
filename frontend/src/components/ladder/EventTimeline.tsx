import type { SipMessage } from '../../types';

const METHOD_COLORS: Record<string, string> = {
  INVITE: '#00c8ff',
  '100': '#5a7a9a',
  '180': '#ff8c42',
  '183': '#ff8c42',
  '200': '#00ffa3',
  ACK: '#9b5de5',
  BYE: '#ff4d6d',
  CANCEL: '#ff4d6d',
  '486': '#ff4d6d',
  '503': '#ff8c42',
};

function getColor(method: string): string {
  return METHOD_COLORS[method.toUpperCase()] ?? '#5a7a9a';
}

export default function EventTimeline({ messages }: { messages: SipMessage[] }) {
  if (!messages.length) {
    return <p className="text-xs text-[var(--text-muted)] text-center py-6">No messages</p>;
  }

  const maxTs = messages[messages.length - 1]?.timestamp ?? 1;

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => {
        const color = getColor(msg.method);
        const pct = maxTs > 0 ? (msg.timestamp / maxTs) * 100 : 0;

        return (
          <div key={i} className="flex items-center gap-2 group">
            {/* Time marker */}
            <span className="text-[9px] font-mono text-[var(--text-dim)] w-12 text-right shrink-0">
              {msg.timestamp.toFixed(2)}s
            </span>
            {/* Timeline bar */}
            <div className="flex-1 relative h-5 flex items-center">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-full bg-[var(--border)]" />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-px"
                style={{ width: `${pct}%`, background: `${color}44` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 transition-transform group-hover:scale-125"
                style={{ left: `${pct}%`, backgroundColor: color, borderColor: color, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            {/* Method badge */}
            <span
              className="text-[9px] font-mono font-bold w-14 shrink-0"
              style={{ color }}
            >
              {msg.method}
            </span>
          </div>
        );
      })}
    </div>
  );
}
