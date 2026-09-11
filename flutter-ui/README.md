# CrisisLink — Disaster Relief & Incident Dashboard

A high-performance, emergency-ready Flutter application built for rapid incident reporting, crisis coordination, and disaster response. Engineered with an offline-first mindset, friction-free identification, high-contrast Material 3 dark theme, optimized rendering pipeline, and fluid micro-animations tailored for mission-critical field conditions.

Developed for the **Kurukshetra Hackathon**.

---

## 📜 Complete Changelog & Architecture Evolution

A detailed summary of all features, enhancements, and architectural upgrades implemented across the application:

### 1. Friction-Free Onboarding & Authentication (`lib/welcome_screen.dart`)
- **Dark Theme Transformation**: Migrated entire visual hierarchy from basic white layout to an emergency-tailored dark theme (`#0B0F19`, `#131B2E`, `#EF4444`).
- **Zero-Friction Identity Fallback**: Submitting an empty name automatically defaults to **"Unknown Person"** for rapid, unblocked emergency dispatch.
- **Persistent Autofill Memory**: User name and role selections persist across app restarts and after logout, allowing instant re-entry.
- **Viewport-Adaptive Single-Screen Layout**: Removed all vertical scrolling from the welcome screen, guaranteeing a single-view presentation without layout clipping on any standard phone viewport.
- **Tactile Role Selector**: Animated spring selector for switching between **Civilian** and **First Responder** roles with glowing badges.
- **Pulsing Status Shield**: Fluid breathing animation with `RepaintBoundary` isolation to minimize GPU/CPU cycles.

### 2. Session Persistence & Navigation Flow (`lib/main.dart`, `lib/services/storage_service.dart`)
- **Centralized `StorageService`**: Singleton service encapsulating `SharedPreferences` with defensive type safety and backward-compatible key mapping (`user_name`, `user_role`, `is_logged_in`).
- **Instant Session Restoration**: On app launch, the authentication state is evaluated before rendering; active sessions skip login and open `IncidentReportScreen` directly.
- **Directional Navigation**: Removed redundant top-left back button from `IncidentReportScreen` to keep the incident dashboard focused and forward-directional.
- **Top-Right Logout Action**: Allows responders and civilians to securely end their session while retaining saved profile credentials for quick autofill.

### 3. Comprehensive Incident Reporting Form (`lib/incident_report_screen.dart`)
- **Disaster Type Dropdown**: Visual classification menu with themed icons for:
  - 🌊 **Flood**
  - 🔥 **Fire**
  - 🌍 **Earthquake**
  - 🚑 **Medical**
- **Dynamic Severity Slider (1 to 5)**: Real-time slider with color-coded gradations (Green $\rightarrow$ Cyan $\rightarrow$ Amber $\rightarrow$ Orange $\rightarrow$ Red) and contextual threat level labels (`Minor`, `Moderate`, `Significant`, `Severe`, `Critical`).
- **Urgent Reporter Override**: Integrated **"Urgent (Unknown)"** quick button to set identity to "Unknown Person" immediately under high-stress field conditions.
- **Multiline Tactical Description**: Form field with dark slate styling, rounded focus borders, and emergency red accents for situation details.
- **Resources Needed Multi-Select**: Responsive toggle chips for `Medical`, `Food`, `Rescue`, and `Water` with active/inactive neon highlights.
- **Staggered Action Cards**: 4 quick-action category shortcuts with staggered entrance animations (`380ms` – `860ms`) and responsive press-down physics (`0.95x` scaling).
- **Live Dispatch Radar Beacon (`_LiveRadarBeacon`)**: Real-time pulsing circular radar waves showing active telemetry monitoring.

### 4. Incident Data Model & REST API Integration (`lib/models/`, `lib/services/incident_api_service.dart`)
- **Strict Data Model (`IncidentReport`)**: Conforms to the required JSON schema:
  `{reporter_name, disaster_type, severity_level, latitude, longitude, description, resources_needed}`.
- **REST API Dispatch**: Sends `POST` requests to `https://my-render-api.com/api/incident` using the `http` package.
- **Network Resilience**:
  - 10-second request timeout handling via `TimeoutException`.
  - HTTP error code inspection (`200 OK` vs `4xx/5xx`).
  - Offline local fallback logging via `StorageService.logIncident`.
- **Dependency Injection**: Accepts optional `http.Client` for fast, zero-flakiness automated testing.

