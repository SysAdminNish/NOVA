import { useState } from 'react';
import type { SipMessage, RtpStream, CallRecord } from '../../types';

const METHOD_COLORS: Record<string, string> = {
  INVITE:    '#00c8ff',
  REGISTER:  '#00c8ff',
  SUBSCRIBE: '#00c8ff',
  NOTIFY:    '#00c8ff',
  OPTIONS:   '#5a7a9a',
  '100':     '#5a7a9a',
  '180':     '#ff8c42',
  '181':     '#ff8c42',
  '183':     '#ff8c42',
  '200':     '#00ffa3',
  '202':     '#00ffa3',
  ACK:       '#9b5de5',
  PRACK:     '#9b5de5',
  BYE:       '#ff4d6d',
  CANCEL:    '#ff4d6d',
  RTP:       'rgba(0,200,255,0.35)',
};

const COLUMN_X = { uac: 80, proxy: 290, uas: 500 };
const ROW_START = 120;
const ROW_STEP = 50;
const HEADER_H = 80;

interface SipLadderProps {
  messages: SipMessage[];
  rtp_streams: RtpStream[];
  call: CallRecord;
  onMessageClick?: (msg: SipMessage) => void;
}

function inferArrow(msg: SipMessage, idx: number): { from: number; to: number } {
  const m = msg.method.toUpperCase();
  if (['INVITE', 'REGISTER', 'ACK', 'BYE', 'CANCEL', 'OPTIONS', 'SUBSCRIBE', 'NOTIFY', 'PRACK'].includes(m)) {
    // Request: UAC → proxy (even) or proxy → UAS (odd pass-through)
    return idx % 2 === 0
      ? { from: COLUMN_X.uac, to: COLUMN_X.proxy }
      : { from: COLUMN_X.proxy, to: COLUMN_X.uas };
  }
  if (!isNaN(Number(m))) {
    // Response: proxy → UAC (even) or UAS → proxy (odd)
    return idx % 2 === 0
      ? { from: COLUMN_X.proxy, to: COLUMN_X.uac }
      : { from: COLUMN_X.uas, to: COLUMN_X.proxy };
  }
  return { from: COLUMN_X.uac, to: COLUMN_X.proxy };
}

