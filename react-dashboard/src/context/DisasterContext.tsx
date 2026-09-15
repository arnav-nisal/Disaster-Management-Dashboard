import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Hotspot, Resource, Incident, AuditLog, ToastMessage, IncidentStatus } from '../types/disaster';
import { initialHotspots, initialResources } from '../data/mockDisasterData';

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

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export const DisasterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [activeRegionFilter, setActiveRegionFilter] = useState<string | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isGeneralDetailsOpen, setIsGeneralDetailsOpen] = useState<boolean>(false);
  const [overrideIncident, setOverrideIncident] = useState<Incident | null>(null);
  
  const [hotspots] = useState<Hotspot[]>(initialHotspots);
  const [resources] = useState<Resource[]>(initialResources);
  // Pure Live Firebase Firestore State (zero static mock incidents)
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAutoDispatchActive, setIsAutoDispatchActive] = useState<boolean>(true);
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [telemetryCoords, setTelemetryCoords] = useState<string>('20.5937° N, 78.9629° E');

  // Real-time Firestore onSnapshot listener for incidents & audit_logs collections
  useEffect(() => {
    try {
      const incidentsRef = collection(db, 'incidents');
      const unsubscribeIncidents = onSnapshot(
        incidentsRef,
        (snapshot) => {
          const firestoreIncidents = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const rawLat = data.latitude ?? data.lat ?? data.incident?.latitude ?? data.incident?.lat;
            const rawLng = data.longitude ?? data.lon ?? data.lng ?? data.incident?.longitude ?? data.incident?.lon ?? data.incident?.lng;
            const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat);
            const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng);

            return {
              id: docSnap.id,
              location: data.location || data.incident?.location || data.allocation?.location || 'Operational Incident Zone',
              severity: Number(data.severity || data.severity_level || data.incident?.severity_level || 5),
              requestedResources: Array.isArray(data.requestedResources)
                ? data.requestedResources
                : Array.isArray(data.incident?.resources_needed)
                  ? data.incident.resources_needed
                  : [],
              assignedUnit: data.assignedUnit || data.leadUnit || data.allocation?.dispatch_message || 'NDRF Quick Response Wing',
              status: (data.status || data.allocation?.status || 'In Progress') as IncidentStatus,
              timestamp: data.timestamp || new Date().toISOString(),
              category: data.category || data.disaster_type || data.incident?.disaster_type || 'Disaster Alert',
              latitude: !isNaN(lat) ? lat : undefined,
              longitude: !isNaN(lng) ? lng : undefined,
              reporter_name: data.reporter_name || data.incident?.reporter_name,
              description: data.description || data.incident?.description,
              ...data,
            };
          }) as Incident[];
          setIncidents(firestoreIncidents);
        },
        (error) => {
          console.warn('Firestore incidents live sync error:', error);
        }
      );

      const auditLogsRef = collection(db, 'audit_logs');
      const unsubscribeAudit = onSnapshot(
        auditLogsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreLogs = snapshot.docs.map((d) => {
              const data = d.data() || {};
              const actor = typeof data.actor === 'string' && data.actor
                ? data.actor
                : typeof data.event_type === 'string' && data.event_type
                ? data.event_type.replace(/_/g, ' ')
                : 'SYSTEM DISPATCH';

              let msg = '';
              if (typeof data.message === 'string' && data.message) {
                msg = data.message;
              } else if (typeof data.details?.dispatch_message === 'string' && data.details.dispatch_message) {
                msg = data.details.dispatch_message;
              } else if (typeof data.details?.reasoning === 'string' && data.details.reasoning) {
                msg = data.details.reasoning;
              } else if (typeof data.event_type === 'string') {
                msg = `Operational event [${data.event_type}] logged for incident ${data.incident_id || ''}`;
              } else {
                msg = 'Operational telemetry event logged.';
              }

              const rawTime = typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString();
              const timeDisplay = rawTime.includes('T')
                ? rawTime.split('T')[1].slice(0, 8)
                : rawTime.slice(0, 8);

              return {
                id: d.id,
                incidentId: typeof data.incident_id === 'string' ? data.incident_id : typeof data.incidentId === 'string' ? data.incidentId : '',
                timestamp: timeDisplay,
                actor: actor,
                actionType: (actor.includes('ALERT') ? 'ALERT' : actor.includes('WARN') ? 'WARNING' : 'INFO') as 'ALERT' | 'WARNING' | 'INFO' | 'SUCCESS',
                message: msg,
              };
            }) as AuditLog[];

            firestoreLogs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            setAuditLogs(firestoreLogs);
          }
        },
        (error) => {
          console.warn('Firestore audit_logs live sync error:', error);
        }
      );

      return () => {
        unsubscribeIncidents();
        unsubscribeAudit();
      };
    } catch (err) {
      console.warn('Error connecting to Firebase Firestore:', err);
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

  const simulateDisasterEvent = async () => {
    const disasterPresets = [
      { location: 'Kolkata Port Delta Reach', lat: 22.5726, lng: 88.3639, category: 'Cyclone Alert', unit: 'Eastern Naval Command' },
      { location: 'Bengaluru Southern Sector', lat: 12.9716, lng: 77.5946, category: 'Urban Flash Flood', unit: 'Karnataka Civil Defense' },
      { location: 'Jaipur Drainage Basin', lat: 26.9124, lng: 75.7873, category: 'Flash Flood', unit: 'Rajasthan SDRF Battalion' },
      { location: 'Visakhapatnam Naval Reach', lat: 17.6868, lng: 83.2185, category: 'Storm Surge', unit: 'Coast Guard Unit 4' },
      { location: 'Chennai Coastal Belt', lat: 13.0827, lng: 80.2707, category: 'Tsunami Warning', unit: 'Southern Maritime Rescue' }
    ];
    const pick = disasterPresets[Math.floor(Math.random() * disasterPresets.length)];
    const id = 'INC-' + (9200 + incidents.length);
    const newIncident: Incident = {
      id,
      location: pick.location,
      category: pick.category,
      severity: 8,
      latitude: pick.lat,
      longitude: pick.lng,
      requestedResources: ['Rescue Boats: 4', 'Trauma Kits: 80', 'Ambulances: 2'],
      assignedUnit: pick.unit,
      status: 'Pending',
      timestamp: new Date().toTimeString().split(' ')[0]
    };

    // Save live directly to Firebase Firestore
    try {
      await setDoc(doc(db, 'incidents', id), newIncident);
    } catch (err) {
      console.warn('Direct Firestore save failed, fallback to local state:', err);
      setIncidents(prev => [newIncident, ...prev]);
    }

    addAuditLog({
      incidentId: id,
      actor: 'CENTRAL DISPATCH',
      actionType: 'ALERT',
      message: `Flash incident alert logged for ${pick.location}. Threat escalated to Level 8.`
    });
    showToast(`Emergency reported at ${pick.location}`, 'warning');
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
