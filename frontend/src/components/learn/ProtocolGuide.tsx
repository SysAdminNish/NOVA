import { useState, useEffect, useRef } from 'react';
import { BookOpen, Network, Radio, Target, Zap, Shield, Wrench } from 'lucide-react';

interface GuideEntry {
  title: string;
  color: string;
  body: string;
  tip?: string;
  code?: string;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  entries: GuideEntry[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'sip',
    title: 'SIP Protocol Deep Dive',
    icon: Network,
    color: '#00c8ff',
    entries: [
      {
        title: 'SIP Architecture & Components',
        color: '#00c8ff',
        body: 'SIP uses a client-server architecture with several key components: User Agent Client (UAC) initiates requests, User Agent Server (UAS) receives requests, Proxy Server routes requests between UAs, Registrar accepts REGISTER requests and updates location database, Redirect Server returns 3xx responses with alternate URIs. The SIP Trapezoid shows the typical topology: UAC → Proxy → Proxy → UAS.',
        tip: 'A single device can act as both UAC and UAS simultaneously. The role is per-transaction, not per-device.',
      },
      {
        title: 'SIP Methods Explained',
        color: '#00c8ff',
        body: 'INVITE: Initiates a session. ACK: Confirms final response to INVITE. BYE: Terminates a session. CANCEL: Cancels a pending request. REGISTER: Registers contact information. OPTIONS: Queries capabilities. INFO: Sends mid-session information. REFER: Asks recipient to issue a request (call transfer). SUBSCRIBE: Requests notification of events. NOTIFY: Notifies of events. UPDATE: Modifies session without changing dialog state. PRACK: Provisional response acknowledgment.',
        tip: 'INVITE, ACK, and BYE form the core of a basic call. All other methods are optional extensions.',
      },
      {
        title: 'SIP Headers Reference',
        color: '#00c8ff',
        body: 'Via: Path taken by request, added by each proxy. From: Initiator of request (includes tag for dialog). To: Recipient (tag added in response). Call-ID: Unique identifier for call/dialog. CSeq: Command sequence (number + method). Contact: Direct URI for future requests. Max-Forwards: Hop limit (decremented by proxies). Route/Record-Route: Proxy routing. Content-Type/Content-Length: Message body info. User-Agent/Server: Software identification.',
        code: 'INVITE sip:bob@example.com SIP/2.0\nVia: SIP/2.0/UDP pc.example.com:5060\nFrom: Alice <sip:alice@example.com>;tag=1928301774\nTo: Bob <sip:bob@example.com>\nCall-ID: a84b4c76e66710@pc.example.com\nCSeq: 314159 INVITE',
      },
      {
        title: 'SIP Response Codes Complete Reference',
        color: '#00c8ff',
        body: '1xx Provisional: 100 Trying, 180 Ringing, 181 Call Forwarded, 183 Session Progress. 2xx Success: 200 OK. 3xx Redirection: 300 Multiple Choices, 301 Moved Permanently, 302 Moved Temporarily. 4xx Client Error: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 407 Proxy Auth Required, 408 Request Timeout, 486 Busy Here, 487 Request Terminated. 5xx Server Error: 500 Internal Error, 503 Service Unavailable. 6xx Global Failure: 600 Busy Everywhere, 603 Decline, 604 Does Not Exist.',
        tip: 'Only 2xx responses establish a dialog. 1xx are informational, 3xx-6xx indicate failure or redirection.',
      },
      {
        title: 'SDP (Session Description Protocol)',
        color: '#00c8ff',
        body: 'SDP is carried in SIP message bodies to negotiate media sessions. Key fields: v= (version), o= (origin/session ID), s= (session name), c= (connection info with IP), t= (timing), m= (media description: type, port, protocol, format), a= (attributes: rtpmap, ptime, sendrecv/sendonly/recvonly). SDP offer/answer model: caller sends offer in INVITE, callee sends answer in 200 OK.',
        code: 'v=0\no=alice 2890844526 2890844526 IN IP4 pc.example.com\ns=Session\nc=IN IP4 192.168.1.100\nt=0 0\nm=audio 49170 RTP/AVP 0 8\na=rtpmap:0 PCMU/8000\na=rtpmap:8 PCMA/8000',
      },
      {
        title: 'SIP Call Flow: Basic Call',
        color: '#00c8ff',
        body: 'Standard call flow: (1) UAC sends INVITE with SDP offer → (2) UAS responds 100 Trying (optional) → (3) UAS sends 180 Ringing → (4) UAS sends 200 OK with SDP answer → (5) UAC sends ACK → (6) RTP media flows bidirectionally → (7) Either party sends BYE → (8) Other party responds 200 OK. The INVITE/200/ACK is a three-way handshake. ACK is never challenged (no auth).',
        tip: 'ACK for 2xx responses is a separate transaction. ACK for error responses is part of INVITE transaction.',
      },
      {
        title: 'SIP Call Flow: Authentication',
        color: '#00c8ff',
        body: 'Digest authentication flow: (1) UAC sends INVITE → (2) UAS/Proxy responds 401 Unauthorized or 407 Proxy Auth Required with WWW-Authenticate/Proxy-Authenticate header containing realm and nonce → (3) UAC resends INVITE with Authorization/Proxy-Authorization header containing MD5 hash of credentials + nonce → (4) Server validates and proceeds with call. Nonce prevents replay attacks.',
        tip: 'REGISTER requests typically require authentication. INVITE may or may not, depending on policy.',
      },
      {
        title: 'SIP Call Flow: Call Transfer',
        color: '#00c8ff',
        body: 'Attended transfer (consultation): A calls B, B calls C, B sends REFER to A with Refer-To: C, A sends INVITE to C, B hangs up. Unattended transfer (blind): A calls B, B sends REFER to A with Refer-To: C without calling C first, A sends INVITE to C, B hangs up. REFER creates a NOTIFY subscription to report transfer progress.',
        tip: 'Refer-To header contains the URI of the transfer target. Also-header can include additional context.',
      },
      {
        title: 'SIP Call Flow: Early Media',
        color: '#00c8ff',
        body: 'Early media allows audio before call answer (e.g., announcements, ringback tones). Flow: INVITE → 183 Session Progress with SDP → Early RTP media flows → 200 OK with final SDP → ACK → Established media. Early media is one-way (sendonly/recvonly) or two-way. Gateway may play announcements during early media phase.',
        tip: '183 Session Progress is provisional (1xx) but includes SDP, unlike 180 Ringing which typically has no SDP.',
      },
      {
        title: 'SIP Dialogs and Transactions',
        color: '#00c8ff',
        body: 'Transaction: Single request + all responses (provisional + final). Dialog: Peer-to-peer relationship established by INVITE, identified by Call-ID + From tag + To tag. A dialog can contain multiple transactions (INVITE, re-INVITE, BYE). Session: Media flow associated with a dialog. Dialog state is maintained by both endpoints.',
        tip: 'Call-ID alone does not identify a dialog. You need Call-ID + both tags. Multiple dialogs can share a Call-ID.',
      },
    ],
  },
  {
    id: 'rtp',
    title: 'RTP/RTCP Protocol',
    icon: Radio,
    color: '#00ffa3',
    entries: [
      {
        title: 'RTP Packet Structure',
        color: '#00ffa3',
        body: 'RTP header (12 bytes minimum): Version (2 bits, always 2), Padding (1 bit), Extension (1 bit), CSRC count (4 bits), Marker (1 bit), Payload Type (7 bits), Sequence Number (16 bits), Timestamp (32 bits), SSRC (32 bits), CSRC list (0-15 items, 32 bits each). Payload follows header. Sequence numbers detect loss, timestamps enable jitter calculation and playback timing.',
        tip: 'Sequence numbers wrap at 65535. Timestamp units depend on codec (e.g., 8000 Hz for G.711 = 160 per 20ms).',
      },
      {
        title: 'RTP Payload Types',
        color: '#00ffa3',
        body: 'Static payload types (0-95): 0=PCMU/G.711μ, 3=GSM, 4=G.723, 8=PCMA/G.711a, 9=G.722, 18=G.729. Dynamic payload types (96-127): Negotiated via SDP rtpmap attribute. PT 13=Comfort Noise, PT 101=telephone-event (DTMF). The PT field in RTP header identifies codec without SDP lookup.',
        code: 'a=rtpmap:0 PCMU/8000\na=rtpmap:101 telephone-event/8000\na=fmtp:101 0-15',
      },
      {
        title: 'SSRC and CSRC',
        color: '#00ffa3',
        body: 'SSRC (Synchronization Source): 32-bit identifier for RTP stream source, randomly chosen at stream start. Each participant has unique SSRC. CSRC (Contributing Source): List of SSRCs that contributed to mixed stream (e.g., conference bridge). CSRC count in header indicates list length. SSRC collision detection: if duplicate detected, participant must choose new SSRC.',
        tip: 'SSRC changes if stream restarts or codec changes. Use SSRC to correlate RTP packets into streams.',
      },
      {
        title: 'Jitter Calculation (RFC 3550)',
        color: '#00ffa3',
        body: 'Jitter measures packet arrival time variation. RFC 3550 algorithm: D = (arrival_time - expected_time) where expected is based on timestamp. J = J + (|D| - J) / 16. This is an exponentially weighted moving average. Units are timestamp units (e.g., 1/8000 sec for G.711). Convert to milliseconds: jitter_ms = (J / sample_rate) * 1000. Low jitter (<10ms) = smooth delivery.',
        code: 'Si = RTP timestamp from packet i\nRi = arrival time of packet i\nD(i,j) = (Rj - Ri) - (Sj - Si)\nJ(i) = J(i-1) + (|D(i-1,i)| - J(i-1))/16',
      },
      {
        title: 'RTCP Packet Types',
        color: '#00ffa3',
        body: 'SR (Sender Report, PT=200): Sent by active senders, includes packet/byte counts, NTP/RTP timestamps for sync, plus reception report blocks. RR (Receiver Report, PT=201): Sent by receivers, contains reception report blocks only. SDES (Source Description, PT=202): CNAME, NAME, EMAIL, etc. BYE (PT=203): Indicates participant leaving. APP (PT=204): Application-specific data. XR (Extended Reports, PT=207): VoIP metrics.',
        tip: 'RTCP uses next odd port after RTP (e.g., RTP=16384, RTCP=16385). Bandwidth limited to 5% of session.',
      },
      {
        title: 'RTCP Reception Report Blocks',
        color: '#00ffa3',
        body: 'Each RR block contains: SSRC of source, Fraction lost (8 bits), Cumulative packets lost (24 bits), Highest sequence number received, Interarrival jitter, Last SR timestamp (LSR), Delay since last SR (DLSR). Round-trip time = current_time - LSR - DLSR. These metrics enable quality monitoring and MOS calculation.',
        tip: 'NOVA uses RTCP data for precise latency calculation. Without RTCP, latency is estimated or unavailable.',
      },
      {
        title: 'RTP Port Allocation',
        color: '#00ffa3',
        body: 'RTP uses even UDP ports, RTCP uses next odd port. Common ranges: 16384-32767 (Cisco), 10000-20000 (Asterisk), 49152-65535 (dynamic/ephemeral). SDP m= line specifies RTP port, RTCP port is implicit (+1). Symmetric RTP: send and receive on same port (helps with NAT). Firewalls must allow bidirectional UDP on RTP port range.',
        tip: 'Each call uses 2 ports per direction (RTP+RTCP), so 4 ports total for bidirectional audio.',
      },
      {
        title: 'Jitter Buffer Operation',
        color: '#00ffa3',
        body: 'Jitter buffer absorbs timing variations by buffering packets before playback. Adaptive buffers adjust size based on network conditions. Trade-off: larger buffer = more latency but fewer dropouts, smaller buffer = lower latency but more dropouts. Typical size: 20-100ms. Buffer underrun = late/lost packet, causes audio gap. Buffer overrun = packet too early, discarded.',
        tip: 'Jitter buffer is at receiver. Sender cannot control it. High jitter requires larger buffer and more latency.',
      },
    ],
  },
  {
    id: 'quality',
    title: 'Quality Metrics & MOS',
    icon: Target,
    color: '#ff8c42',
    entries: [
      {
        title: 'E-Model (ITU-T G.107) Explained',
        color: '#ff8c42',
        body: 'E-Model calculates R-Factor (0-100) representing voice quality. R = R0 - Is - Id - Ie + A. R0 = base quality (~94), Is = simultaneous impairment (noise), Id = delay impairment, Ie = equipment impairment (codec, packet loss), A = advantage factor (mobile=5-10). MOS = 1 + 0.035*R + R*(R-60)*(100-R)*7e-6 for R>0. MOS scale: 1=bad, 2=poor, 3=fair, 4=good, 5=excellent.',
        tip: 'NOVA uses simplified E-Model focusing on jitter, loss, and latency. Full E-Model includes 20+ parameters.',
      },
      {
        title: 'MOS Calculation from Network Metrics',
        color: '#ff8c42',
        body: 'Simplified approach: Start with codec base MOS (G.711=4.4, G.729=3.9). Subtract loss penalty: 0-1% loss = -0.1, 1-3% = -0.5, >3% = -1.0. Subtract jitter penalty: <10ms = 0, 10-30ms = -0.2, >30ms = -0.5. Subtract latency penalty: <150ms = 0, 150-300ms = -0.3, >300ms = -0.7. Final MOS = max(1.0, base - penalties). This gives approximate conversational quality.',
        tip: 'Packet loss has biggest impact on MOS. 5% loss can drop MOS by 1.0-1.5 points.',
      },
      {
        title: 'Quality Impairment Factors',
        color: '#ff8c42',
        body: 'Codec distortion: Compression artifacts (G.729 > G.711). Packet loss: Missing audio samples, clicks/pops. Jitter: Timing variations, choppy audio. Latency: Delay causes talk-over, echo. Echo: Acoustic or line echo (requires cancellation >50ms delay). Noise: Background noise, quantization noise. Clipping: Overdriven input, AGC issues. These combine non-linearly.',
        tip: 'Multiple small impairments compound. A call with moderate loss + jitter + latency feels worse than sum of parts.',
      },
      {
        title: 'Packet Loss Concealment (PLC)',
        color: '#ff8c42',
        body: 'PLC algorithms hide lost packets by synthesizing replacement audio. Techniques: Silence insertion (worst), Noise insertion (CNG), Waveform substitution (repeat last packet), Interpolation (blend adjacent packets), Model-based (predict from history). G.711 Appendix I defines PLC. Opus has built-in PLC. Effective up to 5-10% loss for short bursts.',
        tip: 'PLC works for isolated losses. Burst losses (consecutive packets) are harder to conceal and degrade quality severely.',
      },
      {
        title: 'Latency Components Breakdown',
        color: '#ff8c42',
        body: 'Total latency = Capture + Encoding + Packetization + Network + Jitter Buffer + Decoding + Playback. Capture: ADC, ~1ms. Encoding: Codec processing, 0.1-25ms (G.711=0.1, G.729=25). Packetization: Frame assembly, 10-30ms. Network: Propagation + routing, 1-200ms. Jitter buffer: 20-100ms. Decoding: 0.1-25ms. Playback: DAC, ~1ms. ITU-T G.114: <150ms excellent, 150-400ms acceptable, >400ms unacceptable.',
        tip: 'One-way latency >150ms causes noticeable delay. >400ms makes conversation difficult. Satellite links add ~500ms.',
      },
      {
        title: 'Echo and Echo Cancellation',
        color: '#ff8c42',
        body: 'Acoustic echo: Speaker output picked up by microphone. Line echo: Impedance mismatch in analog circuits. Echo becomes annoying when delay >50ms. Echo cancellation (AEC): Adaptive filter subtracts predicted echo from mic signal. Requires training period. Non-linear processing (NLP) suppresses residual echo. G.168 defines echo canceller requirements. VoIP endpoints should have AEC.',
        tip: 'Echo is worse with high latency. Headsets eliminate acoustic echo. Line echo mostly affects PSTN gateways.',
      },
    ],
  },

