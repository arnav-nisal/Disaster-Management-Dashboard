import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useDisaster } from './context/DisasterContext';
import { Header } from './components/header/Header';
import { ThreatRadarMap } from './components/map/ThreatRadarMap';
import { KanbanMatrix } from './components/kanban/KanbanMatrix';
import { AuditLogSidebar } from './components/sidebar/AuditLogSidebar';
import { HumanOverrideModal } from './components/modals/HumanOverrideModal';
import { GeneralDetailsModal } from './components/modals/GeneralDetailsModal';
import { ToastContainer } from './components/common/ToastContainer';

export const AppContent: React.FC = () => {
  const {
    currentRoute,
    activeRegionFilter,
    switchRoute,
    hotspots
  } = useDisaster();

  const isMapRoute = currentRoute === '/';

  // Determine active region status text
  let focusedRegionName = 'ALL REGIONS';
  let focusedRegionStatus = 'MULTI-ZONE VIEW';

  if (activeRegionFilter) {
    focusedRegionName = activeRegionFilter;
    const spot = hotspots.find(
      (s) =>
        s.name.toLowerCase().includes(activeRegionFilter.toLowerCase()) ||
        activeRegionFilter.toLowerCase().includes(s.name.toLowerCase())
    );
    if (spot) {
      focusedRegionStatus = `CRITICAL SEV-${spot.severity}`;
    } else {
      focusedRegionStatus = 'ZONE FILTERED';
    }
  }

  return (
    <div className="ambient-bg text-slate-100 font-sans w-full max-w-[1920px] mx-auto flex flex-col antialiased selection:bg-teal-500 selection:text-black">
      {/* Top Header & Branding / Network Telemetry & KPI Deck */}
      <Header />

      {/* Main Workspace */}
      <main className="flex-1 px-4 xl:px-6 py-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start max-w-[1920px] mx-auto w-full pb-10">
        {/* Left 65% Panel (Map / Kanban) */}
        <div className="xl:col-span-8 flex flex-col gap-3.5 w-full">
          {/* Breadcrumb Bar (When drilling into Kanban) */}
          {!isMapRoute && (
            <div
              id="routeBreadcrumbBar"
              className="flex items-center justify-between glass-panel p-3.5 rounded-2xl border border-white/[0.08] shadow-md shrink-0"
            >
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => switchRoute('/')}
                  className="flex items-center gap-2 text-cyan-300 hover:text-white glass-pill px-3 py-1.5 rounded-xl font-medium apple-transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Return to Geospatial Map</span>
                </button>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400 font-medium">Focused Sector:</span>
                <span
                  id="breadcrumbRegionText"
                  className="font-bold text-amber-300 uppercase tracking-wide"
                >
                  {focusedRegionName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">STATUS:</span>
                <span
                  id="breadcrumbRegionStatus"
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                >
                  {focusedRegionStatus}
                </span>
              </div>
            </div>
          )}

          {/* View Container */}
          <div className="w-full">
            {isMapRoute ? <ThreatRadarMap /> : <KanbanMatrix />}
          </div>
        </div>

        {/* Right 35% Sidebar: Incident Dispatch & Activity Log */}
        <AuditLogSidebar />
      </main>

      {/* Overlays & Modals */}
      <HumanOverrideModal />
      <GeneralDetailsModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
