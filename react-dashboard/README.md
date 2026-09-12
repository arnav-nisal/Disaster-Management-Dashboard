# National Incident Command System (ICS-20) — Disaster Management Dashboard

Tactical 2D Political Threat Radar, District Risk Mesh, Multi-Agent Resource Allocation, and Live Commander Directive Center built with **React 18 + TypeScript + Vite + Tailwind CSS + Firebase**.

---

## 🌟 Executive Summary & Mission

The **National Incident Command System (ICS-20)** is a mission-critical disaster management and tactical resource coordination platform designed for national disaster response authorities (such as the **NDMA** and **NDRF**).

The system integrates real-time geospatial threat radar tracking, district-level vulnerability meshes, live emergency battalion inventories, triage kanban workflows, human commander manual overrides, streaming operational audit logs, and instant disaster simulation capabilities.

---

## 🚀 Key Features & Capabilities

### 1. 🛡️ Welcome & Authentication Gateway (`/welcome`, `/login`, `/signup`)
- **Mission Gateway**: Welcome screen featuring live Indian Standard Time (IST) clock, INSAT-3DR satellite uplink telemetry, and animated NDMA orbital crest insignia.
- **Guest / Demo Mode**: One-click "Enter Command Center" bypass with smooth scale and fade transitions.
- **Operator Authentication**:
  - **Secure Sign-In (`LoginPage.tsx`)**: Authenticates against Firebase Firestore `users` collection with shake error feedback, password visibility toggling, and automatic logging of all login attempts in `login_logs`.
  - **Access Request (`SignupPage.tsx`)**: Clean operator registration form for demo credential generation.
  - **SSO Preparation**: Google Workspace SSO placeholder tag with "Coming Soon" status.

### 2. 🛰️ 2D Threat Radar & Geospatial Risk Mesh (`ThreatRadarMap.tsx`)
- **Official Political Map of India**: Precise WGS-84 coordinate-calibrated vector map with high-contrast tactical state boundaries.
- **Interactive Hotspot Pins (`HotspotPin.tsx`)**:
  - Pulsing radar pings color-coded by severity (Critical Sev 8–10 in Rose Red, High Sev 5–7 in Amber Orange, Moderate Sev 1–4 in Sky Blue).
  - Dynamic hover tooltips displaying sector name, coordinates, affected civilian count, and active lead response unit.
- **Pan & Zoom Auto-Centering**: Clicking any hotspot automatically scales ($1.65\times$) and shifts the viewport coordinates to center directly on the focused disaster zone.
- **Tactical Radar Sweep (`RadarOverlay.tsx`)**: Concentric calibration range rings and rotating continuous radar sweep beam with grid watermark overlays.
- **District Risk Popover (`DistrictFocusCard.tsx`)**: Floating frosted glass popover displaying district-by-district casualty / danger breakdowns sorted strictly by priority (`Critical` $\rightarrow$ `High` $\rightarrow$ `Moderate` $\rightarrow$ `Normal`), with instant navigation to sector-filtered triage.

### 3. 📋 Incident Triage Kanban Matrix (`KanbanMatrix.tsx`)
- **4 Workflow Triage Tiers**:
  - 🚨 **Critical Red (Sev 8–10)**: Immediate life-threatening events requiring rapid battalion dispatch.
  - ⚠️ **High Orange (Sev 5–7)**: Major infrastructure damage, urban waterlogging, transit grid failures.
  - ℹ️ **Moderate Blue (Sev 1–4)**: Land subsidence monitoring, precautionary relocations, logistics hubs.
  - ✅ **Resolved Green**: Contained emergencies, evacuated zones, and standby reserves.
- **Instant Search & Filters**: Live filtering by incident ID, target sector name, assigned unit, and status, plus one-click filter reset.
- **Incident Cards (`IncidentCard.tsx`)**: Detailed badges for required emergency gear, timestamp, assigned unit, and a "Directive / Override" button.

