from pydantic import BaseModel
from typing import Optional


class SipMessage(BaseModel):
    timestamp: float
    method: str
    direction: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    call_id: str
    from_uri: str
    to_uri: str
    cseq: Optional[str] = None
    sdp_offer: Optional[str] = None
    raw_first_line: str


class RtpStream(BaseModel):
    ssrc: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    payload_type: int
    codec: str
    packet_count: int
    duration_sec: float
    avg_jitter_ms: float
    max_jitter_ms: float
    min_jitter_ms: float
    packet_loss_pct: float
    mos_score: float
    jitter_series: list[float]


class CallRecord(BaseModel):
    call_id: str
    from_uri: str
    to_uri: str
    start_time: float
    end_time: Optional[float] = None
    duration_sec: float
    status: str
    codec: str
    mos_score: Optional[float] = None
    avg_jitter_ms: Optional[float] = None
    avg_latency_ms: Optional[float] = None
    packet_loss_pct: Optional[float] = None
    messages: list[SipMessage]
    rtp_streams: list[RtpStream]


class SipError(BaseModel):
    code: int
    reason: str
    call_id: str
    timestamp: float
    count: int


class CaptureStats(BaseModel):
    filename: str
    total_packets: int
    sip_packets: int
    rtp_packets: int
    rtcp_packets: int
    total_calls: int
    successful_calls: int
    failed_calls: int
    capture_duration_sec: float
    avg_mos: Optional[float] = None
    total_errors: int


class CaptureAnalysis(BaseModel):
    stats: CaptureStats
    calls: list[CallRecord]
    errors: list[SipError]
