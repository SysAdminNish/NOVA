import { Speaker, Info, Zap, TrendingUp } from 'lucide-react';
import { useCaptureStore } from '../store/captureStore';
import CodecBars from '../components/rtp/CodecBars';

interface CodecSpec {
  name: string;
  bitrate: string;
  sampleRate: string;
  frameSize: string;
  compression: string;
  complexity: string;
  quality: string;
  latency: string;
  useCase: string;
  color: string;
}

const CODEC_SPECS: CodecSpec[] = [
  {
    name: 'G.711u (PCMU)',
    bitrate: '64 kbps',
    sampleRate: '8 kHz',
    frameSize: '10-30 ms',
    compression: 'None (μ-law)',
    complexity: 'Very Low',
    quality: 'Excellent',
    latency: 'Very Low (~0.125ms)',
    useCase: 'PSTN, high-quality calls, North America/Japan standard',
    color: '#00c8ff',
  },
  {
    name: 'G.711a (PCMA)',
    bitrate: '64 kbps',
    sampleRate: '8 kHz',
    frameSize: '10-30 ms',
    compression: 'None (A-law)',
    complexity: 'Very Low',
    quality: 'Excellent',
    latency: 'Very Low (~0.125ms)',
    useCase: 'PSTN, high-quality calls, Europe/rest of world standard',
    color: '#9b5de5',
  },
  {
    name: 'G.729',
    bitrate: '8 kbps',
    sampleRate: '8 kHz',
    frameSize: '10 ms',
    compression: 'CS-ACELP',
    complexity: 'High',
    quality: 'Good',
    latency: 'Medium (~25ms)',
    useCase: 'Low-bandwidth links, mobile networks, satellite',
    color: '#ff8c42',
  },
  {
    name: 'G.722',
    bitrate: '64 kbps',
    sampleRate: '16 kHz',
    frameSize: '20 ms',
    compression: 'SB-ADPCM',
    complexity: 'Low',
    quality: 'Excellent (Wideband)',
    latency: 'Low (~4ms)',
    useCase: 'HD voice, conference calls, premium quality',
    color: '#00ffa3',
  },
  {
    name: 'Opus',
    bitrate: '6-510 kbps (adaptive)',
    sampleRate: '8-48 kHz',
    frameSize: '2.5-60 ms',
    compression: 'Hybrid SILK+CELT',
    complexity: 'Medium-High',
    quality: 'Excellent (Fullband)',
    latency: 'Very Low (~5-66ms)',
    useCase: 'WebRTC, modern VoIP, variable network conditions',
    color: '#00ffa3',
  },
  {
    name: 'GSM',
    bitrate: '13 kbps',
    sampleRate: '8 kHz',
    frameSize: '20 ms',
    compression: 'RPE-LTP',
    complexity: 'Medium',
    quality: 'Fair',
    latency: 'Medium (~20ms)',
    useCase: 'Mobile networks, legacy systems',
    color: '#5a7a9a',
  },
];

function CodecSpecCard({ spec }: { spec: CodecSpec }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-bright)] transition-colors">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: spec.color }} />
        <span className="font-mono text-sm font-bold" style={{ color: spec.color }}>{spec.name}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Bitrate', value: spec.bitrate },
            { label: 'Sample Rate', value: spec.sampleRate },
            { label: 'Frame Size', value: spec.frameSize },
            { label: 'Compression', value: spec.compression },
            { label: 'Complexity', value: spec.complexity },
            { label: 'Quality', value: spec.quality },
            { label: 'Latency', value: spec.latency },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[var(--bg-card2)] rounded-lg px-3 py-2">
              <div className="text-[9px] uppercase tracking-wider text-[var(--text-dim)] mb-0.5">{label}</div>
              <div className="font-mono text-[var(--text-primary)] font-semibold">{value}</div>
            </div>
          ))}
        </div>
        <div className="bg-[var(--bg-card2)] rounded-lg px-3 py-2">
          <div className="text-[9px] uppercase tracking-wider text-[var(--text-dim)] mb-1">Use Case</div>
          <div className="text-xs text-[var(--text-muted)] leading-relaxed">{spec.useCase}</div>
        </div>
      </div>
    </div>
  );
}

