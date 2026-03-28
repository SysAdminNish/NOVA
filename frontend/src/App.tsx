import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import LadderView from './pages/LadderView';
import RtpStreams from './pages/RtpStreams';
import PacketView from './pages/PacketView';
import Quality from './pages/Quality';
import CodecInfo from './pages/CodecInfo';
import ProtocolGuide from './components/learn/ProtocolGuide';
import SipGlossary from './components/learn/SipGlossary';

function AppShell() {
  const uploadTriggerRef = useRef<(() => void) | null>(null);

  return (
    <div className="flex h-screen bg-deep overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onUploadClick={() => uploadTriggerRef.current?.()} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard uploadTriggerRef={uploadTriggerRef} />} />
            <Route path="/ladder/:callId" element={<LadderView />} />
            <Route path="/rtp" element={<RtpStreams />} />
            <Route path="/packets" element={<PacketView />} />
            <Route path="/errors" element={<Dashboard uploadTriggerRef={uploadTriggerRef} scrollTo="errors" />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/codecs" element={<CodecInfo />} />
            <Route path="/glossary" element={<SipGlossary standalone />} />
            <Route path="/guide" element={<ProtocolGuide standalone />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
