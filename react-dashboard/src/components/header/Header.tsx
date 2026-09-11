import React from 'react';
import { 
  ShieldAlert, 
  Map, 
  Kanban, 
  Radio, 
  PlusCircle, 
  Layers,
  Activity
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { KpiDeck } from '../kpi/KpiDeck';

export const Header: React.FC = () => {
  const {
    currentRoute,
    activeRegionFilter,
    switchRoute,
    simulateDisasterEvent,
    toggleAutoDispatch,
    isAutoDispatchActive
  } = useDisaster();

  const isMapRoute = currentRoute === '/';

  return (
    <header className="border-b border-white/[0.08] bg-slate-950/75 backdrop-blur-2xl sticky top-0 z-30 px-6 py-2.5 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
      <div className="w-full flex items-center justify-between gap-4 px-2 xl:px-4 py-0.5">
        {/* Brand & Telemetry */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent border border-cyan-400/30 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <ShieldAlert className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm tracking-wide text-white uppercase flex items-center gap-2">
                National Incident Command System
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  ICS-20 • ACTIVE
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="font-medium">DISASTER RESPONSE &amp; LOGISTICS</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FIRESTORE REAL-TIME SYNCED
              </span>
            </p>
          </div>
        </div>

        {/* Apple-style Segmented Route Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-2xl border border-white/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <button
            id="tabBtnMap"
            onClick={() => switchRoute('/')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium apple-transition ${
              isMapRoute
                ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.12]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-cyan-400" />
            <span>2D Threat Radar</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/[0.08] text-[10px] text-slate-300">
              Map
            </span>
          </button>

          <button
            id="tabBtnKanban"
            onClick={() => switchRoute('/details/all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium apple-transition ${
              !isMapRoute
                ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.12]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Kanban className="w-3.5 h-3.5 text-slate-400" />
            <span>Regional Board</span>
            <span
              id="activeRegionBadge"
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                activeRegionFilter
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/[0.08] text-slate-300'
              }`}
            >
              {activeRegionFilter ? activeRegionFilter.split(' ')[0].toUpperCase() : 'ALL SECTORS'}
            </span>
          </button>
        </div>

        {/* Controls & Operations */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-white/[0.06] text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">FIELD BATTALIONS:</span>
            <span className="text-emerald-400 font-semibold">14 DEPLOYED</span>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>TELEMETRY: 24ms</span>
          </div>

          <button
            onClick={simulateDisasterEvent}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-medium tracking-wide shadow-md shadow-rose-950/40 border border-rose-400/30 active:scale-95 apple-transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Incident</span>
          </button>

          <button
            onClick={toggleAutoDispatch}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium tracking-wide apple-transition ${
              isAutoDispatchActive
                ? 'bg-slate-900/60 hover:bg-slate-800/80 border-white/[0.12] text-cyan-300'
                : 'bg-slate-900/30 hover:bg-slate-800/50 border-white/[0.06] text-slate-400'
            }`}
          >
            <Activity
              className={`w-3.5 h-3.5 ${isAutoDispatchActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}
            />
            <span>
              Auto-Routing: {isAutoDispatchActive ? 'ACTIVE' : 'HOLD'}
            </span>
          </button>
        </div>
      </div>

      {/* KPI & Tactical Inventory Deck */}
      <KpiDeck />
    </header>
  );
};
