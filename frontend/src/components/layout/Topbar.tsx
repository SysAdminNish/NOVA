import { Upload, RefreshCw } from 'lucide-react';
import { useCaptureStore } from '../../store/captureStore';

export default function Topbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const { analysis, reset } = useCaptureStore();

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-panel)]/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--text-muted)] font-mono">
          {analysis
            ? `${analysis.stats.total_calls} calls · ${analysis.stats.sip_packets} SIP · ${analysis.stats.rtp_packets.toLocaleString()} RTP`
            : 'No capture loaded — upload a file or try demo'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {analysis && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
          >
            <RefreshCw size={12} />
            New capture
          </button>
        )}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 transition-all font-medium"
        >
          <Upload size={12} />
          Upload
        </button>
      </div>
    </header>
  );
}
