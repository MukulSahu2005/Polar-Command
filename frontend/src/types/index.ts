// ─── STATUS & SEVERITY TYPES ────────────────────────────────────────────────
export type Status = 'healthy' | 'normal' | 'warning' | 'critical' | 'offline' | 'maintenance' | 'unknown';
export type Severity = 'critical' | 'warning' | 'info';

// ─── STATION ─────────────────────────────────────────────────────────────────
export interface Station {
  id: string;
  code: 'MAI' | 'BHR';
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  status: 'operational' | 'warning' | 'critical' | 'offline';
  healthScore: number;
  lastSync: string;
}

// ─── ASSET ───────────────────────────────────────────────────────────────────
export type AssetType =
  | 'generator'
  | 'hvac'
  | 'water'
  | 'fuel'
  | 'communication'
  | 'laboratory'
  | 'storage'
  | 'substation'
  | 'habitat'
  | 'other';

export interface AssetMetric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  status?: Status;
  threshold?: number;
}

export interface Asset {
  id: string;
  stationId: string;
  name: string;
  type: AssetType;
  module: string;
  status: Status;
  healthScore: number;
  anomalyScore?: number;
  location: { x: number; y: number; w?: number; h?: number };
  metrics: AssetMetric[];
  recommendations: string[];
  lastUpdate: string;
}

// ─── ENERGY ──────────────────────────────────────────────────────────────────
export interface EnergyReading {
  timestamp: string;
  powerGenerated: number;
  powerConsumed: number;
  fuelLevelPct: number;
  fuelLiters: number;
  batteryPct: number;
  generatorLoadPct: number;
  solarKw: number;
  windKw: number;
}

export interface GeneratorStatus {
  id: string;
  name: string;
  model: string;
  status: Status;
  outputKw: number;
  ratedKw: number;
  efficiency: number;
  blockTempC: number;
  oilBarPressure?: number;
  runHours?: number;
  vibrationMms?: number;
  fuelBurnLpd?: number;
  anomalyScore?: number;
  coolantFlowPct?: number;
  exhaustTempC?: number;
  cranBattV?: number;
  startLatencySec?: number;
  lastTestPassed?: string;
}

export interface EnergyOverview {
  totalGenerationKw: number;
  consumptionKw: number;
  gridLoadPct: number;
  reserveMarginKw: number;
  batteryKwh: number;
  batteryPct: number;
  fuelLiters: number;
  fuelPct: number;
  fuelBurnLph: number;
  estimatedDaysRemaining: number;
  peakTodayKw: number;
  solarKw: number;
  windKw: number;
  generators: GeneratorStatus[];
}

// ─── ENVIRONMENT ──────────────────────────────────────────────────────────────
export interface EnvironmentReading {
  timestamp: string;
  temperatureC: number;
  windChillC: number;
  windKts: number;
  gustKts: number;
  windDirDeg: number;
  pressureHpa: number;
  humidityPct: number;
  visibilityKm: number;
  solarWm2: number;
  kpIndex: number;
}

export interface EnvironmentOverview extends EnvironmentReading {
  windDirLabel: string;
  pressureTrend: 'rising' | 'falling' | 'stable';
  pressureChangeHph: number;
  riskLevel: Status;
  alerts: string[];
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export type InventoryCategory = 'fuel' | 'food' | 'medical' | 'spares' | 'technical' | 'water';

export interface InventoryItem {
  id: string;
  stationId: string;
  itemName: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  consumptionRate: number;
  consumptionUnit: string;
  estimatedDaysRemaining: number;
  reorderThreshold: number;
  status: Status;
}

export interface ResupplyInfo {
  vessel: string;
  etaDays: number;
  status: string;
  fuelGapDays: number;
}

export interface LogisticsOverview {
  inventory: InventoryItem[];
  resupply: ResupplyInfo;
  fuelEnduranceDays: number;
  fuelBurnLpd: number;
}

// ─── ALERTS ──────────────────────────────────────────────────────────────────
export interface AlertEvent {
  id: string;
  alertId: string;
  timestamp: string;
  label: string;
  detail: string;
}

export interface Alert {
  id: string;
  stationId: string;
  assetId?: string;
  severity: Severity;
  title: string;
  description: string;
  subsystem: 'energy' | 'environment' | 'logistics' | 'hvac' | 'structural' | 'comms';
  source: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  unit?: string;
  riskScore?: number;
  recommendedAction?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  updatedAt?: string;
  events?: AlertEvent[];
}

// ─── SIMULATION ──────────────────────────────────────────────────────────────
export interface SimulationRequest {
  stationId: string;
  scenario: 'A' | 'B' | 'C' | 'D';
  assetId?: string;
  oatC: number;
  windKts: number;
  spinUpGen3: boolean;
  sheddingOverrides?: Record<string, boolean>;
}

export interface Point {
  t: number;
  baseline?: number;
  unmitigated?: number;
  withShedding?: number;
  thermal?: number;
  floor?: number;
}

export interface SimulationDirective {
  title: string;
  description: string;
  state: 'PRE-VALIDATED' | 'READY FOR ACTUATION' | 'QUEUED STAGE 3' | string;
}

export interface SimulationResult {
  scenario: string;
  currentPowerKw: number;
  simulatedPowerKw: number;
  deficitKw: number;
  loadBeforeKw: number;
  loadAfterShedKw: number;
  bufferKw: number;
  enduranceDays: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  criticalLoadsSupported: boolean;
  shedTiers: string[];
  mitigatedKw: number;
  generators: { id: string; before: number; after: number; status: string }[];
  series: { powerStability: Point[]; thermal: Point[] };
  directives: SimulationDirective[];
  recommendations: string[];
  runs: number;
  generatedAt: string;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export interface StationOverview {
  station: Station;
  healthScore: number;
  healthDelta: number;
  healthStatus: Status;
  anomalyVector: string;
  predictedMtbfH: number;
  subScores: {
    hull: number;
    grid: number;
    life: number;
    infra: number;
    energy: number;
    env: number;
    logistics: number;
  };
  energy: EnergyOverview;
  environment: EnvironmentOverview;
  logistics: LogisticsOverview;
  alertCounts: { critical: number; warning: number; info: number; total: number };
}

// ─── API RESPONSE ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: { code: string; message: string };
}

// ─── LOAD TIER ────────────────────────────────────────────────────────────────
export interface LoadTier {
  id: string;
  tier: number;
  name: string;
  description: string;
  kw: number;
  locked: boolean;
  priority: 'LOCKED' | 'HIGH PRIO' | 'SHEDDABLE';
}

// ─── TICKET ───────────────────────────────────────────────────────────────────
export interface MaintenanceTicket {
  id: string;
  stationId: string;
  assetId: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
}
