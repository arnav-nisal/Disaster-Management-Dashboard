import React from 'react';
import { SlidersHorizontal, Clock, UserCheck, MapPin, User, MessageSquare, AlertTriangle } from 'lucide-react';
import { Incident } from '../../types/disaster';
import { useDisaster } from '../../context/DisasterContext';
import { useReverseGeocode } from '../../utils/geo';

interface IncidentCardProps {
  incident: Incident;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
  const { openOverrideModal } = useDisaster();
  const { city, state, loading: geoLoading } = useReverseGeocode(incident.latitude, incident.longitude);

  const isCritical = incident.severity >= 8;
  const isHigh = incident.severity >= 5 && incident.severity < 8;

  // Severity badge styling
  const badgeClass = isCritical
    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
    : isHigh
    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    : 'bg-sky-500/10 text-sky-300 border-sky-500/20';

  // Card urgency class
  const urgencyClass = isCritical
    ? 'incident-critical-pulse'
    : isHigh
    ? 'incident-high-glow'
    : '';

  // Dynamic title: "{Category} Emergency at {City}, {State}"
  const category = incident.category || 'Emergency';
  let dynamicTitle: string;
  if (incident.latitude != null && incident.longitude != null) {
    if (geoLoading) {
      dynamicTitle = `${category} Emergency — Resolving location...`;
    } else if (city !== 'Unknown' || state !== 'Unknown') {
      dynamicTitle = `${category} Emergency at ${city}, ${state}`;
    } else {
      dynamicTitle = `${category} Emergency — ${incident.location}`;
    }
  } else {
    dynamicTitle = `${category} Emergency — ${incident.location}`;
  }

  return (
    <div className={`bg-[#0a0f19] rounded-lg p-3 space-y-2.5 border border-slate-800 hover:border-slate-700 transition ${urgencyClass}`}>
      {/* Header: ID, Timestamp, Severity Badge */}
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-600 shrink-0" /> {incident.id} • {incident.timestamp}
          </span>
          <h4 className="font-medium text-xs text-slate-100 mt-1 leading-snug">
            {dynamicTitle}
          </h4>
        </div>
        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${badgeClass} shrink-0`}>
          SEV {incident.severity}
        </span>
      </div>

      {/* Coordinates & Reporter Row */}
      {(incident.latitude != null || incident.reporter_name) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
          {incident.latitude != null && incident.longitude != null && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-500" />
              <span className="font-mono text-slate-300">
                {incident.latitude.toFixed(4)}°, {incident.longitude.toFixed(4)}°
              </span>
            </span>
          )}
          {incident.reporter_name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-500" />
              <span className="text-slate-300">{incident.reporter_name}</span>
            </span>
          )}
        </div>
      )}

      {/* AI Dispatch Message */}
      {incident.dispatch_message && (
        <div className="bg-slate-900/80 rounded-md p-2 border border-slate-800/80">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">AI Dispatch</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{incident.dispatch_message}</p>
        </div>
      )}

      {/* Requested Resources */}
      {incident.requestedResources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {incident.requestedResources.map((r, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-900 text-[10px] text-slate-300 rounded border border-slate-800"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Assigned Unit & Status */}
      <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-800/80">
        <span className="text-slate-300 font-medium flex items-center gap-1.5">
          <UserCheck className="w-3 h-3 text-slate-400" />
          {incident.assignedUnit}
        </span>
        <span className="text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {incident.status}
        </span>
      </div>

      {/* Commander Directive Button */}
      <button
        onClick={() => openOverrideModal(incident.id)}
        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
      >
        {isCritical ? (
          <AlertTriangle className="w-3 h-3 text-rose-400" />
        ) : (
          <SlidersHorizontal className="w-3 h-3 text-slate-400" />
        )}
        <span>{isCritical ? 'Urgent Command' : 'Commander Directive'}</span>
      </button>
    </div>
  );
};
