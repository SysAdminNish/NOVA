export interface SipMessage {
  timestamp: number;
  method: string;
  direction: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  call_id: string;
  from_uri: string;
  to_uri: string;
  cseq: string | null;
  sdp_offer: string | null;
  raw_first_line: string;
}

export interface RtpStream {
  ssrc: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  payload_type: number;
  codec: string;
  packet_count: number;
  duration_sec: number;
  avg_jitter_ms: number;
  max_jitter_ms: number;
  min_jitter_ms: number;
  packet_loss_pct: number;
  mos_score: number;
  jitter_series: number[];
}

export interface CallRecord {
  call_id: string;
  from_uri: string;
  to_uri: string;
  start_time: number;
  end_time: number | null;
  duration_sec: number;
  status: string;
  codec: string;
  mos_score: number | null;
  avg_jitter_ms: number | null;
  avg_latency_ms: number | null;
  packet_loss_pct: number | null;
  messages: SipMessage[];
  rtp_streams: RtpStream[];
}

export interface SipError {
  code: number;
  reason: string;
  call_id: string;
  timestamp: number;
  count: number;
}

export interface CaptureStats {
  filename: string;
  total_packets: number;
  sip_packets: number;
  rtp_packets: number;
  rtcp_packets: number;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  capture_duration_sec: number;
  avg_mos: number | null;
  total_errors: number;
}

export interface CaptureAnalysis {
  stats: CaptureStats;
  calls: CallRecord[];
  errors: SipError[];
}
