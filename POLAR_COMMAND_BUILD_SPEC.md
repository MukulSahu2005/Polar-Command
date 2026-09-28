# POLAR COMMAND — Master Build Specification (Agent Prompt)

> **How to use this file:** Give this entire document to your coding agent (Claude Code, Cursor, etc.) with the instruction:
> *"Read POLAR_COMMAND_BUILD_SPEC.md fully and build the complete project exactly as specified. Work phase by phase (Section 17). After each phase, run the app and fix errors before continuing. Do not ask questions; where something is ambiguous, follow this spec, and where the spec is silent, choose the simplest option."*

---

## 0. Ground rules for the agent

1. Build a **working full-stack prototype**: React + TypeScript frontend, FastAPI + PostgreSQL backend, seeded synthetic data, JWT demo login.
2. **Everything must run locally with one command each** (`npm run dev`, `uvicorn app.main:app --reload`, optional `docker compose up`).
3. **Demo Mode is mandatory**: with `VITE_DEMO_MODE=true` the frontend works fully with no backend, using local mock data through a provider layer (Section 12).
4. **All data is synthetic.** Show a persistent `DEMO TELEMETRY` badge in the topbar. Never claim values are real NCPOR measurements. The station layout is a *representative prototype abstraction*, not an official blueprint.
5. **Unfinished features must never be dead buttons.** Any feature not fully implemented must show the "Under Development" pattern (Section 15) — a toast and/or a placeholder panel with a clear message. No silent failures, no `alert()`.
6. Every screen needs: **loading (skeletons), error (with Retry), empty, and stale-data states.**
7. Use **one canonical dataset** (Section 9). The source mockups had inconsistent numbers; the canonical values below override them.
8. Do not use Three.js, microservices, real IoT, or a chatbot. Digital Twin is **2D SVG + React**.
9. Code quality: strict TypeScript, no `any`, components small and reusable, no hard-coded demo numbers inside components (they come from mock/API).

---

## 1. Project overview

**POLAR COMMAND** is a remote-operations "mission control" console and Digital Twin for India's Antarctic research stations **Maitri** and **Bharati** (SIH 2026, PS 26060). It integrates infrastructure, energy, logistics, and environmental monitoring, detects anomalies, raises alerts, and lets operators run **what-if simulations** to get recommended actions.

**Core story the UI must tell (the hero demo path):**

```
Select Bharati/Maitri → Dashboard → Digital Twin → click Generator 02
→ efficiency declining → anomaly detected → alert raised → open alert
→ Run What-If (Gen 02 offline) → power drops 870→610 kW
→ critical loads preserved, non-critical shed → recommended response
```

Operator questions the UI answers: What is happening? Is anything abnormal? Where? How serious? What happens next? What if this fails? What do I investigate first?

**Product feel:** Antarctic operations + aerospace control room + modern SaaS. Controlled, dense, readable. Not a crypto/gaming dashboard.

---

## 2. Tech stack (locked — do not change)

### Frontend
React 18 + TypeScript + Vite · Tailwind CSS · React Router v6 · Zustand · Axios · Recharts · Lucide React · React Hot Toast · Framer Motion (light use) · SVG for Digital Twin · (optional) React Hook Form + Zod for login.
Fonts: **Inter** (UI) and **JetBrains Mono** (telemetry/labels), via Google Fonts.

### Backend
FastAPI · SQLAlchemy 2.x · Pydantic v2 · PostgreSQL (SQLite fallback allowed via `DATABASE_URL` for quick start) · JWT auth (python-jose + passlib) · NumPy · Pandas · scikit-learn (IsolationForest) · Uvicorn.

### Deployment
Frontend → Vercel · Backend → Render · DB → Render/Neon PostgreSQL. Provide `Dockerfile` for backend and `docker-compose.yml` (frontend, backend, postgres).

---

## 3. Repository layout

```
POLAR-COMMAND/
├── frontend/
├── backend/
├── data/                      # generated seed files (json/csv)
├── docs/
│   ├── api.md
│   └── architecture.md
├── docker-compose.yml
├── README.md
└── .gitignore
```

### 3.1 Frontend structure (feature-based)

```
frontend/
├── public/favicon.svg
├── src/
│   ├── app/            App.tsx, router.tsx, providers.tsx, constants.ts
│   ├── components/
│   │   ├── ui/         Button, IconButton, Card, Badge, StatusBadge, StatusDot, ProgressBar,
│   │   │               Spinner, Skeleton, Tooltip, Modal, Drawer, Tabs, Select, Toggle, Input,
│   │   │               EmptyState, ErrorState, ConfirmDialog, FeatureInProgress
│   │   ├── layout/     AppShell, Sidebar, Topbar, PageHeader, Breadcrumbs, MobileSidebar,
│   │   │               BottomStatusBar, ConnectionBanner
│   │   └── common/     MetricCard, SectionHeader, Sparkline, TrendIndicator, RiskBadge,
│   │                   LastSync, DataSourceBadge, CommandLoading, TimeRangeSelector
│   ├── features/
│   │   ├── auth/            LoginPage, LoginForm, DemoCredentials
│   │   ├── dashboard/       DashboardPage + StationHealthCard, OperationalSummary, TwinPreview,
│   │   │                    SystemTrendChart, PriorityAlertList, QuickActions, InterventionsPanel
│   │   ├── digital-twin/    DigitalTwinPage, TwinCanvas, StationLayout, AssetMarker,
│   │   │                    AssetDetailsPanel, TwinLegend, TwinToolbar, TwinLayerControl, AssetFilter
│   │   ├── energy/          EnergyOverview, GeneratorGrid, GeneratorCard, BatteryCard, FuelLevelCard,
│   │   │                    PowerHistoryChart, FuelHistoryChart, RenewablesPanel, EnergyInsight
│   │   ├── environment/     EnvironmentOverview, Temperature/Wind/Pressure/Humidity/Visibility cards,
│   │   │                    EnvironmentHistoryChart, WindCompass, EnvironmentRiskBanner, ForecastPanel
│   │   ├── logistics/       LogisticsOverview, InventoryGrid, InventoryCard, StockLevelBar,
│   │   │                    ResupplyStatus, LogisticsAlert, ConsumablesTable
│   │   ├── alerts/          AlertsPage, AlertFilters, AlertList, AlertCard, AlertDetailsPanel,
│   │   │                    AlertTimeline, AcknowledgeButton, RecommendedAction
│   │   ├── simulation/      SimulationPage, ScenarioSelector, ScenarioCard, AtmosphericControls,
│   │   │                    GenerationBusPanel, LoadSheddingMatrix, SimulationResult, VerdictStrip,
│   │   │                    ImpactCharts, DirectivesList, BeforeAfterChart
│   │   └── operations/      OperationsPage, OperationsTabs
│   ├── pages/          thin route wrappers (Login, Dashboard, DigitalTwin, Operations, Alerts,
│   │                    Simulation, NotFound)
│   ├── services/       apiClient.ts, authApi, stationApi, assetApi, energyApi, environmentApi,
│   │                    logisticsApi, alertApi, simulationApi
│   ├── providers/      dataProvider.ts (demo vs live switch), demo/*.ts, live/*.ts
│   ├── store/          authStore, stationStore, uiStore, alertStore
│   ├── hooks/          useAuth, useStation, useDashboard, useEnergy, useEnvironment,
│   │                    useLogistics, useAlerts, useAssets, useSimulation, usePolling
│   ├── types/          station, asset, energy, environment, logistics, alert, simulation, api
│   ├── mock/           stations, assets, energy, environment, logistics, alerts, simulation, telemetryEngine
│   ├── utils/          formatNumber, formatDate, formatStatus, severity, calculations, cn
│   ├── styles/         globals.css, tokens.css
│   └── main.tsx
├── .env / .env.example
├── package.json, tsconfig.json, vite.config.ts, tailwind config
```

