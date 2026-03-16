import { useState, useMemo } from 'react';
import { Package, Search, X } from 'lucide-react';
import { useCaptureStore } from '../store/captureStore';
import type { SipMessage } from '../types';

const METHOD_COLORS: Record<string, string> = {
  INVITE: '#00c8ff', REGISTER: '#00c8ff',
  '100': '#5a7a9a', '180': '#ff8c42', '183': '#ff8c42',
  '200': '#00ffa3', '202': '#00ffa3',
  ACK: '#9b5de5', BYE: '#ff4d6d', CANCEL: '#ff4d6d',
};

interface FlatMessage extends SipMessage {
  callIdShort: string;
}

export default function PacketView() {
  const { analysis } = useCaptureStore();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [selected, setSelected] = useState<FlatMessage | null>(null);

  const allMessages: FlatMessage[] = useMemo(() => {
    if (!analysis) return [];
    return analysis.calls
      .flatMap((c) =>
        c.messages.map((m) => ({
          ...m,
          callIdShort: c.call_id.slice(0, 16),
        }))
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [analysis]);

  const methods = useMemo(
    () => [...new Set(allMessages.map((m) => m.method))].sort(),
    [allMessages]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allMessages.filter((m) => {
      const matchMethod = !methodFilter || m.method === methodFilter;
      const matchSearch =
        !q ||
        m.call_id.toLowerCase().includes(q) ||
        m.src_ip.includes(q) ||
        m.dst_ip.includes(q) ||
        m.from_uri.toLowerCase().includes(q) ||
        m.to_uri.toLowerCase().includes(q) ||
        m.method.toLowerCase().includes(q) ||
        m.raw_first_line.toLowerCase().includes(q);
      return matchMethod && matchSearch;
    });
  }, [allMessages, search, methodFilter]);

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)] p-8">
        <Package size={36} />
        <p className="text-sm">No capture loaded</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-bold text-[var(--text-primary)]">
          Packet View
          <span className="ml-2 text-[var(--text-muted)] font-normal font-mono">({filtered.length} / {allMessages.length})</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={12} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search IP, Call-ID, URI, method…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] flex-1 font-mono"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={11} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setMethodFilter('')}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
              !methodFilter
                ? 'bg-cyan/10 text-cyan border-cyan/30'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-bright)]'
            }`}
          >
            ALL
          </button>
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m === methodFilter ? '' : m)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                methodFilter === m
                  ? 'border-opacity-50 border'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-bright)]'
              }`}
              style={
                methodFilter === m
                  ? { color: METHOD_COLORS[m] ?? '#5a7a9a', borderColor: METHOD_COLORS[m] ?? '#5a7a9a', backgroundColor: `${METHOD_COLORS[m] ?? '#5a7a9a'}15` }
                  : {}
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--bg-card)] z-10">
              <tr className="border-b border-[var(--border)]">
                {['Time', 'Method', 'From', 'To', 'Call-ID', 'Direction'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((msg, i) => (
                <tr
                  key={i}
                  onClick={() => setSelected(selected?.timestamp === msg.timestamp && selected.method === msg.method ? null : msg)}
                  className={`border-b border-[var(--border)] cursor-pointer transition-colors ${
                    selected?.timestamp === msg.timestamp && selected.method === msg.method
                      ? 'bg-cyan/5'
                      : 'hover:bg-white/3'
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-[var(--text-dim)]">
                    +{msg.timestamp.toFixed(3)}s
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="font-mono text-[10px] font-bold"
                      style={{ color: METHOD_COLORS[msg.method.toUpperCase()] ?? '#5a7a9a' }}
                    >
                      {msg.method}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--text-muted)] max-w-[130px]">
                    <span className="block truncate" title={msg.from_uri}>{msg.from_uri.replace('sip:', '')}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--text-muted)] max-w-[130px]">
                    <span className="block truncate" title={msg.to_uri}>{msg.to_uri.replace('sip:', '')}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--text-dim)] max-w-[120px]">
                    <span className="block truncate" title={msg.call_id}>{msg.callIdShort}…</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--text-dim)] max-w-[180px] text-[9px]">
                    <span className="block truncate">{msg.direction}</span>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)] text-xs">
                    No packets match the current filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 p-4 bg-[var(--bg-card)] border border-[var(--border-bright)] rounded-xl animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-mono font-bold"
              style={{ color: METHOD_COLORS[selected.method.toUpperCase()] ?? '#5a7a9a' }}
            >
              {selected.method}
            </span>
            <button onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono">
            {[
              ['From', selected.from_uri],
              ['To', selected.to_uri],
              ['Src', `${selected.src_ip}:${selected.src_port}`],
              ['Dst', `${selected.dst_ip}:${selected.dst_port}`],
              ['Call-ID', selected.call_id],
              ['CSeq', selected.cseq ?? '—'],
              ['Timestamp', `+${selected.timestamp.toFixed(6)}s`],
              ['First line', selected.raw_first_line],
            ].map(([k, v]) => (
              <div key={k} className="col-span-1">
                <span className="text-[var(--text-dim)] text-[8px] uppercase tracking-wider block">{k}</span>
                <span className="text-[var(--text-primary)] break-all">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