function CodecComparison() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <TrendingUp size={14} className="text-cyan" />
        <span className="text-xs font-semibold uppercase tracking-wider">Codec Comparison Matrix</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Codec</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Bandwidth</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Quality</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">CPU Usage</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Best For</th>
            </tr>
          </thead>
          <tbody>
            {[
              { codec: 'G.711u/a', bandwidth: 'High (64k)', quality: 'Excellent', cpu: 'Very Low', bestFor: 'PSTN, LAN' },
              { codec: 'G.722', bandwidth: 'High (64k)', quality: 'Excellent (HD)', cpu: 'Low', bestFor: 'HD Voice, Conferencing' },
              { codec: 'G.729', bandwidth: 'Low (8k)', quality: 'Good', cpu: 'High', bestFor: 'WAN, Satellite' },
              { codec: 'Opus', bandwidth: 'Adaptive (6-510k)', quality: 'Excellent', cpu: 'Medium', bestFor: 'WebRTC, Modern VoIP' },
              { codec: 'GSM', bandwidth: 'Low (13k)', quality: 'Fair', cpu: 'Medium', bestFor: 'Mobile, Legacy' },
            ].map((row, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card2)] transition-colors">
                <td className="px-5 py-3 font-mono text-cyan font-semibold">{row.codec}</td>
                <td className="px-5 py-3 font-mono text-[var(--text-primary)]">{row.bandwidth}</td>
                <td className="px-5 py-3 font-mono text-green">{row.quality}</td>
                <td className="px-5 py-3 font-mono text-orange">{row.cpu}</td>
                <td className="px-5 py-3 text-[var(--text-muted)]">{row.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BandwidthCalculator() {
  const calculations = [
    { codec: 'G.711', packetSize: 20, pps: 50, bandwidth: '87.2 kbps', overhead: '26%' },
    { codec: 'G.729', packetSize: 20, pps: 50, bandwidth: '31.2 kbps', overhead: '74%' },
    { codec: 'G.722', packetSize: 20, pps: 50, bandwidth: '87.2 kbps', overhead: '26%' },
    { codec: 'Opus (20k)', packetSize: 20, pps: 50, bandwidth: '43.2 kbps', overhead: '54%' },
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Zap size={14} className="text-cyan" />
        <span className="text-xs font-semibold uppercase tracking-wider">Bandwidth Requirements (with IP/UDP/RTP overhead)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Codec</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Packet Size</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Packets/sec</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Total Bandwidth</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Overhead</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                <td className="px-5 py-3 font-mono text-cyan font-semibold">{row.codec}</td>
                <td className="px-5 py-3 font-mono text-[var(--text-primary)]">{row.packetSize} ms</td>
                <td className="px-5 py-3 font-mono text-[var(--text-primary)]">{row.pps}</td>
                <td className="px-5 py-3 font-mono text-green font-bold">{row.bandwidth}</td>
                <td className="px-5 py-3 font-mono text-orange">{row.overhead}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 bg-[var(--bg-card2)] border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">
          <Info size={10} className="inline mr-1" />
          Overhead includes IP (20 bytes), UDP (8 bytes), and RTP (12 bytes) headers = 40 bytes per packet.
          Actual bandwidth may vary based on packetization interval and network conditions.
        </p>
      </div>
    </div>
  );
}

function CodecEducation() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Info size={14} className="text-cyan" />
        <span className="text-xs font-semibold uppercase tracking-wider">Codec Selection Guide</span>
      </div>
      <div className="p-5 space-y-4">
        {[
          {
            title: 'Narrowband vs Wideband vs Fullband',
            content: 'Narrowband (8 kHz) covers 300-3400 Hz (traditional phone quality). Wideband (16 kHz) covers 50-7000 Hz (HD voice). Fullband (48 kHz) covers 20-20000 Hz (studio quality). G.711/G.729 are narrowband, G.722 is wideband, Opus supports fullband.',
            color: '#00c8ff',
          },
          {
            title: 'Codec Negotiation',
            content: 'Codecs are negotiated during SIP call setup via SDP (Session Description Protocol). The caller offers a list of supported codecs in the INVITE, and the callee selects one in the 200 OK response. Both endpoints must support the chosen codec.',
            color: '#00ffa3',
          },
          {
            title: 'Transcoding Considerations',
            content: 'When endpoints use different codecs, a media gateway must transcode (convert) between them. Transcoding adds latency, CPU load, and may degrade quality. Direct codec matching is always preferred.',
            color: '#ff8c42',
          },
          {
            title: 'Packet Loss Resilience',
            content: 'G.711 handles packet loss well due to no compression. G.729 is more sensitive to loss. Opus includes built-in FEC (Forward Error Correction) and PLC (Packet Loss Concealment) for excellent resilience.',
            color: '#9b5de5',
          },
          {
            title: 'Voice Activity Detection (VAD)',
            content: 'VAD detects silence periods and stops transmitting packets, saving bandwidth. G.729 includes VAD. During silence, Comfort Noise Generation (CNG) may be used to avoid dead air.',
            color: '#5a7a9a',
          },
        ].map((item, i) => (
          <div key={i} className="border-l-2 pl-4 py-1" style={{ borderColor: item.color }}>
            <h3 className="text-xs font-bold text-[var(--text-primary)] mb-1" style={{ color: item.color }}>
              {item.title}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CodecInfo() {
  const { analysis } = useCaptureStore();

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)] p-8">
        <Speaker size={36} />
        <p className="text-sm">No capture loaded</p>
        <p className="text-xs">Upload a pcap file from the Dashboard to analyse codec information.</p>
      </div>
    );
  }

  const streamsWithCall = analysis.calls.flatMap((c) =>
    c.rtp_streams.map((s) => ({ stream: s, callId: c.call_id }))
  );

  return (
    <div className="px-6 py-5 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Speaker size={18} className="text-cyan" />
        <h1 className="text-base font-bold text-[var(--text-primary)]">Codec Information</h1>
      </div>

      {streamsWithCall.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Codec Distribution in Current Capture
              <span className="ml-2 text-[var(--text-muted)] font-normal font-mono">({streamsWithCall.length} streams)</span>
            </span>
          </div>
          <div className="p-4">
            <CodecBars streams={streamsWithCall.map((s) => s.stream)} />
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Codec Specifications</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {CODEC_SPECS.map((spec) => (
            <CodecSpecCard key={spec.name} spec={spec} />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <CodecComparison />
        <BandwidthCalculator />
        <CodecEducation />
      </div>
    </div>
  );
}
