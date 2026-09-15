import React from 'react';
import { 
  Map, 
  Kanban, 
  BarChart3, 
  ShieldCheck, 
  Activity,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const NavigationSidebar: React.FC = () => {
  const {
    currentRoute,
    switchRoute,
    incidents,
    activeRegionFilter,
    isAutoDispatchActive,
    toggleAutoDispatch
  } = useDisaster();

  const isMapRoute = currentRoute === '/';
  const isKanbanRoute = currentRoute.startsWith('/details');
  const isStatsRoute = currentRoute === '/stats';

  const criticalCount = incidents.filter((i) => i.severity >= 8 && i.status !== 'Resolved').length;
  const activeCount = incidents.length;

  return (
    <aside className="w-64 bg-[#0a111d] border-r border-white/[0.08] flex flex-col justify-between shrink-0 min-h-screen text-slate-300 select-none z-20">
      {/* Top Branding */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-transparent border border-cyan-400/30 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">
                SENTINEL OPS
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                NDRF
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DISASTER RADAR • LIVE
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Core Operations Menu */}
        <div>
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Operations Center
          </div>
          <nav className="space-y-1">
            {/* 1. Threat Radar Map */}
            <button
              onClick={() => switchRoute('/')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isMapRoute
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Map className={`w-4 h-4 ${isMapRoute ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>Threat Radar</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                isMapRoute
                  ? 'bg-cyan-500/25 text-cyan-200'
                  : 'bg-white/[0.06] text-slate-400'
              }`}>
                {activeCount}
              </span>
            </button>

            {/* 2. Regional Board (Kanban) */}
            <button
              onClick={() => switchRoute('/details/all')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isKanbanRoute
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Kanban className={`w-4 h-4 ${isKanbanRoute ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>Regional Board</span>
              </div>
              {criticalCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  {criticalCount} CRIT
                </span>
              )}
            </button>

            {/* 3. Stats & Analytics */}
            <button
              onClick={() => switchRoute('/stats')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isStatsRoute
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-4 h-4 ${isStatsRoute ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>Stats &amp; Metrics</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-400">
                KPIs
              </span>
            </button>
          </nav>
        </div>

        {/* Quick Tactical Controls */}
        <div>
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Automations &amp; Status
          </div>
          <div className="space-y-2 px-1">
            {/* Auto Dispatch Toggle */}
            <button
              onClick={toggleAutoDispatch}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                isAutoDispatchActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15'
                  : 'bg-slate-900/40 border-white/[0.06] text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className={`w-3.5 h-3.5 ${isAutoDispatchActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Auto-Dispatch</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                isAutoDispatchActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {isAutoDispatchActive ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Sync health badge */}
            <div className="p-3 rounded-xl bg-slate-900/30 border border-white/[0.05] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync Protocol</span>
              </div>
              <span className="text-[10px] font-mono font-medium text-emerald-400">
                Real-time
              </span>
            </div>

            {/* Sector status if filtered */}
            {activeRegionFilter && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="text-[10px] text-amber-400/80 uppercase font-mono font-semibold mb-0.5">
                  Sector Filter Active
                </div>
                <div className="text-amber-200 font-bold truncate">
                  {activeRegionFilter}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Profile - Matching UptimeRobot Style */}
      <div className="p-3 border-t border-white/[0.08] bg-[#070d17]/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Pill */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-cyan-950/40 border border-cyan-400/30">
              AN.
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-100 truncate">
                Arnav Nisal
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Incident Commander
              </div>
            </div>
          </div>
          <div className="text-slate-400 hover:text-white transition p-1">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default NavigationSidebar;