  {
    id: 'codecs',
    title: 'Codecs Encyclopedia',
    icon: Zap,
    color: '#9b5de5',
    entries: [
      {
        title: 'Audio Codec Comparison',
        color: '#9b5de5',
        body: 'G.711 (PCMU/PCMA): 64 kbps, no compression, excellent quality, very low latency, high bandwidth. G.729: 8 kbps, CS-ACELP compression, good quality, high CPU, low bandwidth, patent issues. G.722: 64 kbps, wideband (50-7000 Hz), excellent HD quality. Opus: 6-510 kbps adaptive, fullband, excellent quality, low latency, royalty-free, best for WebRTC. GSM: 13 kbps, fair quality, medium CPU.',
        tip: 'For LAN: use G.711 or G.722. For WAN: use G.729 or Opus. For WebRTC: use Opus.',
      },
      {
        title: 'Wideband vs Narrowband vs Fullband',
        color: '#9b5de5',
        body: 'Narrowband: 8 kHz sampling, 300-3400 Hz frequency range, traditional phone quality (G.711, G.729). Wideband: 16 kHz sampling, 50-7000 Hz range, HD voice quality (G.722). Super-wideband: 32 kHz, 50-14000 Hz (AMR-WB). Fullband: 48 kHz, 20-20000 Hz, studio quality (Opus). Human hearing: 20-20000 Hz. Wider bandwidth = more natural, intelligible speech.',
        tip: 'Wideband codecs significantly improve clarity for consonants (s, f, th) which are in 4-8 kHz range.',
      },
      {
        title: 'Codec Negotiation Process',
        color: '#9b5de5',
        body: 'Codec negotiation via SDP offer/answer: (1) Caller lists supported codecs in INVITE SDP (m=audio line, multiple payload types). (2) Callee selects one codec and returns it in 200 OK SDP. (3) Both endpoints use selected codec for RTP. Preference order matters: first codec in list is preferred. Codec parameters (ptime, annexb) also negotiated via a=fmtp.',
        code: 'Offer: m=audio 49170 RTP/AVP 0 8 18\nAnswer: m=audio 38120 RTP/AVP 0\n(Selected PCMU)',
      },
      {
        title: 'Transcoding and Media Gateways',
        color: '#9b5de5',
        body: 'Transcoding converts between codecs when endpoints do not share common codec. Media gateway/B2BUA performs transcoding. Impacts: Adds latency (encoding + decoding delay), Consumes CPU resources, May degrade quality (lossy-to-lossy transcoding), Increases jitter. Avoid transcoding when possible by ensuring endpoint codec compatibility. G.711 is universal fallback.',
        tip: 'G.711↔G.729 transcoding is common. Each transcode step degrades quality. Direct codec match is always best.',
      },
      {
        title: 'Voice Activity Detection (VAD) and DTX',
        color: '#9b5de5',
        body: 'VAD detects speech vs silence. During silence, Discontinuous Transmission (DTX) stops sending RTP packets, saving bandwidth. Comfort Noise Generation (CNG) plays low-level noise at receiver to avoid dead air. G.729 Annex B defines VAD/DTX. SDP: a=fmtp:18 annexb=yes. Bandwidth savings: 30-50% for typical conversation. Trade-off: slight delay when speech resumes.',
        tip: 'VAD can cause clipping of first syllable after silence. Disable for music-on-hold or continuous audio.',
      },
      {
        title: 'DTMF Transmission Methods',
        color: '#9b5de5',
        body: 'In-band: DTMF tones in audio stream, works with any codec but unreliable with compression. Out-of-band RFC 2833/4733: telephone-event RTP payload (PT 101), sends DTMF as RTP events, reliable, codec-independent. SIP INFO: DTMF in SIP INFO message body, less common. RTP events are preferred method. SDP: a=rtpmap:101 telephone-event/8000, a=fmtp:101 0-15.',
        code: 'a=rtpmap:101 telephone-event/8000\na=fmtp:101 0-15\n(0-15 = DTMF digits 0-9, *, #, A-D)',
      },
    ],
  },
  {
    id: 'network',
    title: 'Network & Transport',
    icon: Shield,
    color: '#5a7a9a',
    entries: [
      {
        title: 'UDP vs TCP for VoIP',
        color: '#5a7a9a',
        body: 'RTP uses UDP: No connection setup, no retransmission, low latency, tolerates packet loss. TCP would cause: Retransmission delays (unacceptable for real-time), Head-of-line blocking, Higher latency. SIP can use UDP, TCP, or TLS. UDP for SIP: Simple, low overhead, but unreliable (use for small messages). TCP for SIP: Reliable, required for large messages (>MTU), NAT-friendly. TLS for SIP: Encrypted signaling.',
        tip: 'RTP must use UDP. SIP should use TCP for reliability or TLS for security. Never use TCP for RTP.',
      },
      {
        title: 'NAT Types and Traversal',
        color: '#5a7a9a',
        body: 'NAT types: Full Cone (allows any inbound after outbound), Restricted Cone (allows from contacted IP), Port Restricted (allows from contacted IP:port), Symmetric (different mapping per destination). Symmetric NAT hardest for VoIP. Traversal methods: STUN (discovers public IP:port), TURN (relay server for symmetric NAT), ICE (combines STUN/TURN with connectivity checks). SIP ALG in routers often breaks VoIP.',
        tip: 'Disable SIP ALG in router. Use STUN for simple NAT, TURN for symmetric NAT. ICE is best for WebRTC.',
      },
      {
        title: 'Port Ranges and Firewall Configuration',
        color: '#5a7a9a',
        body: 'SIP: UDP/TCP 5060 (unencrypted), 5061 (TLS). RTP: UDP 16384-32767 (Cisco), 10000-20000 (Asterisk), 49152-65535 (ephemeral). RTCP: RTP port + 1. Firewall rules: Allow outbound SIP to provider, allow inbound SIP from provider, allow bidirectional RTP/RTCP on port range. Each call uses 4 ports (RTP+RTCP bidirectional). 100 concurrent calls = 400 ports.',
        tip: 'Narrow RTP port range for security but ensure enough ports for concurrent calls. 1000-port range supports ~250 calls.',
      },
      {
        title: 'QoS and DSCP Markings',
        color: '#5a7a9a',
        body: 'Quality of Service (QoS) prioritizes VoIP traffic over data. DSCP (Differentiated Services Code Point) marks IP packets for priority. Recommended markings: SIP signaling = CS3 (DSCP 24) or AF31 (DSCP 26), RTP media = EF (DSCP 46). Routers/switches honor DSCP by queuing high-priority packets first. Configure QoS on all network devices in path. Without QoS, VoIP competes with data traffic.',
        tip: 'QoS is critical on congested links. Mark packets at source (phone/gateway). Verify routers honor markings.',
      },
      {
        title: 'Network Requirements for VoIP',
        color: '#5a7a9a',
        body: 'Bandwidth: 100 kbps per G.711 call (with overhead), 40 kbps per G.729 call. Latency: <150ms one-way (excellent), <400ms (acceptable). Jitter: <30ms. Packet loss: <1% (excellent), <5% (acceptable). Bandwidth calculation: (codec bitrate + IP/UDP/RTP overhead) * concurrent calls. G.711: 64k + 40k overhead = 104 kbps. Add 20% safety margin.',
        tip: 'Test with ping (latency), iperf (bandwidth), and VoIP quality test tools. Wired connections better than Wi-Fi.',
      },
      {
        title: 'Common Network Issues',
        color: '#5a7a9a',
        body: 'One-way audio: Firewall blocking RTP, NAT issues, asymmetric routing. Choppy audio: Jitter, packet loss, insufficient bandwidth, Wi-Fi interference. Robotic voice: Packet loss, codec issues. Echo: Acoustic feedback, line echo, no echo cancellation. Call drops: SIP session timer, NAT timeout, network instability. Registration failures: Firewall, credentials, DNS issues.',
        tip: 'Capture packets with tcpdump/Wireshark to diagnose. Check RTP flow in both directions. Verify NAT/firewall rules.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting & Best Practices',
    icon: Wrench,
    color: '#ff4d6d',
    entries: [
      {
        title: 'Diagnosing One-Way Audio',
        color: '#ff4d6d',
        body: 'Symptoms: One party cannot hear the other. Causes: (1) Firewall blocking RTP in one direction, (2) NAT not allowing inbound RTP, (3) Incorrect SDP IP address (private IP sent instead of public), (4) Asymmetric routing. Diagnosis: Capture packets, verify RTP flows bidirectionally, check SDP c= line for correct IP, verify firewall rules. Solution: Fix NAT/firewall, use STUN/TURN, enable symmetric RTP.',
        tip: 'If SIP works but RTP fails, it\'s almost always firewall/NAT. Check RTP port range is open bidirectionally.',
      },
      {
        title: 'Diagnosing Audio Quality Issues',
        color: '#ff4d6d',
        body: 'Choppy/robotic audio: Check packet loss (RTCP reports, Wireshark), jitter (>30ms?), bandwidth congestion. Garbled audio: Codec mismatch, transcoding issues, wrong payload type. Delayed audio: High latency (>150ms), check network delay, jitter buffer size. Echo: Enable echo cancellation, check for acoustic feedback, reduce volume. Dropouts: Packet loss bursts, Wi-Fi interference, buffer underruns.',
        tip: 'Use Wireshark RTP analysis: Telephony → RTP → Stream Analysis shows loss, jitter, and sequence errors.',
      },
      {
        title: 'SIP Registration Troubleshooting',
        color: '#ff4d6d',
        body: 'REGISTER fails: (1) 401/407 Unauthorized = wrong credentials, check username/password. (2) 403 Forbidden = account disabled, IP blocked. (3) 408 Timeout = network issue, firewall blocking. (4) 503 Service Unavailable = server down. (5) No response = DNS failure, wrong server address. Check: DNS resolution, network connectivity, credentials, firewall allows SIP port.',
        tip: 'Registration must refresh before expiry (Expires header). Typical: 3600s. Re-register at 50-90% of expiry.',
      },
      {
        title: 'Call Setup Failures',
        color: '#ff4d6d',
        body: '404 Not Found: Invalid number, user not registered. 486 Busy Here: Callee busy. 487 Request Terminated: CANCEL received (caller hung up). 408 Timeout: No response from callee (offline, network issue). 503 Service Unavailable: Server overload, trunk down. 603 Decline: Callee rejected call. Check: Number format, registration status, trunk capacity, network path.',
        tip: 'Enable SIP debug logging on server/gateway. Trace Call-ID through logs to see full call flow.',
      },
      {
        title: 'Reading SIP Ladder Diagrams',
        color: '#ff4d6d',
        body: 'Ladder diagram shows message flow between endpoints over time. Vertical axis = time (top to bottom), horizontal = entities (UAC, proxies, UAS). Arrows = messages (request or response). Read top-to-bottom to follow call sequence. Look for: (1) Request/response pairs, (2) Timing gaps (delays), (3) Retransmissions (duplicate messages), (4) Error responses. NOVA generates interactive ladders.',
        tip: 'Retransmissions indicate network issues (packet loss, high latency). Multiple 100 Trying is normal.',
      },
      {
        title: 'Packet Capture Best Practices',
        color: '#ff4d6d',
        body: 'Capture location: As close to problem as possible (on phone, gateway, or mirror port). Filters: Capture only relevant traffic (port 5060 for SIP, RTP port range). Duration: Capture during problem occurrence, include before/after context. Tools: tcpdump, Wireshark, sngrep (SIP-specific). Command: tcpdump -i eth0 -w capture.pcap -s0 port 5060 or portrange 10000-20000. Analyze with NOVA or Wireshark.',
        code: 'tcpdump -i eth0 -w voip.pcap -s0 \'port 5060 or (udp and portrange 10000-20000)\'',
      },
      {
        title: 'VoIP Security Best Practices',
        color: '#ff4d6d',
        body: 'Use TLS for SIP signaling (port 5061), SRTP for media encryption. Require authentication for REGISTER and INVITE. Implement fail2ban to block brute-force attacks. Use strong passwords (20+ chars). Restrict SIP access by IP (whitelist providers). Disable unnecessary SIP methods. Monitor for toll fraud (unusual destinations, high call volume). Use SBC (Session Border Controller) at network edge.',
        tip: 'Toll fraud is common. Monitor CDRs for suspicious patterns. Block international calls if not needed.',
      },
      {
        title: 'Performance Optimization',
        color: '#ff4d6d',
        body: 'Reduce latency: Use wired connections, optimize routing, minimize hops, use CDN/edge servers. Reduce jitter: Enable QoS, avoid Wi-Fi, use dedicated VoIP VLAN. Reduce packet loss: Fix network congestion, increase bandwidth, enable QoS. Codec selection: G.711 for quality, G.729 for bandwidth savings, Opus for WebRTC. Jitter buffer: Adaptive buffer balances latency and loss concealment.',
        tip: 'Dedicated VoIP VLAN with QoS is best practice for enterprise. Separate VoIP from data traffic.',
      },
    ],
  },
];

function GuideItem({ entry }: { entry: GuideEntry }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
        {entry.title}
      </h3>
      <div className="pl-4 border-l-2" style={{ borderColor: `${entry.color}33` }}>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">{entry.body}</p>
        {entry.code && (
          <pre className="mb-3 px-3 py-2 rounded-md bg-[var(--bg-card2)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-primary)] overflow-x-auto">
            {entry.code}
          </pre>
        )}
        {entry.tip && (
          <div
            className="px-3 py-2 rounded-r-md text-xs text-[var(--text-muted)]"
            style={{
              borderLeft: `2px solid ${entry.color}`,
              background: `${entry.color}0d`,
            }}
          >
            {entry.tip}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideSection({ section }: { section: GuideSection }) {
  const Icon = section.icon;

  return (
    <section id={section.id} className="mb-12 scroll-mt-6">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2" style={{ borderColor: `${section.color}33` }}>
        <span style={{ color: section.color }}>
          <Icon size={20} />
        </span>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {section.title}
        </h2>
      </div>
      <div className="space-y-6">
        {section.entries.map((e) => <GuideItem key={e.title} entry={e} />)}
      </div>
    </section>
  );
}

function TableOfContents({ sections, activeSection }: { sections: GuideSection[]; activeSection: string }) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-6 w-56 shrink-0">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Contents</h3>
        <ul className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan/10 text-cyan border-l-2 border-cyan'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  <span style={{ color: isActive ? '#00c8ff' : section.color }}>
                    <Icon size={12} />
                  </span>
                  <span className="text-xs font-medium">{section.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

interface ProtocolGuideProps {
  standalone?: boolean;
}

export default function ProtocolGuide({ standalone }: ProtocolGuideProps) {
  const [activeSection, setActiveSection] = useState('sip');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66% 0px',
        threshold: 0,
      }
    );

    GUIDE_SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (standalone) {
    return (
      <div className="px-6 py-5 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={18} className="text-cyan" />
          <h1 className="text-base font-bold text-[var(--text-primary)]">VoIP Protocol Guide</h1>
        </div>
        <div className="mb-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
            Comprehensive guide to VoIP protocols, quality metrics, codecs, networking, and troubleshooting.
            This mini-encyclopedia covers everything from SIP/RTP fundamentals to advanced diagnostics.
          </p>
          <p className="text-[10px] text-[var(--text-dim)]">
            Use the table of contents to navigate between sections. All content is fully expanded for easy reading.
          </p>
        </div>
        <div className="flex gap-6">
          <TableOfContents sections={GUIDE_SECTIONS} activeSection={activeSection} />
          <div className="flex-1 min-w-0">
            {GUIDE_SECTIONS.map((section) => (
              <GuideSection key={section.id} section={section} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
