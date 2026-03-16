"""
Parse raw SIP log text (not pcap). Handles common log formats:
  - Asterisk/FreePBX logs
  - OpenSIPS/Kamailio debug logs
  - Plain SIP trace dumps
"""
import re
from models.call_models import (
    CaptureAnalysis,
    CaptureStats,
    CallRecord,
    SipMessage,
    RtpStream,
    SipError,
)
from utils.sip_codes import SIP_CODE_REASON

CALL_ID_RE = re.compile(r"Call-ID:\s*(.+)", re.IGNORECASE)
FROM_RE = re.compile(r"From:\s*.*?<?(sip:[^>\s;]+)", re.IGNORECASE)
TO_RE = re.compile(r"To:\s*.*?<?(sip:[^>\s;]+)", re.IGNORECASE)
VIA_RE = re.compile(r"Via:\s*SIP/2\.0/\w+\s+([\d\.]+):(\d+)", re.IGNORECASE)


def parse_sip_log(text: str, filename: str = "sip_log.txt") -> CaptureAnalysis:
    calls: dict[str, dict] = {}
    errors: list[dict] = []
    lines = text.splitlines()
    blocks = _split_into_blocks(lines)

    for i, block in enumerate(blocks):
        joined = "\n".join(block)
        call_id_m = CALL_ID_RE.search(joined)
        if not call_id_m:
            continue
        call_id = call_id_m.group(1).strip()

        from_m = FROM_RE.search(joined)
        to_m = TO_RE.search(joined)
        from_uri = from_m.group(1) if from_m else "unknown"
        to_uri = to_m.group(1) if to_m else "unknown"

        first = block[0]
        method = _parse_first_line(first)
        ts = float(i)

        if call_id not in calls:
            calls[call_id] = {
                "call_id": call_id,
                "from_uri": from_uri,
                "to_uri": to_uri,
                "start_time": ts,
                "end_time": None,
                "status": "Unknown",
                "messages": [],
                "rtp_streams": [],
                "codec": "G.711u",
            }

        via_m = VIA_RE.search(joined)
        src_ip = via_m.group(1) if via_m else "0.0.0.0"
        src_port = int(via_m.group(2)) if via_m else 5060

        msg = SipMessage(
            timestamp=ts,
            method=method,
            direction=f"{src_ip}:{src_port} → proxy",
            src_ip=src_ip,
            dst_ip="0.0.0.0",
            src_port=src_port,
            dst_port=5060,
            call_id=call_id,
            from_uri=from_uri,
            to_uri=to_uri,
            cseq=None,
            sdp_offer=None,
            raw_first_line=first.strip(),
        )
        calls[call_id]["messages"].append(msg)

        code = _get_code(method)
        if code and code >= 400:
            calls[call_id]["status"] = f"{code} {SIP_CODE_REASON.get(code, 'Error')}"
            errors.append(
                {
                    "code": code,
                    "call_id": call_id,
                    "timestamp": ts,
                    "reason": SIP_CODE_REASON.get(code, "Unknown"),
                    "count": 1,
                }
            )
        elif code == 200:
            calls[call_id]["status"] = "200 OK"

        if method.upper() in ("BYE", "CANCEL"):
            calls[call_id]["end_time"] = ts

    call_records = [
        CallRecord(
            call_id=c["call_id"],
            from_uri=c["from_uri"],
            to_uri=c["to_uri"],
            start_time=c["start_time"],
            end_time=c["end_time"],
            duration_sec=round(
                (c["end_time"] or c["start_time"]) - c["start_time"], 3
            ),
            status=c["status"],
            codec=c["codec"],
            mos_score=None,
            avg_jitter_ms=None,
            avg_latency_ms=None,
            packet_loss_pct=None,
            messages=c["messages"],
            rtp_streams=[],
        )
        for c in calls.values()
    ]

    error_objs = [SipError(**e) for e in errors]
    total_msgs = sum(len(c.messages) for c in call_records)
    stats = CaptureStats(
        filename=filename,
        total_packets=total_msgs,
        sip_packets=total_msgs,
        rtp_packets=0,
        rtcp_packets=0,
        total_calls=len(call_records),
        successful_calls=sum(1 for c in call_records if "200" in c.status),
        failed_calls=sum(1 for c in call_records if "200" not in c.status),
        capture_duration_sec=float(len(blocks)),
        avg_mos=None,
        total_errors=len(error_objs),
    )
    return CaptureAnalysis(stats=stats, calls=call_records, errors=error_objs)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _split_into_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    cur: list[str] = []
    for line in lines:
        if line.strip() == "" and cur:
            blocks.append(cur)
            cur = []
        elif line.strip():
            cur.append(line)
    if cur:
        blocks.append(cur)
    return blocks


def _parse_first_line(line: str) -> str:
    parts = line.strip().split()
    if not parts:
        return "UNKNOWN"
    if parts[0].startswith("SIP/"):
        return parts[1] if len(parts) > 1 else "???"
    return parts[0]


def _get_code(method: str) -> int | None:
    try:
        return int(method)
    except (ValueError, TypeError):
        return None
