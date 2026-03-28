import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { useCaptureStore } from '../store/captureStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CallRecord } from '../types';

function MosBadge({ mos }: { mos: number | null }) {
  if (mos === null) return <span className="font-mono text-xs text-[var(--text-dim)]">N/A</span>;
  const color = mos >= 4.0 ? 'text-green' : mos >= 3.5 ? 'text-orange' : 'text-voip-red';
  const bg = mos >= 4.0 ? 'bg-green/10' : mos >= 3.5 ? 'bg-orange/10' : 'bg-voip-red/10';
  return (
    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${color} ${bg}`}>
      {mos.toFixed(2)}
    </span>
  );
}

function QualityLevel({ label, count, color, total }: { label: string; count: number; color: string; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="bg-[var(--bg-card2)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">{label}</span>
        <span className="text-xs font-mono text-[var(--text-muted)]">{pct.toFixed(0)}%</span>
      </div>
      <div className="font-mono text-2xl font-bold mb-3" style={{ color }}>{count}</div>
      <div className="h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AggregateMetric({ label, value, unit, color, threshold }: { 
  label: string; 
  value: number | null; 
  unit: string; 
  color: string;
  threshold: string;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-2">{label}</div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono text-xl font-bold" style={{ color }}>
          {value !== null ? value.toFixed(2) : 'N/A'}
        </span>
        <span className="text-xs text-[var(--text-muted)]">{unit}</span>
      </div>
      <div className="text-[9px] text-[var(--text-dim)]">{threshold}</div>
    </div>
  );
}

function CallQualityCard({ call }: { call: CallRecord }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-bright)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[var(--text-primary)] truncate mb-1">
            {call.from_uri} → {call.to_uri}
          </div>
          <div className="text-[9px] font-mono text-[var(--text-dim)] truncate">{call.call_id}</div>
        </div>
        <MosBadge mos={call.mos_score} />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { 
            label: 'Jitter', 
            value: call.avg_jitter_ms !== null ? `${call.avg_jitter_ms.toFixed(1)}ms` : 'N/A',
            color: call.avg_jitter_ms !== null 
              ? (call.avg_jitter_ms < 10 ? '#00ffa3' : call.avg_jitter_ms < 30 ? '#ff8c42' : '#ff4d6d')
              : '#5a7a9a'
          },
          { 
            label: 'Latency', 
            value: call.avg_latency_ms !== null ? `${call.avg_latency_ms.toFixed(0)}ms` : 'N/A',
            color: call.avg_latency_ms !== null 
              ? (call.avg_latency_ms < 100 ? '#00ffa3' : call.avg_latency_ms < 200 ? '#ff8c42' : '#ff4d6d')
              : '#5a7a9a'
          },
          { 
            label: 'Loss', 
            value: call.packet_loss_pct !== null ? `${call.packet_loss_pct.toFixed(2)}%` : 'N/A',
            color: call.packet_loss_pct !== null 
              ? (call.packet_loss_pct < 1 ? '#00ffa3' : call.packet_loss_pct < 5 ? '#ff8c42' : '#ff4d6d')
              : '#5a7a9a'
          },
          { 
            label: 'Codec', 
            value: call.codec || 'N/A',
            color: '#00c8ff'
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[var(--bg-card2)] rounded-lg px-2 py-2">
            <div className="text-[8px] uppercase tracking-wider text-[var(--text-dim)] mb-0.5">{label}</div>
            <div className="font-mono text-[10px] font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Quality() {
  const { analysis } = useCaptureStore();

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)] p-8">
        <Target size={36} />
        <p className="text-sm">No capture loaded</p>
        <p className="text-xs">Upload a pcap file from the Dashboard to analyse call quality.</p>
      </div>
    );
  }

  const callsWithMos = analysis.calls.filter(c => c.mos_score !== null);
  const excellent = callsWithMos.filter(c => c.mos_score! >= 4.0).length;
  const good = callsWithMos.filter(c => c.mos_score! >= 3.5 && c.mos_score! < 4.0).length;
  const poor = callsWithMos.filter(c => c.mos_score! < 3.5).length;

  const avgMos = callsWithMos.length > 0
    ? callsWithMos.reduce((sum, c) => sum + c.mos_score!, 0) / callsWithMos.length
    : null;

  const callsWithJitter = analysis.calls.filter(c => c.avg_jitter_ms !== null);
  const avgJitter = callsWithJitter.length > 0
    ? callsWithJitter.reduce((sum, c) => sum + c.avg_jitter_ms!, 0) / callsWithJitter.length
    : null;

  const callsWithLatency = analysis.calls.filter(c => c.avg_latency_ms !== null);
  const avgLatency = callsWithLatency.length > 0
    ? callsWithLatency.reduce((sum, c) => sum + c.avg_latency_ms!, 0) / callsWithLatency.length
    : null;

  const callsWithLoss = analysis.calls.filter(c => c.packet_loss_pct !== null);
  const avgLoss = callsWithLoss.length > 0
    ? callsWithLoss.reduce((sum, c) => sum + c.packet_loss_pct!, 0) / callsWithLoss.length
    : null;

  const mosDistribution = [
    { range: '4.0-4.5', label: 'Excellent', count: callsWithMos.filter(c => c.mos_score! >= 4.0).length, color: '#00ffa3' },
    { range: '3.5-4.0', label: 'Good', count: callsWithMos.filter(c => c.mos_score! >= 3.5 && c.mos_score! < 4.0).length, color: '#ff8c42' },
    { range: '3.0-3.5', label: 'Fair', count: callsWithMos.filter(c => c.mos_score! >= 3.0 && c.mos_score! < 3.5).length, color: '#ff8c42' },
    { range: '<3.0', label: 'Poor', count: callsWithMos.filter(c => c.mos_score! < 3.0).length, color: '#ff4d6d' },
  ];

  return (
    <div className="px-6 py-5 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Target size={18} className="text-cyan" />
        <h1 className="text-base font-bold text-[var(--text-primary)]">Call Quality Analysis</h1>
      </div>

      {callsWithMos.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-12 text-center mb-6">
          <AlertCircle size={32} className="text-[var(--text-dim)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">No quality metrics available</p>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            This capture does not contain RTP streams with quality data.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <QualityLevel label="Excellent (MOS ≥ 4.0)" count={excellent} color="#00ffa3" total={callsWithMos.length} />
            <QualityLevel label="Good (MOS 3.5-4.0)" count={good} color="#ff8c42" total={callsWithMos.length} />
            <QualityLevel label="Poor (MOS < 3.5)" count={poor} color="#ff4d6d" total={callsWithMos.length} />
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <AggregateMetric 
              label="Average MOS" 
              value={avgMos} 
              unit="" 
              color={avgMos !== null ? (avgMos >= 4.0 ? '#00ffa3' : avgMos >= 3.5 ? '#ff8c42' : '#ff4d6d') : '#5a7a9a'}
              threshold="Target: ≥ 4.0"
            />
            <AggregateMetric 
              label="Average Jitter" 
              value={avgJitter} 
              unit="ms" 
              color={avgJitter !== null ? (avgJitter < 10 ? '#00ffa3' : avgJitter < 30 ? '#ff8c42' : '#ff4d6d') : '#5a7a9a'}
              threshold="Target: < 10ms"
            />
            <AggregateMetric 
              label="Average Latency" 
              value={avgLatency} 
              unit="ms" 
              color={avgLatency !== null ? (avgLatency < 100 ? '#00ffa3' : avgLatency < 200 ? '#ff8c42' : '#ff4d6d') : '#5a7a9a'}
              threshold="Target: < 100ms"
            />
            <AggregateMetric 
              label="Average Packet Loss" 
              value={avgLoss} 
              unit="%" 
              color={avgLoss !== null ? (avgLoss < 1 ? '#00ffa3' : avgLoss < 5 ? '#ff8c42' : '#ff4d6d') : '#5a7a9a'}
              threshold="Target: < 1%"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
              <TrendingUp size={14} className="text-cyan" />
              <span className="text-xs font-semibold uppercase tracking-wider">MOS Score Distribution</span>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mosDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="label" 
                    stroke="var(--text-muted)" 
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card2)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {mosDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider">Quality Thresholds Reference</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Metric</th>
                    <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Excellent</th>
                    <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Good</th>
                    <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Poor</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: 'MOS Score', excellent: '≥ 4.0', good: '3.5 – 4.0', poor: '< 3.5' },
                    { metric: 'Jitter', excellent: '< 10 ms', good: '10 – 30 ms', poor: '> 30 ms' },
                    { metric: 'Packet Loss', excellent: '< 1%', good: '1 – 5%', poor: '> 5%' },
                    { metric: 'Latency', excellent: '< 100 ms', good: '100 – 200 ms', poor: '> 200 ms' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-5 py-3 font-mono text-[var(--text-primary)]">{row.metric}</td>
                      <td className="px-5 py-3 font-mono text-green">{row.excellent}</td>
                      <td className="px-5 py-3 font-mono text-orange">{row.good}</td>
                      <td className="px-5 py-3 font-mono text-voip-red">{row.poor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="mb-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">
          Per-Call Quality Summary
          <span className="ml-2 text-[var(--text-muted)] font-normal font-mono">({analysis.calls.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analysis.calls.map((call) => (
          <CallQualityCard key={call.call_id} call={call} />
        ))}
      </div>
    </div>
  );
}
