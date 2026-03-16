import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

interface GuideEntry {
  title: string;
  color: string;
  body: string;
  tip?: string;
}

const ENTRIES: GuideEntry[] = [
  {
    title: 'What is SIP?',
    color: '#00c8ff',
    body: 'Session Initiation Protocol (SIP) is a text-based signalling protocol used to set up, manage, and terminate real-time communication sessions such as voice calls, video calls, and messaging. SIP messages look similar to HTTP and use methods like INVITE, ACK, and BYE.',
    tip: 'SIP only controls the call setup — the actual audio travels over RTP, a separate protocol.',
  },
  {
    title: 'What is RTP?',
    color: '#00ffa3',
    body: 'Real-time Transport Protocol (RTP) carries the actual audio and video data during a call. It runs over UDP and includes sequence numbers and timestamps so the receiver can detect packet loss and reorder packets if needed.',
    tip: 'RTP does not guarantee delivery — it prioritises low latency over reliability.',
  },
  {
    title: 'What is RTCP?',
    color: '#9b5de5',
    body: 'RTP Control Protocol (RTCP) is a companion to RTP that carries quality statistics: packet loss, jitter, and round-trip time. It runs alongside RTP on the next odd port (e.g. RTP on 16384, RTCP on 16385). NOVA uses RTCP data to calculate precise latency.',
  },
  {
    title: 'UAC vs UAS',
    color: '#ff8c42',
    body: 'User Agent Client (UAC) is the entity that initiates a SIP request — typically the caller. User Agent Server (UAS) is the entity that receives the request — typically the callee. In a SIP diagram, the UAC is on the left and the UAS on the right.',
    tip: 'Both sides are actually full user agents — the UAC/UAS roles can reverse within the same call (e.g. BYE can come from either side).',
  },
  {
    title: 'SIP Response Code Classes',
    color: '#00c8ff',
    body: '1xx = Provisional (100 Trying, 180 Ringing). 2xx = Success (200 OK). 3xx = Redirection. 4xx = Client Error (404 Not Found, 486 Busy Here). 5xx = Server Error (503 Service Unavailable). 6xx = Global Failure (600 Busy Everywhere, 603 Decline).',
    tip: 'Only 2xx responses confirm a successful transaction. 1xx responses are informational only.',
  },
  {
    title: 'What is MOS?',
    color: '#00ffa3',
    body: 'Mean Opinion Score (MOS) rates perceived voice quality on a scale from 1.0 (unacceptable) to 4.5 (excellent). NOVA calculates MOS using the E-Model (ITU-T G.107), factoring in jitter, packet loss, and latency. A score above 4.0 is considered excellent; below 3.5 indicates noticeable degradation.',
  },
  {
    title: 'What is Jitter?',
    color: '#ff8c42',
    body: 'Jitter is the variation in arrival time of packets. If packets are sent every 20ms but arrive at 15ms, 25ms, and 18ms intervals, the jitter is high. High jitter causes choppy audio. RTP receivers typically use a jitter buffer to smooth this out, but very high jitter (>50ms) still degrades quality.',
    tip: 'NOVA calculates jitter per RFC 3550 using the formula: J += (|D| - J) / 16.',
  },
  {
    title: 'G.711 vs G.729',
    color: '#9b5de5',
    body: 'G.711 (PCMU/PCMA) uses 64 kbps and provides excellent audio quality — it is the standard for PSTN calls. G.729 uses only 8 kbps through compression, making it popular for low-bandwidth links, but it introduces slightly more processing delay and is sensitive to packet loss.',
    tip: 'G.722 wideband codec at 64 kbps offers better quality than G.711 because it covers a wider frequency range (50–7000 Hz vs 300–3400 Hz).',
  },
  {
    title: 'What is a pcap file?',
    color: '#5a7a9a',
    body: 'A pcap (Packet Capture) file is a recording of raw network traffic captured by tools like Wireshark, tcpdump, or sngrep. It stores every packet with a precise timestamp. NOVA reads pcap and pcapng files using tshark (the command-line version of Wireshark) to extract SIP and RTP packets.',
    tip: 'You can capture SIP traffic with: tcpdump -w capture.pcap port 5060',
  },
  {
    title: 'SIP Call Flow (INVITE Dialog)',
    color: '#00c8ff',
    body: 'A standard SIP call follows: INVITE → 100 Trying → 180 Ringing → 200 OK → ACK → [RTP audio] → BYE → 200 OK. The INVITE establishes the session with SDP offer/answer for media negotiation. ACK confirms the 200 OK. BYE terminates the session.',
    tip: 'Early media (audio before answer) uses the 183 Session Progress response with SDP.',
  },
];

function GuideItem({ entry }: { entry: GuideEntry; compact?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border border-[var(--border)] rounded-lg overflow-hidden transition-colors ${
        open ? 'border-opacity-40' : 'hover:border-[var(--border-bright)]'
      }`}
      style={open ? { borderColor: `${entry.color}33` } : {}}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left group"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-xs font-semibold text-[var(--text-primary)] flex-1 group-hover:text-white transition-colors">
          {entry.title}
        </span>
        {open
          ? <ChevronDown size={12} className="text-[var(--text-muted)] shrink-0" />
          : <ChevronRight size={12} className="text-[var(--text-muted)] shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{entry.body}</p>
          {entry.tip && (
            <div
              className="mt-3 px-3 py-2 rounded-r-md text-xs text-[var(--text-muted)]"
              style={{
                borderLeft: `2px solid ${entry.color}`,
                background: `${entry.color}0d`,
              }}
            >
              {entry.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ProtocolGuideProps {
  compact?: boolean;
  standalone?: boolean;
}

export default function ProtocolGuide({ compact, standalone }: ProtocolGuideProps) {
  const entries = compact ? ENTRIES.slice(0, 5) : ENTRIES;

  if (standalone) {
    return (
      <div className="px-6 py-5 max-w-[900px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={18} className="text-cyan" />
          <h1 className="text-base font-bold text-[var(--text-primary)]">Protocol Guide</h1>
        </div>
        <div className="space-y-2">
          {ENTRIES.map((e) => <GuideItem key={e.title} entry={e} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => <GuideItem key={e.title} entry={e} compact={compact} />)}
      {compact && (
        <p className="text-[9px] text-[var(--text-dim)] text-center pt-1">
          Full guide available in the sidebar → Protocol Guide
        </p>
      )}
    </div>
  );
}
