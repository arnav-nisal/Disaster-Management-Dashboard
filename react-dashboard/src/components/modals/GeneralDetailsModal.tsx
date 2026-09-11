import React from 'react';
import { 
  ShieldAlert, 
  X, 
  AlertOctagon, 
  Flame, 
  Users, 
  Crosshair, 
  ArrowRightCircle, 
  Layers, 
  Target, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const GeneralDetailsModal: React.FC = () => {
  const {
    isGeneralDetailsOpen,
    toggleGeneralDetailsModal,
    hotspots,
    inspectSpotFromIntel,
    switchRouteAndDrilldown,
    switchRoute
  } = useDisaster();

  if (!isGeneralDetailsOpen) return null;

  // Sorted strictly descending (HIGHEST RISK FIRST)
  const ranked = [...hotspots].sort((a, b) => b.severity - a.severity);
  const topSpot = ranked[0];
  const remaining = ranked.slice(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 apple-transition">
      <div className="glass-modal w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden border border-white/[0.14]">
        {/* Modal Header */}
        <div className="p-5 sm:px-7 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-2xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide uppercase">
                  National Disaster Threat Ranking &amp; Sector Intelligence
                </h3>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  HIGHEST PRIORITY FIRST
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>INCIDENT SEVERITY CLASSIFICATION</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-cyan-300 font-medium">
                  {hotspots.length} ACTIVE SECTORS MONITORED
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleGeneralDetailsModal(false)}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/[0.08] apple-transition"
            title="Close Briefing"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* #1 MOST CRITICAL SPOTLIGHT (APPLE LIQUID GLASS) */}
          {topSpot && (
            <div className="relative overflow-hidden rounded-3xl glass-panel border-rose-500/30 p-6 shadow-2xl glow-soft-rose">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3.5 w-3.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    HIGHEST DISASTER THREAT SECTOR #1
                  </span>
                  <span className="text-xs text-slate-400">
                    ID: <span className="text-white font-semibold font-mono">{topSpot.id}</span>
                  </span>
                </div>
                <span className="text-xs px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold tracking-wider">
                  THREAT LEVEL {topSpot.severity} / 10
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-2.5">
                  <h4 className="text-xl font-bold text-white tracking-wide">
                    {topSpot.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-rose-200/90 flex items-center gap-2 font-medium">
                    <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Disaster Threat: <strong className="text-white font-semibold">{topSpot.type}</strong></span>
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
                      <span className="text-slate-400 text-[10px] block">ESTIMATED CITIZEN IMPACT</span>
                      <span className="text-amber-200 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                        <Users className="w-4 h-4 text-amber-400" />
                        {topSpot.affected}
                      </span>
                    </div>
                    <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
                      <span className="text-slate-400 text-[10px] block">GEOSPATIAL COORDINATES</span>
                      <span className="text-cyan-300 font-semibold text-xs mt-0.5 block font-mono">{topSpot.coords}</span>
                    </div>
                    <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/[0.06] col-span-2 sm:col-span-1">
                      <span className="text-slate-400 text-[10px] block">LEAD RESPONSE WING</span>
                      <span className="text-cyan-200 font-semibold text-xs mt-0.5 truncate block">
                        {topSpot.leadUnit}
                      </span>
                    </div>
                  </div>

                  {/* District Preview */}
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Sector Breakdown by Priority:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(topSpot.districts || []).map((d) => (
                        <span
                          key={d.name}
                          className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-rose-200 text-xs rounded-xl flex items-center gap-1.5"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${d.dotClass}`} />
                          {d.name} (Level {d.severity}/10)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-4 lg:pt-0 lg:pl-6">
                  <button
                    onClick={() => inspectSpotFromIntel(topSpot.regionId)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 apple-transition active:scale-[0.98]"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span>LOCATE SECTOR ON MAP</span>
                  </button>
                  <button
                    onClick={() => switchRouteAndDrilldown(topSpot.regionId)}
                    className="w-full py-3 px-4 rounded-2xl glass-pill text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 apple-transition"
                  >
                    <ArrowRightCircle className="w-4 h-4 text-cyan-400" />
                    <span>OPEN REGIONAL BOARD</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBSEQUENT RANKED ZONES */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Subsequent Incident Sectors (Priority Descending)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Ranks #2 — #{ranked.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {remaining.map((spot, idx) => {
                const rank = idx + 2;
                const borderCol =
                  spot.severity >= 8
                    ? 'border-rose-500/30'
                    : spot.severity >= 5
                    ? 'border-amber-500/30'
                    : 'border-white/[0.08]';
                const badgeCol =
                  spot.severity >= 8
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : spot.severity >= 5
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30';

                return (
                  <div
                    key={spot.id}
                    className={`glass-panel-subtle border ${borderCol} rounded-3xl p-5 flex flex-col justify-between gap-3.5 shadow-md apple-transition hover:border-white/[0.18]`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-slate-300">
                            #{rank}
                          </span>
                          <div>
                            <h5 className="text-sm font-semibold text-white">
                              {spot.name}
                            </h5>
                            <span className="text-[11px] text-slate-400 block">
                              {spot.stateName}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeCol}`}>
                          Level {spot.severity}/10
                        </span>
                      </div>

                      <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/[0.06] text-xs space-y-1.5">
                        <div className="text-slate-300 truncate">
                          <span className="text-slate-400">Threat:</span>{' '}
                          <span className="text-amber-200 font-medium">{spot.type}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>
                            Affected: <strong className="text-slate-200 font-medium">{spot.affected}</strong>
                          </span>
                          <span>
                            Top Sector:{' '}
                            <strong className="text-rose-300 font-medium">
                              {spot.districts[0] ? spot.districts[0].name : 'Sector 1'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {spot.coords}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => inspectSpotFromIntel(spot.regionId)}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 text-xs font-medium flex items-center gap-1.5 apple-transition"
                        >
                          <Target className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Focus Map</span>
                        </button>
                        <button
                          onClick={() => switchRouteAndDrilldown(spot.regionId)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1 apple-transition"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-white/[0.03] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3.5 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Critical Threat Peak
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              High Priority
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Moderate Watch
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => toggleGeneralDetailsModal(false)}
              className="px-4 py-2 glass-pill rounded-xl text-slate-300 hover:text-white font-medium text-xs apple-transition"
            >
              Close Intel Brief
            </button>
            <button
              onClick={() => {
                toggleGeneralDetailsModal(false);
                switchRoute('/details/all');
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs apple-transition flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
            >
              <span>View Regional Matrix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
