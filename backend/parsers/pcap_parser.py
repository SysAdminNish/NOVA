"""
Parse a pcap/pcapng file using pyshark.
Requires tshark installed:
  macOS:  brew install --cask wireshark
  Ubuntu: sudo apt install tshark

Returns a CaptureAnalysis object.
"""
from models.call_models import (
    CaptureAnalysis,
    CaptureStats,
    CallRecord,
    SipMessage,
    RtpStream,
    SipError,
)
from utils.codec_map import PT_TO_CODEC
from utils.sip_codes import SIP_CODE_REASON
from .rtp_analyser import calculate_mos, calculate_jitter_series


_TSHARK_SEARCH_PATHS = [
    # macOS — Wireshark.app bundle (GUI installer)
    "/Applications/Wireshark.app/Contents/MacOS/tshark",
    # macOS — Homebrew (Intel + Apple Silicon)
    "/usr/local/bin/tshark",
    "/opt/homebrew/bin/tshark",
    # Linux
    "/usr/bin/tshark",
    "/usr/sbin/tshark",
]


def _find_tshark() -> str | None:
    """Return the first usable tshark binary, checking PATH then known locations."""
    import shutil as _shutil
    import os

    on_path = _shutil.which("tshark")
    if on_path:
        return on_path
    for candidate in _TSHARK_SEARCH_PATHS:
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return None


def _parse_timestamp(raw: str | float) -> float:
    """
    Convert pyshark sniff_timestamp to Unix epoch float.
    pyshark can return either numeric strings (e.g. "1479571996.509176") or
    ISO 8601 strings (e.g. "2016-11-26T14:53:16.509176000Z").
    """
    if isinstance(raw, (int, float)):
        return float(raw)
    s = str(raw).strip()
    try:
        return float(s)
    except ValueError:
        pass
    # ISO 8601 format
    from datetime import datetime

    s = s.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        return dt.timestamp()
    except ValueError:
        return 0.0


