import type { Alert, AlertEvent } from '@/types';

const ts = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

const GEN02_EVENTS: AlertEvent[] = [
  {
    id: 'EVT-001', alertId: 'ALT-8821',
    timestamp: ts(30), label: 'ANOMALY DETECTED',
    detail: 'Vibration harmonic excursion — 4.8 mm/s exceeds 3.5 mm/s critical limit',
  },
  {
    id: 'EVT-002', alertId: 'ALT-8821',
    timestamp: ts(29), label: 'BUS PRE-WARM',
    detail: 'Bus pre-warm command issued — Gen-03 pre-heating sequence initiated',
  },
  {
    id: 'EVT-003', alertId: 'ALT-8821',
    timestamp: ts(24), label: 'OPERATOR OVERRIDE',
    detail: 'Operator override logged by Cmdr. Dr. A. Sharma — monitoring continued',
  },
  {
    id: 'EVT-004', alertId: 'ALT-8821',
    timestamp: ts(14), label: 'ESCALATION',
    detail: 'Thermal efficiency dropped below 80% threshold — alert escalated to CRITICAL',
  },
];

export const MAITRI_ALERTS: Alert[] = [
  {
    id: 'ALT-8821', stationId: 'maitri', assetId: 'GEN-02',
    severity: 'critical',
    title: 'Gen #02 Thermal Surge & Fuel Efficiency Anomaly',
    description: 'Generator #02 showing thermal efficiency decline from 88% to 76% over 72h. Core temp 94.2°C exceeds 92°C threshold. Vibration harmonic 4.8 mm/s critical. Fuel burn +18% (820 L/day). IsolationForest anomaly score 0.87. Estimated time to failure: 01h 42m.',
    subsystem: 'energy', source: 'AI RISK ENGINE — ISOLATION-FOREST-V4',
    metric: 'thermal_efficiency', currentValue: 76, threshold: 88, unit: '%',
    riskScore: 0.87, status: 'active',
    recommendedAction: 'Immediately transfer load to GEN-03. Dispatch maintenance ticket. Inspect bearing assembly and coolant system.',
    createdAt: ts(14), updatedAt: ts(2),
    events: GEN02_EVENTS,
  },
  {
    id: 'ALT-8819', stationId: 'maitri',
    severity: 'critical',
    title: 'Cat-4 Polar Blizzard Incoming — Station Lockout Mandatory',
    description: 'Barometric pressure falling at -4.2 hPa/hr. Wind forecast >65 kts within 6h. Category 4 polar gale conditions expected. Visibility <50m. All exterior personnel must be recalled. Station lockout protocol mandatory per NCPOR safety directive.',
    subsystem: 'environment', source: 'ATMOSPHERIC MONITORING ARRAY',
    metric: 'pressure_change', currentValue: -4.2, threshold: -2.0, unit: 'hPa/hr',
    riskScore: 0.91, status: 'active',
    recommendedAction: 'Initiate station lockout. Recall all exterior personnel. Secure equipment. Activate blizzard protocol.',
    createdAt: ts(32), updatedAt: ts(5),
  },
  {
    id: 'ALT-8794', stationId: 'maitri', assetId: 'FUEL-01',
    severity: 'warning',
    title: 'Diesel Reserves Below 21-Day Protocol Buffer',
    description: 'Current fuel: 38,200L (17.2 days at 2,218 L/day burn rate). Protocol mandates 21-day minimum before winter closure. Resupply vessel ETA 24 days — SUPPLY GAP 6.8 days. Eco-Mode activation extends endurance by +6.8 days.',
    subsystem: 'logistics', source: 'LOGISTICS MANAGEMENT SYSTEM',
    metric: 'fuel_days_remaining', currentValue: 17.2, threshold: 21, unit: 'days',
    riskScore: 0.62, status: 'active',
    recommendedAction: 'Activate Eco-Mode to extend endurance. Coordinate early resupply request. Review non-essential fuel consumption.',
    createdAt: ts(120), updatedAt: ts(10),
  },
  {
    id: 'ALT-8750', stationId: 'maitri', assetId: 'HVAC-02',
    severity: 'warning',
    title: 'B-Sector Air Duct Differential Pressure High',
    description: 'Duct pressure ΔP 312 Pa exceeds 250 Pa threshold. Flow efficiency reduced to 68%. Rime ice formation detected in inlet ducting. De-icing coils required. Continued high ΔP risks filter damage and reduced habitat ventilation.',
    subsystem: 'hvac', source: 'HVAC MONITORING SYSTEM',
    metric: 'duct_pressure_delta', currentValue: 312, threshold: 250, unit: 'Pa',
    riskScore: 0.34, status: 'active',
    recommendedAction: 'Engage de-icing coils on B-sector inlet. Monitor pressure differential. Replace filters if >350 Pa.',
    createdAt: ts(180), updatedAt: ts(45),
  },
  // Info/nominal alerts
  { id: 'ALT-8720', stationId: 'maitri', severity: 'info', title: 'Battery Bank Float Charge Nominal', description: 'Battery bank maintaining 94% SoC in float charge mode. All cells within voltage parameters.', subsystem: 'energy', source: 'BATTERY MANAGEMENT SYSTEM', riskScore: 0.05, status: 'active', createdAt: ts(240), metric: 'battery_soc', currentValue: 94, threshold: 80, unit: '%' },
  { id: 'ALT-8715', stationId: 'maitri', severity: 'info', title: 'SATCOM Link Stable 99.8%', description: 'Satellite communication link operational at 99.8% uptime. Ping 32ms. All telemetry channels nominal.', subsystem: 'comms', source: 'SATCOM MONITOR', riskScore: 0.02, status: 'active', createdAt: ts(300) },
  { id: 'ALT-8710', stationId: 'maitri', severity: 'info', title: 'Snow Load Within Design Limits', description: 'Roof snow load measured at 184 kg/m² — within 300 kg/m² structural limit. No clearance required.', subsystem: 'structural', source: 'STRUCTURAL MONITOR', riskScore: 0.06, status: 'active', createdAt: ts(360) },
  { id: 'ALT-8705', stationId: 'maitri', severity: 'info', title: 'Permafrost Temperature −11.2°C', description: 'Foundation permafrost temperature stable at −11.2°C. Seasonal variation within expected bounds.', subsystem: 'structural', source: 'GEOTHERMAL SENSOR ARRAY', riskScore: 0.04, status: 'active', createdAt: ts(420) },
  { id: 'ALT-8700', stationId: 'maitri', severity: 'info', title: 'Water Melter Cycle Complete', description: 'Water melter cycle completed successfully. Potable water tank topped to 92%. Next cycle in 4h.', subsystem: 'hvac', source: 'WATER MANAGEMENT', riskScore: 0.02, status: 'active', createdAt: ts(480) },
  { id: 'ALT-8695', stationId: 'maitri', severity: 'info', title: 'Lab Seismic Array Calibrated', description: 'Research laboratory seismic array successfully auto-calibrated at 04:30 UTC. All sensors nominal.', subsystem: 'structural', source: 'SEISMIC ARRAY', riskScore: 0.01, status: 'active', createdAt: ts(540) },
  { id: 'ALT-8690', stationId: 'maitri', severity: 'info', title: 'Inverter Efficiency 98.1%', description: 'Power inverter bank operating at 98.1% efficiency. All phases balanced. Harmonic distortion <2%.', subsystem: 'energy', source: 'POWER MANAGEMENT', riskScore: 0.03, status: 'active', createdAt: ts(600) },
  { id: 'ALT-8685', stationId: 'maitri', severity: 'info', title: 'Scheduled Generator Test Passed', description: 'Weekly scheduled test of GEN-03 emergency generator passed. Start latency 14s within 30s spec.', subsystem: 'energy', source: 'GENERATOR MANAGEMENT', riskScore: 0.02, status: 'active', createdAt: ts(660) },
  { id: 'ALT-8680', stationId: 'maitri', severity: 'info', title: 'Wind Turbine Blade Heating Active', description: 'Arctic wind turbine blade de-icing system active. Power output maintained at 138 kW despite -38°C ambient.', subsystem: 'energy', source: 'RENEWABLES MONITOR', riskScore: 0.04, status: 'active', createdAt: ts(720) },
  { id: 'ALT-8675', stationId: 'maitri', severity: 'info', title: 'CO₂ Scrubber Efficiency Optimal', description: 'Life support CO₂ scrubbers operating at 99.2% efficiency. CO₂ concentration 410 ppm, well below 1000 ppm limit.', subsystem: 'hvac', source: 'LIFE SUPPORT MONITOR', riskScore: 0.02, status: 'active', createdAt: ts(780) },
  { id: 'ALT-8670', stationId: 'maitri', severity: 'info', title: 'Solar Array Power Export 42 kW', description: 'Bifacial polar solar array generating 42 kW at 64% efficiency. Optimal angle for low sun angle conditions.', subsystem: 'energy', source: 'SOLAR MONITOR', riskScore: 0.01, status: 'active', createdAt: ts(840) },
  { id: 'ALT-8665', stationId: 'maitri', severity: 'info', title: 'Data Backup Synchronised', description: 'Research data backup to NCPOR server synchronised. 48.2 GB transferred via SATCOM at 12:00 UTC.', subsystem: 'comms', source: 'DATA MANAGEMENT', riskScore: 0.01, status: 'active', createdAt: ts(900) },
  { id: 'ALT-8660', stationId: 'maitri', severity: 'info', title: 'Expedition Crew Health Status Normal', description: 'Daily health monitoring of all 29 expedition crew members completed. All personnel within normal parameters.', subsystem: 'structural', source: 'MEDICAL MONITOR', riskScore: 0.02, status: 'active', createdAt: ts(960) },
  { id: 'ALT-8655', stationId: 'maitri', severity: 'info', title: 'Habitat Pressure 101.3 kPa Nominal', description: 'Main habitat cabin pressure at 101.3 kPa. Airtightness 99.1%. All seals and hatches sealed.', subsystem: 'structural', source: 'HABITAT MONITOR', riskScore: 0.02, status: 'active', createdAt: ts(1020) },
];

