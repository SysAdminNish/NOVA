import type { CaptureAnalysis } from '../types';

function jitterSeries(count: number, base: number, spread: number): number[] {
  const series: number[] = [];
  let val = base;
  // Deterministic pseudo-random for consistent demo display
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < count; i++) {
    val += (rand() - 0.45) * spread;
    val = Math.max(1, Math.min(base + spread, val));
    series.push(Math.round(val * 100) / 100);
  }
  return series;
}

function makeMessages(
  callId: string,
  fromUri: string,
  toUri: string,
  src: string,
  dst: string,
) {
  return [
    {
      timestamp: 0.0,
      method: 'INVITE',
      direction: `${src}:5060 → ${dst}:5060`,
      src_ip: src, dst_ip: dst, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 INVITE', sdp_offer: null,
      raw_first_line: `INVITE ${toUri} SIP/2.0`,
    },
    {
      timestamp: 0.05,
      method: '100',
      direction: `${dst}:5060 → ${src}:5060`,
      src_ip: dst, dst_ip: src, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 INVITE', sdp_offer: null,
      raw_first_line: 'SIP/2.0 100 Trying',
    },
    {
      timestamp: 0.32,
      method: '180',
      direction: `${dst}:5060 → ${src}:5060`,
      src_ip: dst, dst_ip: src, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 INVITE', sdp_offer: null,
      raw_first_line: 'SIP/2.0 180 Ringing',
    },
    {
      timestamp: 2.87,
      method: '200',
      direction: `${dst}:5060 → ${src}:5060`,
      src_ip: dst, dst_ip: src, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 INVITE', sdp_offer: null,
      raw_first_line: 'SIP/2.0 200 OK',
    },
    {
      timestamp: 2.93,
      method: 'ACK',
      direction: `${src}:5060 → ${dst}:5060`,
      src_ip: src, dst_ip: dst, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 ACK', sdp_offer: null,
      raw_first_line: `ACK ${toUri} SIP/2.0`,
    },
    {
      timestamp: 35.12,
      method: 'BYE',
      direction: `${src}:5060 → ${dst}:5060`,
      src_ip: src, dst_ip: dst, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '2 BYE', sdp_offer: null,
      raw_first_line: `BYE ${toUri} SIP/2.0`,
    },
    {
      timestamp: 35.18,
      method: '200',
      direction: `${dst}:5060 → ${src}:5060`,
      src_ip: dst, dst_ip: src, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '2 BYE', sdp_offer: null,
      raw_first_line: 'SIP/2.0 200 OK',
    },
  ];
}

function makeFailedMessages(
  callId: string,
  fromUri: string,
  toUri: string,
  src: string,
  dst: string,
  code: number,
  reason: string,
) {
  return [
    {
      timestamp: 0.0,
      method: 'INVITE',
      direction: `${src}:5060 → ${dst}:5060`,
      src_ip: src, dst_ip: dst, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 INVITE', sdp_offer: null,
      raw_first_line: `INVITE ${toUri} SIP/2.0`,
    },
    {
      timestamp: 0.04,
      method: '100',
      direction: `${dst}:5060 → ${src}:5060`,
      src_ip: dst, dst_ip: src, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 INVITE', sdp_offer: null,
      raw_first_line: 'SIP/2.0 100 Trying',
    },
    {
      timestamp: 0.51,
      method: String(code),
      direction: `${dst}:5060 → ${src}:5060`,
      src_ip: dst, dst_ip: src, src_port: 5060, dst_port: 5060,
      call_id: callId, from_uri: fromUri, to_uri: toUri,
      cseq: '1 INVITE', sdp_offer: null,
      raw_first_line: `SIP/2.0 ${code} ${reason}`,
    },
  ];
}

