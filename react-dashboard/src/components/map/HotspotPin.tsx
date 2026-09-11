import React from 'react';
import { Hotspot } from '../../types/disaster';

interface HotspotPinProps {
  spot: Hotspot;
  onSelect: (spot: Hotspot) => void;
  onHover: (spot: Hotspot | null, event?: React.MouseEvent) => void;
}

export const HotspotPin: React.FC<HotspotPinProps> = ({
  spot,
  onSelect,
  onHover,
}) => {
  let pinColor = 'bg-sky-500 shadow-sky-500/50';
  let pingColor = 'bg-sky-400';
  let badgeStyle = 'text-sky-200 border-sky-500/30 bg-slate-900/90';

  if (spot.severity >= 8) {
    pinColor = 'bg-rose-500 shadow-rose-500/60';
    pingColor = 'bg-rose-500';
    badgeStyle = 'text-rose-200 border-rose-500/40 bg-slate-950/90';
  } else if (spot.severity >= 5) {
    pinColor = 'bg-amber-500 shadow-amber-500/50';
    pingColor = 'bg-amber-500';
    badgeStyle = 'text-amber-200 border-amber-500/40 bg-slate-950/90';
  }

  return (
    <div
      id={`pin-${spot.regionId}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(spot);
      }}
      onMouseEnter={(e) => onHover(spot, e)}
      onMouseLeave={() => onHover(null)}
      style={{ left: `${spot.x}px`, top: `${spot.y}px` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 apple-transition hover:scale-125 pointer-events-auto"
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-50`}
        />
        <span
          className={`relative inline-flex rounded-full h-4 w-4 ${pinColor} shadow-lg ring-2 ring-white/40`}
        />
      </span>

      {/* Apple-style floating label */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap ${badgeStyle} border text-[11px] font-medium px-2.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 apple-transition pointer-events-none shadow-xl backdrop-blur-md z-30`}
      >
        {spot.name.split('/')[0].trim()} • Sev {spot.severity}
      </div>
    </div>
  );
};
