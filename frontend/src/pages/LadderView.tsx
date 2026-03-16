import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch } from 'lucide-react';
import { useCaptureStore } from '../store/captureStore';
import SipLadder from '../components/ladder/SipLadder';
import EventTimeline from '../components/ladder/EventTimeline';
import QualityMetrics from '../components/rtp/QualityMetrics';

export default function LadderView() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { analysis, selectedCall, selectCall } = useCaptureStore();

  const call =
    selectedCall ??
    analysis?.calls.find((c) => c.call_id === decodeURIComponent(callId ?? '')) ??
    null;

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-muted)]">
        <GitBranch size={36} />
        <p className="text-sm">No call selected. Go back to Dashboard and click a call row.</p>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-cyan border border-cyan/20 px-4 py-2 rounded-lg hover:bg-cyan/10 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-sm font-bold text-[var(--text-primary)] font-mono">{call.call_id}</h1>
          <p className="text-xs text-[var(--text-muted)]">
            {call.from_uri} → {call.to_uri} · {call.duration_sec.toFixed(1)}s
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`text-[9px] font-mono font-bold px-2 py-1 rounded-full ${
              call.status.startsWith('200')
                ? 'bg-green/15 text-green'
                : 'bg-voip-red/15 text-voip-red'
            }`}
          >
            {call.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Full-width ladder */}
        <div className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="flex items-center px-5 py-3 border-b border-[var(--border)]">
            <GitBranch size={13} className="text-[var(--text-muted)] mr-2" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">SIP Ladder Diagram</span>
            <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)]">
              {call.messages.length} messages
            </span>
          </div>
          <div className="p-5 overflow-x-auto">
            <SipLadder
              messages={call.messages}
              rtp_streams={call.rtp_streams}
              call={call}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="flex items-center px-5 py-3 border-b border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">Event Timeline</span>
            </div>
            <div className="p-4">
              <EventTimeline messages={call.messages} />
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="flex items-center px-5 py-3 border-b border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">Quality Metrics</span>
            </div>
            <div className="p-4">
              <QualityMetrics call={call} />
            </div>
          </div>

          {/* Call details */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="flex items-center px-5 py-3 border-b border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">Call Details</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                ['Codec', call.codec === 'unknown' ? '—' : call.codec],
                ['Duration', `${call.duration_sec.toFixed(2)}s`],
                ['RTP Streams', String(call.rtp_streams.length)],
                ['SIP Messages', String(call.messages.length)],
                ['Start', `+${call.start_time.toFixed(3)}s`],
                ['End', call.end_time !== null ? `+${call.end_time.toFixed(3)}s` : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-[var(--text-muted)] text-[9px] uppercase tracking-wider block">{k}</span>
                  <span className="text-[var(--text-primary)]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Other calls */}
      {analysis && analysis.calls.length > 1 && (
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-3 font-semibold">Other calls in capture</p>
          <div className="flex flex-wrap gap-2">
            {analysis.calls
              .filter((c) => c.call_id !== call.call_id)
              .map((c) => (
                <button
                  key={c.call_id}
                  onClick={() => { selectCall(c); navigate(`/ladder/${encodeURIComponent(c.call_id)}`); }}
                  className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-cyan hover:border-cyan/30 transition-all truncate max-w-[200px]"
                  title={c.call_id}
                >
                  {c.call_id.slice(0, 20)}{c.call_id.length > 20 ? '…' : ''}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
