import React from 'react';

export const RadarOverlay: React.FC = () => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 570 680"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient cx="50%" cy="50%" id="meteorologicalSweepGrad" r="50%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.18)" />
          <stop offset="70%" stopColor="rgba(56,189,248,0.03)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Elegant Geospatial Range Rings */}
      <g opacity="0.25" stroke="#38bdf8" strokeDasharray="4 6" strokeWidth="0.8">
        <circle cx="285" cy="350" r="110" fill="none" />
        <circle cx="285" cy="350" r="200" fill="none" />
        <circle cx="285" cy="350" r="285" fill="none" />
        <line x1="30" x2="540" y1="350" y2="350" />
        <line x1="285" x2="285" y1="40" y2="640" />
      </g>

      {/* Static ambient glow ring (no animation) */}
      <circle cx="285" cy="350" r="285" fill="url(#meteorologicalSweepGrad)" opacity="0.12" />

      {/* Maritime & Geographic Reference Labels */}
      <g fill="#94a3b8" fontFamily="system-ui, -apple-system, sans-serif" fontSize="7.5" fontWeight="600" opacity="0.5" pointerEvents="none" letterSpacing="0.08em">
        <text x="36" y="445">ARABIAN SEA</text>
        <text x="415" y="375">BAY OF BENGAL</text>
        <text x="210" y="665">INDIAN OCEAN</text>
        <text x="65" y="585">LAKSHADWEEP</text>
        <text x="470" y="525">ANDAMAN &amp; NICOBAR</text>
      </g>
    </svg>
  );
};
