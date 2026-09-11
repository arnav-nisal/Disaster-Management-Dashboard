import React from 'react';
import { Trash2, ShieldCheck, Activity } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const AuditLogSidebar: React.FC = () => {
  const { auditLogs, unitFilter, setUnitFilter, clearAuditLogs } = useDisaster();

  const filteredLogs = auditLogs.filter((log) => {
    if (unitFilter === 'ALL') return true;
    return log.actor.includes(unitFilter);
  });

  return (
    <aside className="xl:col-span-4 glass-panel rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
      {/* Header with macOS-style glass controls */}
      <div className="p-4 border-b border-white/[0.08] bg-slate-900/40 rounded-t-3xl flex flex-col gap-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-xs font-semibold text-slate-200 tracking-wider uppercase ml-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Operational Dispatch Log
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-300">STREAMING</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-1">
            <label
              htmlFor="unitLogFilter"
              className="text-[11px] font-medium text-slate-400 whitespace-nowrap"
            >
              Filter Unit:
            </label>
            <select
              id="unitLogFilter"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-slate-900/80 border border-white/[0.08] text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500/60 w-full apple-transition"
            >
              <option value="ALL">ALL RESPONSE UNITS</option>
              <option value="COMMANDER DIRECTIVE">COMMANDER DIRECTIVES ONLY</option>
              <option value="NDRF RAPID UNIT">NDRF LOGISTICS &amp; RESCUE</option>
              <option value="CRISIS ASSESSMENT CELL">SITUATION ASSESSMENT CELL</option>
              <option value="CENTRAL DISPATCH">CENTRAL DISPATCH</option>
            </select>
          </div>
          <button
            onClick={clearAuditLogs}
            className="p-2 hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 rounded-xl border border-white/[0.06] transition"
            title="Clear log stream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Stream with Liquid Glass cards */}
      <div
        id="auditLogStream"
        className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 text-center py-12 font-medium">No logs recorded in this filter.</div>
        ) : (
          filteredLogs.map((log) => {
            let actorColor = 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10';
            if (log.actor.includes('COMMANDER DIRECTIVE')) {
              actorColor = 'text-amber-300 border-amber-500/30 bg-amber-500/15';
            } else if (log.actor.includes('CENTRAL DISPATCH')) {
              actorColor = 'text-slate-300 border-white/[0.08] bg-white/[0.04]';
            } else if (log.actor.includes('CRISIS ASSESSMENT')) {
              actorColor = 'text-sky-300 border-sky-500/20 bg-sky-500/10';
            }

            return (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] apple-transition"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="font-mono">{log.timestamp}</span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${actorColor}`}>
                    {log.actor}
                  </span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed font-normal">
                  {log.message}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-white/[0.08] bg-slate-900/40 rounded-b-3xl flex items-center justify-between text-[11px] text-slate-400 backdrop-blur-xl">
        <div className="flex items-center gap-2 truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">
            State Disaster Management Console • <span className="text-cyan-300">Live Telemetry Synchronized</span>
          </span>
        </div>
        <span className="text-slate-500 text-[10px] shrink-0 font-medium">RDRS v2.4</span>
      </div>
    </aside>
  );
};