def parse_pcap(filepath: str, filename: str = "capture.pcap") -> CaptureAnalysis:
    try:
        import pyshark
    except ImportError:
        raise RuntimeError(
            "pyshark is not installed. Run: pip install pyshark"
        )

    tshark_path = _find_tshark()
    if not tshark_path:
        from fastapi import HTTPException
        raise HTTPException(
            503,
            "tshark not found. Install Wireshark from https://www.wireshark.org/download.html "
            "(macOS: brew install --cask wireshark)",
        )

    try:
        cap = pyshark.FileCapture(
            filepath,
            display_filter="sip or rtp or rtcp",
            use_json=True,
            include_raw=False,
            tshark_path=tshark_path,
        )
    except Exception as exc:
        from fastapi import HTTPException
        raise HTTPException(422, f"Could not open capture file: {exc}")

    calls: dict[str, dict] = {}
    rtp_streams: dict[str, dict] = {}
    errors: list[dict] = []
    total_packets = 0
    sip_count = rtp_count = rtcp_count = 0
    first_ts: float | None = None
    last_ts: float | None = None

    try:
        for pkt in cap:
            try:
                ts = _parse_timestamp(pkt.sniff_timestamp)
                if first_ts is None:
                    first_ts = ts
                last_ts = ts
                total_packets += 1

                # ── SIP ──────────────────────────────────────────────────
                if hasattr(pkt, "sip"):
                    sip_count += 1
                    sip = pkt.sip
                    call_id = getattr(sip, "call_id", "unknown").strip()
                    method = _extract_sip_method(sip)
                    from_uri = getattr(sip, "from_user", getattr(sip, "from_addr", "unknown"))
                    to_uri = getattr(sip, "to_user", getattr(sip, "to_addr", "unknown"))
                    src_ip = str(pkt.ip.src) if hasattr(pkt, "ip") else "?"
                    dst_ip = str(pkt.ip.dst) if hasattr(pkt, "ip") else "?"
                    tl = pkt.transport_layer
                    src_port = int(pkt[tl].srcport) if tl else 5060
                    dst_port = int(pkt[tl].dstport) if tl else 5060

                    if call_id not in calls:
                        calls[call_id] = {
                            "call_id": call_id,
                            "from_uri": from_uri,
                            "to_uri": to_uri,
                            "start_time": ts,
                            "end_time": None,
                            "status": "In Progress",
                            "messages": [],
                            "rtp_streams": [],
                            "codec": "unknown",
                        }

                    msg = SipMessage(
                        timestamp=round(ts - first_ts, 6),
                        method=method,
                        direction=_infer_direction(src_ip, dst_ip, src_port, dst_port),
                        src_ip=src_ip,
                        dst_ip=dst_ip,
                        src_port=src_port,
                        dst_port=dst_port,
                        call_id=call_id,
                        from_uri=from_uri,
                        to_uri=to_uri,
                        cseq=getattr(sip, "cseq", None),
                        sdp_offer=None,
                        raw_first_line=_get_sip_first_line(sip) or method,
                    )
                    calls[call_id]["messages"].append(msg)

                    code = _get_response_code(sip)
                    if code:
                        if 200 <= code < 300:
                            calls[call_id]["status"] = f"{code} OK"
                        elif 400 <= code < 700:
                            calls[call_id]["status"] = (
                                f"{code} {SIP_CODE_REASON.get(code, 'Error')}"
                            )
                            errors.append(
                                {
                                    "code": code,
                                    "call_id": call_id,
                                    "timestamp": ts - first_ts,
                                }
                            )

                    if method.upper() in ("BYE", "CANCEL"):
                        calls[call_id]["end_time"] = ts

                # ── RTP ──────────────────────────────────────────────────
                elif hasattr(pkt, "rtp"):
                    rtp_count += 1
                    rtp = pkt.rtp
                    ssrc = getattr(rtp, "ssrc", "0x0")
                    if ssrc not in rtp_streams:
                        tl = pkt.transport_layer
                        rtp_streams[ssrc] = {
                            "ssrc": ssrc,
                            "src_ip": str(pkt.ip.src) if hasattr(pkt, "ip") else "?",
                            "dst_ip": str(pkt.ip.dst) if hasattr(pkt, "ip") else "?",
                            "src_port": int(pkt[tl].srcport) if tl else 0,
                            "dst_port": int(pkt[tl].dstport) if tl else 0,
                            "payload_type": int(getattr(rtp, "p_type", 0)),
                            "packets": [],
                            "first_ts": ts,
                            "last_ts": ts,
                        }
                    rtp_streams[ssrc]["packets"].append(ts)
                    rtp_streams[ssrc]["last_ts"] = ts

                # ── RTCP ─────────────────────────────────────────────────
                elif hasattr(pkt, "rtcp"):
                    rtcp_count += 1

            except Exception:
                pass  # Skip malformed packets
    finally:
        cap.close()

    if first_ts is None:
        first_ts = 0.0
    if last_ts is None:
        last_ts = 0.0

    # ── Build RTP stream objects ──────────────────────────────────────
    built_rtp: list[RtpStream] = [
        _build_rtp_stream(s, first_ts) for s in rtp_streams.values()
    ]

    # ── Build CallRecord objects ──────────────────────────────────────
    call_records: list[CallRecord] = []
    for cid, c in calls.items():
        end = c["end_time"] or last_ts
        duration = round((end or 0) - c["start_time"], 3)
        
        # Associate RTP streams by timing overlap with call
        call_start = c["start_time"]
        call_end = end or last_ts
        associated_rtp = [
            s for s in built_rtp
            if s.duration_sec > 0 and (
                (s.duration_sec + first_ts >= call_start - 5 and
                 first_ts <= call_end + 5)
            )
        ]

        if associated_rtp:
            for s in associated_rtp:
                if c["codec"] == "unknown" and s.codec not in ("unknown",):
                    c["codec"] = s.codec
                    break
            mos = sum(s.mos_score for s in associated_rtp) / len(associated_rtp)
            jitter = sum(s.avg_jitter_ms for s in associated_rtp) / len(associated_rtp)
            loss = sum(s.packet_loss_pct for s in associated_rtp) / len(associated_rtp)
        else:
            mos = jitter = loss = None

        call_records.append(
            CallRecord(
                call_id=cid,
                from_uri=c["from_uri"],
                to_uri=c["to_uri"],
                start_time=round(c["start_time"] - first_ts, 6),
                end_time=round(end - first_ts, 6) if end else None,
                duration_sec=duration,
                status=c["status"],
                codec=c["codec"],
                mos_score=round(mos, 2) if mos is not None else None,
                avg_jitter_ms=round(jitter, 1) if jitter is not None else None,
                avg_latency_ms=None,
                packet_loss_pct=round(loss, 2) if loss is not None else None,
                messages=c["messages"],
                rtp_streams=associated_rtp[:4],
            )
        )

    # ── Deduplicate errors ────────────────────────────────────────────
    error_map: dict[tuple, dict] = {}
    for e in errors:
        key = (e["code"], e["call_id"])
        if key not in error_map:
            error_map[key] = {
                **e,
                "count": 0,
                "reason": SIP_CODE_REASON.get(e["code"], "Unknown"),
            }
        error_map[key]["count"] += 1

    error_objects = [
        SipError(
            code=v["code"],
            reason=v["reason"],
            call_id=v["call_id"],
            timestamp=v["timestamp"],
            count=v["count"],
        )
        for v in error_map.values()
    ]

    successful = sum(1 for c in call_records if c.status.startswith("200"))
    all_mos = [c.mos_score for c in call_records if c.mos_score is not None]
    stats = CaptureStats(
        filename=filename,
        total_packets=total_packets,
        sip_packets=sip_count,
        rtp_packets=rtp_count,
        rtcp_packets=rtcp_count,
        total_calls=len(call_records),
        successful_calls=successful,
        failed_calls=len(call_records) - successful,
        capture_duration_sec=round(last_ts - first_ts, 3),
        avg_mos=round(sum(all_mos) / len(all_mos), 2) if all_mos else None,
        total_errors=len(error_objects),
    )

    return CaptureAnalysis(stats=stats, calls=call_records, errors=error_objects)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_sip_first_line(sip) -> str:
    """Get Request-Line or Status-Line; pyshark/tshark use different names by version."""
    for name in ("Request-Line", "request_line", "Status-Line", "status_line"):
        val = getattr(sip, name, None)
        if val and isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def _extract_sip_method(sip) -> str:
    line = _get_sip_first_line(sip)
    if line:
        parts = line.split()
        if parts:
            if parts[0].startswith("SIP/"):
                return parts[1] if len(parts) > 1 else "???"
            return parts[0]
    for name in ("method", "Method"):
        val = getattr(sip, name, None)
        if val and isinstance(val, str):
            return val.strip()
    return "UNKNOWN"


