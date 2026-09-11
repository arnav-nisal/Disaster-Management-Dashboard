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

### 2. Rapid Incident Reporting Dashboard (`IncidentReportScreen`)
- **Staggered Category Cascades**: The 4 emergency response tiles animate in with individual staggered intervals (380ms – 860ms), creating an ultra-smooth visual hierarchy.
- **Tactile Interactive Physics**: Category tiles react with responsive micro-scaling (`0.95x` on press down, springing back to `1.0x` on release) and glowing neon accent borders.
- **Live Dispatch Radar Beacon**: Real-time pulsing radar wave (`_LiveRadarBeacon`) on the status advisory banner showing active network telemetry and emergency monitoring.
- **Local Incident Telemetry Logging**: Tapping any emergency tile records the incident timestamp and category into local offline persistent storage via `StorageService`.
- **Clean Emergency Header**: The top app bar features the incident dashboard emblem and title, keeping the screen focused and distraction-free in critical conditions.
- **Secure Logout / Profile Reset**: The top-right logout button securely ends the active session while retaining user credentials for quick autofill upon return.

### 3. Emergency Categories
- 🔥 **Fire / Hazard** — Blazes, chemical spills, gas leaks, industrial hazards, explosions.
- 🌊 **Flood / Water** — Flash floods, dam breaches, storm surges, rising water levels.
- 🚑 **Medical Aid** — Trauma, urgent first aid, ambulance dispatch requests.
- 🛡️ **Safe Shelters** — Evacuation routing, nearby refuge points, relief distribution centers.

---

## ⚡ Performance & Storage Optimizations

| Optimization Area | Technique & Implementation | Benefit |
|---|---|---|
| **Render Tree Rebuilds** | Eliminated redundant `AnimatedBuilder` wrappers on screens; explicit `SlideTransition` and `FadeTransition` animate directly | 0 unnecessary widget builds per second during entrance; completely smooth 60/120 FPS transitions |
| **Repaint Layer Isolation** | Added `RepaintBoundary` wrappers to continuous animations (`_pulse`, `_buttonGlowController`, `_LiveRadarBeacon`, ambient gradients) | Continuous animations repaint only their isolated pixel boundary instead of invalidating the entire screen layer; saves significant battery |
| **Centralized Storage Service** | Created `StorageService` singleton with dynamic `SharedPreferences` resolution and backward-compatible key mapping (`name` & `user_name`, `role` & `user_role`) | Single source of truth, eliminates duplicated disk calls, supports offline incident queue |
| **Layout & Memory Footprint** | Replaced dynamic layout allocations with `const` widgets, flexible text wrapping, and compact JSON serialization for incident records | Zero memory leaks, predictable garbage collection, fast application startup |
| **Accessibility Resilience** | Wrapped layout texts in `Flexible` with `TextOverflow.ellipsis` and responsive constraints | Fully compliant with up to `1.5x+` system accessibility font scaling without `RenderFlex` overflow errors |

---

## 📱 Tech Stack & Architecture

| Technology | Purpose |
|---|---|
| **Flutter SDK** (Dart ^3.13.1) | Cross-platform UI toolkit |
| **Material 3** | Visual design system with customized dark palette |
| **shared_preferences** | Local offline key-value storage for user profile & incident telemetry |
| **StorageService** | Clean service layer encapsulating offline persistence and session state |
| **flutter_test** | Automated unit, widget, storage, and accessibility test suite |

---

## 📂 Project Structure

```
flutter-ui/
├── lib/
│   ├── main.dart                   # Application entrypoint & global dark theme definition
│   ├── welcome_screen.dart         # Frictionless login & role selection screen
│   ├── incident_report_screen.dart # Staggered emergency incident categories & dashboard
│   ├── screens/                    # Clean modular screen re-exports
│   │   ├── welcome_screen.dart
│   │   └── incident_report_screen.dart
│   └── services/                   # Service layer
│       └── storage_service.dart    # Centralized offline caching & incident storage
├── test/
│   └── widget_test.dart            # 11 unit, widget, navigation, and accessibility tests
├── pubspec.yaml                    # Dependencies and package metadata
└── README.md                       # Comprehensive documentation
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

- **Run all 11 unit & widget tests:**
  ```bash
  flutter test
  ```
  *Tests include: default identity fallback, persistent session storage, autofill preservation after logout, 1.25x accessibility font scaling, non-scrollable viewport fitting, navigation flow, StorageService CRUD, and incident report telemetry.*

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
