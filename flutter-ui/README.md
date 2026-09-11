# CrisisLink — Disaster Relief & Incident Dashboard

A high-performance, emergency-ready Flutter application built for rapid incident reporting, crisis coordination, and disaster response. Engineered with an offline-first mindset, friction-free identification, high-contrast Material 3 dark theme, optimized rendering pipeline, and fluid micro-animations tailored for mission-critical field conditions.

Developed for the **Kurukshetra Hackathon**.

---

## 🌟 Key Features

### 1. Fast, Friction-Free Identification (`WelcomeScreen`)
- **Zero Sign-in Friction**: In urgent emergency situations, speed saves lives. Users can enter their name or proceed immediately as **"Unknown Person"** with a single tap.
- **Role-Based Context Switching**:
  - **Civilian**: Tailored for citizens seeking urgent assistance, reporting local hazards, and navigating to safe shelters.
  - **First Responder**: Tailored for emergency personnel needing dispatch channels, priority alerts, and field coordination.
- **Smooth Spring Role Toggle**: Fluid animated indicator with spring curve physics and high-contrast glowing badges.
- **Pre-filled Autofill Memory**: Preserves the user's name and role across sessions and after logout for instant re-entry.
- **Viewport-Adaptive Layout**: Guaranteed single-screen presentation with zero vertical scrolling across all standard phone viewports.
- **Early Permission Acquisition**: Non-blocking location permission request triggered at app startup to pre-warm the location cache and optimize response times.

### 2. Comprehensive Incident Reporting Form (`IncidentReportScreen`)
- **Scrollable Emergency Form**: Structured, clear inputs designed for high-stress operation.
- **Disaster Type Dropdown**: Categorizes the emergency with dedicated visual indicators:
  - 🌊 **Flood**
  - 🔥 **Fire**
  - 🌍 **Earthquake**
  - 🚑 **Medical**
- **Dynamic Severity Slider**: 1 to 5 scale with real-time color gradations (Green -> Yellow -> Orange -> Deep Red) and status labels (`1 - Minor`, `2 - Moderate`, `3 - Significant`, `4 - Severe`, `5 - Critical`).
- **Urgent Reporter Override**: "Urgent (Unknown)" button instantly sets identity to "Unknown Person" if reporting under extreme duress.
- **Multi-Tier Live Geolocation (`LocationService`)**:
  - **Tier 1 (Native GPS)**: Queries device hardware GPS via `geolocator` with high-accuracy positioning.
  - **Tier 2 (HTTPS IP Geolocation)**: Primary failover via `https://ipwho.is/` (city, region, coordinates) if GPS hardware or permissions are unavailable.
  - **Tier 3 (HTTP IP Failover)**: Secondary failover via `http://ip-api.com/json`.
  - **Tier 4 (Offline Fallback)**: Resilient default emergency coordinates if network and GPS are completely inaccessible.
  - **Dynamic Source Badges**: Real-time visual chip indicating coordinates provenance:
    - 🟢 `LIVE GPS` (hardware GPS sensor locked)
    - 🔵 `IP NETWORK` (network-resolved IP coordinates)
    - 🟡 `CUSTOM` (manually entered/adjusted coordinates)
    - ⚪ `DISPATCH FALLBACK` (offline default coordinates)
- **Custom Coordinates Modal**: "Custom" button opens a sleek dialog enabling responders to manually enter or fine-tune exact disaster coordinates with numerical bounds validation (-90° to 90° latitude, -180° to 180° longitude).
- **Multi-Select Resource Checklist**: Toggle chips for critical needs:
  - 🚑 `Medical`
  - 🍞 `Food`
  - 🛟 `Rescue`
  - 💧 `Water`
- **Detailed Situation Description**: Multiline text area for tactical field observations, hazard alerts, or victim counts.
- **Submitting & Loading State**: Animated submission button with loading spinner, validation, and error handling.
- **Tactile Quick Action Tiles**: 4 rapid-access category shortcuts (Fire, Flood, Medical Aid, Safe Shelters) with spring physics and telemetry logging.
- **Live Dispatch Radar Beacon**: Real-time pulsing radar wave (`_LiveRadarBeacon`) displaying telemetry and emergency status.
- **Secure Session Management**: Top-right profile and logout button securely ends the session while retaining credentials for autofill.

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
- **Native GPS**: Utilizes `geolocator` (`14.0.3`) for hardware satellite coordinates.
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