def _get_response_code(sip) -> int | None:
    for name in ("status_code", "Status-Code"):
        val = getattr(sip, name, None)
        if val is not None:
            try:
                return int(val)
            except (ValueError, TypeError):
                pass
    # Parse from Status-Line: "SIP/2.0 200 OK" -> 200
    line = getattr(sip, "Status-Line", None) or getattr(sip, "status_line", None)
    if line and isinstance(line, str):
        parts = line.strip().split()
        if len(parts) >= 2 and parts[0].startswith("SIP/"):
            try:
                return int(parts[1])
            except (ValueError, TypeError):
                pass
    return None


def _infer_direction(src_ip: str, dst_ip: str, src_port: int, dst_port: int) -> str:
    return f"{src_ip}:{src_port} → {dst_ip}:{dst_port}"


def _build_rtp_stream(stream: dict, first_ts: float) -> RtpStream:
    pts = stream["packets"]
    duration = stream["last_ts"] - stream["first_ts"] if len(pts) > 1 else 0.0
    pt = stream["payload_type"]
    codec = PT_TO_CODEC.get(pt, f"PT:{pt}")
    jitter_series = calculate_jitter_series(pts)
    avg_j = sum(jitter_series) / len(jitter_series) if jitter_series else 0.0
    max_j = max(jitter_series) if jitter_series else 0.0
    min_j = min(jitter_series) if jitter_series else 0.0
    expected = int(duration * 50)
    loss = max(0.0, (expected - len(pts)) / expected * 100) if expected > 0 else 0.0
    mos = calculate_mos(avg_j, loss)
    return RtpStream(
        ssrc=stream["ssrc"],
        src_ip=stream["src_ip"],
        dst_ip=stream["dst_ip"],
        src_port=stream["src_port"],
        dst_port=stream["dst_port"],
        payload_type=pt,
        codec=codec,
        packet_count=len(pts),
        duration_sec=round(duration, 3),
        avg_jitter_ms=round(avg_j, 2),
        max_jitter_ms=round(max_j, 2),
        min_jitter_ms=round(min_j, 2),
        packet_loss_pct=round(loss, 2),
        mos_score=round(mos, 2),
        jitter_series=[round(j, 2) for j in jitter_series[:100]],
    )
