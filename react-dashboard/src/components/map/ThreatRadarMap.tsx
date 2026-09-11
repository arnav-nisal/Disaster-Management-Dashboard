import React, { useState, useRef } from 'react';
import { 
  Maximize, 
  Crosshair, 
  PlusCircle, 
  Target, 
  MousePointerClick,
  Compass,
  FileText
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { RadarOverlay } from './RadarOverlay';
import { HotspotPin } from './HotspotPin';
import { DistrictFocusCard } from './DistrictFocusCard';
import { Hotspot } from '../../types/disaster';

export const ThreatRadarMap: React.FC = () => {
  const {
    hotspots,
    selectedHotspot,
    resetMapZoom,
    closeFocusCard,
    triggerViewInDetail,
    toggleGeneralDetailsModal,
    simulateDisasterEvent,
    telemetryCoords,
    focusHotspotById
  } = useDisaster();

  const [hoveredSpot, setHoveredSpot] = useState<Hotspot | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const handleHover = (spot: Hotspot | null, event?: React.MouseEvent) => {
    setHoveredSpot(spot);
    if (spot && event && mapWrapperRef.current) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const mapRect = mapWrapperRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left - mapRect.left + 25,
        y: rect.top - mapRect.top - 10
      });
    }
  };

  // Zoom transform calculation
  const mapTransform = selectedHotspot
    ? `scale(1.65) translate(${(285 - selectedHotspot.x) * 1.0}px, ${(340 - selectedHotspot.y) * 1.0}px)`
    : 'scale(1) translate(0px, 0px)';

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* MAP SUB-HEADER WITH GENERAL DETAILS (RANKED INTEL) */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel px-5 py-3 rounded-2xl border border-white/[0.08] shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.05] rounded-xl text-cyan-400 border border-white/[0.08]">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-slate-100 tracking-wide uppercase">
                Geospatial Threat Radar &amp; State Boundaries
              </h2>
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                OFFICIAL BORDERS • WGS-84
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Geospatial district risk mesh calibrated with real-time disaster alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {/* NATIONAL THREAT INTEL BUTTON */}
          <button
            id="btnGeneralDetails"
            onClick={() => toggleGeneralDetailsModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/40 hover:border-amber-400 text-amber-300 hover:text-white shadow-sm font-medium tracking-wide apple-transition active:scale-95 group"
            title="View Ranked National Threat Intel"
          >
            <FileText className="w-4 h-4 text-amber-400 group-hover:rotate-6 apple-transition" />
            <span>National Threat Brief</span>
            <span
              id="intelCountBadge"
              className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-[10px] text-amber-300 font-bold"
            >
              Ranked Intel
            </span>
          </button>

          {/* SEVERITY PILLS */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-[11px] backdrop-blur-md">
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Sev 8-10 (Critical)
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Sev 5-7 (High)
            </span>
            <span className="flex items-center gap-1.5 text-sky-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Sev 1-4 (Moderate)
            </span>
          </div>

          {/* RESET ZOOM */}
          <button
            id="btnResetZoom"
            onClick={resetMapZoom}
            className="px-3 py-1.5 glass-pill rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 apple-transition"
          >
            <Maximize className="w-3.5 h-3.5 text-slate-400" />
            <span>National View</span>
          </button>
        </div>
      </div>

      {/* 2D MAP CANVAS CONTAINER (APPLE LIQUID GLASS) */}
      <div className="relative glass-panel rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col items-center justify-center min-h-[760px] w-full border border-white/[0.08]">
        {/* Soft ambient radial backdrop glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40 ambient-bg" />

        {/* TOP-LEFT SATELLITE HUD */}
        <div className="absolute top-5 left-5 z-10 text-[11px] space-y-1 glass-panel-subtle p-3 rounded-2xl border border-white/[0.08] shadow-lg backdrop-blur-2xl">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              COORDINATES: <span className="text-cyan-300 font-semibold">{telemetryCoords}</span>
            </span>
          </div>
          <div className="text-slate-400">
            PROJECTION: <span className="text-slate-200">ACCURATE 2D POLITICAL STATE BOUNDARIES</span>
          </div>
          <div className="text-slate-400 flex items-center gap-1.5">
            <span>SATELLITE LINK:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              INSAT-3DR METEOROLOGICAL LINK
            </span>
          </div>
        </div>

        {/* TOP-RIGHT PIN INJECTOR */}
        <div className="absolute top-5 right-5 z-10 flex flex-col gap-1.5">
          <button
            onClick={simulateDisasterEvent}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 shadow-md apple-transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Inject Incident Pin</span>
          </button>
        </div>

        {/* MAP VIEWPORT AND DETAILED 2D POLITICAL VECTOR MAP */}
        <div
          id="mapViewportContainer"
          className="relative w-full h-[720px] overflow-hidden flex items-center justify-center transition-transform duration-700 ease-out"
        >
          <div
            ref={mapWrapperRef}
            id="indiaMapWrapper"
            style={{ transform: mapTransform }}
            className="relative w-[570px] h-[680px] transition-transform duration-700 ease-out origin-center flex items-center justify-center"
          >
            {/* BASE ACCURATE OFFICIAL OUTLINE MAP */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfw4B-kyM5giK2XcBHLeW0x_8myQwQaUbAqNyKqs7Jha5Y4CvzrQ2tqTCy6EQauMjcGlfAersRdZE4QWxg1woVKRnhaKO_S6Bw8IH9QxJxlajQ86wWLy1ki2bIJS3Ro6iXfzBr_upRwCEXICCP9vYQDDYMiu66720sIqMLWsWkh_26n2W3MF2g5GkS7kFHSf5LKyQXIoZ-QMDdjfxZvdRF_MrLJxtcEuDrcvmCQf6imBJsO7bzHQLGW_umOdgakgb5G6o"
                alt="Official India Political Outline Map with States and UTs"
                className="w-full h-full object-contain tactical-base-map"
              />
            </div>

            {/* RADAR, TACTICAL CALIBRATION RINGS & SCAN OVERLAY */}
            <RadarOverlay />

            {/* HOTSPOT PINS LAYER OVER REAL ACCURATE COORDINATES */}
            <div className="absolute inset-0 pointer-events-auto">
              {hotspots.map((spot) => (
                <HotspotPin
                  key={spot.id}
                  spot={spot}
                  onSelect={() => focusHotspotById(spot.regionId)}
                  onHover={handleHover}
                />
              ))}
            </div>

            {/* RADAR TARGET CROSSHAIR LOCK */}
            {selectedHotspot && (
              <div
                id="radarCrosshair"
                style={{ left: `${selectedHotspot.x}px`, top: `${selectedHotspot.y}px` }}
                className="absolute pointer-events-none transition-all duration-500 -translate-x-1/2 -translate-y-1/2 w-16 h-16 z-30"
              >
                <div className="absolute inset-0 border border-cyan-400/60 rounded-full animate-ping" />
                <div className="absolute inset-2 border border-dashed border-amber-400/80 rounded-full animate-spin" />
                <div className="w-full h-full flex items-center justify-center text-cyan-300 text-[9px]">
                  <Target className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HOVER TOOLTIP IN APPLE FROSTED GLASS */}
        {hoveredSpot && (
          <div
            id="hotspotTooltip"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
            className="absolute pointer-events-none z-30 glass-modal text-slate-200 p-3 rounded-2xl shadow-2xl text-xs backdrop-blur-2xl apple-transition border border-white/[0.12]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  hoveredSpot.severity >= 8
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                    : hoveredSpot.severity >= 5
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                    : 'bg-sky-500/20 border border-sky-500/40 text-sky-200'
                }`}
              >
                LEVEL {hoveredSpot.severity}/10
              </span>
              <span className="font-semibold text-white text-xs">{hoveredSpot.name}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Threat: <span className="text-cyan-300 font-medium">{hoveredSpot.type}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Civilian Impact: <span className="text-amber-300 font-bold">{hoveredSpot.affected}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <MousePointerClick className="w-3 h-3 text-cyan-400" />
              Click to view District Breakdown
            </div>
          </div>
        )}

        {/* DISTRICT FOCUS CARD POPOVER */}
        {selectedHotspot && (
          <DistrictFocusCard
            hotspot={selectedHotspot}
            onClose={closeFocusCard}
            onViewDetail={triggerViewInDetail}
          />
        )}
      </div>
    </div>
  );
};
