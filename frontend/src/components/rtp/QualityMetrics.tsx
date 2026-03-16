import type { CallRecord } from '../../types';

interface Metric {
  label: string;
  value: string;
  pct: number;
  color: string;
  note: string;
}

function mosColor(mos: number | null): string {
  if (mos === null) return '#5a7a9a';
  if (mos >= 4.0) return '#00ffa3';
  if (mos >= 3.5) return '#ff8c42';
  return '#ff4d6d';
}

function jitterColor(j: number | null): string {
  if (j === null) return '#5a7a9a';
  if (j < 10) return '#00ffa3';
  if (j < 30) return '#ff8c42';
  return '#ff4d6d';
}

function lossColor(l: number | null): string {
  if (l === null) return '#5a7a9a';
  if (l < 1) return '#00ffa3';
  if (l < 5) return '#ff8c42';
  return '#ff4d6d';
}

function latencyColor(l: number | null): string {
  if (l === null) return '#5a7a9a';
  if (l < 100) return '#00ffa3';
  if (l < 200) return '#ff8c42';
  return '#ff4d6d';
}

export default function QualityMetrics({ call }: { call: CallRecord }) {
  const metrics: Metric[] = [
    {
      label: 'Avg Jitter',
      value: call.avg_jitter_ms !== null ? `${call.avg_jitter_ms.toFixed(1)} ms` : 'N/A',
      pct: call.avg_jitter_ms !== null ? Math.min(100, (call.avg_jitter_ms / 100) * 100) : 0,
      color: jitterColor(call.avg_jitter_ms),
      note: call.avg_jitter_ms !== null
        ? call.avg_jitter_ms < 10 ? 'Excellent' : call.avg_jitter_ms < 30 ? 'Acceptable' : 'High'
        : 'No data',
    },
    {
      label: 'Avg Latency',
      value: call.avg_latency_ms !== null ? `${call.avg_latency_ms.toFixed(0)} ms` : 'N/A',
      pct: call.avg_latency_ms !== null ? Math.min(100, (call.avg_latency_ms / 300) * 100) : 0,
      color: latencyColor(call.avg_latency_ms),
      note: call.avg_latency_ms !== null
        ? call.avg_latency_ms < 100 ? 'Excellent' : call.avg_latency_ms < 200 ? 'Acceptable' : 'High'
        : 'Requires RTCP',
    },
    {
      label: 'Packet Loss',
      value: call.packet_loss_pct !== null ? `${call.packet_loss_pct.toFixed(2)}%` : 'N/A',
      pct: call.packet_loss_pct !== null ? Math.min(100, call.packet_loss_pct * 10) : 0,
      color: lossColor(call.packet_loss_pct),
      note: call.packet_loss_pct !== null
        ? call.packet_loss_pct < 1 ? 'Acceptable' : call.packet_loss_pct < 5 ? 'Moderate' : 'Severe'
        : 'No data',
    },
    {
      label: 'MOS Score',
      value: call.mos_score !== null ? call.mos_score.toFixed(2) : 'N/A',
      pct: call.mos_score !== null ? ((call.mos_score - 1) / 3.5) * 100 : 0,
      color: mosColor(call.mos_score),
      note: call.mos_score !== null
        ? call.mos_score >= 4.0 ? 'Excellent' : call.mos_score >= 3.5 ? 'Good' : call.mos_score >= 3.0 ? 'Fair' : 'Poor'
        : 'No RTP data',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="bg-[var(--bg-card2)] border border-[var(--border)] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">{m.label}</span>
            <span className="text-[9px] font-medium" style={{ color: m.color }}>{m.note}</span>
          </div>
          <p className="font-mono text-lg font-bold mb-2" style={{ color: m.color }}>{m.value}</p>
          <div className="h-1 bg-[var(--bg-card)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${m.pct}%`, backgroundColor: m.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
