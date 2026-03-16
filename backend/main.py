from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from parsers.pcap_parser import parse_pcap
from parsers.sip_log_parser import parse_sip_log
from models.call_models import CaptureAnalysis
import tempfile
import os

app = FastAPI(title="NOVA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/upload", response_model=CaptureAnalysis)
async def upload_capture(file: UploadFile = File(...)):
    """
    Accept .pcap, .pcapng, .ncap, .cap, or .txt/.log (SIP log).
    Returns full CaptureAnalysis JSON.
    """
    suffix = os.path.splitext(file.filename or "upload")[1].lower()
    allowed = {".pcap", ".pcapng", ".ncap", ".cap", ".txt", ".log"}
    if suffix not in allowed:
        raise HTTPException(400, f"Unsupported file type: {suffix}")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(413, "File exceeds 50 MB limit")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    # pyshark (wrapping tshark) is fully synchronous and manages its own event
    # loop internally. Running it directly inside an async FastAPI handler causes
    # "Cannot run the event loop while another loop is running". Offloading to a
    # thread pool avoids that conflict entirely.
    try:
        fname = file.filename or ("sip_log.txt" if suffix in {".txt", ".log"} else "capture.pcap")
        if suffix in {".txt", ".log"}:
            with open(tmp_path, "r", errors="replace") as f:
                text = f.read()
            result = await run_in_threadpool(parse_sip_log, text, filename=fname)
        else:
            result = await run_in_threadpool(parse_pcap, tmp_path, filename=fname)
        return result
    finally:
        os.unlink(tmp_path)


@app.get("/api/demo", response_model=CaptureAnalysis)
def get_demo():
    """Return hardcoded demo data (no tshark required)."""
    from demo_data import DEMO_ANALYSIS
    return DEMO_ANALYSIS


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "NOVA"}
