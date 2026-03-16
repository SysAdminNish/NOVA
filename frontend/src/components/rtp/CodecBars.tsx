import { useEffect, useRef, useState } from 'react';
import type { RtpStream } from '../../types';

const CODEC_COLORS: Record<string, string> = {
  'G.711u': '#00c8ff',
  'G.711a': '#9b5de5',
  'G.729':  '#ff8c42',
  'G.722':  '#00ffa3',
  'Opus':   '#00ffa3',
  'GSM':    '#5a7a9a',
};

function codecColor(codec: string): string {
  return CODEC_COLORS[codec] ?? '#5a7a9a';
}

export default function CodecBars({ streams }: { streams: RtpStream[] }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!streams.length) {
    return (
      <div className="flex items-center justify-center h-24 text-[var(--text-muted)] text-xs">
        No RTP streams detected
      </div>
    );
  }

  // Aggregate by codec
  const codecMap = new Map<string, { count: number; packets: number; pt: number }>();
  for (const s of streams) {
    const existing = codecMap.get(s.codec);
    if (existing) {
      existing.count++;
      existing.packets += s.packet_count;
    } else {
      codecMap.set(s.codec, { count: 1, packets: s.packet_count, pt: s.payload_type });
    }
  }

  const entries = [...codecMap.entries()].sort((a, b) => b[1].packets - a[1].packets);
  const maxPackets = entries[0]?.[1].packets ?? 1;

  return (
    <div ref={ref} className="space-y-3">
      {entries.map(([codec, info]) => {
        const pct = (info.packets / maxPackets) * 100;
        const color = codecColor(codec);
        return (
          <div key={codec}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold" style={{ color }}>{codec}</span>
                <span className="text-[9px] font-mono bg-[var(--bg-card2)] border border-[var(--border)] text-[var(--text-dim)] px-1.5 py-0.5 rounded">
                  PT:{info.pt}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {info.packets.toLocaleString()} pkts · {info.count} stream{info.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-2 bg-[var(--bg-card2)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${pct}%` : '0%',
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}44`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