export default function SipLadder({ messages, rtp_streams, onMessageClick }: SipLadderProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<SipMessage | null>(null);

  // Insert RTP band between ACK and BYE
  const ackIdx = messages.findIndex((m) => m.method.toUpperCase() === 'ACK');
  const showRtp = rtp_streams.length > 0 && ackIdx >= 0;

  const rows: Array<{ type: 'sip'; msg: SipMessage; origIdx: number } | { type: 'rtp' }> = [];
  messages.forEach((msg, i) => {
    rows.push({ type: 'sip', msg, origIdx: i });
    if (showRtp && i === ackIdx) {
      rows.push({ type: 'rtp' });
    }
  });

  const svgHeight = ROW_START + rows.length * ROW_STEP + 40;
  const svgWidth = 600;

  const ColumnHeader = ({ x, label, ip }: { x: number; label: string; ip?: string }) => (
    <g>
      <rect
        x={x - 55} y={8} width={110} height={48}
        rx={8}
        fill="rgba(0,200,255,0.06)"
        stroke="rgba(0,200,255,0.15)"
        strokeWidth={1}
      />
      <text x={x} y={30} textAnchor="middle" fill="#e8f4ff" fontSize={11} fontFamily="DM Sans, sans-serif" fontWeight={600}>
        {label}
      </text>
      {ip && (
        <text x={x} y={46} textAnchor="middle" fill="#5a7a9a" fontSize={9} fontFamily="Space Mono, monospace">
          {ip}
        </text>
      )}
    </g>
  );

  return (
    <div className="overflow-x-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ fontFamily: 'inherit', minWidth: 540 }}
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="currentColor" />
          </marker>
          {Object.entries(METHOD_COLORS).map(([method, color]) => (
            <marker
              key={method}
              id={`arrow-${method.replace(/[^a-zA-Z0-9]/g, '_')}`}
              markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={color} />
            </marker>
          ))}
        </defs>

        {/* Column headers */}
        <ColumnHeader x={COLUMN_X.uac} label="UAC" ip={messages[0]?.src_ip} />
        <ColumnHeader x={COLUMN_X.proxy} label="SIP Proxy" />
        <ColumnHeader x={COLUMN_X.uas} label="UAS" ip={messages[0]?.dst_ip} />

        {/* Lifelines */}
        {[COLUMN_X.uac, COLUMN_X.proxy, COLUMN_X.uas].map((x) => (
          <line
            key={x}
            x1={x} y1={HEADER_H}
            x2={x} y2={svgHeight - 10}
            stroke="rgba(0,200,255,0.12)"
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        ))}

        {/* Messages */}
        {rows.map((row, rowIdx) => {
          const y = ROW_START + rowIdx * ROW_STEP;

          if (row.type === 'rtp') {
            const codec = rtp_streams[0]?.codec ?? 'RTP';
            const pkts = rtp_streams.reduce((n, s) => n + s.packet_count, 0);
            return (
              <g key="rtp-band">
                <rect
                  x={COLUMN_X.uac - 10} y={y - 14}
                  width={COLUMN_X.uas - COLUMN_X.uac + 20} height={28}
                  rx={4}
                  fill="rgba(0,200,255,0.04)"
                  stroke="rgba(0,200,255,0.12)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <line
                  x1={COLUMN_X.uac} y1={y}
                  x2={COLUMN_X.uas} y2={y}
                  stroke={METHOD_COLORS.RTP}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                >
                  <animate attributeName="stroke-dashoffset" from="30" to="0" dur="1.5s" repeatCount="indefinite" />
                </line>
                <text
                  x={(COLUMN_X.uac + COLUMN_X.uas) / 2}
                  y={y + 4}
                  textAnchor="middle"
                  fill="rgba(0,200,255,0.6)"
                  fontSize={9}
                  fontFamily="Space Mono, monospace"
                >
                  {codec} · {pkts.toLocaleString()} packets
                </text>
              </g>
            );
          }

          const { msg, origIdx } = row;
          const color = METHOD_COLORS[msg.method.toUpperCase()] ?? '#5a7a9a';
          const { from, to } = inferArrow(msg, origIdx);
          const isHovered = hoveredIdx === rowIdx;
          const isSelected = selected?.timestamp === msg.timestamp && selected?.method === msg.method;
          const dir = to > from ? 1 : -1;
          const arrowId = `arrow-${msg.method.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
          const labelX = (from + to) / 2;
          const labelW = 72;

          return (
            <g
              key={rowIdx}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setSelected(isSelected ? null : msg);
                onMessageClick?.(msg);
              }}
              onMouseEnter={() => setHoveredIdx(rowIdx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Hover highlight */}
              {(isHovered || isSelected) && (
                <rect
                  x={10} y={y - 14} width={svgWidth - 20} height={28}
                  rx={4}
                  fill={isSelected ? `${color}22` : 'rgba(255,255,255,0.03)'}
                  stroke={isSelected ? `${color}44` : 'none'}
                />
              )}
              {/* Timestamp */}
              <text
                x={14} y={y + 4}
                fill="#2a4a6a"
                fontSize={8}
                fontFamily="Space Mono, monospace"
                textAnchor="start"
              >
                +{msg.timestamp.toFixed(2)}s
              </text>
              {/* Arrow line */}
              <line
                x1={from + dir * 6} y1={y}
                x2={to - dir * 6} y2={y}
                stroke={color}
                strokeWidth={isHovered || isSelected ? 2 : 1.5}
                markerEnd={`url(#${arrowId})`}
              />
              {/* Label background */}
              <rect
                x={labelX - labelW / 2} y={y - 11}
                width={labelW} height={15}
                rx={3}
                fill="var(--bg-panel, #0a1628)"
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={0.5}
              />
              {/* Label text */}
              <text
                x={labelX} y={y + 1}
                textAnchor="middle"
                fill={color}
                fontSize={9}
                fontFamily="Space Mono, monospace"
                fontWeight={600}
              >
                {msg.method}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected message detail */}
      {selected && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--bg-card2)] border border-[var(--border-bright)] text-xs animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-mono font-bold text-sm"
              style={{ color: METHOD_COLORS[selected.method.toUpperCase()] ?? '#5a7a9a' }}
            >
              {selected.method}
            </span>
            <span className="text-[var(--text-muted)]">{selected.direction}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-[var(--text-muted)]">
            <span>From: <span className="text-[var(--text-primary)]">{selected.from_uri}</span></span>
            <span>To: <span className="text-[var(--text-primary)]">{selected.to_uri}</span></span>
            <span>CSeq: <span className="text-[var(--text-primary)]">{selected.cseq ?? '—'}</span></span>
            <span>Time: <span className="text-[var(--text-primary)]">+{selected.timestamp.toFixed(3)}s</span></span>
            <span className="col-span-2 truncate" title={selected.raw_first_line}>
              Line: <span className="text-cyan">{selected.raw_first_line}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
