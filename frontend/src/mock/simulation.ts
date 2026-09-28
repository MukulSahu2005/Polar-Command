import type { SimulationRequest, SimulationResult, Point } from '@/types';

function generatePowerStabilitySeries(
  currentPowerKw: number,
  simulatedPowerKw: number,
  loadAfterShedKw: number
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i;
    const noise = (Math.random() - 0.5) * 15;
    const scenarioNoise = (Math.random() - 0.5) * 20;
    points.push({
      t,
      baseline: Math.round(currentPowerKw + noise),
      unmitigated: i < 2 ? Math.round(currentPowerKw + noise) : Math.round(simulatedPowerKw + scenarioNoise),
      withShedding: i < 2 ? Math.round(currentPowerKw + noise) : Math.round(loadAfterShedKw + noise * 0.5),
    });
  }
  return points;
}

function generateThermalSeries(): Point[] {
  const points: Point[] = [];
  const baseTemp = 21.4;
  for (let i = 0; i <= 24; i++) {
    const decay = i > 0 ? Math.exp(-i * 0.05) * 2.9 : 0;
    const glycolBoost = i >= 4 && i <= 8 ? 0.5 : 0;
    points.push({
      t: i,
      thermal: Math.round((baseTemp - decay + glycolBoost) * 10) / 10,
      floor: 15,
    });
  }
  return points;
}