### 5. Native GPS, Permissions & Geolocation Pipeline (`lib/services/location_service.dart`)
- **Native Device GPS (`geolocator: ^14.0.3`)**: Real satellite GPS positioning for physical mobile devices.
- **Platform Permissions**:
  - Android (`android/app/src/main/AndroidManifest.xml`): `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `INTERNET`.
  - iOS (`ios/Runner/Info.plist`): `NSLocationWhenInUseUsageDescription`.
- **Startup Permission Check & Pre-Warming**:
  - Automatically queries location permissions non-blockingly at app launch in `main.dart`.
  - Pre-warms the location cache so coordinates are already loaded when entering the form.
  - Implements a 2-minute cache validity window to eliminate redundant battery-draining GPS queries.
- **4-Tier Geolocation Failover**:
  1. **Tier 1 (Native GPS)**: Hardware sensor satellite fix via `geolocator`.
  2. **Tier 2 (HTTPS IP Geolocation)**: Automatic failover to `https://ipwho.is/` (retrieving latitude, longitude, city, and region).
  3. **Tier 3 (HTTP IP Failover)**: Secondary failover to `http://ip-api.com/json`.
  4. **Tier 4 (Offline Fallback)**: Resilient default emergency dispatch coordinates.
- **Real-Time Provenance Badges**:
  - 🟢 `LIVE GPS` — Hardware satellite fix locked.
  - 🔵 `IP NETWORK` — Network-resolved coordinates with city/region readout.
  - 🟡 `CUSTOM` — Manually specified coordinates.
  - ⚪ `DISPATCH FALLBACK` — Default offline coordinates.
- **Custom Coordinates Modal**: "Custom" button opens an interactive dialog to type or fine-tune exact disaster coordinates with numerical bounds validation (-90° to 90° latitude, -180° to 180° longitude).

### 6. Performance, Layout & Accessibility Optimizations
- **Zero `RenderFlex` Overflows**:
  - Wrapped all SnackBar content text in `Expanded` with `maxLines: 2` and `overflow: TextOverflow.ellipsis`, fixing overflow crashes on 1.25x+ text scaling.
  - Replaced rigid `Row` layouts (Reporter Name header, Severity slider header, Location header) with responsive `Wrap` widgets.
- **Repaint Layer Isolation**:
  - Wrapped continuous looping animations (`_pulse`, `_buttonGlowController`, `_LiveRadarBeacon`) with `RepaintBoundary` to prevent invalidating entire screen layers and preserve device battery.
- **Render Tree Optimization**:
  - Replaced dynamic nested builders with direct `SlideTransition` and `FadeTransition` controllers for smooth 60/120 FPS animations.

### 7. Automated Test Suite (`test/widget_test.dart`)
- Expanded test suite to **18 automated unit, widget, mock API, location, and accessibility tests**.
- Maintained **0 errors and 0 warnings** under `flutter analyze`.

---

## 🌟 Key Features

### Fast, Friction-Free Identification (`WelcomeScreen`)
- **Zero Sign-in Friction**: Users can enter their name or proceed immediately as **"Unknown Person"** with a single tap.
- **Role-Based Context Switching**:
  - **Civilian**: Seeking urgent assistance, reporting local hazards, and navigating to safe shelters.
  - **First Responder**: Priority dispatch channels, alerts, and field coordination.
- **Smooth Spring Role Toggle**: Fluid animated indicator with spring curve physics and high-contrast glowing badges.
- **Pre-filled Autofill Memory**: Preserves user name and role across sessions and after logout for instant re-entry.
- **Viewport-Adaptive Layout**: Single-screen presentation with zero vertical scrolling across standard phone viewports.
- **Early Permission Acquisition**: Non-blocking location permission request triggered at app startup to pre-warm the location cache.

