import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { RtpStream } from '../../types';

function qualityLabel(value: number): string {
  if (value < 10) return 'Excellent';
  if (value < 25) return 'Good';
  if (value < 50) return 'Warning';
  return 'Poor';
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div className="bg-[var(--bg-card2)] border border-[var(--border-bright)] rounded-lg px-3 py-2 text-xs">
      <p className="font-mono text-cyan font-bold">{v.toFixed(2)} ms</p>
      <p className="text-[var(--text-muted)]">{qualityLabel(v)}</p>
    </div>
  );
}

export default function JitterChart({ stream }: { stream: RtpStream }) {
  const data = stream.jitter_series.map((j, i) => ({ t: i, jitter: j }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-xs">
        No jitter data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="jitterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00c8ff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.05)" />
        <XAxis
          dataKey="t"
          tick={{ fontSize: 8, fill: '#2a4a6a', fontFamily: 'Space Mono, monospace' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'sample', position: 'insideBottomRight', fontSize: 8, fill: '#2a4a6a', offset: -4 }}
        />
        <YAxis
          tick={{ fontSize: 8, fill: '#2a4a6a', fontFamily: 'Space Mono, monospace' }}
          tickLine={false}
          axisLine={false}
          unit=" ms"
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={25}
          stroke="rgba(255,140,66,0.4)"
          strokeDasharray="4 4"
          label={{ value: '25ms', fontSize: 8, fill: '#ff8c42', position: 'right' }}
        />
        <Area
          type="monotone"
          dataKey="jitter"
          stroke="#00c8ff"
          strokeWidth={1.5}
          fill="url(#jitterGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#00c8ff', stroke: 'var(--bg-card)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