### 4. ⚡ Commander Directive & Human Override Modal (`HumanOverrideModal.tsx`)
- **Manual Severity Adjustment**: Interactive range slider (1 to 10) to adjust threat priority based on field intelligence.
- **Status Override**: Dynamic status transitions (`Pending`, `In Progress`, `Dispatched`, `Re-allocated`, `Resolved`).
- **Resource Reallocation**: Comma-separated equipment assignment updates.
- **Reason & Audit Log**: Requires commander rationale entry, automatically dispatching an immutable operational log with `COMMANDER DIRECTIVE` classification.

### 5. 📑 Ranked National Threat Intelligence Brief (`GeneralDetailsModal.tsx`)
- **Highest Priority First**: Automatically sorts all nationwide disaster sectors by threat level in descending order.
- **#1 Threat Spotlight Card**: Prominently highlights the nation's single most dangerous active sector with pulsing indicators, casualty figures, lead battalion, and requested assets.
- **Direct Radar Inspection & Kanban Drill-Down**: Quick navigation buttons to center the map on any sector or switch directly to its Kanban board.

### 6. 📊 Real-Time KPI Deck & Resource Mesh (`KpiDeck.tsx`, `ResourceInventory.tsx`)
- **Active Incident Counter**: Total live emergencies with rate-of-change indicators (`+3 / hr`).
- **Critical Red Zones**: Real-time counter of Sev 8–10 threats with animated alert badges.
- **Emergency Battalions**: Total deployed battalions and readiness percentage.
- **Resource Inventory Capacities**: Real-time progress bars tracking NDRF equipment stock:
  - 🚤 **Rescue Boats**: Inflatable & motorized flood rescue craft.
  - 🩹 **Trauma & First-Aid Kits**: Medical triage packs.
  - 🚑 **ALS Ambulances**: Advanced life support transport units.
  - 🍞 **Air-Drop Ration Packs**: Emergency food & water relief kits.

### 7. 📡 Streaming Operational Dispatch Log (`AuditLogSidebar.tsx`)
- **Live Activity Feed**: Streaming audit trail recording every system alert, unit deployment, commander directive, and flash event.
- **Actor-Level Filtering**:
  - `ALL RESPONSE UNITS`
  - `COMMANDER DIRECTIVES ONLY`
  - `NDRF LOGISTICS & RESCUE`
  - `SITUATION ASSESSMENT CELL`
  - `CENTRAL DISPATCH`
- **Management Controls**: One-click log clearing and timestamped record entries.

### 8. 🚨 Live Emergency Simulation Engine (`simulateDisasterEvent`)
- **Simulation Trigger**: Header button generating randomized high-severity flash disaster incidents across major delta reaches, coastal zones, and urban hubs.
- **Auto-Dispatch Toggle**: Switch between automated algorithmic unit routing and manual hold mode.
- **Tactical Toast Notification System (`ToastContainer.tsx`)**: Ephemeral, color-coded status alerts (info, warning, success) notifying operators of every action.

---

## 🗂️ Complete Directory & File Structure

