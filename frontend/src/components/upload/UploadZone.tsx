import { useRef, useState, useCallback } from 'react';
import { Upload, FileSearch, AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { uploadCapture, fetchDemo } from '../../api/nova';
import { useCaptureStore } from '../../store/captureStore';
import { DEMO_CAPTURE } from '../../data/demoCapture';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

interface UploadZoneProps {
  collapsed?: boolean;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

export default function UploadZone({ collapsed = false, triggerRef }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { setAnalysis, setLoading, setError } = useCaptureStore();

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  if (triggerRef) {
    triggerRef.current = openFilePicker;
  }

  const handleFile = async (file: File) => {
    setState('uploading');
    setLoading(true);
    try {
      const result = await uploadCapture(file);
      setAnalysis(result);
      setState('success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Upload failed';
      setErrorMsg(msg);
      setError(msg);
      setState('error');
    }
  };

  const handleDemo = async () => {
    setState('uploading');
    setLoading(true);
    try {
      // Try API first, fall back to built-in demo data
      try {
        const result = await fetchDemo();
        setAnalysis(result);
      } catch {
        setAnalysis(DEMO_CAPTURE);
      }
      setState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo failed';
      setErrorMsg(msg);
      setState('error');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
    else setState('idle');
  };

  if (collapsed && state === 'success') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-green/5 border border-green/20 rounded-xl mb-4">
        <CheckCircle2 size={14} className="text-green shrink-0" />
        <span className="text-xs text-green font-medium">Capture loaded — dashboard updated</span>
        <button
          onClick={() => { setState('idle'); openFilePicker(); }}
          className="ml-auto text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          Upload another
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setState('dragging'); }}
      onDragLeave={() => setState('idle')}
      onDrop={onDrop}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
        state === 'dragging'
          ? 'border-cyan bg-cyan/5 scale-[1.01]'
          : state === 'error'
          ? 'border-voip-red/40 bg-voip-red/5'
          : state === 'success'
          ? 'border-green/40 bg-green/5'
          : 'border-[var(--border-bright)] bg-[var(--bg-card)]'
      }`}
    >
      {/* Scan line animation */}
      {(state === 'idle' || state === 'dragging') && (
        <div className="animate-scanline absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan to-transparent opacity-30 pointer-events-none" />
      )}

      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        {state === 'uploading' ? (
          <>
            <Loader2 size={36} className="text-cyan animate-spin mb-4" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Analysing your capture…</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Extracting SIP messages and RTP streams</p>
          </>
        ) : state === 'error' ? (
          <>
            <AlertCircle size={36} className="text-voip-red mb-4" />
            <p className="text-sm font-semibold text-voip-red">Analysis failed</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">{errorMsg}</p>
            <button
              onClick={() => setState('idle')}
              className="mt-4 px-4 py-2 rounded-lg text-xs bg-voip-red/10 text-voip-red border border-voip-red/20 hover:bg-voip-red/20 transition-all"
            >
              Try again
            </button>
          </>
        ) : state === 'success' ? (
          <>
            <CheckCircle2 size={36} className="text-green mb-4" />
            <p className="text-sm font-semibold text-green">Capture analysed successfully</p>
            <button
              onClick={openFilePicker}
              className="mt-4 px-4 py-2 rounded-lg text-xs bg-green/10 text-green border border-green/20 hover:bg-green/20 transition-all"
            >
              Upload another
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mb-5">
              {state === 'dragging' ? (
                <FileSearch size={28} className="text-cyan" />
              ) : (
                <Upload size={28} className="text-cyan" />
              )}
            </div>

            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {state === 'dragging' ? 'Drop to analyse' : 'Upload capture file'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-5 max-w-xs">
              Drag & drop a Wireshark capture or SIP log. NOVA will extract all calls, media streams, and quality metrics instantly.
            </p>

            {/* Format chips */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-5">
              {['.pcap', '.pcapng', '.ncap', '.cap', '.txt', '.log'].map((fmt) => (
                <span
                  key={fmt}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-card2)] border border-[var(--border)] text-[var(--text-muted)]"
                >
                  {fmt}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={openFilePicker}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan text-deep hover:bg-cyan/90 transition-all shadow-lg shadow-cyan/20"
              >
                Browse files
              </button>
              <button
                onClick={handleDemo}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-card2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] transition-all"
              >
                <Zap size={13} />
                Try demo
              </button>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pcap,.pcapng,.ncap,.cap,.txt,.log"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
