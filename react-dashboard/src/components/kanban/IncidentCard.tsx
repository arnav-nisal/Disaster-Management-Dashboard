import React from 'react';
import { SlidersHorizontal, Clock, UserCheck } from 'lucide-react';
import { Incident } from '../../types/disaster';
import { useDisaster } from '../../context/DisasterContext';

interface IncidentCardProps {
  incident: Incident;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
  const { openOverrideModal } = useDisaster();

  const isCritical = incident.severity >= 8;
  const badgeClass = isCritical
    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : incident.severity >= 5
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-sky-500/15 text-sky-300 border-sky-500/30';

  return (
    <div className="glass-panel-subtle rounded-2xl p-4 space-y-3 shadow-md hover:border-white/[0.16] apple-transition group">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" /> {incident.id} • {incident.timestamp}
          </span>
          <h4 className="font-semibold text-xs text-white mt-1 group-hover:text-cyan-300 apple-transition">
            {incident.location}
          </h4>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
          Level {incident.severity}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(incident.requestedResources || []).map((r, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-white/[0.04] text-[10px] text-slate-300 rounded-lg border border-white/[0.06]"
          >
            {r}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-white/[0.06]">
        <span className="text-cyan-300 font-medium flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-cyan-400" />
          {incident.assignedUnit}
        </span>
        <span className="text-slate-400 font-medium bg-white/[0.04] px-2 py-0.5 rounded-md">
          {incident.status}
        </span>
      </div>

      <button
        onClick={() => openOverrideModal(incident.id)}
        className="w-full py-1.5 bg-white/[0.04] hover:bg-amber-500/15 text-slate-300 hover:text-amber-300 border border-white/[0.08] hover:border-amber-500/30 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 apple-transition"
      >
        <SlidersHorizontal className="w-3 h-3 text-amber-400" />
        <span>Commander Directive</span>
      </button>
    </div>
  );
};
