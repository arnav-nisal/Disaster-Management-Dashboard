import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDisaster } from '../../context/DisasterContext';
import { Incident } from '../../types/disaster';
import { Compass, ShieldAlert, Crosshair } from 'lucide-react';
import { indiaMaskPositions } from '../../data/indiaMask';

// Bounds strictly enclosing India's mainland and island territories
const INDIA_BOUNDS: LatLngBoundsExpression = [
  [4.0, 65.0],
  [38.5, 100.0],
];

interface MapControllerProps {
  incidents: Incident[];
}

/**
 * Child controller component using useMap() to fly the camera
 * to the newest emergency incident whenever the incidents list updates.
 */
export const MapController: React.FC<MapControllerProps> = ({ incidents }) => {
  const map = useMap();
  const prevNewestIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(false);

  // Invalidate map size so Leaflet recalculates viewport
  // when mounting inside dynamic dashboard layout transitions
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  useEffect(() => {
    // Filter incidents with valid coordinate numbers
    const validIncidents = incidents.filter(
      (inc): inc is Incident & { latitude: number; longitude: number } =>
        typeof inc.latitude === 'number' &&
        !isNaN(inc.latitude) &&
        typeof inc.longitude === 'number' &&
        !isNaN(inc.longitude)
    );

    if (validIncidents.length === 0) return;

    // Helper to extract comparable timestamp value
    const getTimestampValue = (ts?: string): number => {
      if (!ts) return 0;
      const parsed = Date.parse(ts);
      if (!isNaN(parsed)) return parsed;

      // Match HH:mm:ss
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(ts)) {
        const parts = ts.split(':').map(Number);
        return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
      }
      return 0;
    };

    // Sort to locate the newest incident
    const newest = [...validIncidents].sort(
      (a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp)
    )[0];

    if (newest) {
      if (!isMountedRef.current) {
        // Initial mount: record newest ID without canceling India overview, re-validate size
        isMountedRef.current = true;
        prevNewestIdRef.current = newest.id;
        setTimeout(() => map.invalidateSize(), 150);
      } else if (newest.id !== prevNewestIdRef.current) {
        // Subsequent new emergencies: swoop to incident coordinates
        prevNewestIdRef.current = newest.id;
        map.flyTo([newest.latitude, newest.longitude], 8, { animate: true });
      }
    }
  }, [incidents, map]);

  return null;
};

/**
 * Child component to capture the map reference for external controls (e.g. Center Map)
 */
const MapInstanceCapture: React.FC<{ onMapReady: (map: L.Map) => void }> = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

/**
 * Helper to get status and severity based theme colors
 */
const getSeverityColor = (severity: number, status?: string) => {
  const normStatus = (status || '').trim().toLowerCase();
  if (
    normStatus === 'resolved' ||
    normStatus === 'closed' ||
    normStatus === 'done' ||
    normStatus === 'completed' ||
    normStatus === 'cleared'
  ) {
    return '#10b981';
  }
  if (severity >= 8) return '#ef4444';
  if (severity >= 5) return '#f59e0b';
  return '#3b82f6';
};

interface ThreatIncidentMarkersProps {
  incidents: Incident[];
}

/**
 * Renders zoom-adaptive threat radar markers:
 * - At country overview (zoom 4-5): Large, dramatic faded threat heatmaps
 * - As the user zooms in: The threat aura continuously contracts and dissolves
 * - At high zoom levels (11+): The aura completely vanishes, leaving ONLY a precise,
 *   crisp epicenter pin positioned exactly at the building/street GPS coordinates.
 */
