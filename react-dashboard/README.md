# PS20 Disaster Response Command Center (React)

Tactical 2D Political Threat Radar, District Risk Mesh, and Multi-Agent Command Center replicated in **React + TypeScript + Tailwind CSS**.

## Project Architecture

```
react-dashboard/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── src/
    ├── main.tsx                      # Root mount with DisasterProvider
    ├── App.tsx                       # Master command layout (Header, Main, Modals, Toasts)
    ├── index.css                     # Custom animations, HUD scanlines, cyberpunk tactical filters
    ├── types/
    │   └── disaster.ts               # TypeScript schemas (Incident, Hotspot, District, Resource, AuditLog)
    ├── data/
    │   └── mockDisasterData.ts       # Calibrated geospatial coordinates & initial telemetry
    ├── context/
    │   └── DisasterContext.tsx       # State management & simulated Firestore onSnapshot subscriptions
    ├── components/
    │   ├── common/
    │   │   └── ToastContainer.tsx    # Tactical notification toasts
    │   ├── header/
    │   │   └── Header.tsx            # Navigation, active agents counter, latency HUD, simulation trigger
    │   ├── kpi/
    │   │   ├── KpiDeck.tsx           # Real-time incident counts & critical alert metrics
    │   │   └── ResourceInventory.tsx # Inventory capacity bars (Boats, Med Kits, Ambulances, Food)
    │   ├── map/
    │   │   ├── ThreatRadarMap.tsx    # 2D political base map container with pan/zoom centering
    │   │   ├── RadarOverlay.tsx      # SVG calibration rings, rotating radar sweep & watermark labels
    │   │   ├── HotspotPin.tsx        # Pulsing coordinate pins with severity glow
    │   │   └── DistrictFocusCard.tsx # Popover breakdown strictly sorted: Critical -> High -> Moderate -> Normal
    │   ├── kanban/
    │   │   ├── KanbanMatrix.tsx      # 4 Severity tiers (Critical, High, Moderate, Resolved) + search filter
    │   │   ├── KanbanColumn.tsx      # Column container with severity badges & counts
    │   │   └── IncidentCard.tsx      # Incident cards with resource tags & Human Override button
    │   ├── sidebar/
    │   │   └── AuditLogSidebar.tsx   # Streaming AI activity terminal, actor filtering, UTF-8 status
    │   └── modals/
    │       ├── HumanOverrideModal.tsx# Commander manual override form with severity slider & status override
    │       └── GeneralDetailsModal.tsx# National ranked threat intel modal (highest risk first)
```

## Running the Application

```bash
# Start development server on port 3000
npm run dev

# Build production bundle
npm run build
```

## Connecting to Firebase Firestore Later

The state management in `src/context/DisasterContext.tsx` is structured specifically for Firebase:
1. Initialize Firebase app:
   ```ts
   import { initializeApp } from 'firebase/app';
   import { getFirestore, collection, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';
   ```
2. Replace local state initialization in `DisasterContext.tsx` with `onSnapshot` listeners:
   ```ts
   useEffect(() => {
     const unsubIncidents = onSnapshot(collection(db, 'incidents'), (snapshot) => {
       const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
       setIncidents(docs);
     });
     return () => unsubIncidents();
   }, []);
   ```
3. Map `submitHumanOverride` directly to `updateDoc(doc(db, 'incidents', payload.incidentId), ...)` and `addDoc(collection(db, 'audit_logs'), ...)`.

 v2