### 3.2 Backend structure

```
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── router.py
│   │   └── routes/ auth.py stations.py assets.py energy.py environment.py
│   │                logistics.py alerts.py simulation.py health.py
│   ├── models/     user.py station.py asset.py energy.py environment.py inventory.py alert.py
│   │               simulation_run.py
│   ├── schemas/    (Pydantic) mirrors models + simulation request/response
│   ├── services/   station_service, asset_service, energy_service, environment_service,
│   │               logistics_service, alert_service, simulation_service
│   ├── analytics/  anomaly.py  forecasting.py  risk_engine.py  health_score.py
│   ├── database/   connection.py  seed.py  generate_data.py
│   └── core/       config.py  security.py  deps.py
├── requirements.txt
├── Dockerfile
└── .env.example
```

**Pattern:** `Route → Service → DB`. No SQL/ORM queries inside route functions.

---

## 4. Design system

**Primary theme: LIGHT** (the approved mockups are light slate + cyan). Provide optional dark-mode via a `dark` class toggle in `uiStore` if time permits (tokens below include dark values).

### 4.1 Tokens (Tailwind + CSS variables)

| Token | Light | Dark (optional) |
|---|---|---|
| background | `#F8FAFC` (slate-50) | `#07131D` |
| surface/card | `#FFFFFF` | `#102734` |
| border | `#E2E8F0` (slate-200) | `#203845` |
| text primary | `#0F172A` | `#F5FAFC` |
| text secondary | `#475569` | `#93AAB5` |
| muted | `#94A3B8` | `#617984` |
| primary (cyan) | `#0891B2` / hover `#0E7490` | `#55C7E8` |
| success (emerald) | `#10B981` | `#45D39C` |
| warning (amber) | `#F59E0B` | `#F6B94A` |
| critical (rose/red) | `#E11D48` | `#F05D5E` |
| info (sky) | `#0284C7` | `#82DDF2` |

Status colours are used **consistently everywhere**: healthy/normal = emerald, warning = amber, critical = rose, offline = slate-400, maintenance = sky, unknown = slate-300. Never rely on colour alone — always pair with a text label.

### 4.2 Typography
Page title 24–28px bold · Section title 16–18px semibold · Card title 13–14px · Body 13–14px · Metric 24–36px `font-mono` bold · Metadata/labels 10–12px `font-mono` UPPERCASE with tracking-wider. Numbers, IDs, timestamps, units → JetBrains Mono.

### 4.3 Components look
Cards: `rounded-xl border border-slate-200 bg-white shadow-sm p-4/5`. Badges: small rounded pills, mono uppercase. Buttons: primary = cyan-600, danger = rose-600, secondary = white with slate border. Status dots: 8px, with `animate-pulse` only for critical. **Animate sparingly** — page/drawer transitions, critical pulse, chart appear. No constant floating/bouncing.

### 4.4 Status model

```ts
type Status = "healthy"|"normal"|"warning"|"critical"|"offline"|"maintenance"|"unknown";
type Severity = "critical"|"warning"|"info";
```
One `StatusBadge` component handles all. One `severity.ts` util maps status → colour classes/labels.

### 4.5 Responsive
Desktop primary (sidebar 240–256px). Tablet: sidebar collapses to icons; grids 2-col. Mobile: sidebar → drawer; KPI 1–2 cols; charts scroll horizontally; twin full-width; asset panel → bottom sheet.

### 4.6 Accessibility
`aria-label` on icon buttons, labelled inputs, focus rings, status text not colour only.

---

## 5. Application shell (all pages after login)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Topbar (fixed, h-16)                                                 │
├───────────┬──────────────────────────────────────────────────────────┤
│ Sidebar   │  Page content (scrolls)                                  │
│ (fixed)   │                                                          │
├───────────┴──────────────────────────────────────────────────────────┤
│ Bottom status bar (fixed, h-10)                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.1 Topbar
- Left: cyan rounded logo tile with `ac_unit`/Snowflake icon, **POLAR COMMAND** (mono, bold, tracking-wider), version chip `v4.2-EXP`, subtitle `ANTARCTIC RESEARCH TELEMETRY NETWORK`.
- Center (xl+): **Station selector** dropdown (Maitri [MAI] / Bharati [BHR]) with status dot, code, coordinates & `UTC+5`; quick strip: Outside Air Temp, Wind Velocity + `BLIZZARD` badge when wind ≥ 40 kts.
- Right: `SATCOM LINK 99.8%` + live UTC clock, `DEMO TELEMETRY` badge, audio-alerts toggle (functional: mutes/unmutes a UI flag + toast), **LOCKOUT** button (→ Under Development pattern: opens confirm dialog then shows "Station lockout broadcast is simulated in this prototype"), user chip (`Cmdr. Dr. A. Sharma`, `Expedition 44`, initials avatar) with dropdown: Settings (drawer, Under Development), Logout.
- Station change updates **global** `stationStore.selectedStationId` and refetches everything; toast `Station changed to Maitri`.

### 5.2 Sidebar (`MISSION NAVIGATION` · `STN-SYS`)
Items: Dashboard (`grid_view`), Digital Twin (`layers`), Operations (`bolt`, expandable → Energy/Environment/Logistics), Alerts & Anomalies (badge = active alert count), What-If Simulation (`model_training`). Active item: cyan-50 bg, cyan-800 text, cyan border. Bottom widget: **Primary Array** ONLINE + progress bar + `PWR DRAW 342 kW` (from live/mock data), `RADAR SWEEP 100km ACTIVE`.

### 5.3 Bottom status bar
`● N CRITICAL` (pulse) | `● N WARNINGS` | `● N NOMINAL` | `SATCOM PING 32ms` | `GRID LOAD 81%` | `FUEL 17.2 DAYS` … right: `ALL TELEMETRY SYNCHRONIZED` (or `SYNC DELAYED — last update Xm Ys ago` when stale). Counts derive from alerts/assets, not hard-coded.

### 5.4 Connection banner
If API fails/stale > 60s: amber banner `CONNECTION DEGRADED — showing latest available station data.` with Retry.

---

## 6. Routes

