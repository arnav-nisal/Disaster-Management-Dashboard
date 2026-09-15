import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useDisaster } from './context/DisasterContext';
import { Header } from './components/header/Header';
import { ThreatRadarMap } from './components/map/ThreatRadarMap';
import { KanbanMatrix } from './components/kanban/KanbanMatrix';
import { AuditLogSidebar } from './components/sidebar/AuditLogSidebar';
import { NavigationSidebar } from './components/sidebar/NavigationSidebar';
import { StatsCommandView } from './components/stats/StatsCommandView';
import { HumanOverrideModal } from './components/modals/HumanOverrideModal';
import { GeneralDetailsModal } from './components/modals/GeneralDetailsModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const AppContent: React.FC = () => {
  const {
    currentRoute,
    activeRegionFilter,
    switchRoute,
    hotspots
  } = useDisaster();

  const isMapRoute = currentRoute === '/';
  const isStatsRoute = currentRoute === '/stats';
  const isKanbanRoute = currentRoute.startsWith('/details');

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
    <div className="flex h-screen w-full bg-[#070c15] text-slate-100 font-sans antialiased overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* 1. Left Operational Navigation Sidebar (UptimeRobot Inspired) */}
      <NavigationSidebar />

      {/* 2. Main Workspace & View Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-gradient-to-b from-[#0b1320] via-[#09101b] to-[#070c15]">
        {/* Top Command Status Bar */}
        <Header />

        {/* Main Content Body */}
        <main className="flex-1 p-4 xl:p-6 w-full max-w-[1920px] mx-auto">
          {/* A. THREAT RADAR VIEW (Map + Matching Height Logs) */}
          {isMapRoute && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start w-full">
              {/* Left 8 Cols: Threat Map */}
              <div className="xl:col-span-8 w-full">
                <ErrorBoundary fallbackTitle="Tactical Map Error">
                  <ThreatRadarMap />
                </ErrorBoundary>
              </div>

              {/* Right 4 Cols: Compact Dispatch Logs matching map length */}
              <div className="xl:col-span-4 w-full">
                <ErrorBoundary fallbackTitle="Audit Logs Error">
                  <AuditLogSidebar />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* B. REGIONAL BOARD VIEW (Kanban Matrix) */}
          {isKanbanRoute && (
            <div className="flex flex-col gap-4 w-full">
              {/* Breadcrumb Header */}
              <div
                id="routeBreadcrumbBar"
                className="flex items-center justify-between glass-panel p-3.5 rounded-2xl border border-white/[0.08] shadow-md shrink-0"
              >
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => switchRoute('/')}
                    className="flex items-center gap-2 text-cyan-300 hover:text-white glass-pill px-3 py-1.5 rounded-xl font-medium transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Return to Threat Radar</span>
                  </button>
                  <span className="text-slate-600">/</span>
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

              <KanbanMatrix />
            </div>
          )}

          {/* C. STATS & ANALYTICS VIEW */}
          {isStatsRoute && (
            <ErrorBoundary fallbackTitle="Analytics Dashboard Error">
              <StatsCommandView />
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* Overlays & Modals */}
      <HumanOverrideModal />
      <GeneralDetailsModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Situation Room Dashboard Error">
      <AppContent />
    </ErrorBoundary>
  );
}

