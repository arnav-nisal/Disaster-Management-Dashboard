export interface District {
  name: string;
  severity: number;
  badgeText: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export interface Hotspot {
  id: string;
  regionId: string;
  name: string;
  stateName: string;
  type: string;
  severity: number;
  affected: string;
  leadUnit: string;
  coords: string;
  x: number;
  y: number;
  districts: District[];
}

export interface Resource {
  id: string;
  category: string;
  total: number;
  available: number;
  icon: string;
}

export type IncidentStatus = 
  | 'Pending' 
  | 'In Progress' 
  | 'Dispatched' 
  | 'Re-allocated' 
  | 'Resolved';

export interface Incident {
  id: string;
  location: string;
  severity: number;
  requestedResources: string[];
  assignedUnit: string;
  status: IncidentStatus;
  timestamp: string;
  // Extended fields from AI backend
  category?: string;           // e.g. 'Flood', 'Earthquake', 'Cyclone'
  latitude?: number;
  longitude?: number;
  reporter_name?: string;
  dispatch_message?: string;   // AI allocation / dispatch message
  description?: string;
}

export type AuditLogActor = 
  | 'ALL'
  | 'COMMANDER DIRECTIVE' 
  | 'NDRF RAPID UNIT' 
  | 'CRISIS ASSESSMENT CELL' 
  | 'CENTRAL DISPATCH';

export interface AuditLog {
  id: string;
  incidentId: string;
  timestamp: string;
  actor: string;
  actionType: 'ALERT' | 'WARNING' | 'INFO' | 'SUCCESS';
  message: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}