const ThreatIncidentMarkers: React.FC<ThreatIncidentMarkersProps> = ({ incidents }) => {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(() => map.getZoom());

  useMapEvents({
    zoom: () => {
      setZoom(map.getZoom());
    },
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  const validIncidents = useMemo(
    () =>
      incidents.filter(
        (inc) =>
          typeof inc.latitude === 'number' &&
          !isNaN(inc.latitude) &&
          inc.latitude >= -90 &&
          inc.latitude <= 90 &&
          typeof inc.longitude === 'number' &&
          !isNaN(inc.longitude) &&
          inc.longitude >= -180 &&
          inc.longitude <= 180
      ),
    [incidents]
  );

  // Dynamic scale factor:
  // At country overview (<= 4.5): 1.0 (large ~240km threat halos)
  // Progressive collapse between zoom 4.5 and 11
  // At zoom 11+: 0 (aura completely dissolved)
  const scaleFactor = useMemo(() => {
    if (zoom <= 4.5) return 1.0;
    if (zoom >= 11) return 0;
    return Math.pow(0.50, zoom - 4.5);
  }, [zoom]);

  // Soft opacity fadeout as the aura reaches collapse threshold (between zoom 9 and 11)
  const auraOpacityMultiplier = useMemo(() => {
    if (zoom >= 11) return 0;
    if (zoom >= 9) return (11 - zoom) / 2.0;
    return 1.0;
  }, [zoom]);

  const showAura = scaleFactor > 0.005 && auraOpacityMultiplier > 0.02;

  return (
    <>
      {validIncidents.map((incident) => {
        const color = getSeverityColor(incident.severity, incident.status);
        const isCritical = incident.severity >= 8;
        const isHigh = incident.severity >= 5;

        // Base large radii at national scale (in meters)
        // Sev 8-10: ~240km outer, Sev 5-7: ~170km, Sev 1-4: ~110km
        const baseOuter = isCritical ? 240000 : isHigh ? 170000 : 110000;
        const baseMid = isCritical ? 130000 : isHigh ? 90000 : 60000;
        const baseCore = isCritical ? 60000 : isHigh ? 40000 : 25000;

        const outerRadius = Math.round(baseOuter * scaleFactor);
        const midRadius = Math.round(baseMid * scaleFactor);
        const coreRadius = Math.round(baseCore * scaleFactor);

        return (
          <React.Fragment key={`incident-marker-${incident.id}`}>
            {/* Dynamic Faded Aura: shrinks as zoom increases, collapses completely at zoom 11+ */}
            {showAura && outerRadius > 80 && (
              <>
                {/* 1. Outer diffused perimeter with soft blur */}
                <Circle
                  center={[incident.latitude!, incident.longitude!]}
                  radius={outerRadius}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.12 * auraOpacityMultiplier,
                    stroke: false,
                    className: 'threat-faded-outer',
                  }}
                  interactive={false}
                />

                {/* 2. Mid dispersion ring */}
                {midRadius > 50 && (
                  <Circle
                    center={[incident.latitude!, incident.longitude!]}
                    radius={midRadius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.25 * auraOpacityMultiplier,
                      stroke: false,
                      className: 'threat-faded-mid',
                    }}
                    interactive={false}
                  />
                )}

                {/* 3. Core high-intensity field */}
                {coreRadius > 30 && (
                  <Circle
                    center={[incident.latitude!, incident.longitude!]}
                    radius={coreRadius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.50 * auraOpacityMultiplier,
                      stroke: false,
                      className: 'threat-faded-core',
                    }}
                    interactive={false}
                  />
                )}
              </>
            )}

            {/* 4. PRECISE EPICENTER PIN (Always locked to exact GPS coordinates) */}
            {/* CircleMarker uses screen-pixel radius: remains a crisp pinpoint dot at every zoom level */}
            <CircleMarker
              center={[incident.latitude!, incident.longitude!]}
              radius={zoom >= 12 ? 6 : zoom >= 8 ? 5 : 4}
              pathOptions={{
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 1.0,
                weight: zoom >= 10 ? 2 : 1.5,
                className: 'threat-epicenter-dot',
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.96}>
                <div className="p-2 min-w-[170px] text-xs font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      {incident.category || 'Disaster Alert'}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 font-mono font-bold rounded text-[10px] ${
                        incident.severity >= 8
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : incident.severity >= 5
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      SEV-{incident.severity}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div>
                      <span className="text-slate-400">Location: </span>
                      <span className="font-medium text-slate-200">{incident.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">AI Severity: </span>
                      <span className="font-semibold text-amber-400">{incident.severity}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Assigned Unit: </span>
                      <span className="font-medium text-cyan-300">
                        {incident.assignedUnit || 'Standby Response Team'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status: </span>
                      <span className="font-mono text-emerald-400">{incident.status}</span>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </>
  );
};

export const ThreatRadarMap: React.FC = () => {
  const { incidents } = useDisaster();
  const mapRef = useRef<L.Map | null>(null);

  // Count incidents that have valid coordinates
  const validCount = useMemo(
    () =>
      incidents.filter(
        (inc) =>
          typeof inc.latitude === 'number' &&
          !isNaN(inc.latitude) &&
          inc.latitude >= -90 &&
          inc.latitude <= 90 &&
          typeof inc.longitude === 'number' &&
          !isNaN(inc.longitude) &&
          inc.longitude >= -180 &&
          inc.longitude <= 180
      ).length,
    [incidents]
  );

  // SVG renderer with generous padding to prevent mask edge clipping on pan
  const maskRenderer = useMemo(() => L.svg({ padding: 2.0 }), []);

  // Smooth camera swoop to center full India
  const handleCenterIndia = React.useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([22.5, 82.0], 5, {
        animate: true,
        duration: 1.2,
      });
    }
  }, []);

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Tactical Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel px-5 py-3 rounded-2xl border border-white/[0.08] shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.05] rounded-xl text-cyan-400 border border-white/[0.08]">
            <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                India Tactical Threat Radar
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE RADAR
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Sovereign Operational Mesh • Active Targets: {validCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Crit (8-10)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              High (5-7)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Mod (1-4)
            </span>
          </div>

          {/* Center Full India Button */}
          <button
            onClick={handleCenterIndia}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white border border-cyan-500/30 shadow-sm shadow-cyan-950/40 transition-all active:scale-95"
            title="Focus map on full India overview (Zoom 5)"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Center India</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative w-full h-[560px] md:h-[640px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl glass-panel z-0">
        {/* Floating Quick Action Overlay on Map */}
        <div className="absolute top-3.5 right-3.5 z-[400] flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleCenterIndia}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09101d]/90 hover:bg-slate-800 text-cyan-300 hover:text-white text-xs font-semibold border border-white/[0.12] shadow-xl backdrop-blur-md transition-all active:scale-95"
            title="Recenter and focus full India view"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Center India</span>
          </button>
        </div>

        <MapContainer
          center={[22.5, 82.0]}
          zoom={5}
          minZoom={4}
          maxZoom={18}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={0.9}
          style={{ height: '100%', width: '100%', minHeight: '560px', backgroundColor: '#111d2e' }}
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          {/* Capture map instance */}
          <MapInstanceCapture onMapReady={(m) => { mapRef.current = m; }} />

          {/* OpenStreetMap Standard Free Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* 
            Subtle Vignette Fade:
            Softly subdues and fades out all non-India areas (neighboring countries, oceans)
            so they remain visible in the background rather than being completely blank,
            with a clean, understated, non-highlighted natural border.
          */}
          <Polygon
            positions={indiaMaskPositions}
            renderer={maskRenderer}
            pathOptions={{
              fillColor: '#09101d',
              fillOpacity: 0.68,
              color: 'rgba(226, 232, 240, 0.28)',
              weight: 1.2,
              opacity: 0.7,
            }}
            interactive={false}
          />

          {/* Controller to fly to newest emergency */}
          <MapController incidents={incidents} />

          {/* Zoom-adaptive Threat Incident Markers */}
          <ThreatIncidentMarkers incidents={incidents} />
        </MapContainer>
      </div>
    </div>
  );
};

export default ThreatRadarMap;