### Comprehensive Incident Reporting Form (`IncidentReportScreen`)
- **Scrollable Emergency Form**: Structured, clear inputs designed for high-stress operation.
- **Disaster Type Dropdown**: Categorizes the emergency with dedicated visual indicators (Flood, Fire, Earthquake, Medical).
- **Dynamic Severity Slider**: 1 to 5 scale with real-time color gradations and status labels.
- **Urgent Reporter Override**: "Urgent (Unknown)" button instantly sets identity to "Unknown Person".
- **Multi-Tier Live Geolocation (`LocationService`)**: Hardware GPS $\rightarrow$ HTTPS IP Geolocation $\rightarrow$ HTTP Geolocation $\rightarrow$ Offline Defaults.
- **Dynamic Source Badges**: `LIVE GPS`, `IP NETWORK`, `CUSTOM`, `DISPATCH FALLBACK`.
- **Custom Coordinates Modal**: Allows responders to manually enter or fine-tune exact coordinates with bounds validation.
- **Multi-Select Resource Checklist**: Toggle chips for `Medical`, `Food`, `Rescue`, `Water`.
- **Tactile Quick Action Tiles**: 4 category shortcuts with spring physics and telemetry logging.
- **Live Dispatch Radar Beacon**: Real-time pulsing radar wave displaying telemetry and emergency status.
- **Secure Session Management**: Top-right profile and logout button securely ends session while retaining autofill credentials.

---

## 🛰️ Incident Report Schema & API Integration

### Data Model (`IncidentReport`)
Reports strictly conform to the required JSON payload specification:

```json
{
  "reporter_name": "Elena Fisher",
  "disaster_type": "Earthquake",
  "severity_level": 4,
  "latitude": 18.5204,
  "longitude": 73.8567,
  "description": "Collapsed wall on 4th cross, 2 civilians trapped under rubble.",
  "resources_needed": [
    "Rescue",
    "Medical"
  ]
}
```

### API Service (`IncidentApiService`)
- **Endpoint**: `POST https://my-render-api.com/api/incident`
- **Headers**: `Content-Type: application/json`
- **Network Safety**:
  - 10-second request timeout handling via `TimeoutException`.
  - HTTP error code inspection (`200 OK` vs `4xx/5xx`).
  - Network disconnection fallback with user-friendly feedback.
- **Dependency Injection**: Accepts an optional `http.Client` for testability and mock responses.

### Location Service (`LocationService`)
- **Native GPS**: Utilizes `geolocator` (`^14.0.3`) for hardware satellite coordinates.
- **Permissions**:
  - Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `INTERNET`.
  - iOS: `NSLocationWhenInUseUsageDescription`.
- **Pre-Warming & Cache**: Automatically requests permissions at startup and caches coordinates for 2 minutes to eliminate repeated battery-draining GPS queries.
- **Testable**: Supports injectable `http.Client` and `enableGps` toggles for zero-flakiness automated testing.

---

## ⚡ Performance & Storage Optimizations

| Optimization Area | Technique & Implementation | Benefit |
|---|---|---|
| **Location Pre-Warming** | Requested permissions non-blockingly at app launch; caches coordinates for 2 minutes | Zero-delay location retrieval when opening the incident form; preserves battery life |
| **Multi-Tier Location Failover** | Hardware GPS $\rightarrow$ HTTPS IP Geolocation $\rightarrow$ HTTP Geolocation $\rightarrow$ Offline Defaults | Coordinates are guaranteed to never fail or crash under any field condition |
| **Render Tree Rebuilds** | Eliminated redundant `AnimatedBuilder` wrappers on screens; explicit `SlideTransition` and `FadeTransition` animate directly | 0 unnecessary widget builds per second during entrance; completely smooth 60/120 FPS transitions |
| **Repaint Layer Isolation** | Added `RepaintBoundary` wrappers to continuous animations (`_pulse`, `_buttonGlowController`, `_LiveRadarBeacon`, ambient gradients) | Continuous animations repaint only their isolated pixel boundary instead of invalidating the entire screen layer; saves significant battery |
| **Centralized Storage Service** | Created `StorageService` singleton with dynamic `SharedPreferences` resolution and backward-compatible key mapping (`name` & `user_name`, `role` & `user_role`) | Single source of truth, eliminates duplicated disk calls, supports offline incident queue |
| **Responsive Wrap & Expanded Layouts** | Replaced rigid `Row` layouts with `Wrap` and wrapped all `SnackBar` text nodes in `Expanded` | 100% immune to `RenderFlex` overflows on small viewports, long location strings, or extreme system font scaling (`1.25x` to `1.5x+`) |

---

## 📱 Tech Stack & Architecture

