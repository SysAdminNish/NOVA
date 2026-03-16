"""
Hardcoded demo CaptureAnalysis returned by GET /api/demo.
Contains 7 calls (5 successful, 2 failed) with realistic RTP jitter data.
"""
import random
import math

random.seed(42)


def _jitter_series(count: int = 50, base: float = 8.0, spread: float = 12.0) -> list[float]:
    series = []
    val = base
    for _ in range(count):
        val += random.uniform(-spread * 0.3, spread * 0.4)
        val = max(1.0, min(base + spread, val))
        series.append(round(val, 2))
    return series


def _make_rtp(
    ssrc: str,
    src_ip: str,
    dst_ip: str,
    src_port: int,
    dst_port: int,
    pt: int,
    codec: str,
    packets: int,
    duration: float,
    avg_j: float,
    loss: float,
) -> dict:
    from parsers.rtp_analyser import calculate_mos
    jitter_s = _jitter_series(50, avg_j, avg_j * 0.6)
    mos = calculate_mos(avg_j, loss)
    return {
        "ssrc": ssrc,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": src_port,
        "dst_port": dst_port,
        "payload_type": pt,
        "codec": codec,
        "packet_count": packets,
        "duration_sec": duration,
        "avg_jitter_ms": avg_j,
        "max_jitter_ms": round(avg_j * 1.8, 2),
        "min_jitter_ms": round(avg_j * 0.3, 2),
        "packet_loss_pct": loss,
        "mos_score": mos,
        "jitter_series": jitter_s,
    }


def _messages(call_id: str, from_uri: str, to_uri: str, src: str, dst: str) -> list[dict]:
    return [
        {
            "timestamp": 0.0,
            "method": "INVITE",
            "direction": f"{src}:5060 → {dst}:5060",
            "src_ip": src, "dst_ip": dst, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 INVITE", "sdp_offer": None,
            "raw_first_line": f"INVITE {to_uri} SIP/2.0",
        },
        {
            "timestamp": 0.05,
            "method": "100",
            "direction": f"{dst}:5060 → {src}:5060",
            "src_ip": dst, "dst_ip": src, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 INVITE", "sdp_offer": None,
            "raw_first_line": "SIP/2.0 100 Trying",
        },
        {
            "timestamp": 0.32,
            "method": "180",
            "direction": f"{dst}:5060 → {src}:5060",
            "src_ip": dst, "dst_ip": src, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 INVITE", "sdp_offer": None,
            "raw_first_line": "SIP/2.0 180 Ringing",
        },
        {
            "timestamp": 2.87,
            "method": "200",
            "direction": f"{dst}:5060 → {src}:5060",
            "src_ip": dst, "dst_ip": src, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 INVITE", "sdp_offer": None,
            "raw_first_line": "SIP/2.0 200 OK",
        },
        {
            "timestamp": 2.93,
            "method": "ACK",
            "direction": f"{src}:5060 → {dst}:5060",
            "src_ip": src, "dst_ip": dst, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 ACK", "sdp_offer": None,
            "raw_first_line": f"ACK {to_uri} SIP/2.0",
        },
        {
            "timestamp": 35.12,
            "method": "BYE",
            "direction": f"{src}:5060 → {dst}:5060",
            "src_ip": src, "dst_ip": dst, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "2 BYE", "sdp_offer": None,
            "raw_first_line": f"BYE {to_uri} SIP/2.0",
        },
        {
            "timestamp": 35.18,
            "method": "200",
            "direction": f"{dst}:5060 → {src}:5060",
            "src_ip": dst, "dst_ip": src, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "2 BYE", "sdp_offer": None,
            "raw_first_line": "SIP/2.0 200 OK",
        },
    ]