```
/login                    public
/dashboard                protected (default after login)
/digital-twin             protected   (?asset=GEN-02 highlights + opens asset)
/operations               protected   (?tab=energy|environment|logistics)
/alerts                   protected   (?asset=GEN-02 or ?id=ALT-8821 opens alert)
/simulation               protected   (?asset=GEN-02&scenario=A preselects)
/*                        NotFound
```
`ProtectedRoute` checks `authStore.isAuthenticated`. Deep links must work (clicking an alert's asset → Twin with asset selected; "Run What-If" → Simulation preselected).

---

## 7. Screen specifications

### 7.1 Login (`/login`)
Centered card on a subtle snow/grid background: logo, `POLAR COMMAND`, `REMOTE OPERATIONS CONSOLE`, email + password fields (validated), `SIGN IN` button, **Demo access box**: `operator@polar.demo / polar123` with a "Fill demo credentials" button. Invalid login → inline error. Success → `/dashboard`. In Demo Mode, login succeeds locally.

### 7.2 Dashboard (`/dashboard`) — hero screen
Order of information (top→bottom): station state → critical alert → energy → environment → logistics → twin → history.

1. **Header strip:** Active Command Post selector (Maitri Base MAI-01 / Bharati Base BHR-02), coordinates, elevation, sunlight, `STREAM: 100 Hz` ticker, **FORCED SYNC** button (re-fetches, ticker shows `SYNCING…` then `100 Hz OK`, toast).
2. **Bento row (12-col):**
   - **Station Health Index** (4 cols): circular gauge (SVG, 87%), delta `+1.4% /24h`, status `Stable / Minor Anomaly`, `Anomaly Vector: PWR-GEN02`, `Predicted MTBF 1,840 h`, sub-scores Hull 99.1 / Grid 91.4 / Life 98.8 (and Infra/Energy/Env/Logistics).
   - **4 subsystem cards** (8 cols, 2×2): **Energy** (Generated/Load `870 / 705 kW`, Battery `94% FLOAT`, per-generator efficiency rows), **Environmental** (outdoor temp / wind chill, wind velocity + direction, barometer trend, `BLIZZARD PHASE 1` badge), **Logistics** (fuel days bar + critical threshold, water %, food days, O₂ %), **Life Support & Habitat** (pressure, CO₂ ppm, indoor temp, air exchange, humidity). Each card clickable → corresponding Operations tab.
3. **Digital Twin Quick View** (8 cols): 2D SVG schematic with corridor lines, module boxes (Main Habitat, PWR-GEN #02 red pulsing, Life Support, Laboratory, Sec-B Hab amber, Fuel Depot, Sat Dome), leader-line callouts (`COEFF: 0.87 CRIT`, `FILTER HIGH ΔP`), legend (`5 Nominal / 1 Warning / 1 Anomaly`), footer stats (Hull Airtightness, Thermal Bridging, Snow Load, Permafrost Temp), button `Launch Full 2D Twin`.
4. **Right column** (4 cols): **Anomaly Alert Summary** (2 unresolved; Gen #02 Thermal & Load Asymmetry CRIT w/ `ISOLATE UNIT` action; B-Sector Air Duct Filter ΔP WARN w/ `DE-ICE LOUVER`), **Mission Interventions** (Run Station Diagnostic, Switch to Generator #03, Emergency Fuel Protocol, Export Daily Telemetry Log).
5. **24-HOUR STATION LOAD** Recharts line chart (Generation vs Consumption, kW), tooltip shows time + both values.
6. **Live Telemetry Bus ticker** strip (P-BUS voltage, GRID FREQ 50.04 Hz, INVERTER EFF, SAT JITTER, HAB PM2.5) — values gently jitter via telemetry engine.

**Interaction behaviours (real, not alerts):**
- *Run Station Diagnostic* → modal with animated progress polling "148 IoT nodes", ends with a result summary (147 OK, 1 warning Gen-02) — implemented via mock.
- *Switch to Generator #03* → confirm dialog → updates local/demo state (Gen-03 → ONLINE ramping to 210 kW, total generation updates) and toast.
- *Isolate Unit* → confirm → Gen-02 marked `maintenance/isolated`, generation drops, alert status changes to acknowledged; toast.
- *Emergency Fuel Protocol* → confirm dialog (warning text) → **Under Development** message (Section 15) because it involves physical vault control.
- *Export Daily Telemetry Log* → generate and download a real CSV of last 24h energy+environment data (implement); NetCDF option shows Under Development.
- *De-ice louver* → toast `De-icing sequence queued (simulated)` and clears warning after 8s in demo state.

### 7.3 Digital Twin (`/digital-twin`)
Header: `Station Digital Twin & Schematic HUD — {Station}`, badges `SEC-7A`, `CAD-REF: MTR-SCHEMATIC-V8.42`, `LIVE TELEMETRY STREAM`. Filter chips: **All Modules / Power / Life Support / Research / Storage / Critical Paths** (dim non-matching modules to 30% opacity + grayscale).

Layout (2xl: 8 + 4 cols):
- **Left – Blueprint canvas** (min-h ~720px): dotted CAD grid background (SVG pattern), conduit overlay lines (blue dashed pulse = power spine; red = fault feedback from GEN-02 to substation; green = water), header `ORTHOGRAPHIC BLUEPRINT // DECK-1`, scale `1:125 METRIC`, module cards grid:
  - **MOD-05 Generator Complex** (CRIT ANOMALY, red border): GEN-01 ONLINE 290/430 kW, GEN-02 SURGE, GEN-03 STBY READY; primary draw, vibration harmonic 4.8 mm/s; "Bearing fatigue indicator active"; `INSPECT UNIT →`.
  - **MOD-03 Substation Distribution** (WARNING): Bus-A 415 V stable, Bus-B 398 V slight imbalance, load factor bar 81%.
  - **MOD-01 Research Laboratories** (NOMINAL): lab temp, pwr load, seismic calib.
  - **MOD-02 HVAC & Climate Pod** (NOMINAL): flow, thermal, filter life, duct pressure.
  - **MOD-04 Storage & Life Support Pod** (NOMINAL, full width): potable water 12,400 L, hydroponic light, O₂ scrubbers, CO₂ 410 ppm.
  - Additional modules from station config: Fuel Farm, Communication/SAT Dome, Water System (so the Twin is generated from `assets` data, not hard-coded).
  - Toolbar: Zoom +/−, Reset, Fullscreen, **Layers** (Infrastructure, Energy, Environment, Logistics, Alerts checkboxes), `RE-CENTER BLUEPRINT` button. Legend + status footer.
  - Clicking a module or marker selects it (ring highlight) and loads details on the right.
- **Right – Asset Details drawer/panel** for the selected asset (default GEN-02): `CRIT-INSPECT` badge, `SYS-ID`, title, **Anomaly Risk Engine** score (0.87), severity chip, **Critical Parameter Matrix** (Thermal efficiency 76% w/ bar & target >88%, Fuel burn 820 L/day +18%, Core temp 94.2°C vs 92.0 threshold, Vibration 4.8 mm/s), active load factor, **Efficiency & Fuel Drift (72h)** mini chart (teal efficiency falling 88→76, rose fuel rising), **Recommended Actions // AI Risk Engine** list (3 items), action buttons: **Transfer Load to Gen #03** (real state change + feedback banner), **Dispatch Ticket** (creates `MAINT-TICKET #NNNN` in local state, banner), **Override Alarm** (silences 15 min, logged), plus `VIEW HISTORY` and `RUN WHAT-IF` (→ `/simulation?asset=GEN-02`).
- Mobile: full-width SVG + bottom sheet.
- Bottom summary cards: Habitat core mean temp, total sector consumption / grid load, Anomaly index `RISK 0.87 / 1.00`.

Generic asset panel must work for **every** asset type (generator, hvac, water, fuel, comm, lab, storage), showing metrics defined in `asset.metrics[]` from the API.

### 7.4 Operations (`/operations`) — tabs via `?tab=`
Sub-header: `Station Sector 04 // Tactical Operations Hub`, **Mission Grid & Environmental Logistics**, time range selector **6H / 24H / 7D / 30D** (re-queries history), **Export Telemetry** button (opens modal "Generate Expedition Report": station, encryption label, sensor count, Cancel / **Transmit Report** → simulated 1.3s progress → `Dispatched!` toast; also offers real CSV download). Tab badges: `870 kW`, `BLIZZARD`, `17.2d Left`.

**Tab 1 — Energy & Power Grid**
- 5 KPI cards: Total Generation 870 kW (peak today 920), Net Demand 705 kW (81% load bar), Reserve Margin +165 kW (HEALTHY), Battery 480 kWh / 94% SoC (segment bar), Diesel Reserve 38,200 L (`REORDER`, burn 92.4 L/hr).
- **Power Generation vs Consumption timeline** (Recharts area/line; series: Total Output, Base Demand, EV Snowcat charging peaks) with tooltip.
- Side: **Bifacial Polar Solar** (42 kW, efficiency 64%), **Arctic Wind Turbines** (138 kW, rated max 150, 420 RPM, blades heated), **Auto Shedding** card with `Configure` (Under Development).
- **Generator Tri-Array:** GEN-01 Primary (NOMINAL 430 kW, 91%, 82°C, 4.8 bar, 1,842 h, 0.12 mm/s), GEN-02 Auxiliary (ANOMALY DETECTED 260 kW, 76%, block 94°C HIGH, coolant flow −28%, exhaust 512°C, **Throttle Down** button → real state change: output ↓ 20%, toast), GEN-03 Emergency (STANDBY 0 kW, jacket 45°C READY, crank battery 27.6 V, start latency 14 s, test OK 4h ago, `SPIN UP` button).
- **Energy Insight** component (specific, not generic): "Generator 02 efficiency declined from 88% to 76% in 72h. Expected range 80–88%. Impact: +18% fuel burn." with buttons `INSPECT GENERATOR` and `RUN SIMULATION`.
- Fuel history chart and generator load multi-line chart.

**Tab 2 — Polar Environment & Meteorology**
- 5 sensor cards: Outside Temp −38.4°C (chill −59.1°C), Wind 42.6 kts SE (gusts 58.2), Barometric 982.1 hPa ▼ RAPID DROP, Solar Radiation 12 W/m², Aurora/Geomag Kp 6 (`STORM DISTURBANCE`). Plus humidity, visibility.
- **48-Hour Blizzard & Wind Chill Simulation** chart (wind & wind-chill lines, dashed `LOCKOUT THRESHOLD (40 KTS)` reference line, severity badge `CAT-3`). Label as `SIMULATED FORECAST`.
- **Wind compass** SVG (direction + speed).
- **Perimeter Optical Feed** card: **placeholder** panel (dark box, camera icon, `LIVE CAM-04`, Visibility <50 m, Lifelines Engaged) with note `Live camera streaming — Under Development` (no real image URL).
- **Environment Risk Banner** driven by wind/pressure thresholds.

**Tab 3 — Logistics & Fuel Inventory**
- Amber **Critical Protocol banner**: `Arctic Diesel Buffer — 17.2 days remaining; protocol mandates 21-day buffer before winter closure` + **Trigger Reorder Dispatch** (creates a reorder request record in local state, toast; marked simulated).
- **Critical Consumables & Spares table** (Resource, Stock, Burn Rate, Endurance, Status): Anti-freeze Glycol 3,400 L / 12 L/wk / 198 d / NOMINAL; Arctic Rations 4,260 packs / 30/d / 142 d / OPTIMAL; **Spare Turbine Fuel Injectors 2 remaining / High risk / CRITICAL / DEPLETED**; add Diesel, Potable water, Medical supplies (94 units, 42 d), Filters (12, 9 d, WARNING), Lubricant oil.
- **Bulk Fuel Storage T-50** donut: 47% (38,200 / 80,000 L), depletion estimate date computed = today + days remaining.
- **Resupply status:** vessel `Akademik Fedorov` ETA 24 days (ice-pack dependent) → shows **fuel gap** (ETA 24 d > 17.2 d endurance) with a red "SUPPLY GAP 6.8 days" chip. Includes Eco-Mode suggestion (+6.8 days).
- Inventory cards show item, qty, unit, days remaining, progress bar, status.

### 7.5 Alerts & Anomalies (`/alerts`)
- Header: `ALERTS & ANOMALY TRIAGE`, `SEC-CON 1`, `TELEMETRY POLLING: 250ms` (label only), **SILENCE AUDIO HARMONICS** toggle (→ `AUDIO MUTED (59M)`, resets).
- **Severity ribbon:** TOTAL ACTIVE 24 | CRITICAL 2 | WARNINGS 4 | NOMINAL/INFO 18 (clicking a pill filters). Station toggle: ALL (24) / MAITRI (18) / BHARATI (6). Counts derive from data.
- **Search** + **Subsystem** select (Energy, Environment, Logistics, HVAC & Life Support, Structural, SATCOM) + **Sort** (Risk desc / Recency / Severity).
- **Alert feed (left 8 cols)** — cards with left severity border:
  1. `ALT-8821` CRITICAL — Gen #02 Thermal Surge & Fuel Efficiency Anomaly (risk 0.87, +18% fuel, 4.8 mm/s), automated prescription, buttons **AUTO-TRANSFER LOAD**, **ACKNOWLEDGE**, **DIGITAL TWIN LOCATOR** (→ twin with asset), **SILENCE BUZZER**.
  2. `ALT-8819` CRITICAL — Cat-4 Polar Storm incoming (baro −4.2 hPa/hr, winds >65 kts, LOCKOUT MANDATORY); actions **BROADCAST STATION LOCKOUT** (simulated + Under Development note for real comms), **CONFIRM SAFETY CHECKLIST** (opens checklist modal with tickable items), **SOUND BASE KLAXON** (simulated toast).
  3. `ALT-8794` WARNING — Diesel below 21-day protocol (burn **2,218 L/day**, exhaustion 17.2 d, vessel ETA 24 d), Eco-Mode +6.8 days (**ENGAGE ECO-MODE** — changes state and updates endurance to 24.0 d).
  4. `ALT-8750` WARNING — B-Sector Air Duct ΔP 312 Pa (threshold 250), flow efficiency 68%, rime ice; **ENGAGE DE-ICING COILS**.
  - Plus ~20 additional info/nominal alerts (generated in seed) rendered in a compact list style.
  - Acknowledge changes status → `acknowledged`, card dims, counts update, toast.
- **Deep-dive drawer (right 4 cols, sticky)** for the selected alert: ML inference confidence gauge (94.2%, segmented bar, `MODEL: ISOLATION-FOREST-V4`, `P-VAL < 0.001` — computed from anomaly module output), vibration spectrum SVG chart with `CRIT LIMIT (3.5 mm/s)`, recurrence rate 3.4% (2 incidents in 180d), EST. TIME TO FAILURE `01h 42m ACCELERATING`, component anchor (illustrated placeholder graphic, **no external image**), **Telemetry & Audit Trail** timeline (12:30:12 harmonic excursion detected; 12:31:00 bus pre-warm command; 12:35:48 operator override logged), primary command **COMMIT BUS SWITCH TO GEN #03 NOW** (confirm dialog → state change; note "Estimated transfer micro-break 42 ms").
- Every alert has: id, severity, station, asset, source subsystem, metric/current/threshold, recommendation, status, timestamps. Empty state: `NO ACTIVE ALERTS — All monitored systems within configured operating range.`

### 7.6 What-If Simulation (`/simulation`)
Header: badge `Monte Carlo Probabilistic Engine`, `BUILD 4.29-REV8 // POLARIS RESILIENCE MATRIX`, `Sandbox Active // Cold Isolation`; title **Tactical Scenario & Risk Simulation Engine**; sub-line `STN: MAITRI & BHARATI CONTINGENCY HUB • MODEL ITERATION: 10,000 RUNS/SEC • TELEMETRY SYNCED`. Global actions: **Reset to Nominal**, **Export Briefing** (generate a real downloadable PDF/HTML/Markdown briefing of the current result; if PDF lib not available, download `.md`/`.html` and say so), **Run Simulation**.

**Scenario selector (4 cards; A default):**
- **A** Generator #02 Immediate Failure under Peak Winter Blizzard — DEFICIT −260 kW, EXTREME RISK → **fully implemented**.
- **B** Complete SATCOM Blackout for 72 Hours — AUTONOMY 72H, MODERATE → implement simplified (comms tier loss, autonomy timers, queued data buffer size).
- **C** Supply Vessel Delayed +14 Days (Pack Ice) — RESUPPLY +336H → implement (fuel/food/consumable depletion vs delayed ETA; computes gap & eco-mode requirement).
- **D** Catastrophic Habitat Sector-B HVAC Thermal Loss — SUB-ZERO BREACH, CRITICAL EVAC → implement simplified thermal-decay model; if the model can't run, show the Under Development panel for the detailed evacuation planner only.

**Left column (5):**
1. **Atmospheric Boundary Model:** OAT slider −65…−20 (step 0.5, default −42), Wind slider 0…90 kts (default 65) with tag (`MILD BREEZE <25`, `HIGH DRIFT <50`, `CAT-4 GALE`≥50). Values feed the engine (colder/windier → higher heating demand, renewables feathered off ≥ 60 kts).
2. **Generation Bus Injection** (TOTAL updates live): GEN-01 400/430 ONLINE, GEN-02 260 kW → FAILED (strikethrough), GEN-03 standby 210 kW with **SPIN UP** (functional toggle adds +210 kW after 8-min spin-up modelled), Solar PV (0 kW polar night), Ridge Turbines (0 kW feathered off in gale).
3. **Load Shedding Priority Matrix:** T1 Life Support & Habitat Heating 320 kW LOCKED; T2 Station Control & SATCOM 85 LOCKED; T3 Cryo & Ice Core Samples 120 HIGH PRIO; T4 General Habitat Lighting & Galley 95 SHEDDABLE; T5 Mass Spectrometer & Supercomputer 180 SHEDDABLE. Sheddable tiers have working toggles the user can flip (T3 toggle allowed with warning).

**Right column (7):**
- **Simulated Microgrid Execution Verdict** (`SIM_VERDICT_STN_MAI.JSON` chip — button downloads the JSON), 4 cards: **Available Power** 870→610 kW (−260 deficit), **Load Post-Shed** 800→525 kW (+85 buffer), **Station Endurance** ≈22.4 d at 525 kW derated (fuel 38,200 L; computed), **Computed Risk** 0.54 MEDIUM (`STABLE W/ ACTION`). Two verdict strips: Critical Loads Supported (T1+T2 at 100% → SECURED) and Non-Critical Load Deviation (T4 & T5 shed, −275 kW mitigated → ACTIVE SHED).
- **Impact Visualizer** — two charts: *Power Grid Stability (48h)* with baseline (grey dashed), unmitigated (rose), with shedding (cyan) + event markers `GEN-02 SCRAM`, `SHED ACTIVE (525 kW)`; *Habitat Thermal Decay* with floor line `+15°C`, glycol boost marker, `T-0 +21.4°C → T+18h +18.5°C HOLD`. **Charts must be drawn from the simulation result data** (Recharts), not static SVG.
- **Before/After** bars: GEN-01/02/03 output before vs after, total 870 → 610 kW.
- **Automated Contingency Directives** (3 cards): Isolate Bus B3 & B5 (PRE-VALIDATED), Lock Air Handlers (READY FOR ACTUATION), Notify Crew (QUEUED STAGE 3).
- **Recommended Response** numbered list (maintain critical loads; shed T4/T5; inspect Gen 02; evaluate backup capacity / spin up Gen 03).
- **Policy Interlock banner** — **Apply Changes to Live Policy**: confirm dialog → toast `Policy saved to simulation sandbox only. Live SCADA integration — Under Development.` It must **never** claim to actuate real relays.
- **Run Simulation** flow: button shows spinner `CALCULATING…` → POST to backend (or demo engine) → results render → toast `SIMULATION CONVERGED — 10,000 Monte Carlo runs executed. Risk level: MEDIUM (0.54)`.

---

## 8. Data models

### 8.1 TypeScript types (mirror in Pydantic)

```ts
interface Station { id: string; code: 'MAI'|'BHR'; name: string; region: string; latitude: number; longitude: number;
  elevationM: number; status: 'operational'|'warning'|'critical'|'offline'; healthScore: number; lastSync: string; }

interface Asset { id: string; stationId: string; name: string; type: 'generator'|'hvac'|'water'|'fuel'|'communication'|'laboratory'|'storage'|'substation'|'habitat'|'other';
  module: string; status: Status; healthScore: number; anomalyScore?: number; location: {x:number;y:number;w?:number;h?:number};
  metrics: {key:string;label:string;value:number|string;unit?:string;status?:Status;threshold?:number}[];
  recommendations: string[]; lastUpdate: string; }

interface EnergyReading { timestamp: string; powerGenerated: number; powerConsumed: number; fuelLevelPct: number;
  fuelLiters: number; batteryPct: number; generatorLoadPct: number; solarKw: number; windKw: number; }

interface EnvironmentReading { timestamp: string; temperatureC: number; windChillC: number; windKts: number; gustKts: number;
  windDirDeg: number; pressureHpa: number; humidityPct: number; visibilityKm: number; solarWm2: number; kpIndex: number; }

interface InventoryItem { id: string; stationId: string; itemName: string; category: 'fuel'|'food'|'medical'|'spares'|'technical'|'water';
  quantity: number; unit: string; consumptionRate: number; consumptionUnit: string; estimatedDaysRemaining: number;
  reorderThreshold: number; status: Status; }

interface Alert { id: string; stationId: string; assetId?: string; severity: Severity; title: string; description: string;
  subsystem: 'energy'|'environment'|'logistics'|'hvac'|'structural'|'comms'; source: string; metric?: string;
  currentValue?: number; threshold?: number; unit?: string; riskScore?: number; recommendedAction?: string;
  status: 'active'|'acknowledged'|'resolved'; createdAt: string; updatedAt?: string; }

interface SimulationRequest { stationId: string; scenario: 'A'|'B'|'C'|'D'; assetId?: string; oatC: number; windKts: number;
  spinUpGen3: boolean; sheddingOverrides?: Record<string, boolean>; }

interface SimulationResult { scenario: string; currentPowerKw: number; simulatedPowerKw: number; deficitKw: number;
  loadBeforeKw: number; loadAfterShedKw: number; bufferKw: number; enduranceDays: number; riskScore: number;
  riskLevel: 'low'|'medium'|'high'|'extreme'; criticalLoadsSupported: boolean; shedTiers: string[]; mitigatedKw: number;
  generators: {id:string;before:number;after:number;status:string}[]; series: {powerStability: Point[]; thermal: Point[]};
  directives: {title:string;description:string;state:string}[]; recommendations: string[]; runs: number; generatedAt: string; }
```

### 8.2 Database tables (PostgreSQL)

`users(id, email, hashed_password, full_name, role, expedition, created_at)` ·
`stations(id, code, name, region, latitude, longitude, elevation_m, status, health_score, last_sync)` ·
`assets(id, station_id FK, name, type, module, status, health_score, anomaly_score, loc_x, loc_y, loc_w, loc_h, metadata JSONB, updated_at)` ·
`asset_metrics_history(id, asset_id FK, timestamp, efficiency, load_pct, temperature_c, vibration_mm_s, fuel_lph, output_kw)` ·
`energy_data(id, station_id, timestamp, power_generated, power_consumed, fuel_liters, fuel_pct, battery_pct, generator_load, solar_kw, wind_kw)` ·
`environment_data(id, station_id, timestamp, temperature_c, wind_chill_c, wind_kts, gust_kts, wind_dir_deg, pressure_hpa, humidity_pct, visibility_km, solar_wm2, kp_index)` ·
`inventory(id, station_id, item_name, category, quantity, unit, consumption_rate, consumption_unit, reorder_threshold, status)` ·
`alerts(id, station_id, asset_id, severity, title, description, subsystem, source, metric, current_value, threshold, unit, risk_score, recommended_action, status, created_at, updated_at, acknowledged_by)` ·
`alert_events(id, alert_id, timestamp, label, detail)` (audit trail) ·
`tickets(id, station_id, asset_id, title, status, created_at)` ·
`simulation_runs(id, station_id, scenario, params JSONB, result JSONB, created_at)` ·
`load_tiers(id, station_id, tier, name, description, kw, locked)` ·
`resupply(id, station_id, vessel, eta_days, status)`.

Indexes on `(station_id, timestamp)` for time-series tables.

---

## 9. Canonical dataset (create all of this in seed + frontend mock)

> Use these numbers everywhere. They reconcile the inconsistent mockup values.

### 9.1 Stations
| | Maitri | Bharati |
|---|---|---|
| id / code | `maitri` / MAI | `bharati` / BHR |
| Name | Maitri Base (MAI-01) | Bharati Base (BHR-02) |
| Region | Schirmacher Oasis | Larsemann Hills |
| Lat/Lon | 70.7658°S 11.7358°E (display `70°45'S 11°44'E`) | 69.4°S 76.19°E (display `69°24'S 76°11'E`) |
| Elevation | 117 m ASL | 48 m ASL |
| Health | 87% | 91% |
| Active alerts | 18 (2 critical, 4 warnings, 12 info) | 6 (0 critical, 2 warnings, 4 info) |

**Maitri = the hero station** (Generator 02 story). Bharati gets its own generated assets/energy/env/inventory with a milder state (health 91%, one WARNING: fuel filters low; all gens healthy; total gen 780 kW, demand 640 kW, temp −18.6°C, wind 21 kts, fuel 44,600 L → 24.1 days). Make Gen-02 on Bharati optionally fail via simulation only.

### 9.2 Maitri energy (canonical)
- GEN-01 Primary (Caterpillar 3512B): running **430 kW** (rated 500), eff 91%, block 82°C, oil 4.8 bar, 1,842 h, vib 0.12 mm/s, **NOMINAL**
- GEN-02 Auxiliary (Caterpillar 3512B): running **260 kW**, eff **76%** (was 88% 72h ago), block **94°C**, coolant flow −28%, exhaust 512°C, vib 4.8 mm/s, fuel burn 820 L/day (+18%), health 68%, load 81%, anomaly **0.87**, **CRITICAL/ANOMALY**
- GEN-03 Emergency (Scania Tier-4 reserve): **0 kW**, rated **210 kW**, STANDBY, jacket 45°C READY, crank 27.6 V, start latency 14 s
- Solar PV **42 kW** (eff 64%), Wind turbines **138 kW** (rated 150, 420 RPM)
- **Total generation = 430 + 260 + 42 + 138 = 870 kW** · Consumption **705 kW** · Reserve +165 kW · Grid load displayed 81% (=705/870) · Battery 480 kWh @ 94%
- **Fuel:** 38,200 L of 80,000 L (47%); burn **92.4 L/hr = 2,218 L/day → 17.2 days** · Depletion date = today + 17.2 d
- Peak connected demand in blizzard scenario = **800 kW** (tiers below)

### 9.3 Load tiers
T1 Life Support & Habitat Heating 320 kW (LOCKED) · T2 Station Control & SATCOM Uplink 85 (LOCKED) · T3 Scientific Cryo & Ice Core Samples 120 (HIGH PRIO) · T4 General Habitat Lighting & Galley 95 (SHEDDABLE) · T5 Mass Spectrometer & Supercomputer 180 (SHEDDABLE). Sum = 800.

### 9.4 Environment (Maitri, now)
Temp −38.4°C, wind chill −52°C (env tab may show −59.1 at gusts — use computed wind-chill formula), wind 42.6 kts SE (gust 58.2; topbar shows 44.2 latest), pressure 982.1 hPa falling (−4.2 hPa/hr), humidity 38% indoor / 68% outdoor, visibility <0.05 km in blizzard, solar 12 W/m², Kp 6.
Bharati: −18.6°C, 21 kts NW, 998 hPa, visibility 6.2 km.

### 9.5 Assets — Maitri (with SVG layout coords in a 800×400 viewBox)
`GEN-01, GEN-02, GEN-03` (module PWR-GEN) · `SUB-01` Substation (Bus-A 415 V, Bus-B 398 V, warning) · `HVAC-01` HVAC & Climate Pod (nominal) · `HVAC-02` Sector-B air duct (warning ΔP 312 Pa) · `LAB-01` Research Labs (nominal) · `LSS-01` Life Support (nominal) · `STG-01` Storage & Life Support Pod (water 12,400 L 92%) · `FUEL-01` Fuel Depot T-1..4 (nominal) · `WTR-01` Water Melter · `COM-01` Sat Dome (nominal, SATCOM 99.8%) · `HAB-A1` Main Habitat.
Bharati: analogous IDs prefixed the same, different layout: Main Building, Lab, Living, HVAC, Power/CHP, Fuel Farm, Fuel Station, Water System, Storage, Comms, Summer modules.
Each asset needs `metrics[]`, `recommendations[]`, status, health.

### 9.6 Inventory (Maitri)
Diesel 38,200 L (92.4 L/hr, 17.2 d, WARNING) · Anti-freeze glycol 3,400 L (12 L/wk, 198 d, NOMINAL) · Arctic rations 4,260 packs (30/d, 142 d, OPTIMAL) · Food supplies 860 kg (18 d, WATCH) · Medical supplies 94 units (42 d, HEALTHY) · Filters 12 (9 d, WARNING) · Spare turbine fuel injectors 2 (CRITICAL/DEPLETED) · Potable water 12,400 L / 84–92% · Lubricant oil 420 L (60 d) · Resupply: `Akademik Fedorov` ETA 24 days.

### 9.7 Alerts
The 4 main alerts in §7.5 plus 20 generated info/nominal alerts (e.g. "Battery bank float charge nominal", "SATCOM link stable 99.8%", "Snow load within limits", "Permafrost temp −11.2°C", "Water melter cycle complete", "Lab seismic array calibrated", "Inverter efficiency 98.1%", "Scheduled generator test passed", "Wind turbine blade heating active", …) split 12 Maitri / 4 Bharati info + Bharati warnings (filters low, temperature dropping). Timestamps relative to now (14 min, 32 min, 2 h, 5 h, …).

### 9.8 Time-series generation (seed + telemetry engine)
Generate **30 days at 15-min resolution** (or 7d at 5-min + 30d hourly) per station:
- **Consumption:** base 620 kW + diurnal sine (±60) + noise (σ=12) + EV snowcat charging pulses (+40 kW for ~1h, twice daily).
- **Generation:** follows demand + 100–170 kW reserve, wind term `min(150, 3.3*windKts)`, solar term from sun-angle (0 in polar night, 42 max for Maitri now).
- **Fuel:** decreases monotonically by burn rate (∝ diesel kW) with small noise; ends at 38,200 L at "now".
- **GEN-02 efficiency:** 88% → 76% linear-with-noise over last 72 h (this creates the anomaly); block temp 84 → 94°C; vibration 1.1 → 4.8 mm/s; fuel burn +18%.
- **Environment:** temp −38.4 ± diurnal 3°C with slow drift; wind ramps 20 → 44 kts over 24h; pressure falls 4.2 hPa/hr for last 6h.
- **Alerts** generated by running the analytics on this data at seed time (not hard-coded) — then verify they match §7.5.

Write `backend/app/database/generate_data.py` (creates JSON/CSV in `/data`) and `seed.py` (loads DB). Frontend `src/mock/*` and `telemetryEngine.ts` must produce equivalent data client-side.

---

## 10. Backend specification

### 10.1 Auth
`POST /api/auth/login` (email+password → `{access_token, token_type, user}`) · `GET /api/auth/me`. Seed users: `operator@polar.demo / polar123` (Cmdr. Dr. A. Sharma, Expedition 44), `admin@polar.demo / admin123`. JWT 8h expiry. CORS allow frontend origins from env.

### 10.2 Endpoints

```
GET  /api/health
GET  /api/stations
GET  /api/stations/{id}
GET  /api/stations/{id}/overview            # health, subsystem statuses, counts, latest energy/env, twin summary
GET  /api/stations/{id}/assets
GET  /api/assets/{id}                       # detail + metrics + history + anomaly + recommendations
GET  /api/assets/{id}/history?range=72h
POST /api/assets/{id}/actions               # {action: transfer_load|isolate|throttle_down|ticket|override_alarm|spin_up}
GET  /api/stations/{id}/energy
GET  /api/stations/{id}/energy/history?range=24h|6h|7d|30d
GET  /api/stations/{id}/environment
GET  /api/stations/{id}/environment/history?range=...
GET  /api/stations/{id}/forecast/environment   # 48h simulated
GET  /api/stations/{id}/inventory
GET  /api/stations/{id}/inventory/{item_id}
POST /api/stations/{id}/inventory/reorder
GET  /api/stations/{id}/alerts?severity=&status=&subsystem=&q=&sort=
GET  /api/alerts/{id}                       # + audit trail + anomaly detail
POST /api/alerts/{id}/acknowledge
GET  /api/stations/{id}/export?type=csv     # telemetry CSV download
POST /api/simulation/run                    # generic (scenarios A–D)
POST /api/simulation/generator-failure      # alias for scenario A
GET  /api/simulation/scenarios
GET  /api/simulation/runs?station_id=
```
All list endpoints return `{data:[…], meta:{...}}`; errors return `{error:{code,message}}` with proper HTTP codes (never leak stack traces).

### 10.3 Analytics modules
- **`anomaly.py`**: input historical + current metrics for an asset → `{anomaly:bool, severity, score(0–1), confidence, p_value, contributing_features[]}`. Implement with **IsolationForest** on (efficiency, temp, vibration, fuel burn, load) trained on the first 27 days, plus a robust z-score fallback. Score normalised to 0–1 (expected ≈0.87 for Gen-02).
- **`forecasting.py`**: linear/exponential regression on fuel consumption → `{estimated_days_remaining, depletion_date, confidence}`; also time-to-failure estimator from efficiency/vibration trend (`01h 42m` style output from a threshold-crossing extrapolation).
- **`risk_engine.py`**: weighted combination of energy (0.35), infrastructure (0.25), environment (0.2), logistics (0.2) → station risk status + per-subsystem status.
- **`health_score.py`**: `healthScore = weighted mean of asset health` → 87 (Maitri).

### 10.4 Simulation engine (`simulation_service.py`) — deterministic core + Monte Carlo wrapper
Scenario A algorithm:
1. `available = Σ online generators + renewables(adjusted for wind≥60 kts → turbines feathered 0; polar night → solar 0) − failed asset output` (+ Gen-03 210 kW if `spinUpGen3`).
2. `demand = Σ tier kW (peak 800)` adjusted by OAT: `+ 1.5 kW per °C below −40` heating, capped.
3. If `demand > available`: shed tiers from T5 → T4 (→ T3 only if user allows) until `demand ≤ available`; T1/T2 never shed. Record `mitigatedKw`.
4. `buffer = available − demandAfter`. `criticalLoadsSupported = (T1+T2 fully served)`.
5. `enduranceDays = fuelLiters / (burnLph_baseline * dieselKwAfter/dieselKwBefore * 24)`; expected ≈ 22.4 for canonical inputs (accept ±10%).
6. **Monte Carlo** (N=10,000 vectorised NumPy): sample demand noise σ=6%, renewable availability variance, generator failure timing; risk = `P(deficit after shedding)`-weighted blend + severity terms → score 0–1, level bins (<0.3 low, <0.6 medium, <0.8 high, else extreme). Canonical A result: **0.54 MEDIUM**. Return also 48h `powerStability` series (baseline / unmitigated / with-shedding) and 24h `thermal` series (cooling curve, glycol boost, floor +15°C) using exponential-decay thermal model.
7. Scenarios B/C/D: implement simplified engines returning the same `SimulationResult` shape (fields not applicable are null and the UI hides them).
Persist to `simulation_runs`.

### 10.5 Cross-cutting
Pydantic validation, structured logging, `/docs` OpenAPI, unit tests for anomaly, forecasting, simulation (pytest; at least: Gen-02 flagged anomalous; fuel days ≈17.2; scenario A returns 610 kW available/525 kW post-shed/critical supported).

---

## 11. Frontend state & data flow

- **`stationStore`**: `selectedStationId` (default `maitri`), `setStation`. Persist in localStorage.
- **`authStore`**: token, user, `login/logout`, persisted.
- **`uiStore`**: sidebar collapsed, selected asset id, drawer state, audio muted, theme, `demoState` overrides (isolated assets, gen3 online, eco-mode, tickets, acknowledged alerts).
- **`alertStore`**: selected alert, filters, acknowledged ids.
- Server data via hooks with `loading/error/data/refetch`; **polling** every 10–30s (`usePolling`). Do not put backend data into Zustand.
- Flow: `Component → hook → provider → (demo | API service) → Axios → FastAPI`.
- **Demo actions state** (isolate, transfer, eco-mode, acknowledge, tickets) must be applied consistently across pages: e.g. after isolating Gen-02 the dashboard energy numbers, twin, alerts, sidebar badge, and bottom bar all reflect it (implement in the demo provider's mutable in-memory store; live mode does it through `/actions`).

---

## 12. Demo-mode provider layer

```ts
// providers/dataProvider.ts
export const provider = import.meta.env.VITE_DEMO_MODE === 'true' ? demoProvider : liveProvider;
// exposes: getStations, getOverview, getAssets, getAsset, getEnergy, getEnergyHistory, getEnvironment,
// getEnvironmentHistory, getInventory, getAlerts, acknowledgeAlert, runAssetAction, runSimulation, ...
```
`telemetryEngine.ts` updates values every 10 s with **logic** (fuel decreases with load, power follows demand, temperature drifts slowly, small noise) so the dashboard feels alive. If the live API fails in live mode, auto-fallback to demo data with the `CONNECTION DEGRADED` banner. Env vars: `VITE_API_BASE_URL`, `VITE_DEMO_MODE`.

---

## 13. Loading / error / empty / stale states

Skeleton loaders per card (not full-screen spinners). API error copy: `Unable to load station data. The latest telemetry could not be retrieved.` + `TRY AGAIN`. Never show raw Axios errors. Stale: `SYNC DELAYED — Last successful update: 4 min 21 s ago`. Every screen shows `Last sync: N sec ago`.

---

## 14. Charts (Recharts)

Dashboard: 24h Generation vs Consumption. Energy: power history, fuel history (area), generator load multi-line, power distribution bar. Environment: multi-metric toggle chart (temp/wind/pressure/humidity), 48h blizzard forecast with reference line. Asset panel: 72h efficiency/fuel drift. Simulation: baseline vs unmitigated vs shedding, thermal decay. Custom tooltips: `04:00 · Generated 870 kW · Consumed 760 kW` (no raw `x/y`). Every chart answers an operational question and has an axis unit.

---

## 15. "Under Development" pattern (required)

Create `<FeatureInProgress />` and `notifyInProgress(featureName, detail?)` util.

**Placeholder panel** (for whole sections): dashed border card, construction/`Wrench` icon, title `Feature under development`, text `{Feature} is not available in this prototype yet. It is planned for a future release.`, chip `IN PROGRESS`.
**Toast** (for buttons): `🚧 {Feature} — Under Development. This action is simulated in the prototype.` (amber toast, 4s).

Use it for **at least** these (and any feature the agent cannot complete):
- Emergency Fuel Protocol (real vault/manifold control) · Real SATCOM/klaxon/intercom broadcast · Live SCADA policy commit · Auto-Shedding **Configure** · NetCDF export · Live camera feed · Settings drawer (beyond theme/mute) · User management · Historical data > 30d · Real-time WebSocket/MQTT ingestion · 3D/BIM twin view (show toggle `3D VIEW` disabled with tooltip `3D view — Under Development`) · Satellite imagery layer · Multi-user roles.
Simulated actions must say **`(simulated)`** in their success toast so nothing implies real control.

---

## 16. Non-functional requirements

Performance: initial load < 3 s locally, charts memoised. Security: password hashing (bcrypt), JWT, no secrets in repo, `.env.example` provided. Quality: ESLint + Prettier, `tsc --noEmit` clean, no console errors on any route, works in latest Chrome/Edge/Firefox. Docs: README with setup, env vars, demo credentials, demo script, architecture diagram, known limitations.

---

## 17. Build order (execute in this order, verify each phase)

1. **Skeleton:** repos, Vite+TS+Tailwind, FastAPI app, DB connection, docker-compose.
2. **Design system & shell:** tokens, ui/ components, AppShell/Sidebar/Topbar/BottomStatusBar, router, protected routes, FeatureInProgress.
3. **Types + mock data + telemetry engine + provider layer (Demo Mode).**
4. **Login + station selector + global state.**
5. **Dashboard** (complete).
6. **Digital Twin** (SVG layout from asset data, markers, filters, layers, zoom, asset panel, actions).
7. **Operations** (Energy → Environment → Logistics).
8. **Alerts** (feed, filters, deep-dive, acknowledge, deep links).
9. **Simulation** (scenario A first, then B–D, charts from result data).
10. **Backend:** models, seed/generate_data, routes, services, analytics, simulation; unit tests.
11. **Integrate:** live provider via Axios, JWT interceptor, fallback to demo, deep links.
12. **Polish:** responsive, loading/error states, animations, a11y, README, demo script.

---

## 18. Acceptance checklist (agent must self-verify)

- [ ] `npm run dev` starts; Demo Mode works with **no backend**; live mode works with backend + seeded DB.
- [ ] Login works; unauthenticated users are redirected; logout works.
- [ ] Station switch (Maitri ↔ Bharati) updates **every** page; toast shown.
- [ ] Dashboard shows canonical values: health 87%, 870/705 kW, battery 94%, fuel 17.2 d, 2 critical/4 warning/18 nominal (Maitri).
- [ ] Digital Twin renders modules from data, filters/layers/zoom work, clicking Gen-02 shows details with 0.87 risk and drift chart; actions change state consistently across pages.
- [ ] Operations tabs (`?tab=`) all render with charts, time-range selector re-queries, CSV export downloads a real file.
- [ ] Alerts: filter/search/sort/station toggle work, acknowledge updates counts everywhere, deep links from twin/alerts work.
- [ ] Simulation A returns 870→610 kW, 800→525 kW post-shed, +85 kW buffer, ≈22.4 d, risk 0.54 MEDIUM, critical loads SECURED; sliders/toggles change results; B–D return coherent results; charts driven by response data.
- [ ] Every non-implemented feature shows the Under Development message; **no** native `alert()`, no dead buttons.
- [ ] `DEMO TELEMETRY` badge visible; simulated actions labelled `(simulated)`.
- [ ] Loading skeletons, error+retry, empty, stale/degraded-connection states all demonstrable (add a hidden `?fail=1` dev flag or toggle to force an error for demo).
- [ ] Responsive at 1440, 1024, 768, 390 px widths.
- [ ] Backend `pytest` passes; `/docs` lists all endpoints; README complete.

---

## 19. Demo script (include in README)

1. Login (`operator@polar.demo`). 2. Dashboard on Maitri — explain health, energy, environment, logistics, alerts. 3. Open Digital Twin. 4. Click Generator 02 — show efficiency drift + 0.87 risk. 5. Open its alert (ALT-8821) and show audit trail. 6. Click **Run What-If** → Simulation A. 7. Run — show 870→610 kW, shed T4/T5, critical loads secured, endurance, recommendations. 8. Toggle Gen-03 spin-up and show improved buffer. 9. Return to Dashboard, apply **Transfer to Gen #03** and show numbers updating everywhere. 10. Switch to Bharati to show multi-station support. 11. Mention roadmap items (live SCADA, MQTT ingestion, 3D twin) — the ones marked Under Development.

---

## 20. Source-note & disclaimers (show in an About/footer modal)

- Station names/locations and facility categories (power, heating/HVAC, fuel, water, labs, communications, meteorological instruments) are based on public NCPOR information about Maitri and Bharati. **All telemetry, asset counts, equipment models, thresholds and alerts in this prototype are synthetic demo data** and are not official engineering specifications or real measurements.
- The Twin layout is a representative abstraction, not an official station blueprint.
- Simulation outputs are illustrative decision-support demonstrations, not validated engineering predictions.
