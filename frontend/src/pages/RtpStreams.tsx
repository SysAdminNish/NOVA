import { Radio } from 'lucide-react';
import { useCaptureStore } from '../store/captureStore';
import JitterChart from '../components/rtp/JitterChart';
import CodecBars from '../components/rtp/CodecBars';
import type { RtpStream } from '../types';

function MosBadge({ mos }: { mos: number }) {
  const color = mos >= 4.0 ? 'text-green' : mos >= 3.5 ? 'text-orange' : 'text-voip-red';
  const bg = mos >= 4.0 ? 'bg-green/10' : mos >= 3.5 ? 'bg-orange/10' : 'bg-voip-red/10';
  return (
    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${color} ${bg}`}>
      MOS {mos.toFixed(2)}
    </span>
  );
}

function StreamCard({ stream, callId }: { stream: RtpStream; callId: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-bright)] transition-colors">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <Radio size={12} className="text-cyan shrink-0" />
        <span className="font-mono text-[10px] text-[var(--text-muted)] truncate flex-1" title={stream.ssrc}>
          SSRC {stream.ssrc}
        </span>
        <MosBadge mos={stream.mos_score} />
      </div>
      <div className="p-4 space-y-4">
        {/* Stream route */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
          <span className="text-cyan">{stream.src_ip}:{stream.src_port}</span>
          <span>→</span>
          <span className="text-cyan">{stream.dst_ip}:{stream.dst_port}</span>
        </div>

        {/* Codec + stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Codec', value: stream.codec, color: 'text-cyan' },
            { label: 'Packets', value: stream.packet_count.toLocaleString(), color: 'text-[var(--text-primary)]' },
            { label: 'Duration', value: `${stream.duration_sec.toFixed(1)}s`, color: 'text-[var(--text-primary)]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[var(--bg-card2)] rounded-lg px-2 py-2">
              <div className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{label}</div>
              <div className={`font-mono text-xs font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Mini quality stats */}
        <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
          <div>
            <div className="text-[8px] text-[var(--text-dim)] mb-0.5">Jitter avg</div>
            <div className="font-mono text-orange">{stream.avg_jitter_ms.toFixed(1)} ms</div>
          </div>
          <div>
            <div className="text-[8px] text-[var(--text-dim)] mb-0.5">Loss</div>
            <div className={`font-mono ${stream.packet_loss_pct > 1 ? 'text-voip-red' : 'text-green'}`}>
              {stream.packet_loss_pct.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-[8px] text-[var(--text-dim)] mb-0.5">PT</div>
            <div className="font-mono text-[var(--text-muted)]">{stream.payload_type}</div>
          </div>
        </div>

        {/* Jitter chart */}
        {stream.jitter_series.length > 0 && (
          <div>
            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-semibold">Jitter Timeline</p>
            <JitterChart stream={stream} />
          </div>
        )}

        <p className="text-[8px] text-[var(--text-dim)] font-mono truncate" title={callId}>
          call: {callId}
        </p>
      </div>
    </div>
  );
}

export default function RtpStreams() {
  const { analysis } = useCaptureStore();

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)] p-8">
        <Radio size={36} />
        <p className="text-sm">No capture loaded</p>
        <p className="text-xs">Upload a pcap file from the Dashboard to analyse RTP streams.</p>
      </div>
    );
  }

  const streamsWithCall = analysis.calls.flatMap((c) =>
    c.rtp_streams.map((s) => ({ stream: s, callId: c.call_id }))
  );

  if (!streamsWithCall.length) {
    return (
      <div className="px-6 py-5 max-w-[1400px] mx-auto">
        <h1 className="text-sm font-bold text-[var(--text-primary)] mb-4">RTP Streams</h1>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-12 text-center">
          <Radio size={32} className="text-[var(--text-dim)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">No RTP streams found in this capture.</p>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            This may be a SIP-only log file or the RTP streams use non-standard ports.
          </p>
        </div>
        <div className="mt-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Codec Distribution</span>
          </div>
          <div className="p-4">
            <CodecBars streams={[]} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-sm font-bold text-[var(--text-primary)]">
          RTP Streams
          <span className="ml-2 text-[var(--text-muted)] font-normal font-mono">({streamsWithCall.length})</span>
        </h1>
      </div>

      {/* Aggregate codec view */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <span className="text-xs font-semibold uppercase tracking-wider">Codec Distribution</span>
        </div>
        <div className="p-4">
          <CodecBars streams={streamsWithCall.map((s) => s.stream)} />
        </div>
      </div>

      {/* Stream grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {streamsWithCall.map(({ stream, callId }, i) => (
          <StreamCard key={`${stream.ssrc}-${i}`} stream={stream} callId={callId} />
        ))}
      </div>
    </div>
  );
}
