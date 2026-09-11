import React from 'react';
import { X, ArrowRight, Shield, Users, Radio, Navigation } from 'lucide-react';
import { Hotspot } from '../../types/disaster';

interface DistrictFocusCardProps {
  hotspot: Hotspot;
  onClose: () => void;
  onViewDetail: () => void;
}

export const DistrictFocusCard: React.FC<DistrictFocusCardProps> = ({
  hotspot,
  onClose,
  onViewDetail,
}) => {
  const sortedDistricts = [...(hotspot.districts || [])].sort(
    (a, b) => b.severity - a.severity
  );

  const getSeverityLabel = (sev: number) => {
    if (sev >= 8) return 'CRITICAL';
    if (sev >= 5) return 'HIGH';
    return 'MODERATE';
  };

  return (
    <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-[480px] z-20 glass-modal rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] apple-transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
          <div>
            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Regional Situation Brief
            </span>
            <h3 className="font-bold text-base text-white leading-tight mt-0.5">
              {hotspot.name}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/[0.08] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Readout KPIs in Frosted Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-white/[0.08] text-xs">
        <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-[10px] block flex items-center gap-1">
            <Shield className="w-3 h-3 text-rose-400" /> Max Threat
          </span>
          <span className="text-rose-300 font-bold text-xs mt-0.5 block">
            {hotspot.severity}/10 {getSeverityLabel(hotspot.severity)}
          </span>
        </div>
        <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-[10px] block flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-400" /> Affected
          </span>
          <span className="text-amber-200 font-bold text-xs mt-0.5 block">
            {hotspot.affected}
          </span>
        </div>
        <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-[10px] block flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" /> Lead Unit
          </span>
          <span className="text-cyan-200 font-bold text-xs truncate mt-0.5 block" title={hotspot.leadUnit}>
            {hotspot.leadUnit.split(' ')[0]} {hotspot.leadUnit.split(' ')[1] || ''}
          </span>
        </div>
        <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-[10px] block flex items-center gap-1">
            <Navigation className="w-3 h-3 text-slate-400" /> Coords
          </span>
          <span className="text-slate-300 font-medium text-[11px] truncate mt-0.5 block">
            {hotspot.coords}
          </span>
        </div>
      </div>

      {/* District & Municipal Threat Assessment */}
      <div className="mt-3.5 pt-3 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-300 tracking-wide uppercase">
            District &amp; Municipal Risk Breakdown
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/25">
            Priority Sorted
          </span>
        </div>

        {/* Sorted list */}
        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
          {sortedDistricts.length === 0 ? (
            <div className="text-[11px] text-slate-500 py-2">
              No district sub-sectors mapped.
            </div>
          ) : (
            sortedDistricts.map((d, index) => (
              <div
                key={d.name}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex flex-col gap-1 apple-transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${d.dotClass}`} />
                    <span className="font-semibold text-slate-200 text-xs truncate">
                      {index + 1}. {d.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${d.badgeClass} whitespace-nowrap`}
                  >
                    Level {d.severity}/10 • {d.badgeText}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pl-4">
                  {d.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-2">
        <button
          onClick={onViewDetail}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] apple-transition"
        >
          <span>OPEN REGIONAL RESPONSE BOARD</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
