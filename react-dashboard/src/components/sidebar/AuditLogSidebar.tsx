import React from 'react';
import { Trash2, ShieldCheck, Activity } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const AuditLogSidebar: React.FC = () => {
  const { auditLogs, unitFilter, setUnitFilter, clearAuditLogs } = useDisaster();

  const filteredLogs = auditLogs.filter((log) => {
    if (unitFilter === 'ALL') return true;
    return (log.actor || '').includes(unitFilter);
  });

  return (
    <aside className="w-full h-[600px] xl:h-[715px] glass-panel rounded-2xl flex flex-col shadow-xl overflow-hidden border border-white/[0.08]">
      {/* Header with macOS-style glass controls */}
      <div className="p-3 border-b border-white/[0.08] bg-slate-900/50 rounded-t-2xl flex flex-col gap-2.5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500/80" />
              <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-bold text-slate-200 tracking-wide uppercase ml-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Incident Audit Stream
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-medium text-emerald-300">LIVE</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <select
              id="unitLogFilter"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-slate-900/80 border border-white/[0.08] text-slate-200 text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500/60 w-full transition"
            >
              <option value="ALL">ALL UNITS &amp; DIRECTIVES</option>
              <option value="COMMANDER DIRECTIVE">COMMANDER DIRECTIVES ONLY</option>
              <option value="NDRF RAPID UNIT">NDRF RESCUE UNITS</option>
              <option value="CRISIS ASSESSMENT CELL">ASSESSMENT CELL</option>
              <option value="CENTRAL DISPATCH">CENTRAL DISPATCH</option>
            </select>
          </div>
          <button
            onClick={clearAuditLogs}
            className="p-1.5 hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 rounded-lg border border-white/[0.06] transition"
            title="Clear log stream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Stream with Liquid Glass cards */}
      <div
        id="auditLogStream"
        className="flex-1 p-2.5 overflow-y-auto space-y-2 text-xs scrollbar-thin"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 text-center py-12 text-xs font-medium">No logs recorded in this filter.</div>
        ) : (
          filteredLogs.map((log) => {
            const actorText = typeof log.actor === 'string' ? log.actor : 'SYSTEM';
            let actorColor = 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10';
            if (actorText.includes('COMMANDER DIRECTIVE')) {
              actorColor = 'text-amber-300 border-amber-500/30 bg-amber-500/15';
            } else if (actorText.includes('CENTRAL DISPATCH') || actorText.includes('ALLOCATION')) {
              actorColor = 'text-slate-300 border-white/[0.08] bg-white/[0.04]';
            } else if (actorText.includes('CRISIS') || actorText.includes('TRIAGE')) {
              actorColor = 'text-sky-300 border-sky-500/20 bg-sky-500/10';
            }

            const msgText = typeof log.message === 'string'
              ? log.message
              : typeof log.message === 'object'
              ? JSON.stringify(log.message)
              : 'Operational event recorded.';

            return (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-mono text-slate-400">{log.timestamp || '00:00:00'}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${actorColor}`}>
                    {actorText}
                  </span>
                </div>
                <p className="text-slate-200 text-[11px] leading-snug font-normal">
                  {msgText}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-white/[0.08] bg-slate-900/50 rounded-b-2xl flex items-center justify-between text-[10px] text-slate-400 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate">
            Live Telemetry Synced
          </span>
        </div>
        <span className="text-slate-500 text-[10px] shrink-0 font-mono">ICS-LOG</span>
      </div>
    </aside>
  );
};
