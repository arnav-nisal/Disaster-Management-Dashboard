import React from 'react';
import { 
  Layers,
  Activity
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const Header: React.FC = () => {
  const {
    activeRegionFilter,
    toggleAutoDispatch,
    isAutoDispatchActive,
    incidents
  } = useDisaster();

  const criticalCount = incidents.filter((i) => i.severity >= 8 && i.status !== 'Resolved').length;

  return (
    <header className="border-b border-white/[0.08] bg-[#0b1320]/80 backdrop-blur-2xl sticky top-0 z-30 px-6 py-2.5 shrink-0 shadow-md">
      <div className="w-full flex items-center justify-between gap-4 py-0.5">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
              National Incident Command System
            </h1>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              ICS-20
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              FIRESTORE SYNCED
            </span>
          </div>

          {activeRegionFilter && (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SECTOR: {activeRegionFilter.toUpperCase()}
            </span>
          )}
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>{criticalCount} CRITICAL ALERT{criticalCount !== 1 ? 'S' : ''}</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">DEPLOYED:</span>
            <span className="text-emerald-400 font-semibold">14 BATTALIONS</span>
          </div>

          <button
            onClick={toggleAutoDispatch}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium tracking-wide transition-all ${
              isAutoDispatchActive
                ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900/40 hover:bg-slate-800/60 border-white/[0.06] text-slate-400'
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
    </header>
  );
};

