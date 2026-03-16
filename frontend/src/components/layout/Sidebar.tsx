import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, Radio, Package,
  AlertTriangle, Target, Speaker, BookOpen, Network, FileText,
} from 'lucide-react';
import { useCaptureStore } from '../../store/captureStore';

function NavItem({
  to, icon: Icon, label, badge, badgeColor = 'bg-voip-red',
}: {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: number;
  badgeColor?: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-cyan/10 text-cyan border border-cyan/20'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
        }`
      }
    >
      <Icon size={15} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`${badgeColor} text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full leading-none`}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { analysis, selectedCall, reset } = useCaptureStore();
  const navigate = useNavigate();

  const errorCount = analysis?.errors.length ?? 0;
  const streamCount = analysis?.calls.reduce((n, c) => n + c.rtp_streams.length, 0) ?? 0;

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border)] h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[var(--border)]">
        <button
          onClick={() => { reset(); navigate('/'); }}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center">
            <Network size={16} className="text-cyan" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono tracking-wider">NOVA</div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest leading-none">VoIP Analyser</div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        {selectedCall && (
          <NavItem to={`/ladder/${encodeURIComponent(selectedCall.call_id)}`} icon={GitBranch} label="SIP Ladder" />
        )}
        <NavItem to="/rtp" icon={Radio} label="RTP Streams" badge={streamCount} badgeColor="bg-cyan/70" />
        <NavItem to="/packets" icon={Package} label="Packet View" />
        <NavItem to="/errors" icon={AlertTriangle} label="Errors" badge={errorCount} badgeColor="bg-voip-red" />
        <NavItem to="/quality" icon={Target} label="Quality" />
        <NavItem to="/codecs" icon={Speaker} label="Codec Info" />

        <div className="pt-3 pb-1">
          <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] px-3 font-semibold">Learn</div>
        </div>
        <NavItem to="/glossary" icon={FileText} label="SIP Glossary" />
        <NavItem to="/guide" icon={BookOpen} label="Protocol Guide" />
      </nav>

      {/* File status footer */}
      {analysis && (
        <div className="m-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse-dot inline-block" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Loaded</span>
          </div>
          <p className="text-xs text-[var(--text-primary)] font-mono truncate" title={analysis.stats.filename}>
            {analysis.stats.filename}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
            {analysis.stats.total_packets.toLocaleString()} pkts · {analysis.stats.capture_duration_sec.toFixed(1)}s
          </p>
        </div>
      )}
    </aside>
  );
}