export function runSimulationEngine(req: SimulationRequest): SimulationResult {
  const { scenario, oatC, windKts, spinUpGen3, sheddingOverrides = {} } = req;

  // Base generation values
  let gen1 = 430, gen2 = 260, gen3 = 0;
  const solar = windKts >= 60 ? 0 : 42;
  const wind = windKts >= 60 ? 0 : Math.min(150, 3.3 * windKts);

  const currentPowerKw = gen1 + gen2 + gen3 + solar + wind;

  if (scenario === 'A') {
    // Generator 02 failure
    gen2 = 0;
    if (spinUpGen3) gen3 = 210;

    const availableKw = gen1 + gen3 + solar + wind;

    // Demand adjusted for temperature
    const heatingAdj = Math.max(0, (-oatC - 40) * 1.5);
    const demandKw = Math.min(800, 800 + heatingAdj);

    // Load shedding
    const t1 = 320, t2 = 85;
    let t3 = sheddingOverrides['T3'] === false ? 0 : 120;
    let t4 = sheddingOverrides['T4'] === false ? 0 : 95;
    let t5 = sheddingOverrides['T5'] === false ? 0 : 180;

    let loadAfterShed = t1 + t2 + t3 + t4 + t5;
    const shedTiers: string[] = [];

    if (loadAfterShed > availableKw) {
      t5 = 0; shedTiers.push('T5'); loadAfterShed = t1 + t2 + t3 + t4;
    }
    if (loadAfterShed > availableKw) {
      t4 = 0; shedTiers.push('T4'); loadAfterShed = t1 + t2 + t3;
    }
    if (loadAfterShed > availableKw && sheddingOverrides['T3'] !== true) {
      t3 = 0; shedTiers.push('T3'); loadAfterShed = t1 + t2;
    }

    const bufferKw = availableKw - loadAfterShed;
    const deficitKw = currentPowerKw - availableKw;
    const mitigatedKw = demandKw - loadAfterShed;

    // Endurance: derate fuel burn proportional to diesel kw
    const dieselKwAfter = gen1 + gen3;
    const dieselKwBefore = gen1 + gen2;
    const enduranceDays = 38200 / (92.4 * (dieselKwAfter / Math.max(1, dieselKwBefore)) * 24);

    // Risk score: baseline 0.54 for canonical scenario
    const riskScore = Math.min(0.99, Math.max(0.1, 0.54 + (windKts > 60 ? 0.15 : 0) - (spinUpGen3 ? 0.1 : 0)));
    const riskLevel = riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : riskScore < 0.8 ? 'high' : 'extreme';

    return {
      scenario,
      currentPowerKw,
      simulatedPowerKw: availableKw,
      deficitKw,
      loadBeforeKw: demandKw,
      loadAfterShedKw: loadAfterShed,
      bufferKw,
      enduranceDays: Math.round(enduranceDays * 10) / 10,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      criticalLoadsSupported: loadAfterShed >= t1 + t2,
      shedTiers,
      mitigatedKw: Math.max(0, mitigatedKw),
      generators: [
        { id: 'GEN-01', before: 430, after: gen1, status: 'ONLINE' },
        { id: 'GEN-02', before: 260, after: 0, status: 'FAILED' },
        { id: 'GEN-03', before: 0, after: gen3, status: spinUpGen3 ? 'ONLINE' : 'STANDBY' },
      ],
      series: {
        powerStability: generatePowerStabilitySeries(currentPowerKw, availableKw, loadAfterShed),
        thermal: generateThermalSeries(),
      },
      directives: [
        { title: 'Isolate Bus B3 & B5', description: 'Immediately isolate non-critical distribution buses to prevent cascade fault.', state: 'PRE-VALIDATED' },
        { title: 'Lock Air Handler Units', description: 'Lock AHU-03 and AHU-06 to maintain T1 heating capacity under reduced generation.', state: 'READY FOR ACTUATION' },
        { title: 'Notify Crew of Load Shed', description: 'Broadcast station-wide notification of scheduled load shedding. Crew to acknowledge.', state: 'QUEUED STAGE 3' },
      ],
      recommendations: [
        'Maintain T1 Life Support & T2 SATCOM at full capacity (405 kW total) — SECURED',
        'Shed T4 (Lighting & Galley 95 kW) and T5 (Supercomputer 180 kW) — NON-CRITICAL',
        'Initiate GEN-03 spin-up if not already active (adds 210 kW, total available → 820 kW)',
        'Dispatch maintenance crew to inspect GEN-02 bearing and coolant system',
        'Monitor fuel consumption closely — endurance extends to ~22.4 days at reduced load',
      ],
      runs: 10000,
      generatedAt: new Date().toISOString(),
    };
  }

  if (scenario === 'B') {
    // SATCOM Blackout 72h
    return {
      scenario, currentPowerKw, simulatedPowerKw: currentPowerKw, deficitKw: 0,
      loadBeforeKw: 705, loadAfterShedKw: 705, bufferKw: 165,
      enduranceDays: 17.2, riskScore: 0.41, riskLevel: 'medium',
      criticalLoadsSupported: true, shedTiers: [], mitigatedKw: 0,
      generators: [
        { id: 'GEN-01', before: 430, after: 430, status: 'ONLINE' },
        { id: 'GEN-02', before: 260, after: 260, status: 'DEGRADED' },
        { id: 'GEN-03', before: 0, after: 0, status: 'STANDBY' },
      ],
      series: {
        powerStability: generatePowerStabilitySeries(currentPowerKw, currentPowerKw, 705),
        thermal: generateThermalSeries(),
      },
      directives: [
        { title: 'Activate Autonomous Mode', description: 'Switch to pre-programmed autonomous operation protocols for 72h SATCOM blackout.', state: 'PRE-VALIDATED' },
        { title: 'Queue Data Buffer', description: 'Enable on-station data buffer — 2.4 TB capacity — for deferred transmission.', state: 'READY FOR ACTUATION' },
        { title: 'Crew Briefing', description: 'Brief crew on communication blackout procedures and emergency protocols.', state: 'QUEUED STAGE 3' },
      ],
      recommendations: [
        'Activate 72h autonomous operation mode',
        'Maintain internal radio communications',
        'Queue telemetry data for post-blackout transmission',
        'Brief crew: no external communications for 72h',
      ],
      runs: 10000,
      generatedAt: new Date().toISOString(),
    };
  }

  if (scenario === 'C') {
    // Supply vessel delayed
    const newEtaDays = 24 + 14; // +14 days
    const newGapDays = newEtaDays - 17.2;
    return {
      scenario, currentPowerKw, simulatedPowerKw: currentPowerKw, deficitKw: 0,
      loadBeforeKw: 705, loadAfterShedKw: 705, bufferKw: 165,
      enduranceDays: 17.2, riskScore: 0.58, riskLevel: 'medium',
      criticalLoadsSupported: true, shedTiers: [], mitigatedKw: 0,
      generators: [
        { id: 'GEN-01', before: 430, after: 430, status: 'ONLINE' },
        { id: 'GEN-02', before: 260, after: 260, status: 'DEGRADED' },
        { id: 'GEN-03', before: 0, after: 0, status: 'STANDBY' },
      ],
      series: {
        powerStability: generatePowerStabilitySeries(currentPowerKw, currentPowerKw * 0.85, 705),
        thermal: generateThermalSeries(),
      },
      directives: [
        { title: 'Activate Extended Eco-Mode', description: 'Reduce non-essential energy consumption by 15%. Extends fuel endurance by 6.8 days.', state: 'PRE-VALIDATED' },
        { title: 'Ration Consumables', description: 'Implement rationing protocol for food and consumables. Target 20% reduction.', state: 'READY FOR ACTUATION' },
        { title: 'Emergency Resupply Request', description: 'Transmit emergency resupply request to NCPOR HQ via SATCOM.', state: 'QUEUED STAGE 3' },
      ],
      recommendations: [
        `Vessel ETA extended to ${newEtaDays} days — SUPPLY GAP ${Math.round(newGapDays * 10) / 10} days`,
        'Activate Eco-Mode immediately — extends endurance by 6.8 days',
        'Implement food rationing — 20% reduction target',
        'Request emergency air resupply for critical spares',
      ],
      runs: 10000,
      generatedAt: new Date().toISOString(),
    };
  }

  // Scenario D: HVAC thermal loss
  return {
    scenario, currentPowerKw, simulatedPowerKw: currentPowerKw * 0.7, deficitKw: currentPowerKw * 0.3,
    loadBeforeKw: 705, loadAfterShedKw: 405, bufferKw: -65,
    enduranceDays: 17.2, riskScore: 0.82, riskLevel: 'high',
    criticalLoadsSupported: true, shedTiers: ['T3', 'T4', 'T5'], mitigatedKw: 300,
    generators: [
      { id: 'GEN-01', before: 430, after: 430, status: 'ONLINE' },
      { id: 'GEN-02', before: 260, after: 260, status: 'DEGRADED' },
      { id: 'GEN-03', before: 0, after: 210, status: 'EMERGENCY' },
    ],
    series: {
      powerStability: generatePowerStabilitySeries(currentPowerKw, currentPowerKw * 0.7, 405),
      thermal: [
        ...Array.from({ length: 25 }, (_, i) => ({
          t: i,
          thermal: Math.max(15, 21.4 - i * 0.28 + (i > 18 ? 0.2 : 0)),
          floor: 15,
        })),
      ],
    },
    directives: [
      { title: 'Emergency Heating Redirect', description: 'Redirect all available heating capacity to critical habitat sections.', state: 'PRE-VALIDATED' },
      { title: 'Crew Consolidation', description: 'Consolidate crew in main habitat. Seal off B-Sector until thermal restored.', state: 'READY FOR ACTUATION' },
      { title: 'MEDEVAC Pre-Authorization', description: 'Pre-authorize emergency evacuation if temperatures breach +12°C habitat floor.', state: 'QUEUED STAGE 3' },
    ],
    recommendations: [
      'CRITICAL: Consolidate all crew to main habitat immediately',
      'Seal B-Sector and redirect heating',
      'Spin up GEN-03 for additional heating capacity',
      'If habitat temp drops below +15°C — initiate evacuation protocol',
    ],
    runs: 10000,
    generatedAt: new Date().toISOString(),
  };
}
