import { useRef, useEffect } from 'react';
import { useCaptureStore } from '../store/captureStore';
import UploadZone from '../components/upload/UploadZone';
import StatsBar from '../components/dashboard/StatsBar';
import CallsTable from '../components/dashboard/CallsTable';
import ErrorLog from '../components/dashboard/ErrorLog';
import PacketDonut from '../components/dashboard/PacketDonut';
import SipLadder from '../components/ladder/SipLadder';
import EventTimeline from '../components/ladder/EventTimeline';
import QualityMetrics from '../components/rtp/QualityMetrics';
import CodecBars from '../components/rtp/CodecBars';
import JitterChart from '../components/rtp/JitterChart';
import ProtocolGuide from '../components/learn/ProtocolGuide';

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="h-px flex-1 bg-[var(--border)]" />
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold px-2">{title}</span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

function Card({ title, icon, children, className = '' }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)]">
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
        <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

interface DashboardProps {
  uploadTriggerRef: React.MutableRefObject<(() => void) | null>;
  scrollTo?: string;
}

export default function Dashboard({ uploadTriggerRef, scrollTo }: DashboardProps) {
  const { analysis, selectedCall } = useCaptureStore();
  const errorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollTo === 'errors' && errorsRef.current) {
      errorsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrollTo]);

  const allStreams = analysis?.calls.flatMap((c) => c.rtp_streams) ?? [];
  const primaryCall = selectedCall ?? analysis?.calls[0] ?? null;
  const primaryStream = primaryCall?.rtp_streams[0] ?? allStreams[0] ?? null;

  return (
    <div className="px-6 py-5 max-w-[1400px] mx-auto">
      {/* Upload Zone */}
      <UploadZone
        collapsed={!!analysis}
        triggerRef={uploadTriggerRef}
      />

      {!analysis && (
        <div className="mt-8">
          <ProtocolGuide />
        </div>
      )}

      {analysis && (
        <div className="animate-fade-in">
          {/* Stats Bar */}
          <StatsBar stats={analysis.stats} />

          {/* SIP Call Flow */}
          <SectionDivider title="SIP Call Flow Analysis" />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card title="SIP Ladder" className="xl:col-span-2">
              {primaryCall ? (
                <SipLadder
                  messages={primaryCall.messages}
                  rtp_streams={primaryCall.rtp_streams}
                  call={primaryCall}
                />
              ) : (
                <p className="text-xs text-[var(--text-muted)] text-center py-8">No calls — select a call from the table below</p>
              )}
            </Card>
            <div className="flex flex-col gap-4">
              <Card title="Event Timeline">
                {primaryCall ? (
                  <EventTimeline messages={primaryCall.messages} />
                ) : (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">No call selected</p>
                )}
              </Card>
              <Card title="Quality Metrics">
                {primaryCall ? (
                  <QualityMetrics call={primaryCall} />
                ) : (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">No call selected</p>
                )}
              </Card>
            </div>
          </div>

          {/* Media & RTP */}
          <SectionDivider title="Media & RTP Analysis" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Codec Distribution">
              <CodecBars streams={allStreams} />
            </Card>
            <Card title="Jitter Over Time">
              {primaryStream ? (
                <JitterChart stream={primaryStream} />
              ) : (
                <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-xs">
                  No RTP streams in this capture
                </div>
              )}
            </Card>
            <Card title="Packet Breakdown">
              <PacketDonut stats={analysis.stats} />
            </Card>
          </div>

          {/* All Calls */}
          <SectionDivider title="All Calls in Capture" />
          <Card title={`Call Records (${analysis.calls.length})`}>
            <CallsTable calls={analysis.calls} />
          </Card>

          {/* Errors & Guide */}
          <div ref={errorsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card title={`SIP Errors (${analysis.errors.length})`}>
              <ErrorLog errors={analysis.errors} />
            </Card>
            <Card title="Protocol Reference">
              <ProtocolGuide compact />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