export const DEMO_CAPTURE: CaptureAnalysis = {
  stats: {
    filename: 'nova_demo_capture.pcap',
    total_packets: 12847,
    sip_packets: 47,
    rtp_packets: 12680,
    rtcp_packets: 120,
    total_calls: 7,
    successful_calls: 5,
    failed_calls: 2,
    capture_duration_sec: 183.4,
    avg_mos: 4.12,
    total_errors: 2,
  },
  calls: [
    {
      call_id: 'a3f9b2@192.168.1.10',
      from_uri: 'sip:alice@acme.com',
      to_uri: 'sip:bob@acme.com',
      start_time: 0.0,
      end_time: 35.18,
      duration_sec: 35.18,
      status: '200 OK',
      codec: 'G.711u',
      mos_score: 4.28,
      avg_jitter_ms: 8.4,
      avg_latency_ms: 42.0,
      packet_loss_pct: 0.2,
      messages: makeMessages('a3f9b2@192.168.1.10', 'sip:alice@acme.com', 'sip:bob@acme.com', '192.168.1.10', '192.168.1.20'),
      rtp_streams: [
        {
          ssrc: '0xA1B2C3D4', src_ip: '192.168.1.10', dst_ip: '192.168.1.20',
          src_port: 16384, dst_port: 16385, payload_type: 0, codec: 'G.711u',
          packet_count: 1750, duration_sec: 35.0,
          avg_jitter_ms: 8.4, max_jitter_ms: 15.1, min_jitter_ms: 2.5,
          packet_loss_pct: 0.2, mos_score: 4.28,
          jitter_series: jitterSeries(50, 8, 8),
        },
        {
          ssrc: '0xB2C3D4E5', src_ip: '192.168.1.20', dst_ip: '192.168.1.10',
          src_port: 16385, dst_port: 16384, payload_type: 0, codec: 'G.711u',
          packet_count: 1748, duration_sec: 35.0,
          avg_jitter_ms: 9.1, max_jitter_ms: 16.3, min_jitter_ms: 2.8,
          packet_loss_pct: 0.3, mos_score: 4.21,
          jitter_series: jitterSeries(50, 9, 8),
        },
      ],
    },
    {
      call_id: 'c7e1d5@10.0.0.5',
      from_uri: 'sip:carol@corp.net',
      to_uri: 'sip:dave@corp.net',
      start_time: 5.3,
      end_time: 22.8,
      duration_sec: 17.5,
      status: '200 OK',
      codec: 'G.729',
      mos_score: 3.87,
      avg_jitter_ms: 12.3,
      avg_latency_ms: 55.0,
      packet_loss_pct: 0.8,
      messages: makeMessages('c7e1d5@10.0.0.5', 'sip:carol@corp.net', 'sip:dave@corp.net', '10.0.0.5', '10.0.0.6'),
      rtp_streams: [
        {
          ssrc: '0xC3D4E5F6', src_ip: '10.0.0.5', dst_ip: '10.0.0.6',
          src_port: 20000, dst_port: 20001, payload_type: 18, codec: 'G.729',
          packet_count: 875, duration_sec: 17.5,
          avg_jitter_ms: 12.3, max_jitter_ms: 22.1, min_jitter_ms: 3.9,
          packet_loss_pct: 0.8, mos_score: 3.87,
          jitter_series: jitterSeries(50, 12, 12),
        },
      ],
    },
    {
      call_id: 'f2a8c1@172.16.0.1',
      from_uri: 'sip:eve@voip.local',
      to_uri: 'sip:frank@voip.local',
      start_time: 12.1,
      end_time: 62.1,
      duration_sec: 50.0,
      status: '200 OK',
      codec: 'G.711a',
      mos_score: 4.41,
      avg_jitter_ms: 6.2,
      avg_latency_ms: 38.0,
      packet_loss_pct: 0.1,
      messages: makeMessages('f2a8c1@172.16.0.1', 'sip:eve@voip.local', 'sip:frank@voip.local', '172.16.0.1', '172.16.0.2'),
      rtp_streams: [
        {
          ssrc: '0xE5F6A7B8', src_ip: '172.16.0.1', dst_ip: '172.16.0.2',
          src_port: 18000, dst_port: 18001, payload_type: 8, codec: 'G.711a',
          packet_count: 2500, duration_sec: 50.0,
          avg_jitter_ms: 6.2, max_jitter_ms: 11.4, min_jitter_ms: 1.8,
          packet_loss_pct: 0.1, mos_score: 4.41,
          jitter_series: jitterSeries(50, 6, 6),
        },
      ],
    },
    {
      call_id: 'b9d3e7@192.168.1.30',
      from_uri: 'sip:grace@pbx.local',
      to_uri: 'sip:henry@pbx.local',
      start_time: 20.0,
      end_time: 45.5,
      duration_sec: 25.5,
      status: '200 OK',
      codec: 'G.711u',
      mos_score: 4.15,
      avg_jitter_ms: 9.7,
      avg_latency_ms: 44.0,
      packet_loss_pct: 0.4,
      messages: makeMessages('b9d3e7@192.168.1.30', 'sip:grace@pbx.local', 'sip:henry@pbx.local', '192.168.1.30', '192.168.1.40'),
      rtp_streams: [],
    },
    {
      call_id: 'e4f6a2@10.10.0.1',
      from_uri: 'sip:ivan@sip.example.com',
      to_uri: 'sip:judy@sip.example.com',
      start_time: 40.0,
      end_time: 98.7,
      duration_sec: 58.7,
      status: '200 OK',
      codec: 'G.722',
      mos_score: 4.35,
      avg_jitter_ms: 7.1,
      avg_latency_ms: 40.0,
      packet_loss_pct: 0.2,
      messages: makeMessages('e4f6a2@10.10.0.1', 'sip:ivan@sip.example.com', 'sip:judy@sip.example.com', '10.10.0.1', '10.10.0.2'),
      rtp_streams: [],
    },
    {
      call_id: 'd1c8b4@192.168.1.50',
      from_uri: 'sip:karl@office.net',
      to_uri: 'sip:lisa@office.net',
      start_time: 75.0,
      end_time: 75.55,
      duration_sec: 0.55,
      status: '486 Busy Here',
      codec: 'unknown',
      mos_score: null,
      avg_jitter_ms: null,
      avg_latency_ms: null,
      packet_loss_pct: null,
      messages: makeFailedMessages('d1c8b4@192.168.1.50', 'sip:karl@office.net', 'sip:lisa@office.net', '192.168.1.50', '192.168.1.60', 486, 'Busy Here'),
      rtp_streams: [],
    },
    {
      call_id: 'a7e2f9@10.0.1.1',
      from_uri: 'sip:mike@voip.org',
      to_uri: 'sip:nancy@voip.org',
      start_time: 120.0,
      end_time: 120.48,
      duration_sec: 0.48,
      status: '503 Service Unavailable',
      codec: 'unknown',
      mos_score: null,
      avg_jitter_ms: null,
      avg_latency_ms: null,
      packet_loss_pct: null,
      messages: makeFailedMessages('a7e2f9@10.0.1.1', 'sip:mike@voip.org', 'sip:nancy@voip.org', '10.0.1.1', '10.0.1.2', 503, 'Service Unavailable'),
      rtp_streams: [],
    },
  ],
  errors: [
    { code: 486, reason: 'Busy Here', call_id: 'd1c8b4@192.168.1.50', timestamp: 75.51, count: 1 },
    { code: 503, reason: 'Service Unavailable', call_id: 'a7e2f9@10.0.1.1', timestamp: 120.48, count: 1 },
  ],
};
