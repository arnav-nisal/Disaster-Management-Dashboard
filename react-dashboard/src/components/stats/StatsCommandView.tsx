import React from 'react';
import { 
  BarChart3, 
  Flame, 
  Users, 
  Package, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { ResourceInventory } from '../kpi/ResourceInventory';

export const StatsCommandView: React.FC = () => {
  const { incidents } = useDisaster();

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity >= 8 && i.status !== 'Resolved').length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;
  const inProgressCount = totalIncidents - resolvedCount;

  // Category tally
  const categories = incidents.reduce((acc, inc) => {
    const cat = inc.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* View Header */}
      <div className="glass-panel px-6 py-4 rounded-2xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              National Preparedness &amp; Incident Analytics
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time resource allocation, severity distribution, and operational metrics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
            Readiness Index: 98.4%
          </span>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Emergencies */}
        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Tracked Incidents</span>
            <div className="text-2xl font-bold text-white mt-1">{totalIncidents}</div>
            <div className="text-[11px] text-cyan-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Live Synced
            </div>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Red Zones */}
        <div className="glass-panel rounded-2xl p-4 border border-rose-500/30 glow-soft-rose flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Critical Red Zones (Sev 8-10)
            </span>
            <div className="text-2xl font-bold text-rose-200 mt-1">{criticalCount}</div>
            <div className="text-[10px] text-rose-300 font-medium mt-1 uppercase">
              Immediate Priority
            </div>
          </div>
          <div className="p-3 bg-rose-500/15 rounded-xl text-rose-400 border border-rose-500/30">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Response Units Deployed */}
        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Field Units</span>
            <div className="text-2xl font-bold text-cyan-300 mt-1">14 Battalions</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Operational
            </div>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Resolved Triage */}
        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Resolved &amp; Cleared</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{resolvedCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              {inProgressCount} in active containment
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Supplies Inventory & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Resource Inventory */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                Strategic Emergency Supplies
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Central Warehouses</span>
          </div>
          <ResourceInventory />
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Incident Category Distribution
            </h3>
            <span className="text-xs text-cyan-400 font-mono">Live Triage</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categories).map(([category, count]) => {
              const pct = Math.round((count / (totalIncidents || 1)) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCommandView;
