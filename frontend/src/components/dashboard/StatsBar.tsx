import type { CaptureStats } from '../../types';

function StatCard({
  label,
  value,
  sub,
  accent,
  warning,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  warning?: boolean;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">{label}</span>
      <span className={`text-2xl font-mono font-bold ${accent} ${warning ? 'text-orange' : ''}`}>{value}</span>
      {sub && <span className="text-[10px] text-[var(--text-muted)] font-mono">{sub}</span>}
    </div>
  );
}

function mosColor(mos: number | null): string {
  if (mos === null) return 'text-[var(--text-muted)]';
  if (mos >= 4.0) return 'text-green';
  if (mos >= 3.5) return 'text-orange';
  return 'text-voip-red';
}

export default function StatsBar({ stats }: { stats: CaptureStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Total Calls"
        value={String(stats.total_calls)}
        sub={`${stats.successful_calls} ok · ${stats.failed_calls} failed`}
        accent="text-cyan"
      />
      <StatCard
        label="Total Packets"
        value={stats.total_packets.toLocaleString()}
        sub={`SIP ${stats.sip_packets} · RTP ${stats.rtp_packets.toLocaleString()} · RTCP ${stats.rtcp_packets}`}
        accent="text-green"
      />
      <StatCard
        label="Avg MOS Score"
        value={stats.avg_mos !== null ? stats.avg_mos.toFixed(2) : 'N/A'}
        sub={stats.avg_mos !== null ? (stats.avg_mos >= 4.0 ? 'Excellent' : stats.avg_mos >= 3.5 ? 'Good' : 'Poor') : 'No RTP data'}
        accent={mosColor(stats.avg_mos)}
        warning={stats.avg_mos !== null && stats.avg_mos < 3.5}
      />
      <StatCard
        label="SIP Errors"
        value={String(stats.total_errors)}
        sub={`${stats.capture_duration_sec.toFixed(1)}s capture duration`}
        accent={stats.total_errors > 0 ? 'text-voip-red' : 'text-[var(--text-muted)]'}
      />
    </div>
  );
}