export const BHARATI_ALERTS: Alert[] = [
  {
    id: 'BHR-ALT-001', stationId: 'bharati', assetId: 'BHR-HVAC-01',
    severity: 'warning',
    title: 'HVAC Filter Life Critical — Replacement Required',
    description: 'Filter life remaining: 12%. Replacement overdue by estimated 8 days. Risk of reduced air quality if not replaced within 48h.',
    subsystem: 'hvac', source: 'HVAC MONITOR',
    metric: 'filter_life', currentValue: 12, threshold: 20, unit: '%',
    riskScore: 0.38, status: 'active',
    recommendedAction: 'Replace HVAC filters immediately. Check spare parts inventory.',
    createdAt: ts(480), updatedAt: ts(60),
  },
  {
    id: 'BHR-ALT-002', stationId: 'bharati',
    severity: 'warning',
    title: 'Temperature Dropping — Monitor Habitability',
    description: 'External temperature trending down to −18.6°C. Blizzard watch issued by weather station. Wind increasing.',
    subsystem: 'environment', source: 'WEATHER STATION',
    metric: 'temperature', currentValue: -18.6, threshold: -20, unit: '°C',
    riskScore: 0.22, status: 'active',
    recommendedAction: 'Monitor conditions. Ensure all exterior equipment secured.',
    createdAt: ts(240),
  },
  { id: 'BHR-ALT-003', stationId: 'bharati', severity: 'info', title: 'SATCOM Link Nominal 98.6%', description: 'SATCOM operating at 98.6%. All data channels synchronized.', subsystem: 'comms', source: 'SATCOM', riskScore: 0.03, status: 'active', createdAt: ts(300) },
  { id: 'BHR-ALT-004', stationId: 'bharati', severity: 'info', title: 'Generator Test Passed', description: 'Weekly generator tests passed for all units.', subsystem: 'energy', source: 'GEN MONITOR', riskScore: 0.02, status: 'active', createdAt: ts(600) },
  { id: 'BHR-ALT-005', stationId: 'bharati', severity: 'info', title: 'Fuel Reserves 24.1 Days', description: 'Fuel endurance 24.1 days. Above 21-day protocol buffer.', subsystem: 'logistics', source: 'FUEL MONITOR', riskScore: 0.08, status: 'active', createdAt: ts(720) },
  { id: 'BHR-ALT-006', stationId: 'bharati', severity: 'info', title: 'Snow Load Nominal', description: 'Snow load within structural limits.', subsystem: 'structural', source: 'STRUCTURAL MONITOR', riskScore: 0.03, status: 'active', createdAt: ts(900) },
];

export function getAlerts(stationId: string | 'all'): Alert[] {
  if (stationId === 'all') return [...MAITRI_ALERTS, ...BHARATI_ALERTS];
  return stationId === 'maitri' ? MAITRI_ALERTS : BHARATI_ALERTS;
}

export function getAlert(alertId: string): Alert | undefined {
  return [...MAITRI_ALERTS, ...BHARATI_ALERTS].find((a) => a.id === alertId);
}

export function getAlertCounts(stationId: string) {
  const alerts = getAlerts(stationId);
  return {
    critical: alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length,
    warning: alerts.filter((a) => a.severity === 'warning' && a.status === 'active').length,
    info: alerts.filter((a) => a.severity === 'info' && a.status === 'active').length,
    total: alerts.filter((a) => a.status === 'active').length,
  };
}