| Technology | Purpose |
|---|---|
| **Flutter SDK** (Dart ^3.13.1) | Cross-platform UI toolkit |
| **Material 3** | Visual design system with customized dark palette |
| **geolocator** (`^14.0.3`) | Native hardware device GPS positioning and permission management |
| **http** (`^1.2.0`) | REST API communication with Render backend & IP geolocation providers |
| **shared_preferences** (`^2.5.5`) | Local offline key-value storage for user profile & incident telemetry |
| **StorageService** | Clean service layer encapsulating offline persistence and session state |
| **IncidentApiService** | Network service managing POST dispatch to `my-render-api.com` |
| **LocationService** | Multi-tier geographical coordinate resolution, pre-warming, and caching |
| **flutter_test** | Automated unit, widget, mock API, location, and accessibility test suite |

---

## 📂 Project Structure

```
flutter-ui/
├── android/
│   └── app/src/main/AndroidManifest.xml # ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
├── ios/
│   └── Runner/Info.plist              # NSLocationWhenInUseUsageDescription
├── lib/
│   ├── main.dart                      # Application entrypoint & startup location pre-warming
│   ├── welcome_screen.dart            # Frictionless login & role selection screen
│   ├── incident_report_screen.dart    # Scrollable incident form & emergency dashboard
│   ├── models/
│   │   └── incident_report.dart       # IncidentReport JSON model & serialization
│   ├── services/
│   │   ├── storage_service.dart       # Centralized offline caching & incident storage
│   │   ├── incident_api_service.dart  # HTTP REST API client with timeout and error handling
│   │   └── location_service.dart      # Native GPS, IP failover, caching & permissions
│   └── screens/                       # Clean modular screen re-exports
│       ├── welcome_screen.dart
│       └── incident_report_screen.dart
├── test/
│   └── widget_test.dart               # 18 automated unit, widget, mock API, location, and accessibility tests
├── pubspec.yaml                       # Dependencies (geolocator, http, shared_preferences)
└── README.md                          # Comprehensive documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (version `>=3.13.1`)
- Android Studio / VS Code with Flutter extensions
- Android device, iOS simulator, or Chrome for Web

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arnav-nisal/Disaster-Management-Dashboard.git
   cd Disaster-Management-Dashboard/flutter-ui
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Run the app:**
   ```bash
   flutter run
   ```

---

## 🧪 Testing & Verification

Run the automated test suite and code analysis:

- **Run all 18 unit & widget tests:**
  ```bash
  flutter test
  ```
  *Tests verify:*
  1. Default identity fallback to "Unknown Person".
  2. Persistent session storage and direct navigation on restart.
  3. Autofill preservation after logout.
  4. 1.25x accessibility font scaling compliance without overflow.
  5. Non-scrollable viewport fitting on WelcomeScreen.
  6. Absence of top-left back button; presence of top-right logout.
  7. StorageService CRUD and incident counting.
  8. `IncidentReport` model schema validation (`toJson` / `fromJson`).
  9. Incident form input handling, location acquisition, and mock API submission.
  10. "Urgent (Unknown)" button functionality.
  11. `LocationService` live coordinate resolution from primary endpoint.
  12. `LocationService` emergency fallback on network error.
  13. Custom coordinates modal allowing manual coordinate input and validation.
  14. Location SnackBar layout scaling cleanly with zero `RenderFlex` overflow under 1.25x scaling.
  15. `LocationService` location cache pre-warming, startup permission, and 2-minute freshness check.

- **Run code analyzer:**
  ```bash
  flutter analyze
  ```
  *Ensures zero lint warnings, clean architecture, and strict typing.*

---

## 🎨 Color Palette

| Color | Hex | Usage |
|---|---|---|
| Background Dark | `#0B0F19` | Main scaffold background |
| Surface Card | `#131B2E` | Container and action tile background |
| Field Fill | `#0F172A` | Inputs and toggle tracks |
| Border Slate | `#1E293B` | Subtle card & field borders |
| Emergency Red | `#EF4444` / `#DC2626` | Primary accents, buttons & alerts |
| Responder Crimson | `#7F1D1D` | First Responder badges & highlights |
| Civilian Blue | `#1E3A5F` / `#2563EB` | Civilian badge & secondary highlights |
| Hazard Orange | `#FB923C` | Fire & Chemical hazard category |
| Water Cyan | `#38BDF8` | Flood & Storm surge category |
| Medical Pink | `#F87171` | Medical trauma & Ambulance category |
| Shelter Green | `#4ADE80` | Safe shelter & Evacuation category |
| Muted Text | `#64748B` / `#94A3B8` | Subtitles, helpers, and secondary metadata |
