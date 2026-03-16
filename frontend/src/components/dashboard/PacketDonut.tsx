import type { CaptureStats } from '../../types';

const SEGMENTS = [
  { key: 'sip_packets', label: 'SIP', color: '#00c8ff' },
  { key: 'rtp_packets', label: 'RTP', color: '#00ffa3' },
  { key: 'rtcp_packets', label: 'RTCP', color: '#9b5de5' },
] as const;

export default function PacketDonut({ stats }: { stats: CaptureStats }) {
  const total = stats.sip_packets + stats.rtp_packets + stats.rtcp_packets;
  const cx = 60;
  const cy = 60;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const strokeWidth = 12;

  let offset = 0;
  const arcs = SEGMENTS.map(({ key, label, color }) => {
    const count = stats[key];
    const pct = total > 0 ? count / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const arc = { key, label, color, count, pct, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(0,200,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset + circumference * 0.25}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
            {total > 999 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
          <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">pkts</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {arcs.map((arc) => (
          <div key={arc.key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider w-8">{arc.label}</span>
            <span className="font-mono text-xs text-[var(--text-primary)]">{arc.count.toLocaleString()}</span>
            <span className="text-[10px] text-[var(--text-dim)] font-mono">
              {total > 0 ? `${(arc.pct * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
