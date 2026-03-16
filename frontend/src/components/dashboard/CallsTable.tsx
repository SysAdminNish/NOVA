import { useNavigate } from 'react-router-dom';
import type { CallRecord } from '../../types';
import { useCaptureStore } from '../../store/captureStore';

function StatusPill({ status }: { status: string }) {
  const code = parseInt(status);
  let cls = 'bg-[var(--text-dim)]/20 text-[var(--text-muted)]';
  if (code >= 200 && code < 300) cls = 'bg-green/15 text-green';
  else if (code >= 400 && code < 500) cls = 'bg-voip-red/15 text-voip-red';
  else if (code >= 500) cls = 'bg-orange/15 text-orange';
  else if (isNaN(code) && status.toLowerCase().includes('progress')) cls = 'bg-cyan/15 text-cyan';
  return (
    <span className={`inline-block rounded-full font-mono text-[9px] font-bold px-2 py-0.5 ${cls}`}>
      {status}
    </span>
  );
}

function MosCell({ mos }: { mos: number | null }) {
  if (mos === null) return <span className="text-[var(--text-muted)] font-mono text-xs">N/A</span>;
  const cls = mos >= 4.0 ? 'text-green' : mos >= 3.5 ? 'text-orange' : 'text-voip-red';
  return <span className={`font-mono text-xs font-semibold ${cls}`}>{mos.toFixed(2)}</span>;
}

export default function CallsTable({ calls }: { calls: CallRecord[] }) {
  const navigate = useNavigate();
  const selectCall = useCaptureStore((s) => s.selectCall);

  if (!calls.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
        <p className="text-sm">No VoIP traffic found in this capture.</p>
        <p className="text-xs mt-1">Make sure the file contains SIP packets on port 5060.</p>
      </div>
    );
  }

  const handleRow = (call: CallRecord) => {
    selectCall(call);
    navigate(`/ladder/${encodeURIComponent(call.call_id)}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['Call-ID', 'From', 'To', 'Codec', 'Duration', 'MOS', 'Jitter', 'Loss', 'Status'].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr
              key={call.call_id}
              onClick={() => handleRow(call)}
              className="border-b border-[var(--border)] hover:bg-cyan/5 cursor-pointer transition-colors group"
            >
              <td className="px-3 py-2.5 font-mono text-[var(--text-muted)] max-w-[120px]">
                <span
                  className="block truncate group-hover:text-cyan transition-colors"
                  title={call.call_id}
                >
                  {call.call_id.slice(0, 16)}{call.call_id.length > 16 ? '…' : ''}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-[var(--text-primary)] max-w-[140px]">
                <span className="block truncate" title={call.from_uri}>
                  {call.from_uri.replace('sip:', '')}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-[var(--text-primary)] max-w-[140px]">
                <span className="block truncate" title={call.to_uri}>
                  {call.to_uri.replace('sip:', '')}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-cyan text-[10px]">
                {call.codec === 'unknown' ? <span className="text-[var(--text-dim)]">—</span> : call.codec}
              </td>
              <td className="px-3 py-2.5 font-mono text-[var(--text-muted)]">
                {call.duration_sec > 0 ? `${call.duration_sec.toFixed(1)}s` : '—'}
              </td>
              <td className="px-3 py-2.5"><MosCell mos={call.mos_score} /></td>
              <td className="px-3 py-2.5 font-mono text-[var(--text-muted)]">
                {call.avg_jitter_ms !== null ? `${call.avg_jitter_ms.toFixed(1)} ms` : 'N/A'}
              </td>
              <td className="px-3 py-2.5 font-mono text-[var(--text-muted)]">
                {call.packet_loss_pct !== null ? `${call.packet_loss_pct.toFixed(1)}%` : 'N/A'}
              </td>
              <td className="px-3 py-2.5">
                <StatusPill status={call.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
