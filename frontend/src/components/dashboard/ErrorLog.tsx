import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SipError } from '../../types';
import { useCaptureStore } from '../../store/captureStore';

const CODE_LABELS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  408: 'Timeout',
  480: 'Unavailable',
  481: 'No Transaction',
  486: 'Busy Here',
  487: 'Terminated',
  500: 'Server Error',
  503: 'Unavailable',
  600: 'Busy Everywhere',
  603: 'Decline',
};

function codeColor(code: number): string {
  if (code >= 600) return 'text-purple';
  if (code >= 500) return 'text-orange';
  if (code >= 400) return 'text-voip-red';
  return 'text-[var(--text-muted)]';
}

export default function ErrorLog({ errors }: { errors: SipError[] }) {
  const navigate = useNavigate();
  const { analysis, selectCall } = useCaptureStore();

  const handleErrorClick = (err: SipError) => {
    const call = analysis?.calls.find((c) => c.call_id === err.call_id);
    if (call) {
      selectCall(call);
      navigate(`/ladder/${encodeURIComponent(call.call_id)}`);
    }
  };

  if (!errors.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
        <span className="text-green text-sm font-medium">No SIP errors detected</span>
        <span className="text-xs mt-1">All calls completed without 4xx/5xx/6xx responses</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errors.map((err, i) => {
        const hasCall = !!analysis?.calls.find((c) => c.call_id === err.call_id);
        return (
          <div
            key={i}
            onClick={() => handleErrorClick(err)}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg bg-voip-red/5 border border-voip-red/10 transition-colors ${
              hasCall ? 'cursor-pointer hover:border-voip-red/40 hover:bg-voip-red/10' : ''
            }`}
          >
            <AlertTriangle size={13} className="text-voip-red shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono text-sm font-bold ${codeColor(err.code)}`}>{err.code}</span>
                <span className="text-xs text-[var(--text-primary)]">{err.reason || CODE_LABELS[err.code] || 'Error'}</span>
                {err.count > 1 && (
                  <span className="text-[9px] font-mono bg-voip-red/15 text-voip-red px-1.5 py-0.5 rounded-full">
                    ×{err.count}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 truncate" title={err.call_id}>
                {err.call_id}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-[var(--text-dim)]">
                t+{err.timestamp.toFixed(2)}s
              </span>
              {hasCall && (
                <ExternalLink size={11} className="text-[var(--text-dim)] hover:text-cyan transition-colors" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
