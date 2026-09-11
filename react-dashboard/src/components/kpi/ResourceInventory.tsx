import React from 'react';
import { Boxes, Anchor, Activity, Truck, Package, Box } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const ResourceInventory: React.FC = () => {
  const { resources } = useDisaster();

  const getResourceIcon = (iconName: string) => {
    switch (iconName) {
      case 'anchor':
        return <Anchor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'activity':
        return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
      case 'truck':
        return <Truck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'package':
        return <Package className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Box className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="xl:col-span-5 glass-panel-subtle rounded-2xl px-4 py-2.5 flex flex-col justify-center">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium tracking-wide text-slate-300 flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5 text-cyan-400" />
          Emergency Supplies &amp; Logistics
        </span>
        <span className="text-[9px] font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Live Inventory
        </span>
      </div>
      <div className="space-y-1.5">
        {resources.map((res) => {
          const pct = Math.round((res.available / res.total) * 100);
          const barColor =
            pct < 25
              ? 'from-rose-500 to-red-500'
              : pct < 50
              ? 'from-amber-500 to-orange-500'
              : 'from-cyan-500 to-emerald-400';

          return (
            <div key={res.id}>
              <div className="flex justify-between items-center text-[11px] mb-0.5">
                <span className="text-slate-300 font-normal flex items-center gap-1.5">
                  {getResourceIcon(res.icon)}
                  {res.category}
                </span>
                <span className="font-semibold text-slate-200">
                  {res.available.toLocaleString()}{' '}
                  <span className="text-slate-500 font-normal">/ {res.total.toLocaleString()}</span>
                </span>
              </div>
              <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden p-[0.5px]">
                <div
                  className={`bg-gradient-to-r ${barColor} h-full rounded-full apple-transition`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
