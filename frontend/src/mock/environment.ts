import type { EnvironmentOverview, EnvironmentReading } from '@/types';
import { computeWindChill, degToCompass } from '@/utils/format';

export function generateEnvironmentHistory(stationId: string, points = 48 * 2): EnvironmentReading[] {
  const isMaitri = stationId === 'maitri';
  const baseTemp = isMaitri ? -38.4 : -18.6;
  const baseWind = isMaitri ? 42.6 : 21;
  const basePressure = isMaitri ? 982.1 : 998.0;

  const data: EnvironmentReading[] = [];
  const now = Date.now();
  const intervalMs = 30 * 60 * 1000;

  for (let i = points; i >= 0; i--) {
    const t = now - i * intervalMs;
    const hour = new Date(t).getHours();
    const diurnal = 3 * Math.sin(((hour - 14) / 24) * 2 * Math.PI);
    const tempC = baseTemp + diurnal + (Math.random() - 0.5) * 1.5;
    const windRamp = isMaitri ? (points - i) / points * 22 : 0;
    const windKts = baseWind + windRamp + (Math.random() - 0.5) * 3;
    const gustKts = windKts + 10 + Math.random() * 6;
    const pressureDrop = isMaitri ? (points - i) / points * -4.2 : 0;
    const pressure = basePressure + pressureDrop + (Math.random() - 0.5) * 0.5;
    const windDirDeg = isMaitri ? 135 + (Math.random() - 0.5) * 20 : 315 + (Math.random() - 0.5) * 20;

    data.push({
      timestamp: new Date(t).toISOString(),
      temperatureC: Math.round(tempC * 10) / 10,
      windChillC: computeWindChill(tempC, windKts),
      windKts: Math.round(windKts * 10) / 10,
      gustKts: Math.round(gustKts * 10) / 10,
      windDirDeg: Math.round(windDirDeg),
      pressureHpa: Math.round(pressure * 10) / 10,
      humidityPct: isMaitri ? 38 + Math.random() * 10 : 55 + Math.random() * 15,
      visibilityKm: isMaitri ? 0.05 : 6.2 - Math.random() * 1,
      solarWm2: isMaitri ? 12 : 45,
      kpIndex: isMaitri ? 6 : 2,
    });
  }
  return data;
}

export const MAITRI_ENVIRONMENT: EnvironmentOverview = {
  timestamp: new Date().toISOString(),
  temperatureC: -38.4,
  windChillC: -59.1,
  windKts: 42.6,
  gustKts: 58.2,
  windDirDeg: 135,
  windDirLabel: 'SE',
  pressureHpa: 982.1,
  pressureTrend: 'falling',
  pressureChangeHph: -4.2,
  humidityPct: 68,
  visibilityKm: 0.05,
  solarWm2: 12,
  kpIndex: 6,
  riskLevel: 'critical',
  alerts: ['BLIZZARD PHASE 1', 'CAT-4 GALE', 'STORM DISTURBANCE — Kp 6'],
};

export const BHARATI_ENVIRONMENT: EnvironmentOverview = {
  timestamp: new Date().toISOString(),
  temperatureC: -18.6,
  windChillC: computeWindChill(-18.6, 21),
  windKts: 21,
  gustKts: 28,
  windDirDeg: 315,
  windDirLabel: 'NW',
  pressureHpa: 998.0,
  pressureTrend: 'stable',
  pressureChangeHph: -0.2,
  humidityPct: 55,
  visibilityKm: 6.2,
  solarWm2: 45,
  kpIndex: 2,
  riskLevel: 'normal',
  alerts: [],
};

export function getEnvironmentOverview(stationId: string): EnvironmentOverview {
  return stationId === 'maitri'
    ? { ...MAITRI_ENVIRONMENT, timestamp: new Date().toISOString() }
    : { ...BHARATI_ENVIRONMENT, timestamp: new Date().toISOString() };
}

export function generate48hForecast(stationId: string): EnvironmentReading[] {
  const isMaitri = stationId === 'maitri';
  const data: EnvironmentReading[] = [];
  const now = Date.now();

  for (let i = 0; i <= 48; i++) {
    const t = now + i * 3600000;
    const windRamp = isMaitri ? Math.min(65, 42.6 + i * 0.5) : 21;
    const tempDrop = isMaitri ? -38.4 - i * 0.3 : -18.6;
    const windKts = windRamp + (Math.random() - 0.5) * 3;
    const gustKts = windKts + 10 + Math.random() * 8;

    data.push({
      timestamp: new Date(t).toISOString(),
      temperatureC: Math.round(tempDrop * 10) / 10,
      windChillC: computeWindChill(tempDrop, windKts),
      windKts: Math.round(windKts * 10) / 10,
      gustKts: Math.round(gustKts * 10) / 10,
      windDirDeg: 135,
      pressureHpa: isMaitri ? 982.1 - i * 0.15 : 998.0,
      humidityPct: 68,
      visibilityKm: isMaitri ? Math.max(0, 0.05 - i * 0.01) : 6.2,
      solarWm2: 12,
      kpIndex: isMaitri ? Math.min(9, 6 + i * 0.1) : 2,
    });
  }
  return data;
}
