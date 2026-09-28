import type { EnergyOverview, EnergyReading } from '@/types';

// Generate 30 days of 15-min energy data
export function generateEnergyHistory(stationId: string, points = 2 * 24 * 7): EnergyReading[] {
  const isMaitri = stationId === 'maitri';
  const baseGen = isMaitri ? 870 : 780;
  const baseConsume = isMaitri ? 705 : 640;
  const baseFuel = isMaitri ? 38200 : 44600;
  const burnLph = isMaitri ? 92.4 : 76.0;

  const data: EnergyReading[] = [];
  const now = Date.now();
  const intervalMs = 30 * 60 * 1000; // 30 min

  for (let i = points; i >= 0; i--) {
    const t = now - i * intervalMs;
    const hour = new Date(t).getHours();
    // Diurnal sine curve ±60kW
    const diurnal = 60 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
    // EV charging pulses (8am, 6pm)
    const evPulse = (hour === 8 || hour === 18) ? 40 : 0;
    const noise = (Math.random() - 0.5) * 24;

    const powerConsumed = Math.round(baseConsume + diurnal + evPulse + noise);
    const wind = isMaitri ? Math.min(150, 3.3 * 42.6) : Math.min(120, 3.3 * 21);
    const solar = isMaitri ? 42 : 60; // bharati gets a bit more
    const powerGenerated = Math.round(powerConsumed + 100 + (Math.random() * 70) + wind * 0.2 + solar * 0.1);

    const fuelBurned = (burnLph * intervalMs) / 3600000;
    const fuelLiters = Math.max(0, baseFuel - (points - i) * fuelBurned);
    const fuelCap = isMaitri ? 80000 : 90000;

    data.push({
      timestamp: new Date(t).toISOString(),
      powerGenerated: Math.min(powerGenerated, baseGen + 100),
      powerConsumed,
      fuelLevelPct: (fuelLiters / fuelCap) * 100,
      fuelLiters: Math.round(fuelLiters),
      batteryPct: isMaitri ? 94 : 87,
      generatorLoadPct: (powerConsumed / powerGenerated) * 100,
      solarKw: solar,
      windKw: isMaitri ? 138 : 120,
    });
  }
  return data;
}

export const MAITRI_ENERGY: EnergyOverview = {
  totalGenerationKw: 870,
  consumptionKw: 705,
  gridLoadPct: 81,
  reserveMarginKw: 165,
  batteryKwh: 480,
  batteryPct: 94,
  fuelLiters: 38200,
  fuelPct: 47.75,
  fuelBurnLph: 92.4,
  estimatedDaysRemaining: 17.2,
  peakTodayKw: 920,
  solarKw: 42,
  windKw: 138,
  generators: [
    {
      id: 'GEN-01',
      name: 'GEN-01 Primary (Cat 3512B)',
      model: 'Caterpillar 3512B',
      status: 'normal',
      outputKw: 430,
      ratedKw: 500,
      efficiency: 91,
      blockTempC: 82,
      oilBarPressure: 4.8,
      runHours: 1842,
      vibrationMms: 0.12,
      anomalyScore: 0.08,
    },
    {
      id: 'GEN-02',
      name: 'GEN-02 Auxiliary (Cat 3512B)',
      model: 'Caterpillar 3512B',
      status: 'critical',
      outputKw: 260,
      ratedKw: 500,
      efficiency: 76,
      blockTempC: 94.2,
      oilBarPressure: 3.9,
      runHours: 4218,
      vibrationMms: 4.8,
      fuelBurnLpd: 820,
      anomalyScore: 0.87,
      coolantFlowPct: -28,
      exhaustTempC: 512,
    },
    {
      id: 'GEN-03',
      name: 'GEN-03 Emergency (Scania T4)',
      model: 'Scania Tier-4',
      status: 'normal',
      outputKw: 0,
      ratedKw: 210,
      efficiency: 0,
      blockTempC: 45,
      cranBattV: 27.6,
      startLatencySec: 14,
      lastTestPassed: new Date(Date.now() - 4 * 3600000).toISOString(),
      anomalyScore: 0.03,
    },
  ],
};

export const BHARATI_ENERGY: EnergyOverview = {
  totalGenerationKw: 780,
  consumptionKw: 640,
  gridLoadPct: 82,
  reserveMarginKw: 140,
  batteryKwh: 420,
  batteryPct: 87,
  fuelLiters: 44600,
  fuelPct: 55.75,
  fuelBurnLph: 76.0,
  estimatedDaysRemaining: 24.1,
  peakTodayKw: 820,
  solarKw: 60,
  windKw: 120,
  generators: [
    {
      id: 'BHR-GEN-01',
      name: 'GEN-01 Primary',
      model: 'Caterpillar 3512B',
      status: 'normal',
      outputKw: 420,
      ratedKw: 480,
      efficiency: 92,
      blockTempC: 79,
      anomalyScore: 0.06,
    },
    {
      id: 'BHR-GEN-02',
      name: 'GEN-02 Secondary',
      model: 'Caterpillar 3512B',
      status: 'normal',
      outputKw: 360,
      ratedKw: 480,
      efficiency: 88,
      blockTempC: 81,
      anomalyScore: 0.12,
    },
  ],
};

export function getEnergyOverview(stationId: string): EnergyOverview {
  return stationId === 'maitri' ? { ...MAITRI_ENERGY } : { ...BHARATI_ENERGY };
}