```
react-dashboard/
├── .env.example                        # Template for Firebase and Vite environment variables
├── index.html                          # Root HTML shell with viewport, dark theme background & fonts
├── package.json                        # Project dependencies, scripts, and metadata
├── package-lock.json                   # Deterministic package dependency tree
├── postcss.config.js                   # PostCSS pipeline loading Tailwind CSS & Autoprefixer
├── tailwind.config.js                  # Tailwind configuration with tactical colors & keyframe animations
├── tsconfig.json                       # TypeScript compiler options (strict mode, bundler resolution)
├── tsconfig.node.json                  # TypeScript compiler settings for Vite config
├── vite.config.ts                      # Vite build & development server config (port 3000)
└── src/
    ├── main.tsx                        # Application mount point wrapping App in DisasterProvider
    ├── App.tsx                         # Master router & view switcher (Welcome, Login, Signup, Dashboard)
    ├── vite-env.d.ts                   # TypeScript typing declarations for Vite and import.meta.env
    ├── index.css                       # Cyberpunk tactical UI tokens, glassmorphism, radar scanlines
    ├── types/
    │   └── disaster.ts                 # TypeScript data contracts (Incident, Hotspot, District, Resource, AuditLog)
    ├── data/
    │   └── mockDisasterData.ts         # Geospatial coordinates, district casualty data & initial telemetry
    ├── services/
    │   └── firebase.ts                 # Firebase App and Firestore initialization with Vite env fallback
    ├── context/
    │   └── DisasterContext.tsx         # Central React Context state store, reducer actions & simulation engine
    └── components/
        ├── auth/
        │   ├── LoginPage.tsx           # Secure sign-in form with Firestore authentication & log tracking
        │   └── SignupPage.tsx          # Operator account registration interface
        ├── welcome/
        │   └── WelcomePage.tsx         # ICS-20 entrance portal with live IST clock & INSAT-3DR status
        ├── common/
        │   └── ToastContainer.tsx      # Tactical floating notification toasts with auto-dismiss
        ├── header/
        │   └── Header.tsx              # Telemetry banner, view navigation tabs, simulation & dispatch triggers
        ├── kpi/
        │   ├── KpiDeck.tsx             # 4 top-level operational metric cards (Incidents, Critical, Units)
        │   └── ResourceInventory.tsx   # Equipment availability percentage meters (Boats, Med, Ambulances, Rations)
        ├── map/
        │   ├── ThreatRadarMap.tsx      # 2D geospatial base map with pan/zoom centering & national threat brief trigger
        │   ├── RadarOverlay.tsx        # SVG concentric range rings & rotating radar sweep beam
        │   ├── HotspotPin.tsx          # Pulsing geo-anchored coordinate markers with severity glow
        │   └── DistrictFocusCard.tsx   # District casualty breakdown popover sorted Critical -> Normal
        ├── kanban/
        │   ├── KanbanMatrix.tsx        # 4-tier triage matrix with search and active sector filtering
        │   ├── KanbanColumn.tsx        # Severity column wrapper with counter pills and drop styling
        │   └── IncidentCard.tsx        # Incident ticket card with equipment requirements & directive button
        ├── sidebar/
        │   └── AuditLogSidebar.tsx     # Streaming incident dispatch log with actor filter & clear actions
        └── modals/
            ├── HumanOverrideModal.tsx  # Commander directive form with 1-10 severity slider & reasoning log
            └── GeneralDetailsModal.tsx # National Ranked Threat Intel modal (sorted highest risk first)
```

---