def _failed_messages(call_id: str, from_uri: str, to_uri: str, src: str, dst: str, code: int, reason: str) -> list[dict]:
    return [
        {
            "timestamp": 0.0,
            "method": "INVITE",
            "direction": f"{src}:5060 → {dst}:5060",
            "src_ip": src, "dst_ip": dst, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 INVITE", "sdp_offer": None,
            "raw_first_line": f"INVITE {to_uri} SIP/2.0",
        },
        {
            "timestamp": 0.04,
            "method": "100",
            "direction": f"{dst}:5060 → {src}:5060",
            "src_ip": dst, "dst_ip": src, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 INVITE", "sdp_offer": None,
            "raw_first_line": "SIP/2.0 100 Trying",
        },
        {
            "timestamp": 0.51,
            "method": str(code),
            "direction": f"{dst}:5060 → {src}:5060",
            "src_ip": dst, "dst_ip": src, "src_port": 5060, "dst_port": 5060,
            "call_id": call_id, "from_uri": from_uri, "to_uri": to_uri,
            "cseq": "1 INVITE", "sdp_offer": None,
            "raw_first_line": f"SIP/2.0 {code} {reason}",
        },
    ]


rtp1 = _make_rtp("0xA1B2C3D4", "192.168.1.10", "192.168.1.20", 16384, 16385, 0, "G.711u", 1750, 35.0, 8.4, 0.2)
rtp2 = _make_rtp("0xB2C3D4E5", "192.168.1.20", "192.168.1.10", 16385, 16384, 0, "G.711u", 1748, 35.0, 9.1, 0.3)
rtp3 = _make_rtp("0xC3D4E5F6", "10.0.0.5", "10.0.0.6", 20000, 20001, 18, "G.729", 875, 17.5, 12.3, 0.8)
rtp4 = _make_rtp("0xD4E5F6A7", "10.0.0.6", "10.0.0.5", 20001, 20000, 18, "G.729", 873, 17.5, 11.9, 0.7)
rtp5 = _make_rtp("0xE5F6A7B8", "172.16.0.1", "172.16.0.2", 18000, 18001, 8, "G.711a", 2500, 50.0, 6.2, 0.1)
rtp6 = _make_rtp("0xF6A7B8C9", "172.16.0.2", "172.16.0.1", 18001, 18000, 8, "G.711a", 2498, 50.0, 6.8, 0.1)

