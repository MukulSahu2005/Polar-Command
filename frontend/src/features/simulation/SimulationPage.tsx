import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  Zap,
  Flame,
  Shield,
  ShieldAlert,
  Sliders,
  RotateCcw,
  Download,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Wind,
  Thermometer,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, Badge, Button } from '@/components/ui';
import { runSimulationEngine } from '@/mock/simulation';
import type { SimulationRequest, SimulationResult } from '@/types';
import { useStationStore } from '@/store/stationStore';

export const SimulationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedStationId } = useStationStore();

  const initialScenario = (searchParams.get('scenario') as any) || 'A';
  const [scenario, setScenario] = useState<'A' | 'B' | 'C' | 'D'>(initialScenario);
  const [oatC, setOatC] = useState<number>(-42);
  const [windKts, setWindKts] = useState<number>(65);
  const [spinUpGen3, setSpinUpGen3] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Load Shedding Tiers
  const [shedding, setShedding] = useState<Record<string, boolean>>({
    T1: false, // Locked
    T2: false, // Locked
    T3: false, // High Priority
    T4: true,  // Shed by default in Scen A
    T5: true,  // Shed by default in Scen A
  });

  const [result, setResult] = useState<SimulationResult>(() =>
    runSimulationEngine({
      stationId: selectedStationId || 'maitri',
      scenario: 'A',
      oatC: -42,
      windKts: 65,
      spinUpGen3: false,
      sheddingOverrides: { T4: true, T5: true },
    })
  );

  const handleRunSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const newResult = runSimulationEngine({
        stationId: selectedStationId || 'maitri',
        scenario,
        oatC,
        windKts,
        spinUpGen3,
        sheddingOverrides: shedding,
      });
      setResult(newResult);
      setIsCalculating(false);
      toast.success(
        `SIMULATION CONVERGED — 10,000 Monte Carlo runs executed. Risk level: ${newResult.riskLevel.toUpperCase()} (${newResult.riskScore.toFixed(2)})`
      );
    }, 400);
  };

  const handleResetNominal = () => {
    setScenario('A');
    setOatC(-42);
    setWindKts(65);
    setSpinUpGen3(false);
    setShedding({ T1: false, T2: false, T3: false, T4: true, T5: true });
    const resetRes = runSimulationEngine({
      stationId: selectedStationId || 'maitri',
      scenario: 'A',
      oatC: -42,
      windKts: 65,
      spinUpGen3: false,
      sheddingOverrides: { T4: true, T5: true },
    });
    setResult(resetRes);
    toast('Parameters reset to contingency baseline');
  };

  const handleExportBriefing = () => {
    const briefingContent = `# POLAR COMMAND CONTINGENCY SIMULATION BRIEFING
Station: ${selectedStationId.toUpperCase()}
Generated: ${new Date().toISOString()}
Scenario: ${scenario} - ${result.scenario}
Model Iterations: 10,000 Monte Carlo Runs

## 1. Executive Summary
- Risk Level: ${result.riskLevel.toUpperCase()} (Score: ${result.riskScore.toFixed(2)})
- Critical Loads Supported: ${result.criticalLoadsSupported ? 'SECURED (100%)' : 'AT RISK'}
- Available Generation: ${result.currentPowerKw} kW -> ${result.simulatedPowerKw} kW (Deficit: ${result.deficitKw} kW)
- Demand Post-Shedding: ${result.loadBeforeKw} kW -> ${result.loadAfterShedKw} kW
- Operating Reserve Buffer: +${result.bufferKw} kW
- Station Autonomy / Endurance: ${result.enduranceDays} Days

## 2. Load Shedding Action Matrix
${Object.entries(shedding)
  .map(([k, v]) => `- Tier ${k}: ${v ? 'SHED / ISOLATED' : 'POWERED'}`)
  .join('\n')}

## 3. Recommended Actions
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## 4. Directives
${result.directives.map((d) => `- [${d.state}] ${d.title}: ${d.description}`).join('\n')}
`;

    const blob = new Blob([briefingContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POLAR_COMMAND_SIM_BRIEF_${selectedStationId}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Expedition contingency briefing exported (.md)');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIM_VERDICT_STN_${selectedStationId.toUpperCase()}.JSON`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Simulation verdict JSON exported');
  };

  return (
    <div className="space-y-4">
      {/* Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Tactical Scenario & Risk Simulation Engine
            </h1>
            <Badge variant="cyan" className="font-mono text-xs">
              Monte Carlo Engine
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              BUILD 4.29-REV8 // POLARIS
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            STN: {selectedStationId.toUpperCase()} & CONTINGENCY HUB • MODEL ITERATION: 10,000 RUNS/SEC • TELEMETRY SYNCED
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetNominal}
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Nominal
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportBriefing}
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Briefing
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunSimulation}
            disabled={isCalculating}
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            {isCalculating ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                CALCULATING…
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scenario Selector Ribbon (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'A',
            title: 'Scenario A: Generator #02 Failure',
            subtitle: 'Peak Winter Blizzard',
            impact: 'DEFICIT -260 kW',
            risk: 'EXTREME RISK',
            badge: 'danger',
          },
          {
            id: 'B',
            title: 'Scenario B: SATCOM Blackout',
            subtitle: '72-Hour Polar Isolation',
            impact: 'AUTONOMY 72H',
            risk: 'MODERATE',
            badge: 'warning',
          },
          {
            id: 'C',
            title: 'Scenario C: Supply Vessel Delay',
            subtitle: 'Heavy Pack Ice (+14 Days)',
            impact: 'RESUPPLY +336H',
            risk: 'SUPPLY GAP',
            badge: 'warning',
          },
          {
            id: 'D',
            title: 'Scenario D: Sector-B HVAC Failure',
            subtitle: 'Sub-Zero Thermal Loss',
            impact: 'THERMAL DECAY',
            risk: 'CRITICAL EVAC',
            badge: 'danger',
          },
        ].map((scen) => {
          const isSelected = scenario === scen.id;
          return (
            <div
              key={scen.id}
              onClick={() => {
                setScenario(scen.id as any);
                setSearchParams({ scenario: scen.id });
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-cyan-500'
                  : 'bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`font-mono text-xs font-bold ${
                    isSelected ? 'text-cyan-400' : 'text-slate-600'
                  }`}
                >
                  [{scen.id}]
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : scen.badge === 'danger'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {scen.risk}
                </span>
              </div>
              <h3 className="text-xs font-bold leading-tight line-clamp-1">{scen.title}</h3>
              <p
                className={`text-[11px] mt-0.5 ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {scen.subtitle}
              </p>
              <div
                className={`mt-2 text-[10px] font-mono font-semibold ${
                  isSelected ? 'text-cyan-300' : 'text-cyan-700'
                }`}
              >
                {scen.impact}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Controls Left (5 cols), Verdict & Charts Right (7 cols) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Model Parameters & Shedding (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* 1. Atmospheric Boundary Model */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Atmospheric Boundary Model
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-bold">
                {windKts >= 50 ? 'CAT-4 GALE' : windKts >= 25 ? 'HIGH DRIFT' : 'MILD BREEZE'}
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* OAT Slider */}
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Outside Air Temp (OAT)</span>
                  <span className="font-bold text-slate-900">{oatC.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min="-65"
                  max="-20"
                  step="0.5"
                  value={oatC}
                  onChange={(e) => setOatC(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-65°C Extreme</span>
                  <span>-20°C Mild</span>
                </div>
              </div>

              {/* Wind Slider */}
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Sustained Wind Velocity</span>
                  <span className="font-bold text-slate-900">{windKts} kts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={windKts}
                  onChange={(e) => setWindKts(parseInt(e.target.value))}
                  className="w-full accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 kts Calm</span>
                  <span>40 kts Lockout</span>
                  <span>90 kts Hurricane</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Generation Bus Injection */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Generation Bus Injection
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                TOTAL: {result.simulatedPowerKw} kW
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span>GEN-01 Primary (430 kW)</span>
                <span className="font-bold text-emerald-600">ONLINE (400 kW)</span>
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded border ${
                  scenario === 'A'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
              >
                <span className={scenario === 'A' ? 'line-through' : ''}>
                  GEN-02 Aux (260 kW)
                </span>
                <span className="font-bold">
                  {scenario === 'A' ? 'FAILED / 0 kW' : 'ONLINE (260 kW)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <div>
                  <span>GEN-03 Reserve (210 kW)</span>
                  <div className="text-[10px] text-slate-400">Jacket pre-heated 45°C</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSpinUpGen3(!spinUpGen3)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                      spinUpGen3
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {spinUpGen3 ? 'SPUN UP (+210 kW)' : 'SPIN UP'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-slate-500">
                <span>Renewables (Solar PV & Turbines)</span>
                <span>{windKts >= 60 ? 'FEATHERED OFF (Gale)' : '180 kW'}</span>
              </div>
            </div>
          </Card>

          {/* 3. Load Shedding Priority Matrix */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Load Shedding Priority Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">5 TIERS (800 kW)</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* T1 */}
              <div className="flex items-center justify-between p-2 rounded bg-slate-100 text-slate-500 font-mono">
                <div>
                  <span className="font-bold text-slate-700">T1: Life Support & Habitat Heat</span>
                  <div className="text-[10px] text-slate-400">320 kW • Non-negotiable</div>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  LOCKED
                </Badge>
              </div>

              {/* T2 */}
              <div className="flex items-center justify-between p-2 rounded bg-slate-100 text-slate-500 font-mono">
                <div>
                  <span className="font-bold text-slate-700">T2: Station Control & SATCOM</span>
                  <div className="text-[10px] text-slate-400">85 kW • Core Telemetry</div>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  LOCKED
                </Badge>
              </div>

              {/* T3 */}
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 font-mono">
                <div>
                  <span className="font-bold text-slate-800">T3: Scientific Cryo & Ice Samples</span>
                  <div className="text-[10px] text-slate-500">120 kW • -80°C Freezers</div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shedding.T3}
                    onChange={() => {
                      if (!shedding.T3) {
                        toast.error('Warning: Ice sample integrity risk if shed > 4h');
                      }
                      setShedding((prev) => ({ ...prev, T3: !prev.T3 }));
                    }}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[10px] text-slate-600">Shed</span>
                </label>
              </div>

              {/* T4 */}
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 font-mono">
                <div>
                  <span className="font-bold text-slate-800">T4: Habitat Lighting & Galley</span>
                  <div className="text-[10px] text-slate-500">95 kW • Non-essential</div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shedding.T4}
                    onChange={() =>
                      setShedding((prev) => ({ ...prev, T4: !prev.T4 }))
                    }
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-600">Shed</span>
                </label>
              </div>

              {/* T5 */}
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 font-mono">
                <div>
                  <span className="font-bold text-slate-800">T5: Mass Spec & Supercomputer</span>
                  <div className="text-[10px] text-slate-500">180 kW • Deferrable Compute</div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shedding.T5}
                    onChange={() =>
                      setShedding((prev) => ({ ...prev, T5: !prev.T5 }))
                    }
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-600">Shed</span>
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Execution Verdict & Charts (7 cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* Microgrid Execution Verdict Card */}
          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Simulated Microgrid Execution Verdict
                </h3>
              </div>
              <button
                onClick={handleExportJson}
                className="text-[11px] font-mono text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded border border-cyan-200 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                SIM_VERDICT_STN_MAI.JSON
              </button>
            </div>

            {/* 4 KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 font-mono text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 uppercase">Available Power</div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {result.simulatedPowerKw} kW
                </div>
                <div className="text-[10px] text-rose-600 font-semibold">
                  {result.deficitKw > 0 ? `-${result.deficitKw} kW Deficit` : 'Nominal'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 uppercase">Load Post-Shed</div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {result.loadAfterShedKw} kW
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">
                  +{result.bufferKw} kW Buffer
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 uppercase">Station Endurance</div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  ≈{result.enduranceDays} Days
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">38,200 L Fuel</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 uppercase">Computed Risk</div>
                <div className="text-base font-bold text-amber-600 mt-1">
                  {result.riskScore.toFixed(2)} {result.riskLevel.toUpperCase()}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">STABLE W/ ACTION</div>
              </div>
            </div>

            {/* Verdict Strips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Critical Loads (T1 + T2): 100% Guaranteed</span>
                </div>
                <span className="font-bold">SECURED</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-50 border border-cyan-200 text-xs font-mono text-cyan-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  <span>
                    Non-Critical Shedding: {result.mitigatedKw} kW Mitigated (T4 & T5 Isolated)
                  </span>
                </div>
                <span className="font-bold">ACTIVE SHED</span>
              </div>
            </div>
          </Card>

          {/* Impact Visualizer Charts */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Power Grid Stability (48h Contingency Simulation)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">UNITS: kW / HOUR</span>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={result.series.powerStability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }}
                  tickLine={false}
                  unit="h"
                />
                <YAxis
                  tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  unit=" kW"
                  domain={[400, 1000]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    borderRadius: 8,
                  }}
                  formatter={(v: any, n: any) => [`${v} kW`, n]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine
                  x={2}
                  stroke="#E11D48"
                  strokeDasharray="3 3"
                  label={{
                    value: 'GEN-02 SCRAM',
                    position: 'top',
                    fill: '#E11D48',
                    fontSize: 9,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  dot={false}
                  name="Nominal Baseline"
                />
                <Line
                  type="monotone"
                  dataKey="unmitigated"
                  stroke="#E11D48"
                  strokeWidth={2}
                  dot={false}
                  name="Unmitigated Collapse"
                />
                <Line
                  type="monotone"
                  dataKey="withShedding"
                  stroke="#0891B2"
                  strokeWidth={2.5}
                  dot={false}
                  name="With Auto-Shedding"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Habitat Thermal Decay Chart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Habitat Thermal Decay (24h Window)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">FLOOR: +15.0°C</span>
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={result.series.thermal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }}
                  tickLine={false}
                  unit="h"
                />
                <YAxis
                  tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  unit="°C"
                  domain={[10, 25]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    borderRadius: 8,
                  }}
                  formatter={(v: any) => [`${v}°C`, 'Core Temp']}
                />
                <ReferenceLine
                  y={15}
                  stroke="#E11D48"
                  strokeDasharray="3 3"
                  label={{
                    value: 'SAFETY FLOOR (15°C)',
                    position: 'insideBottomRight',
                    fill: '#E11D48',
                    fontSize: 9,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="thermal"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  dot={false}
                  name="Habitat Temp"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Automated Contingency Directives & Recommended Response */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="p-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono mb-2">
                Automated Directives
              </h4>
              <div className="space-y-2">
                {result.directives.map((d, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-800">{d.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                        {d.state}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{d.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono mb-2">
                Recommended Response
              </h4>
              <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside font-sans">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="leading-tight">
                    {rec}
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Policy Interlock Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="text-xs font-mono">
              <div className="font-bold text-cyan-400">POLICY INTERLOCK // SIMULATION SANDBOX</div>
              <div className="text-slate-400 text-[11px]">
                Modifications are isolated to mathematical contingency models.
              </div>
            </div>
            <Button
              size="sm"
              variant="cyan"
              onClick={() =>
                toast('Policy saved to simulation sandbox. Live SCADA integration — Under Development.')
              }
              className="font-mono text-xs whitespace-nowrap"
            >
              Apply Changes to Live Policy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;