## 🛠️ Technology Stack & Dependencies

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [React 18.3](https://react.dev/) | Component architecture with modern hooks (`useState`, `useEffect`, `useMemo`, `useContext`) |
| **Language** | [TypeScript 5.5+](https://www.typescriptlang.org/) | Strict type safety across all disaster domains, components, and environment variables |
| **Build Tool** | [Vite 5.4](https://vitejs.dev/) | Instant hot module replacement (HMR), lightning-fast ES module bundling |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Tactical utility classes, dark glassmorphism styling, custom keyframe animations |
| **CSS Processing** | [PostCSS](https://postcss.org/) & [Autoprefixer](https://github.com/postcss/autoprefixer) | Vendor prefixing and modern CSS parsing |
| **Icons** | [Lucide React](https://lucide.dev/) | High-clarity tactical and telemetry iconography |
| **Class Utilities** | `clsx` & `tailwind-merge` | Conditional and conflict-free className composition |
| **Backend / DB** | [Firebase 12 (Firestore)](https://firebase.google.com/) | Real-time NoSQL database for operator authentication, audit logging, and live incident syncing |

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js**: `v18.0.0` or higher (tested on Node `v24.x`)
- **npm**: `v9.0.0` or higher (tested on npm `v11.x`)

### 1. Clone & Navigate to Repository
```bash
cd "Disaster-Management-Dashboard/react-dashboard"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (Optional)
Copy the example environment file:
```bash
cp .env.example .env
```
*(If left empty or unconfigured, the application runs automatically in offline/demo mode with rich mock data and safe fallbacks).*

### 4. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000/
```

### 5. Build for Production
```bash
npm run build
```
This runs TypeScript validation (`tsc`) followed by Vite production bundling into the `dist/` directory.

### 6. Preview Production Build
```bash
npm run preview
```

---

## ⚙️ Environment Variables Reference

Create a `.env` file in the root of `react-dashboard/` with the following variables:

| Variable Name | Required? | Description |
| :--- | :---: | :--- |
| `VITE_FIREBASE_API_KEY` | Optional | Firebase project Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase project authentication domain (`<id>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Optional | Google Cloud / Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Firebase Storage bucket address |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase registered Web Application ID |

---

## 📐 Data Schemas & Core Types (`src/types/disaster.ts`)

```typescript
// District level granularity within a disaster sector
export interface District {
  name: string;
  severity: number;              // 1 (Normal) to 10 (Critical)
  badgeText: string;             // 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'NORMAL'
  badgeClass: string;            // Tailwind color styling
  dotClass: string;              // Pulsing indicator styling
  description: string;           // Tactical ground report
}

// Macro disaster sector
export interface Hotspot {
  id: string;                    // e.g. 'INC-8901'
  regionId: string;              // URL-safe slug e.g. 'odisha-delta'
  name: string;                  // e.g. 'Odisha / Coastal Delta Sector'
  stateName: string;             // Administrative state
  type: string;                  // Disaster taxonomy (Cyclone, Flood, Landslide, etc.)
  severity: number;              // 1 to 10
  affected: string;              // e.g. '58,700 civilians'
  leadUnit: string;              // Primary dispatched battalion
  coords: string;                // WGS-84 coordinates
  x: number;                     // 2D map X coordinate
  y: number;                     // 2D map Y coordinate
  districts: District[];         // Child districts
}

// Emergency unit dispatch ticket
export interface Incident {
  id: string;                    // e.g. 'INC-9201'
  location: string;              // Target district / sector
  severity: number;              // Threat tier (1 to 10)
  requestedResources: string[];  // e.g. ['Rescue Boats: 4', 'Trauma Kits: 80']
  assignedUnit: string;          // Assigned battalion
  status: 'Pending' | 'In Progress' | 'Dispatched' | 'Re-allocated' | 'Resolved';
  timestamp: string;             // Time recorded
}

// Operational audit trail
export interface AuditLog {
  id: string;
  incidentId: string;
  timestamp: string;
  actor: string;                 // 'COMMANDER DIRECTIVE' | 'CENTRAL DISPATCH' | etc.
  actionType: 'ALERT' | 'WARNING' | 'INFO' | 'SUCCESS';
  message: string;
}
```

---

## 🔥 Firebase Firestore Production Setup

The codebase is built ready for direct Firebase synchronization:

1. **Authentication & Logs**:
   - Operator credentials can be stored in the `users` Firestore collection:
     ```json
     {
       "username": "commander1",
       "password": "hashed_password",
       "role": "Chief Incident Commander",
       "clearance": "LEVEL-5"
     }
     ```
   - Successful and failed authentication attempts are written to `login_logs`.

2. **Real-Time Incidents Sync**:
   To connect live Firestore listeners to `DisasterContext.tsx`:
   ```typescript
   import { collection, onSnapshot } from 'firebase/firestore';
   import { db } from '../services/firebase';

   useEffect(() => {
     const unsubscribe = onSnapshot(collection(db, 'incidents'), (snapshot) => {
       const liveIncidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Incident[];
       setIncidents(liveIncidents);
     });
     return () => unsubscribe();
   }, []);
   ```

3. **Live Commander Directives**:
   Update documents and push immutable audit logs via `updateDoc` and `addDoc`:
   ```typescript
   await updateDoc(doc(db, 'incidents', payload.incidentId), {
     severity: payload.severity,
     status: payload.status,
     requestedResources: payload.resources
   });

   await addDoc(collection(db, 'audit_logs'), {
     incidentId: payload.incidentId,
     actor: 'COMMANDER DIRECTIVE',
     timestamp: new Date().toISOString(),
     message: payload.reason
   });
   ```

---

## 🧪 Testing & Verification

- **Type Checking**: Strict TypeScript validation:
  ```bash
  npx tsc --noEmit
  ```
- **Production Build Test**: Confirms bundle generation and module resolution:
  ```bash
  npm run build
  ```
- **Dev Server Verification**: Launches locally with zero console transformation errors on `http://localhost:3000/`.

---

## 🛡️ License

Developed for the **Kurukshetra Hackathon** — National Disaster Management Command Center Simulation (ICS-20). All rights reserved.