DEMO_ANALYSIS = {
    "stats": {
        "filename": "nova_demo_capture.pcap",
        "total_packets": 12847,
        "sip_packets": 47,
        "rtp_packets": 12680,
        "rtcp_packets": 120,
        "total_calls": 7,
        "successful_calls": 5,
        "failed_calls": 2,
        "capture_duration_sec": 183.4,
        "avg_mos": 4.12,
        "total_errors": 2,
    },
    "calls": [
        # Call 1 — main demo call (8 messages, full flow)
        {
            "call_id": "a3f9b2@192.168.1.10",
            "from_uri": "sip:alice@acme.com",
            "to_uri": "sip:bob@acme.com",
            "start_time": 0.0,
            "end_time": 35.18,
            "duration_sec": 35.18,
            "status": "200 OK",
            "codec": "G.711u",
            "mos_score": 4.28,
            "avg_jitter_ms": 8.4,
            "avg_latency_ms": 42.0,
            "packet_loss_pct": 0.2,
            "messages": _messages("a3f9b2@192.168.1.10", "sip:alice@acme.com", "sip:bob@acme.com", "192.168.1.10", "192.168.1.20"),
            "rtp_streams": [rtp1, rtp2],
        },
        # Call 2
        {
            "call_id": "c7e1d5@10.0.0.5",
            "from_uri": "sip:carol@corp.net",
            "to_uri": "sip:dave@corp.net",
            "start_time": 5.3,
            "end_time": 22.8,
            "duration_sec": 17.5,
            "status": "200 OK",
            "codec": "G.729",
            "mos_score": 3.87,
            "avg_jitter_ms": 12.3,
            "avg_latency_ms": 55.0,
            "packet_loss_pct": 0.8,
            "messages": _messages("c7e1d5@10.0.0.5", "sip:carol@corp.net", "sip:dave@corp.net", "10.0.0.5", "10.0.0.6"),
            "rtp_streams": [rtp3, rtp4],
        },
        # Call 3
        {
            "call_id": "f2a8c1@172.16.0.1",
            "from_uri": "sip:eve@voip.local",
            "to_uri": "sip:frank@voip.local",
            "start_time": 12.1,
            "end_time": 62.1,
            "duration_sec": 50.0,
            "status": "200 OK",
            "codec": "G.711a",
            "mos_score": 4.41,
            "avg_jitter_ms": 6.2,
            "avg_latency_ms": 38.0,
            "packet_loss_pct": 0.1,
            "messages": _messages("f2a8c1@172.16.0.1", "sip:eve@voip.local", "sip:frank@voip.local", "172.16.0.1", "172.16.0.2"),
            "rtp_streams": [rtp5, rtp6],
        },
        # Call 4
        {
            "call_id": "b9d3e7@192.168.1.30",
            "from_uri": "sip:grace@pbx.local",
            "to_uri": "sip:henry@pbx.local",
            "start_time": 20.0,
            "end_time": 45.5,
            "duration_sec": 25.5,
            "status": "200 OK",
            "codec": "G.711u",
            "mos_score": 4.15,
            "avg_jitter_ms": 9.7,
            "avg_latency_ms": 44.0,
            "packet_loss_pct": 0.4,
            "messages": _messages("b9d3e7@192.168.1.30", "sip:grace@pbx.local", "sip:henry@pbx.local", "192.168.1.30", "192.168.1.40"),
            "rtp_streams": [],
        },
        # Call 5
        {
            "call_id": "e4f6a2@10.10.0.1",
            "from_uri": "sip:ivan@sip.example.com",
            "to_uri": "sip:judy@sip.example.com",
            "start_time": 40.0,
            "end_time": 98.7,
            "duration_sec": 58.7,
            "status": "200 OK",
            "codec": "G.722",
            "mos_score": 4.35,
            "avg_jitter_ms": 7.1,
            "avg_latency_ms": 40.0,
            "packet_loss_pct": 0.2,
            "messages": _messages("e4f6a2@10.10.0.1", "sip:ivan@sip.example.com", "sip:judy@sip.example.com", "10.10.0.1", "10.10.0.2"),
            "rtp_streams": [],
        },
        # Call 6 — FAILED (486 Busy Here)
        {
            "call_id": "d1c8b4@192.168.1.50",
            "from_uri": "sip:karl@office.net",
            "to_uri": "sip:lisa@office.net",
            "start_time": 75.0,
            "end_time": 75.55,
            "duration_sec": 0.55,
            "status": "486 Busy Here",
            "codec": "unknown",
            "mos_score": None,
            "avg_jitter_ms": None,
            "avg_latency_ms": None,
            "packet_loss_pct": None,
            "messages": _failed_messages("d1c8b4@192.168.1.50", "sip:karl@office.net", "sip:lisa@office.net", "192.168.1.50", "192.168.1.60", 486, "Busy Here"),
            "rtp_streams": [],
        },
        # Call 7 — FAILED (503 Service Unavailable)
        {
            "call_id": "a7e2f9@10.0.1.1",
            "from_uri": "sip:mike@voip.org",
            "to_uri": "sip:nancy@voip.org",
            "start_time": 120.0,
            "end_time": 120.48,
            "duration_sec": 0.48,
            "status": "503 Service Unavailable",
            "codec": "unknown",
            "mos_score": None,
            "avg_jitter_ms": None,
            "avg_latency_ms": None,
            "packet_loss_pct": None,
            "messages": _failed_messages("a7e2f9@10.0.1.1", "sip:mike@voip.org", "sip:nancy@voip.org", "10.0.1.1", "10.0.1.2", 503, "Service Unavailable"),
            "rtp_streams": [],
        },
    ],
    "errors": [
        {
            "code": 486,
            "reason": "Busy Here",
            "call_id": "d1c8b4@192.168.1.50",
            "timestamp": 75.51,
            "count": 1,
        },
        {
            "code": 503,
            "reason": "Service Unavailable",
            "call_id": "a7e2f9@10.0.1.1",
            "timestamp": 120.48,
            "count": 1,
        },
    ],
}
