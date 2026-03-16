# NOVA — Network Operations VoIP Analyser

Upload Wireshark `.pcap` / `.pcapng` files or paste raw SIP logs and instantly get a professional, dark-mode VoIP intelligence dashboard. No Wireshark expertise required.

## Features

- **SIP Ladder Diagrams** — Interactive SVG call flow visualisation with per-message detail
- **RTP Stream Analysis** — Jitter timeline charts, codec distribution, packet statistics
- **Call Quality Scoring** — MOS score (E-Model/ITU-T G.107), jitter, latency, packet loss
- **SIP Error Log** — All 4xx/5xx/6xx responses with count and context
- **Packet View** — Filterable table of every SIP message across all calls
- **Protocol Guide** — Built-in beginner-friendly explanations of SIP, RTP, MOS, jitter, and more
- **Demo Mode** — Try the full dashboard without uploading anything

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.11+, FastAPI, Pydantic v2, pyshark, scapy |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v3, Recharts, Zustand |
| Fonts | Space Mono (data), DM Sans (UI) |

## Project Structure

```
NOVA/
├── backend/
│   ├── main.py               # FastAPI app & routes
│   ├── parsers/
│   │   ├── pcap_parser.py    # pyshark-based pcap parsing
│   │   ├── sip_log_parser.py # Raw SIP log text parsing
│   │   └── rtp_analyser.py   # RFC 3550 jitter + E-Model MOS
│   ├── models/call_models.py # Pydantic models
│   ├── utils/
│   │   ├── sip_codes.py      # SIP response code descriptions
│   │   └── codec_map.py      # RTP payload type → codec name
│   ├── demo_data.py          # Hardcoded demo capture
│   ├── tests/                # pytest unit tests
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/       # Layout, Upload, Dashboard, Ladder, RTP, Learn
        ├── pages/            # Dashboard, LadderView, RtpStreams, PacketView
        ├── store/            # Zustand global state
        ├── api/nova.ts       # Axios API client
        └── data/demoCapture.ts
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- tshark (for pcap parsing): `brew install --cask wireshark` (macOS) or `sudo apt install tshark` (Ubuntu)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

- `POST /api/upload` — Upload a capture file, returns `CaptureAnalysis` JSON
- `GET /api/demo` — Returns demo capture data (no tshark required)
- `GET /api/health` — Health check

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` requests to `http://localhost:8000`.

### Running Tests

```bash
cd backend
python3 -m pytest tests/ -v
```

26 unit tests covering codec map, RTP analyser (MOS & jitter), and SIP log parser.

## Supported File Types

| Extension | Description |
|---|---|
| `.pcap`, `.pcapng` | Wireshark captures (requires tshark) |
| `.ncap`, `.cap` | Alternative capture formats |
| `.txt`, `.log` | Raw SIP log dumps (Asterisk, OpenSIPS, Kamailio) |

## Quality Thresholds

| Metric | Excellent | Good | Poor |
|---|---|---|---|
| MOS | ≥ 4.0 | 3.5 – 4.0 | < 3.5 |
| Jitter | < 10 ms | 10 – 30 ms | > 30 ms |
| Packet Loss | < 1% | 1 – 5% | > 5% |
| Latency | < 100 ms | 100 – 200 ms | > 200 ms |

## Notes

- If tshark is not installed, the backend returns a `503` error for pcap files. Use "Try Demo" or upload `.txt`/`.log` SIP logs instead.
- Files larger than 50 MB are rejected.
- MOS is calculated using the simplified E-Model (ITU-T G.107) from RTP stream statistics.
