import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Hotspot, Resource, Incident, AuditLog, ToastMessage, IncidentStatus } from '../types/disaster';
import { initialHotspots, initialResources, initialIncidents } from '../data/mockDisasterData';

interface CommanderDirectivePayload {
  incidentId: string;
  severity: number;
  status: IncidentStatus;
  resources: string[];
  reason: string;
}

interface DisasterContextType {
  currentRoute: string;
  activeRegionFilter: string | null;
  selectedHotspot: Hotspot | null;
  isGeneralDetailsOpen: boolean;
  overrideIncident: Incident | null;
  hotspots: Hotspot[];
  resources: Resource[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  toasts: ToastMessage[];
  isAutoDispatchActive: boolean;
  unitFilter: string;
  searchQuery: string;
  telemetryCoords: string;

  // Actions
  switchRoute: (path: string) => void;
  selectHotspot: (hotspot: Hotspot | null) => void;
  focusHotspotById: (regionId: string) => void;
  resetMapZoom: () => void;
  closeFocusCard: () => void;
  triggerViewInDetail: () => void;
  toggleGeneralDetailsModal: (open?: boolean) => void;
  openOverrideModal: (incidentId: string) => void;
  closeOverrideModal: () => void;
  submitCommanderDirective: (payload: CommanderDirectivePayload) => void;
  simulateDisasterEvent: () => void;
  toggleAutoDispatch: () => void;
  clearAuditLogs: () => void;
  setUnitFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  showToast: (message: string, type?: 'info' | 'warning' | 'success') => void;
  removeToast: (id: string) => void;
  resetRegionFilter: () => void;
  inspectSpotFromIntel: (regionId: string) => void;
  switchRouteAndDrilldown: (regionId: string) => void;
}

// Defensive Normalizers for Python AI / Firestore payloads
export const normalizeStatus = (rawStatus: any): IncidentStatus => {
  if (!rawStatus || typeof rawStatus !== 'string') return 'Pending';
  const clean = rawStatus.trim().toLowerCase().replace(/[-_]/g, ' ');

  if (clean === 'in progress' || clean === 'inprogress' || clean === 'active' || clean === 'ongoing') {
    return 'In Progress';
  }
  if (clean === 'dispatched' || clean === 'dispatch' || clean === 'deployed') {
    return 'Dispatched';
  }
  if (clean === 're allocated' || clean === 'reallocated' || clean === 're allocate' || clean === 'reallocate') {
    return 'Re-allocated';
  }
  if (clean === 'resolved' || clean === 'closed' || clean === 'done' || clean === 'completed' || clean === 'cleared') {
    return 'Resolved';
  }
  if (clean === 'pending' || clean === 'queued' || clean === 'new' || clean === 'open') {
    return 'Pending';
  }

  // Exact Title Case check fallback
  if (
    rawStatus === 'Pending' ||
    rawStatus === 'In Progress' ||
    rawStatus === 'Dispatched' ||
    rawStatus === 'Re-allocated' ||
    rawStatus === 'Resolved'
  ) {
    return rawStatus;
  }

  return 'Pending';
};

export const normalizeSeverity = (rawSeverity: any): number => {
  if (typeof rawSeverity === 'number' && !isNaN(rawSeverity)) {
    return rawSeverity;
  }
  if (typeof rawSeverity === 'string') {
    const parsed = parseFloat(rawSeverity);
    if (!isNaN(parsed)) return parsed;

    const lower = rawSeverity.toLowerCase();
    if (lower.includes('crit') || lower.includes('extreme') || lower.includes('emergency')) return 9;
    if (lower.includes('high') || lower.includes('urgent') || lower.includes('severe')) return 7;
    if (lower.includes('mod') || lower.includes('med')) return 4;
    if (lower.includes('low') || lower.includes('normal')) return 2;
  }
  return 5;
};

export const normalizeResources = (raw: any): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((r) => String(r || '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.split(',').map((r) => r.trim()).filter(Boolean);
  }
  return [];
};

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export const DisasterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [activeRegionFilter, setActiveRegionFilter] = useState<string | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isGeneralDetailsOpen, setIsGeneralDetailsOpen] = useState<boolean>(false);
  const [overrideIncident, setOverrideIncident] = useState<Incident | null>(null);

  const [hotspots] = useState<Hotspot[]>(initialHotspots);
  const [resources] = useState<Resource[]>(initialResources);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAutoDispatchActive, setIsAutoDispatchActive] = useState<boolean>(true);
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [telemetryCoords, setTelemetryCoords] = useState<string>('20.5937° N, 78.9629° E');

  // Real-time Firestore onSnapshot listener for incidents collection with defensive mapping
  useEffect(() => {
    try {
      const incidentsRef = collection(db, 'incidents');
      const unsubscribe = onSnapshot(
        incidentsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreIncidents = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              console.log('Raw Firestore Document:', data);

              const status = normalizeStatus(
                data.status ??
                data.incident_status ??
                data.state ??
                data.allocation?.status
              );
              const severity = normalizeSeverity(
                data.severity ??
                data.severity_level ??
                data.incident?.severity_level ??
                data.level ??
                data.priority ??
                data.triage?.calculated_priority ??
                data.allocation?.priority_score
              );
              const requestedResources = normalizeResources(
                data.requestedResources ??
                data.requested_resources ??
                data.incident?.resources_needed ??
                data.incident?.requested_resources ??
                data.resources ??
                data.required_resources
              );
              const location = String(
                data.location ??
                data.district ??
                data.region ??
                data.place ??
                data.city ??
                data.allocation?.location ??
                `Sector ${docSnap.id}`
              ).trim();
              const assignedUnit = String(
                data.assignedUnit ??
                data.assigned_unit ??
                data.unit ??
                data.battalion ??
                (data.allocation?.allocated_rescue_teams ? `NDRF Team (${data.allocation.allocated_rescue_teams} Teams)` : undefined) ??
                'Central Standby Unit'
              ).trim();

              let timestamp = '';
              if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                timestamp = data.timestamp.toDate().toLocaleTimeString('en-IN', { hour12: false });
              } else if (data.timestamp && typeof data.timestamp === 'string') {
                try {
                  const d = new Date(data.timestamp);
                  if (!isNaN(d.getTime())) {
                    timestamp = d.toLocaleTimeString('en-IN', { hour12: false });
                  } else {
                    timestamp = data.timestamp;
                  }
                } catch {
                  timestamp = data.timestamp;
                }
              } else if (data.created_at || data.createdAt) {
                const ts = data.created_at || data.createdAt;
                timestamp = typeof ts?.toDate === 'function' ? ts.toDate().toLocaleTimeString('en-IN', { hour12: false }) : String(ts);
              } else {
                timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
              }

              const category = String(
                data.category ??
                data.disaster_type ??
                data.incident?.disaster_type ??
                data.allocation?.category ??
                data.type ??
                data.incident_type ??
                'Emergency'
              ).trim();

              // Robust extraction: support flat properties and nested AI structures (incident, allocation)
              const rawLat = data.latitude ?? data.lat ?? data.incident?.latitude ?? data.incident?.lat;
              const rawLng = data.longitude ?? data.lon ?? data.lng ?? data.incident?.longitude ?? data.incident?.lon ?? data.incident?.lng;
              let latitude = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat ?? '');
              let longitude = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng ?? '');

              // Fallback: check if location string contains "(lat, lng)"
              if (isNaN(latitude) || isNaN(longitude)) {
                const locStr = String(data.location ?? data.allocation?.location ?? '');
                const match = locStr.match(/([-+]?\d+\.?\d*)[,\s]+([-+]?\d+\.?\d*)/);
                if (match) {
                  const parsedLat = parseFloat(match[1]);
                  const parsedLng = parseFloat(match[2]);
                  if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                    latitude = parsedLat;
                    longitude = parsedLng;
                  }
                }
              }

              const reporter_name = String(
                data.reporter_name ?? data.reported_by ?? data.reporter ?? data.incident?.reporter_name ?? ''
              ).trim() || undefined;
              const dispatch_message = String(
                data.dispatch_message ?? data.allocation?.dispatch_message ?? data.ai_message ?? data.message ?? ''
              ).trim() || undefined;
              const description = String(
                data.description ?? data.details ?? data.report ?? data.incident?.description ?? ''
              ).trim() || undefined;

              return {
                id: data.incident_id ?? docSnap.id,
                location: location || `Sector ${docSnap.id}`,
                severity,
                status,
                requestedResources,
                assignedUnit,
                timestamp,
                category,
                latitude: isNaN(latitude) ? undefined : latitude,
                longitude: isNaN(longitude) ? undefined : longitude,
                reporter_name,
                dispatch_message,
                description,
              } as Incident;
            });

            console.log('Normalized Incidents for Kanban & Map:', firestoreIncidents);
            setIncidents(firestoreIncidents);
          } else {
            console.log('Firestore incidents collection is empty, retaining baseline mock data.');
            setIncidents(initialIncidents);
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot listener error (falling back to initial data):', error);
          setIncidents(initialIncidents);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Error setting up Firestore onSnapshot listener:', err);
    }
  }, []);

  const showToast = (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toTimeString().split(' ')[0]
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const switchRoute = (path: string) => {
    setCurrentRoute(path);
    if (path === '/') {
      setActiveRegionFilter(null);
    } else {
      const regionKey = path.replace('/details/', '');
      if (regionKey && regionKey !== 'all') {
        const spot = hotspots.find(s => s.regionId === regionKey);
        if (spot) {
          setActiveRegionFilter(spot.name);
        }
      } else {
        setActiveRegionFilter(null);
      }
    }
  };

  const selectHotspot = (hotspot: Hotspot | null) => {
    setSelectedHotspot(hotspot);
    if (hotspot) {
      setTelemetryCoords(hotspot.coords);
    } else {
      setTelemetryCoords('20.5937° N, 78.9629° E');
    }
  };

  const focusHotspotById = (regionId: string) => {
    const spot = hotspots.find(s => s.regionId === regionId);
    if (!spot) return;
    selectHotspot(spot);
    addAuditLog({
      incidentId: spot.id,
      actor: 'CENTRAL DISPATCH',
      actionType: 'ALERT',
      message: `Situation room focused on [${spot.name}]. District crisis assessment loaded.`
    });
  };

  const resetMapZoom = () => {
    setSelectedHotspot(null);
    setTelemetryCoords('20.5937° N, 78.9629° E');
  };

  const closeFocusCard = () => {
    setSelectedHotspot(null);
  };

  const triggerViewInDetail = () => {
    if (!selectedHotspot) return;
    switchRoute('/details/' + selectedHotspot.regionId);
  };

  const toggleGeneralDetailsModal = (open?: boolean) => {
    setIsGeneralDetailsOpen(prev => (open !== undefined ? open : !prev));
  };

  const inspectSpotFromIntel = (regionId: string) => {
    setIsGeneralDetailsOpen(false);
    switchRoute('/');
    focusHotspotById(regionId);
  };

  const switchRouteAndDrilldown = (regionId: string) => {
    setIsGeneralDetailsOpen(false);
    switchRoute('/details/' + regionId);
  };

  const openOverrideModal = (incidentId: string) => {
    const inc = incidents.find(i => i.id === incidentId);
    if (inc) {
      setOverrideIncident(inc);
    }
  };

  const closeOverrideModal = () => {
    setOverrideIncident(null);
  };

  const submitCommanderDirective = async (payload: CommanderDirectivePayload) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === payload.incidentId) {
        return {
          ...inc,
          severity: payload.severity,
          status: payload.status,
          requestedResources: payload.resources.length > 0 ? payload.resources : inc.requestedResources
        };
      }
      return inc;
    }));

    const inc = incidents.find(i => i.id === payload.incidentId);
    const locationName = inc ? inc.location : payload.incidentId;
    const directiveMessage = `Commander Directive issued for [${locationName}]: Threat severity adjusted to ${payload.severity}/10, Status: '${payload.status}'. Order: ${payload.reason}`;

    addAuditLog({
      incidentId: payload.incidentId,
      actor: 'COMMANDER DIRECTIVE',
      actionType: 'INFO',
      message: directiveMessage
    });

    closeOverrideModal();
    showToast(`Commander directive executed for ${payload.incidentId}`, 'success');

    try {
      const incidentDocRef = doc(db, 'incidents', payload.incidentId);
      const updateData: Record<string, any> = {
        severity: payload.severity,
        status: payload.status,
      };
      if (payload.resources.length > 0) {
        updateData.requestedResources = payload.resources;
      }
      await updateDoc(incidentDocRef, updateData);

      await addDoc(collection(db, 'audit_logs'), {
        incidentId: payload.incidentId,
        actor: 'COMMANDER DIRECTIVE',
        actionType: 'INFO',
        message: directiveMessage,
        reason: payload.reason,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore live directive update error (fallback to local state):', err);
    }
  };

  const simulateDisasterEvent = () => {
    const locations = [
      { name: 'Kolkata Port Delta Reach', lat: 22.5726, lng: 88.3639, cat: 'Cyclone' },
      { name: 'Bengaluru Southern Sector', lat: 12.9716, lng: 77.5946, cat: 'Flood' },
      { name: 'Jaipur Drainage Basin', lat: 26.9124, lng: 75.7873, cat: 'Flood' },
      { name: 'Visakhapatnam Naval Reach', lat: 17.6868, lng: 83.2185, cat: 'Cyclone' },
      { name: 'Chennai Coastal Belt', lat: 13.0827, lng: 80.2707, cat: 'Flood' },
      { name: 'Mumbai Urban Sector', lat: 18.9220, lng: 72.8347, cat: 'Flood' },
      { name: 'Puri Coastal Delta', lat: 19.8135, lng: 85.8312, cat: 'Cyclone' },
    ];
    const pick = locations[Math.floor(Math.random() * locations.length)];
    const id = 'INC-' + (9200 + incidents.length);
    const newIncident: Incident = {
      id,
      location: pick.name,
      severity: 8,
      requestedResources: ['Rescue Boats: 4', 'Trauma Kits: 80', 'Ambulances: 2'],
      assignedUnit: 'NDRF Rapid Response Wing',
      status: 'Pending',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      latitude: pick.lat,
      longitude: pick.lng,
      category: pick.cat,
      reporter_name: 'Civil Defense Command',
      dispatch_message: `Immediate response required at ${pick.name}. High threat level detected.`,
      description: `Rapid escalating disaster event reported in ${pick.name}. Sector teams dispatched.`
    };

    setIncidents(prev => [newIncident, ...prev]);
    addAuditLog({
      incidentId: id,
      actor: 'CENTRAL DISPATCH',
      actionType: 'ALERT',
      message: `Flash incident alert logged for ${pick.name}. Threat escalated to Level 8.`
    });
    showToast(`Emergency reported at ${pick.name}`, 'warning');
  };

  const toggleAutoDispatch = () => {
    setIsAutoDispatchActive(prev => {
      const next = !prev;
      showToast(`Automated Dispatch Routing: ${next ? 'ACTIVE' : 'MANUAL HOLD'}.`, 'info');
      return next;
    });
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    showToast('Operational audit log cleared.', 'info');
  };

  const resetRegionFilter = () => {
    setActiveRegionFilter(null);
    setSearchQuery('');
  };

  const value = useMemo(() => ({
    currentRoute,
    activeRegionFilter,
    selectedHotspot,
    isGeneralDetailsOpen,
    overrideIncident,
    hotspots,
    resources,
    incidents,
    auditLogs,
    toasts,
    isAutoDispatchActive,
    unitFilter,
    searchQuery,
    telemetryCoords,
    switchRoute,
    selectHotspot,
    focusHotspotById,
    resetMapZoom,
    closeFocusCard,
    triggerViewInDetail,
    toggleGeneralDetailsModal,
    openOverrideModal,
    closeOverrideModal,
    submitCommanderDirective,
    simulateDisasterEvent,
    toggleAutoDispatch,
    clearAuditLogs,
    setUnitFilter,
    setSearchQuery,
    showToast,
    removeToast,
    resetRegionFilter,
    inspectSpotFromIntel,
    switchRouteAndDrilldown,
  }), [
    currentRoute,
    activeRegionFilter,
    selectedHotspot,
    isGeneralDetailsOpen,
    overrideIncident,
    hotspots,
    resources,
    incidents,
    auditLogs,
    toasts,
    isAutoDispatchActive,
    unitFilter,
    searchQuery,
    telemetryCoords
  ]);

  return (
    <DisasterContext.Provider value={value}>
      {children}
    </DisasterContext.Provider>
  );
};

export const useDisaster = () => {
  const context = useContext(DisasterContext);
  if (!context) {
    throw new Error('useDisaster must be used within a DisasterProvider');
  }
  return context;
};
