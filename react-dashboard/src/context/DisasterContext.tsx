import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Hotspot, Resource, Incident, AuditLog, ToastMessage, IncidentStatus } from '../types/disaster';
import { initialHotspots, initialResources, initialIncidents, initialAuditLogs } from '../data/mockDisasterData';

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
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAutoDispatchActive, setIsAutoDispatchActive] = useState<boolean>(true);
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [telemetryCoords, setTelemetryCoords] = useState<string>('20.5937° N, 78.9629° E');

  // Real-time Firestore onSnapshot listener for incidents collection
  useEffect(() => {
    try {
      const incidentsRef = collection(db, 'incidents');
      const unsubscribe = onSnapshot(
        incidentsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreIncidents = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as Incident[];
            setIncidents(firestoreIncidents);
          } else {
            // Keep mockDisasterData as an initial fallback only if the collection is completely empty
            setIncidents(initialIncidents);
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot listener error (using mock data fallback):', error);
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
    const names = [
      'Kolkata Port Delta Reach', 
      'Bengaluru Southern Sector', 
      'Jaipur Drainage Basin',
      'Visakhapatnam Naval Reach',
      'Chennai Coastal Belt'
    ];
    const pick = names[Math.floor(Math.random() * names.length)];
    const id = 'INC-' + (9200 + incidents.length);
    const newIncident: Incident = {
      id,
      location: pick,
      severity: 8,
      requestedResources: ['Rescue Boats: 4', 'Trauma Kits: 80', 'Ambulances: 2'],
      assignedUnit: 'NDRF Rapid Response Wing',
      status: 'Pending',
      timestamp: new Date().toTimeString().split(' ')[0]
    };

    setIncidents(prev => [newIncident, ...prev]);
    addAuditLog({
      incidentId: id,
      actor: 'CENTRAL DISPATCH',
      actionType: 'ALERT',
      message: `Flash incident alert logged for ${pick}. Threat escalated to Level 8.`
    });
    showToast(`Emergency reported at ${pick}`, 'warning');
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
