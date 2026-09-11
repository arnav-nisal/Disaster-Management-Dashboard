import React from 'react';
import { AlertCircle, TrendingUp, Flame, Users } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { ResourceInventory } from './ResourceInventory';

export const KpiDeck: React.FC = () => {
  const { incidents } = useDisaster();

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity >= 8 && i.status !== 'Resolved').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3.5 mt-3 pt-2.5 border-t border-white/[0.06] items-center">
      {/* Total Incidents */}
      <div className="xl:col-span-2 glass-panel-subtle rounded-2xl px-4 py-2.5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium tracking-wide text-slate-400">
            Active Incidents
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              {totalIncidents}
            </span>
            <span className="text-[11px] text-rose-400 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 inline mr-0.5" /> +3 / hr
            </span>
          </div>
        </div>
        <div className="p-2.5 bg-white/[0.05] rounded-xl text-cyan-400 border border-white/[0.08]">
          <AlertCircle className="w-4 h-4" />
        </div>
      </div>

      {/* Critical Threat Zones (SEV 8-10) */}
      <div className="xl:col-span-3 glass-panel rounded-2xl px-4 py-2.5 flex items-center justify-between glow-soft-rose border-rose-500/30">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium tracking-wide text-rose-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Critical Red Zones (Sev 8-10)
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-rose-200 tracking-tight">
              {criticalCount}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
              URGENT RESPONSE
            </span>
          </div>
        </div>
        <div className="p-2.5 bg-rose-500/15 rounded-xl text-rose-400 border border-rose-500/30">
          <Flame className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      {/* Response Battalions */}
      <div className="xl:col-span-2 glass-panel-subtle rounded-2xl px-4 py-2.5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium tracking-wide text-slate-400">
            Emergency Battalions
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-cyan-300 tracking-tight">
              12 Units
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              100% Ready
            </span>
          </div>
        </div>
        <div className="p-2.5 bg-white/[0.05] rounded-xl text-cyan-400 border border-white/[0.08]">
          <Users className="w-4 h-4" />
        </div>
      </div>

      {/* Emergency Supplies Inventory */}
      <ResourceInventory />
    </div>
  );
};
