import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { Incident } from '../../types/disaster';
import { indiaMaskPositions } from '../../data/indiaMask';

// ── Exact India Bounding Box with slight buffer for fluid panning/zooming ──
const indiaBounds: LatLngBoundsExpression = [
  [4.0, 65.0],
  [38.5, 100.0],
];


// ── MapController: auto-fly to newest incident ──
interface MapControllerProps {
  incidents: Incident[];
}

const MapController: React.FC<MapControllerProps> = ({ incidents }) => {
  const map = useMap();
  const lastFlownId = React.useRef<string | null>(null);

  useEffect(() => {
    // Find incidents with valid GPS coordinates
    const geoIncidents = incidents.filter(
      (inc) => inc.latitude != null && inc.longitude != null && !isNaN(inc.latitude!) && !isNaN(inc.longitude!)
    );

    if (geoIncidents.length === 0) return;

    // Sort by timestamp descending — pick the newest
    const newest = geoIncidents.reduce((latest, inc) => {
      const incTime = inc.timestamp || '';
      const latestTime = latest.timestamp || '';
      return incTime >= latestTime ? inc : latest;
    }, geoIncidents[0]);

    if (newest && newest.latitude != null && newest.longitude != null) {
      if (lastFlownId.current !== newest.id) {
        lastFlownId.current = newest.id;
        map.flyTo([newest.latitude, newest.longitude], 8, {
          animate: true,
          duration: 1.5,
        });
      }
    }
  }, [incidents, map]);

  return null;
};

// ── Main Map Component ──
export const ThreatRadarMap: React.FC = () => {
  const { incidents } = useDisaster();

  // Filter incidents with valid GPS coordinates
  const geoIncidents = useMemo(
    () =>
      incidents.filter(
        (inc) =>
          inc.latitude != null &&
          inc.longitude != null &&
          !isNaN(inc.latitude!) &&
          !isNaN(inc.longitude!)
      ),
    [incidents]
  );

  const liveCount = geoIncidents.length;
  const maskRenderer = useMemo(() => L.svg({ padding: 2.0 }), []);

  // ── Helper: severity and status based dynamic styling ──
  const getSeverityStyle = (severity: number, status: string) => {
    const normStatus = (status || '').trim().toLowerCase();
    if (
      normStatus === 'resolved' ||
      normStatus === 'closed' ||
      normStatus === 'done' ||
      normStatus === 'completed' ||
      normStatus === 'cleared'
    ) {
      return { color: '#10b981', fillColor: '#10b981', className: '' };
    }
    if (severity >= 8) {
      return { color: '#ef4444', fillColor: '#ef4444', className: 'animate-pulse' };
    }
    if (severity >= 5) {
      return { color: '#f59e0b', fillColor: '#f59e0b', className: 'animate-pulse' };
    }
    return { color: '#3b82f6', fillColor: '#3b82f6', className: '' };
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* MAP SUB-HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d131f] px-5 py-3 rounded-xl border border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-cyan-400 border border-slate-800">
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-xs text-slate-200 tracking-wider uppercase">
                Live Incident Threat Map
              </h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {liveCount} LIVE PIN{liveCount !== 1 ? 'S' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time GPS-plotted incident markers via OpenStreetMap • Auto-tracks newest alert
            </p>
          </div>
        </div>

        {/* SEVERITY LEGEND */}
        <div className="flex items-center gap-3 text-xs bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1.5 text-rose-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Critical (8-10)
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            High (5-7)
          </span>
          <span className="flex items-center gap-1.5 text-sky-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Moderate (1-4)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Resolved
          </span>
        </div>
      </div>

      {/* INTERACTIVE MAP */}
      <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0a1324]" style={{ height: '550px' }}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          minZoom={4}
          maxBounds={indiaBounds}
          maxBoundsViscosity={0.6}
          style={{ height: '100%', width: '100%', backgroundColor: '#0a1324' }}
          scrollWheelZoom={true}
          zoomControl={true}
          attributionControl={false}
        >
          {/* Free OpenStreetMap Tile Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Tactical Ocean Mask: covers all neighboring landmasses with dark tactical ocean */}
          <Polygon
            positions={indiaMaskPositions}
            renderer={maskRenderer}
            pathOptions={{
              fillColor: '#0a1324',
              fillOpacity: 1.0,
              color: '#38bdf8',
              weight: 1.2,
              opacity: 0.5,
            }}
            interactive={false}
          />

          {/* Auto-fly controller */}
          <MapController incidents={geoIncidents} />

          {/* Incident Circles */}
          {geoIncidents.map((inc) => {
            const style = getSeverityStyle(inc.severity, inc.status);
            return (
              <React.Fragment key={`incident-marker-group-${inc.id}`}>
                {/* Outer coverage perimeter circle */}
                <Circle
                  center={[inc.latitude!, inc.longitude!]}
                  radius={inc.severity >= 8 ? 60000 : inc.severity >= 5 ? 45000 : 30000}
                  color={style.color}
                  fillColor={style.fillColor}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fillColor,
                    fillOpacity: inc.severity >= 8 ? 0.35 : inc.severity >= 5 ? 0.25 : 0.18,
                    weight: 2,
                    className: style.className,
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.95}
                    permanent={false}
                  >
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', lineHeight: '1.6', minWidth: '180px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: '#1e293b' }}>
                        {inc.category || 'Emergency'} — SEV {inc.severity}/10
                      </div>
                      <div style={{ color: '#475569' }}>
                        📍 {inc.location}
                      </div>
                      {inc.reporter_name && (
                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                          👤 Reporter: {inc.reporter_name}
                        </div>
                      )}
                      <div style={{ color: '#475569', fontSize: '11px' }}>
                        🏥 Unit: <strong>{inc.assignedUnit}</strong>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                        Status: {inc.status} • {inc.timestamp}
                      </div>
                    </div>
                  </Tooltip>
                </Circle>

                {/* Core Epicenter Pin Marker (ensures crisp visibility at all zoom levels) */}
                <Circle
                  center={[inc.latitude!, inc.longitude!]}
                  radius={inc.severity >= 8 ? 10000 : inc.severity >= 5 ? 7500 : 5000}
                  color="#ffffff"
                  fillColor={style.fillColor}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: style.fillColor,
                    fillOpacity: 0.95,
                    weight: 2,
                    className: style.className,
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
