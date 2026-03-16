import { AlertTriangle } from 'lucide-react';
import type { SipError } from '../../types';

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
      {errors.map((err, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-3 rounded-lg bg-voip-red/5 border border-voip-red/10 hover:border-voip-red/20 transition-colors"
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
          <span className="text-[10px] font-mono text-[var(--text-dim)] shrink-0">
            t+{err.timestamp.toFixed(2)}s
          </span>
        </div>
      ))}
    </div>
  );
}
