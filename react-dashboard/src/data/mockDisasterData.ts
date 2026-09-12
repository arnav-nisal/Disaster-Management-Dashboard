import { Hotspot, Resource, Incident, AuditLog } from '../types/disaster';

export const initialHotspots: Hotspot[] = [
  {
    id: 'INC-8901',
    regionId: 'odisha-delta',
    name: 'Odisha / Coastal Delta Sector',
    stateName: 'Odisha State',
    type: 'Super Cyclonic Storm Surge & Coastal Inundation',
    severity: 9,
    affected: '58,700 civilians',
    leadUnit: 'NDRF Coastal Logistics Wing',
    coords: '19.8135° N, 85.8312° E',
    x: 352,
    y: 396,
    districts: [
      {
        name: 'Puri Coastal District',
        severity: 9,
        badgeText: 'CRITICAL',
        badgeClass: 'bg-red-500/15 text-rose-300 border-red-500/30',
        dotClass: 'bg-red-500 animate-ping',
        description: 'Storm Surge 4.2m, 28,000 affected, Marine evacuation active'
      },
      {
        name: 'Kendrapara Delta Zone',
        severity: 8,
        badgeText: 'CRITICAL',
        badgeClass: 'bg-red-500/15 text-rose-300 border-red-500/30',
        dotClass: 'bg-red-500',
        description: 'Embankment breach at Mahanadi outlet, 14,500 displaced'
      },
      {
        name: 'Cuttack Metro Periphery',
        severity: 6,
        badgeText: 'HIGH',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'Severe urban waterlogging, power sub-station cutoff, 6,200 affected'
      },
      {
        name: 'Bhubaneswar Central Hub',
        severity: 3,
        badgeText: 'NORMAL',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'Logistics operations intact, primary triage airbase staged'
      }
    ]
  },
  {
    id: 'INC-8902',
    regionId: 'mumbai-urban',
    name: 'Maharashtra / Mumbai Urban Sector',
    stateName: 'Maharashtra State',
    type: 'Flash Urban Deluge & Transit Grid Failure',
    severity: 8,
    affected: '32,400 commuters',
    leadUnit: 'Urban Search & Rescue (USAR-2)',
    coords: '18.9220° N, 72.8347° E',
    x: 172,
    y: 432,
    districts: [
      {
        name: 'Mumbai South & Harbour Rail',
        severity: 8,
        badgeText: 'CRITICAL',
        badgeClass: 'bg-red-500/15 text-rose-300 border-red-500/30',
        dotClass: 'bg-red-500 animate-ping',
        description: 'Submerged rail lines, 18,200 commuters trapped at Dadar / Kurla junction'
      },
      {
        name: 'Thane Creek Basin',
        severity: 7,
        badgeText: 'HIGH',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'Tidal overflow in industrial estates, heavy vehicular standstill'
      },
      {
        name: 'Raigad Coastal Belt',
        severity: 5,
        badgeText: 'ELEVATED',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'River Kundalika flash flow warning, mudslide barricades placed'
      },
      {
        name: 'Pune Tactical Reserve',
        severity: 2,
        badgeText: 'STANDBY',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'Expressway clear; dispatching backup NDRF battalions to Mumbai'
      }
    ]
  },
  {
    id: 'INC-8903',
    regionId: 'kutch-saurashtra',
    name: 'Gujarat Coastal Salt Belt / Kutch',
    stateName: 'Gujarat State',
    type: 'Cyclone Wind Surge Tier-3 & Port Shock',
    severity: 7,
    affected: '18,500 residents',
    leadUnit: 'Western Maritime Rescue Command',
    coords: '23.2420° N, 69.6669° E',
    x: 108,
    y: 342,
    districts: [
      {
        name: 'Kutch Coastal Salt Belt',
        severity: 7,
        badgeText: 'HIGH',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'Gale winds 110 km/h, temporary communications mast down, 9,800 relocated'
      },
      {
        name: 'Jamnagar Port Sector',
        severity: 6,
        badgeText: 'HIGH',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'Refinery jetty operations paused; anchor vessels moved to deep water'
      },
      {
        name: 'Rajkot Peripheral Hub',
        severity: 4,
        badgeText: 'MODERATE',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dotClass: 'bg-sky-400',
        description: 'Intermittent heavy squalls; relief convoys moving west'
      },
      {
        name: 'Ahmedabad Operations Command',
        severity: 2,
        badgeText: 'STANDBY',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'State crisis desk synchronized, civil supplies air-bridge prepared'
      }
    ]
  },
  {
    id: 'INC-8904',
    regionId: 'brahmaputra-assam',
    name: 'Assam / Brahmaputra Valley',
    stateName: 'Assam & Northeast Corridor',
    type: 'Highland River Inundation & Wildlife Corridor Breach',
    severity: 7,
    affected: '14,200 displaced',
    leadUnit: 'Northeast Flood Response Battalion',
    coords: '26.2006° N, 92.9376° E',
    x: 486,
    y: 260,
    districts: [
      {
        name: 'Kaziranga Buffer Zone',
        severity: 7,
        badgeText: 'HIGH',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'Submerged highway corridor; animal rescue teams deployed'
      },
      {
        name: 'Majuli Island River Reach',
        severity: 6,
        badgeText: 'HIGH',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'Ferry operations halted; river swell exceeding danger mark by 1.8m'
      },
      {
        name: 'Guwahati Metro Incline',
        severity: 4,
        badgeText: 'MODERATE',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dotClass: 'bg-sky-400',
        description: 'Hill drainage overflows into Bharalu stream; monitored by civic pumps'
      },
      {
        name: 'Tezpur Airbase Logistics',
        severity: 2,
        badgeText: 'STANDBY',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'Helicopter sort plans confirmed for food packet drop'
      }
    ]
  },
  {
    id: 'INC-8905',
    regionId: 'delhi-ncr',
    name: 'Delhi NCR / Northern Transit Hub',
    stateName: 'Delhi & Haryana Region',
    type: 'Critical Logistics Depot Electrical Grid Surge',
    severity: 5,
    affected: '4,100 on-site',
    leadUnit: 'Capital Emergency Operations Center',
    coords: '28.6139° N, 77.2090° E',
    x: 236,
    y: 218,
    districts: [
      {
        name: 'Yamuna Floodplain Sector',
        severity: 5,
        badgeText: 'ELEVATED',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        description: 'Water level at Old Railway Bridge 205.4m; precautionary watch'
      },
      {
        name: 'Anand Vihar Transit Nexus',
        severity: 3,
        badgeText: 'MODERATE',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dotClass: 'bg-sky-400',
        description: 'Localised transformer flashover; emergency diesel gensets online'
      },
      {
        name: 'Central Secretariat Desk',
        severity: 1,
        badgeText: 'STABLE',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'National emergency satellite relay transmitting at 100%'
      }
    ]
  },
  {
    id: 'INC-8907',
    regionId: 'central-mp',
    name: 'Central / Madhya Pradesh Sector',
    stateName: 'Madhya Pradesh State',
    type: 'Narmada Basin Flash Hydrological Warning',
    severity: 3,
    affected: '3,100 rural agrarian',
    leadUnit: 'Central Zone Civil Defense Corps',
    coords: '23.2599° N, 77.4126° E',
    x: 248,
    y: 338,
    districts: [
      {
        name: 'Hoshangabad Narmada Bank',
        severity: 3,
        badgeText: 'MODERATE',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dotClass: 'bg-sky-400',
        description: 'Water level alert at Sethani Ghat; discharge monitored from Tawa Dam'
      },
      {
        name: 'Bhopal Central Coordination',
        severity: 2,
        badgeText: 'STANDBY',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'State disaster warehouse pre-loaded with dry rations and pumps'
      },
      {
        name: 'Indore Transit Corridor',
        severity: 1,
        badgeText: 'NORMAL',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'Highway corridors green-lighted for emergency military convoys'
      }
    ]
  },
  {
    id: 'INC-8906',
    regionId: 'kerala-ghats',
    name: 'Kerala Coastal Sector / Western Ghats',
    stateName: 'Kerala & Nilgiris',
    type: 'High-Gradient Highland Mudslide Warning',
    severity: 2,
    affected: '2,900 hillside residents',
    leadUnit: 'Kerala Coast Guard & SDRF Wing',
    coords: '10.8505° N, 76.2711° E',
    x: 215,
    y: 568,
    districts: [
      {
        name: 'Wayanad Mountain Pass',
        severity: 2,
        badgeText: 'MONITORING',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dotClass: 'bg-sky-400',
        description: 'Soil moisture sensors stabilised; slope monitoring continuing'
      },
      {
        name: 'Idukki Reservoir Downstream',
        severity: 2,
        badgeText: 'STABLE',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'Controlled shutter discharge within safe catchment buffers'
      },
      {
        name: 'Kochi Navy Base Marine Wing',
        severity: 1,
        badgeText: 'STANDBY',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'Fast interceptor crafts fueled and standing by for coastal support'
      }
    ]
  }
];

