import React from 'react';
import { Header } from './components/header/Header';
import { ThreatRadarMap } from './components/map/ThreatRadarMap';
import { KanbanMatrix } from './components/kanban/KanbanMatrix';
import { IncidentCommandModal } from './components/modals/IncidentCommandModal';
// Old modal kept as backup:
// import { HumanOverrideModal } from './components/modals/HumanOverrideModal';
import { ToastContainer } from './components/common/ToastContainer';

export const AppContent: React.FC = () => {
  return (
    <div className="ambient-bg text-slate-100 font-sans w-full max-w-[1920px] mx-auto flex flex-col antialiased selection:bg-slate-700 selection:text-white min-h-screen">
      {/* Top Header */}
      <Header />

      {/* Main Workspace */}
      <main className="flex-1 px-4 xl:px-8 py-6 max-w-7xl mx-auto w-full pb-10 flex flex-col gap-6">
        {/* Live Incident Threat Map with GPS Plotting */}
        <ThreatRadarMap />

        {/* Kanban Incident Matrix */}
        <KanbanMatrix />
      </main>

      {/* Overlays & Modals */}
      <IncidentCommandModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}