export const initialResources: Resource[] = [
  { id: 'res-1', category: 'Rescue Boats', total: 50, available: 15, icon: 'anchor' },
  { id: 'res-2', category: 'Medical Kits', total: 1000, available: 420, icon: 'activity' },
  { id: 'res-3', category: 'Ambulances', total: 20, available: 8, icon: 'truck' },
  { id: 'res-4', category: 'Food Packs', total: 5000, available: 2150, icon: 'package' }
];

export const initialIncidents: Incident[] = [
  {
    id: 'INC-8901',
    location: 'Odisha Coastal Delta Sector',
    severity: 9,
    requestedResources: ['Rescue Boats: 14', 'Medical Kits: 220', 'Ambulances: 4'],
    assignedUnit: 'NDRF Coastal Logistics Wing',
    status: 'In Progress',
    timestamp: '14:32:05',
    latitude: 19.8135,
    longitude: 85.8312,
    category: 'Cyclone'
  },
  {
    id: 'INC-8902',
    location: 'Maharashtra / Mumbai Urban Sector',
    severity: 8,
    requestedResources: ['Rescue Boats: 6', 'Ambulances: 8'],
    assignedUnit: 'USAR Battalion 2',
    status: 'Pending',
    timestamp: '14:35:12',
    latitude: 18.9220,
    longitude: 72.8347,
    category: 'Flood'
  },
  {
    id: 'INC-8903',
    location: 'Gujarat Coastal Salt Belt / Kutch',
    severity: 7,
    requestedResources: ['Food Packs: 450', 'Medical Kits: 90'],
    assignedUnit: 'Western Maritime Rescue',
    status: 'Dispatched',
    timestamp: '14:28:40',
    latitude: 23.2420,
    longitude: 69.6669,
    category: 'Cyclone'
  },
  {
    id: 'INC-8904',
    location: 'Assam / Brahmaputra Valley',
    severity: 7,
    requestedResources: ['Medical Kits: 110', 'Food Packs: 600'],
    assignedUnit: 'Northeast Flood Response',
    status: 'In Progress',
    timestamp: '14:20:10',
    latitude: 26.2006,
    longitude: 92.9376,
    category: 'Flood'
  },
  {
    id: 'INC-8905',
    location: 'Delhi NCR / Northern Transit Hub',
    severity: 5,
    requestedResources: ['Food Packs: 150', 'Ambulances: 2'],
    assignedUnit: 'Capital EOC Response',
    status: 'Pending',
    timestamp: '14:15:30',
    latitude: 28.6139,
    longitude: 77.2090,
    category: 'Emergency'
  },
  {
    id: 'INC-8907',
    location: 'Central / Madhya Pradesh Sector',
    severity: 3,
    requestedResources: ['Water Pumps: 8', 'Medical Kits: 65'],
    assignedUnit: 'Central Civil Defense Corps',
    status: 'In Progress',
    timestamp: '14:12:18',
    latitude: 23.2599,
    longitude: 77.4126,
    category: 'Flood'
  },
  {
    id: 'INC-8906',
    location: 'Kerala Coastal Sector / Western Ghats',
    severity: 2,
    requestedResources: ['Rescue Boats: 2', 'Medical Kits: 50'],
    assignedUnit: 'Coast Guard & SDRF Wing',
    status: 'Re-allocated',
    timestamp: '14:10:05',
    latitude: 10.8505,
    longitude: 76.2711,
    category: 'Landslide'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    incidentId: 'INC-8901',
    timestamp: '14:36:10',
    actor: 'NDRF RAPID UNIT',
    actionType: 'ALERT',
    message: 'Priority re-allocation dispatched: Re-routed 4 rescue boats and 200 trauma kits to Puri Coastal District.'
  },
  {
    id: 'log-2',
    incidentId: 'INC-8902',
    timestamp: '14:35:12',
    actor: 'CRISIS ASSESSMENT CELL',
    actionType: 'WARNING',
    message: 'Field telemetry confirmed high tidal surge at Mumbai Harbour. Elevated incident severity to Level 8.'
  },
  {
    id: 'log-3',
    incidentId: 'INC-8906',
    timestamp: '14:33:45',
    actor: 'COMMANDER DIRECTIVE',
    actionType: 'INFO',
    message: "Incident Commander directive applied: Status updated to 'Re-allocated', reserved 2 watercraft battalions for standby in Kerala."
  },
  {
    id: 'log-4',
    incidentId: 'INC-8890',
    timestamp: '14:30:00',
    actor: 'CENTRAL DISPATCH',
    actionType: 'SUCCESS',
    message: 'National geopolitical boundary telemetry synchronized with INSAT-3DR meteorological satellite mesh.'
  },
  {
    id: 'log-5',
    incidentId: 'INC-8903',
    timestamp: '14:28:40',
    actor: 'NDRF RAPID UNIT',
    actionType: 'INFO',
    message: 'Dispatched 450 food ration units and 90 trauma kits to Kutch Coastal Salt Belt via Air-Drop Logistics Group 7.'
  }
];
