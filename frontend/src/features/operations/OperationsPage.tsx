import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useStationStore } from '@/store/stationStore';
import { useUiStore } from '@/store/uiStore';
import { getEnergyOverview, generateEnergyHistory } from '@/mock/energy';
import { getEnvironmentOverview, generateEnvironmentHistory, generate48hForecast } from '@/mock/environment';
import { getLogistics } from '@/mock/logistics';
import {
  Card, Badge, StatusBadge, ProgressBar, Button, Tabs, Modal, Spinner, FeatureInProgress, ConfirmDialog, Toggle
} from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { cn } from '@/utils/severity';
import { formatNumber, degToCompass } from '@/utils/format';
import toast from 'react-hot-toast';

// ─── ENERGY TAB ───────────────────────────────────────────────────────────────
const EnergyTab: React.FC<{ stationId: string }> = ({ stationId }) => {
  const { demoState, spinUpGen3, spinDownGen3, throttleGen2 } = useUiStore();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('24H');
  const energy = getEnergyOverview(stationId);
  const histPoints = timeRange === '6H' ? 12 : timeRange === '7D' ? 48 : timeRange === '30D' ? 48 : 48;
  const history = generateEnergyHistory(stationId, histPoints);
  const chartData = history.filter((_, i) => i % 2 === 0).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    generated: r.powerGenerated,
    consumed: r.powerConsumed,
    fuel: r.fuelLiters,
  }));

  const gen2Out = demoState.gen2Isolated ? 0 : demoState.gen2Throttled ? 208 : 260;
  const gen3Out = demoState.gen3Online ? 210 : 0;
  const totalGen = stationId === 'maitri' ? 430 + gen2Out + gen3Out + 42 + 138 : energy.totalGenerationKw;
  const fuelDays = demoState.ecoModeActive ? 24.0 : energy.estimatedDaysRemaining;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'TOTAL GENERATION', value: formatNumber(totalGen), unit: 'kW', sub: `Peak today ${energy.peakTodayKw} kW`, color: 'text-cyan-700' },
          { label: 'NET DEMAND', value: formatNumber(energy.consumptionKw), unit: 'kW', sub: `${Math.round((energy.consumptionKw / totalGen) * 100)}% load`, color: 'text-slate-800' },
          { label: 'RESERVE MARGIN', value: `+${formatNumber(totalGen - energy.consumptionKw)}`, unit: 'kW', sub: 'HEALTHY', color: 'text-emerald-700' },
          { label: 'BATTERY', value: `${energy.batteryPct}%`, unit: 'SoC', sub: `${formatNumber(energy.batteryKwh)} kWh`, color: 'text-cyan-700' },
          { label: 'DIESEL RESERVE', value: formatNumber(energy.fuelLiters), unit: 'L', sub: `${fuelDays.toFixed(1)} days`, color: energy.estimatedDaysRemaining < 21 ? 'text-amber-700' : 'text-slate-800' },
        ].map(({ label, value, unit, sub, color }) => (
          <Card key={label} className="p-4">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-xl font-mono font-bold', color)}>{value}</span>
              <span className="text-xs text-slate-500 font-mono">{unit}</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Power chart + Renewables */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Power Generation vs Consumption</h3>
            <div className="flex gap-1">
              {['6H', '24H', '7D', '30D'].map((r) => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={cn('px-2.5 py-1 rounded text-xs font-mono transition-colors',
                    timeRange === r ? 'bg-cyan-100 text-cyan-800' : 'text-slate-500 hover:bg-slate-100')}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891B2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} axisLine={false} unit="kW" />
              <Tooltip contentStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', borderRadius: 8 }}
                formatter={(v: any, n: any) => [`${v} kW`, n === 'generated' ? 'Generated' : 'Consumed']} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="generated" stroke="#0891B2" strokeWidth={2} fill="url(#eGrad)" name="Generated" />
              <Line type="monotone" dataKey="consumed" stroke="#F59E0B" strokeWidth={2} dot={false} name="Consumed" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="col-span-12 lg:col-span-4 space-y-3">
          <Card className="p-4">
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-3">Bifacial Polar Solar</p>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-mono font-bold text-amber-600">42 kW</div>
              <div>
                <p className="text-xs text-slate-500">Efficiency: 64%</p>
                <p className="text-[10px] font-mono text-slate-400">Low sun angle optimised</p>
              </div>
            </div>
            <ProgressBar value={42} max={80} variant="amber" size="sm" className="mt-2" />
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-3">Arctic Wind Turbines</p>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-mono font-bold text-cyan-600">138 kW</div>
              <div>
                <p className="text-xs text-slate-500">Rated max: 150 kW</p>
                <p className="text-[10px] font-mono text-slate-400">420 RPM · Blades heated</p>
              </div>
            </div>
            <ProgressBar value={138} max={150} variant="cyan" size="sm" className="mt-2" />
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Auto Shedding</p>
              <Button size="xs" variant="ghost" onClick={() => toast('🚧 Configure — Under Development. This action is simulated in the prototype.', { duration: 4000 })}>Configure</Button>
            </div>
            <p className="text-xs text-slate-500">Automatic load shedding is configured for critical threshold breaches.</p>
            <Badge variant="emerald" size="xs" className="mt-2">STANDBY</Badge>
          </Card>
        </div>
      </div>

      {/* Generator Tri-Array */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Generator Tri-Array — Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GEN-01 */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800">GEN-01 PRIMARY</span>
              <Badge variant="emerald" size="xs">NOMINAL</Badge>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-800 mb-3">430 kW</div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-slate-500">Caterpillar 3512B</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Efficiency</span><span className="text-emerald-700 font-bold">91%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Block Temp</span><span>82°C</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Oil Pressure</span><span>4.8 bar</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Run Hours</span><span>1,842h</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Vibration</span><span className="text-emerald-700">0.12 mm/s</span></div>
            </div>
          </div>

          {/* GEN-02 */}
          <div className={cn(
            'border rounded-xl p-4',
            demoState.gen2Isolated ? 'border-sky-200 bg-sky-50' : 'border-rose-300 bg-rose-50'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-xs font-bold', demoState.gen2Isolated ? 'text-sky-800' : 'text-rose-800')}>GEN-02 AUXILIARY</span>
              <Badge variant={demoState.gen2Isolated ? 'sky' : 'rose'} size="xs">
                {demoState.gen2Isolated ? 'ISOLATED' : demoState.gen2Throttled ? 'THROTTLED' : 'ANOMALY'}
              </Badge>
            </div>
            <div className={cn('text-2xl font-mono font-bold mb-3', demoState.gen2Isolated ? 'text-slate-400 line-through' : 'text-rose-700')}>
              {demoState.gen2Isolated ? '0' : demoState.gen2Throttled ? '208' : gen2Out} kW
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-slate-500">Efficiency</span><span className={demoState.gen2Isolated ? 'text-slate-400' : 'text-rose-700 font-bold'}>76%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Block Temp</span><span className="text-rose-700 font-bold">94.2°C HIGH</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Coolant Flow</span><span className="text-rose-700">−28%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Exhaust</span><span className="text-amber-600">512°C</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Vibration</span><span className="text-rose-700 font-bold">4.8 mm/s CRIT</span></div>
            </div>
            {!demoState.gen2Isolated && (
              <Button size="xs" variant="danger" className="mt-3 w-full justify-center"
                onClick={() => { throttleGen2(); toast.success('GEN-02 throttled to 80% output. (simulated)', { icon: '⬇️' }); }}>
                {demoState.gen2Throttled ? '✓ Throttled' : 'Throttle Down'}
              </Button>
            )}
          </div>

          {/* GEN-03 */}
          <div className={cn('border rounded-xl p-4', demoState.gen3Online ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">GEN-03 EMERGENCY</span>
              <Badge variant={demoState.gen3Online ? 'emerald' : 'slate'} size="xs">
                {demoState.gen3Online ? 'ONLINE' : 'STANDBY'}
              </Badge>
            </div>
            <div className={cn('text-2xl font-mono font-bold mb-3', demoState.gen3Online ? 'text-emerald-700' : 'text-slate-500')}>
              {demoState.gen3Online ? '210' : '0'} kW
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-slate-500">Scania Tier-4</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Rated</span><span className="text-slate-700">210 kW</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Jacket Temp</span><span className="text-emerald-600">45°C READY</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Crank Batt</span><span className="text-emerald-600">27.6 V</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Start Latency</span><span>14 s</span></div>
            </div>
            <Button size="xs" variant={demoState.gen3Online ? 'secondary' : 'primary'} className="mt-3 w-full justify-center"
              onClick={() => {
                if (demoState.gen3Online) { spinDownGen3(); toast.success('GEN-03 returning to standby (simulated)'); }
                else { spinUpGen3(); toast.success('GEN-03 spinning up → 210 kW online (simulated)', { icon: '⚡' }); }
              }}>
              {demoState.gen3Online ? 'Return to Standby' : 'SPIN UP'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Energy Insight */}
      <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="amber" size="xs" className="mb-2">ENERGY INSIGHT</Badge>
            <p className="text-sm font-semibold text-slate-800 mb-1">Generator 02 efficiency declined from 88% to 76% in 72h.</p>
            <p className="text-xs text-slate-600">Expected range 80–88%. Impact: +18% fuel burn. Contributing factors: bearing fatigue, coolant flow reduction, thermal escalation.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" onClick={() => navigate('/digital-twin?asset=GEN-02')}>INSPECT GEN</Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/simulation?scenario=A&asset=GEN-02')}>RUN SIM</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── ENVIRONMENT TAB ──────────────────────────────────────────────────────────
const EnvironmentTab: React.FC<{ stationId: string }> = ({ stationId }) => {
  const env = getEnvironmentOverview(stationId);
  const forecast = generate48hForecast(stationId).filter((_, i) => i % 2 === 0).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    wind: r.windKts,
    windChill: r.windChillC,
    gust: r.gustKts,
  }));

  return (
    <div className="space-y-4">
      {/* Sensor cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'OUTSIDE TEMP', value: `${env.temperatureC}°C`, sub: `Chill ${env.windChillC}°C`, color: 'text-cyan-700', badge: null },
          { label: 'WIND VELOCITY', value: `${env.windKts} kts`, sub: `Gusts ${env.gustKts} kts · ${env.windDirLabel}`, color: 'text-slate-800', badge: stationId === 'maitri' ? 'BLIZZARD' : null },
          { label: 'BAROMETRIC', value: `${env.pressureHpa} hPa`, sub: env.pressureTrend === 'falling' ? `▼ ${Math.abs(env.pressureChangeHph)} hPa/hr RAPID DROP` : 'Stable', color: env.pressureTrend === 'falling' ? 'text-amber-700' : 'text-slate-800', badge: null },
          { label: 'SOLAR RADIATION', value: `${env.solarWm2} W/m²`, sub: 'Low polar sun', color: 'text-slate-800', badge: null },
          { label: 'GEOMAGNETIC Kp', value: `${env.kpIndex}`, sub: 'Kp Index', color: env.kpIndex >= 5 ? 'text-rose-700' : 'text-slate-800', badge: env.kpIndex >= 5 ? 'STORM' : null },
        ].map(({ label, value, sub, color, badge }) => (
          <Card key={label} className="p-4">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={cn('text-xl font-mono font-bold', color)}>{value}</p>
            <p className="text-[10px] font-mono text-slate-400 mt-1">{sub}</p>
            {badge && <Badge variant="rose" size="xs" className="mt-1">{badge}</Badge>}
          </Card>
        ))}
      </div>

      {/* Blizzard forecast + wind compass */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">48-Hour Blizzard & Wind Chill Simulation</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="amber" size="xs">SIMULATED FORECAST</Badge>
                {stationId === 'maitri' && <Badge variant="rose" size="xs">CAT-3</Badge>}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', borderRadius: 8 }}
                formatter={(v: any, n: any) => [`${v}`, n === 'wind' ? 'Wind (kts)' : n === 'windChill' ? 'Wind Chill (°C)' : 'Gust (kts)']} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={40} stroke="#E11D48" strokeDasharray="4 4" label={{ value: 'LOCKOUT (40 kts)', position: 'right', fontSize: 9, fill: '#E11D48' }} />
              <Line type="monotone" dataKey="wind" stroke="#0891B2" strokeWidth={2} dot={false} name="Wind kts" />
              <Line type="monotone" dataKey="windChill" stroke="#7C3AED" strokeWidth={1.5} dot={false} name="Wind Chill °C" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Wind compass */}
        <Card className="col-span-12 lg:col-span-4 p-5 flex flex-col items-center justify-center">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-4">Wind Compass</p>
          <svg viewBox="0 0 200 200" width="160" height="160">
            <circle cx="100" cy="100" r="90" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
            {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, i) => {
              const angle = i * 45;
              const rad = ((angle - 90) * Math.PI) / 180;
              const x = 100 + 78 * Math.cos(rad);
              const y = 100 + 78 * Math.sin(rad);
              return <text key={dir} x={x} y={y + 4} textAnchor="middle" style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: '600', fill: dir === env.windDirLabel ? '#0891B2' : '#94A3B8' }}>{dir}</text>;
            })}
            {/* Arrow */}
            <g transform={`rotate(${env.windDirDeg}, 100, 100)`}>
              <polygon points="100,25 107,100 100,115 93,100" fill="#0891B2" opacity="0.8" />
              <polygon points="100,175 107,100 100,115 93,100" fill="#CBD5E1" opacity="0.6" />
            </g>
            <circle cx="100" cy="100" r="8" fill="#0891B2" />
            <text x="100" y="104" textAnchor="middle" style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', fill: '#fff', fontWeight: 'bold' }}>{env.windDirLabel}</text>
          </svg>
          <div className="mt-3 text-center">
            <p className="text-2xl font-mono font-bold text-slate-800">{env.windKts} kts</p>
            <p className="text-[10px] font-mono text-slate-400">GUST {env.gustKts} kts</p>
          </div>
        </Card>
      </div>

      {/* Perimeter cam */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Perimeter Optical Feed — CAM-04</h3>
          <Badge variant="slate" size="xs">LIVE CAM-04</Badge>
        </div>
        <div className="bg-slate-800 rounded-xl h-40 flex items-center justify-center border border-slate-700">
          <div className="text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <p className="text-xs font-mono">Visibility &lt;50 m · Lifelines Engaged</p>
            <p className="text-[10px] text-slate-600 mt-1">Live camera streaming — Under Development</p>
          </div>
        </div>
      </Card>

      {/* Risk Banner */}
      {stationId === 'maitri' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              ⚠️
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">ENVIRONMENT RISK: CRITICAL — BLIZZARD PHASE 1</p>
              <p className="text-xs text-rose-600">Wind {env.windKts} kts / Pressure dropping {Math.abs(env.pressureChangeHph)} hPa/hr / Visibility &lt;50m. All exterior operations suspended.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LOGISTICS TAB ────────────────────────────────────────────────────────────
const LogisticsTab: React.FC<{ stationId: string }> = ({ stationId }) => {
  const { demoState, activateEcoMode, requestReorder } = useUiStore();
  const logistics = getLogistics(stationId);
  const [reorderConfirm, setReorderConfirm] = useState(false);
  const fuelDays = demoState.ecoModeActive ? logistics.fuelEnduranceDays + 6.8 : logistics.fuelEnduranceDays;
  const hasGap = logistics.resupply.etaDays > fuelDays;

  const statusColor = (status: string) => {
    if (status === 'critical') return 'text-rose-600 bg-rose-50';
    if (status === 'warning') return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  return (
    <div className="space-y-4">
      {/* Critical protocol banner */}
      {stationId === 'maitri' && !demoState.ecoModeActive && hasGap && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="amber">CRITICAL PROTOCOL</Badge>
                <span className="text-[10px] font-mono text-amber-600">FUEL BUFFER ALERT</span>
              </div>
              <p className="text-sm font-semibold text-amber-900">
                Arctic Diesel Buffer — {fuelDays.toFixed(1)} days remaining; protocol mandates 21-day buffer before winter closure
              </p>
              {hasGap && (
                <p className="text-xs text-amber-700 mt-1">
                  Supply gap: Vessel ETA {logistics.resupply.etaDays}d vs endurance {fuelDays.toFixed(1)}d = <span className="font-bold text-rose-700">GAP {(logistics.resupply.etaDays - fuelDays).toFixed(1)} DAYS</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => {
                activateEcoMode();
                toast.success('Eco-Mode activated. Fuel endurance extended to 24.0 days. (simulated)', { icon: '🌿' });
              }}>
                🌿 Eco-Mode +6.8d
              </Button>
              <Button size="sm" variant="danger" onClick={() => setReorderConfirm(true)}>
                Trigger Reorder
              </Button>
            </div>
          </div>
        </div>
      )}
      {demoState.ecoModeActive && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <Badge variant="emerald">ECO-MODE ACTIVE</Badge>
          <p className="text-xs text-emerald-700 mt-1">Non-essential fuel consumption reduced. Endurance extended to 24.0 days. (simulated)</p>
        </div>
      )}

      {/* Inventory table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Critical Consumables & Spares</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-mono text-slate-500 uppercase tracking-wider text-[10px]">Resource</th>
                <th className="text-right px-4 py-2.5 font-mono text-slate-500 uppercase tracking-wider text-[10px]">Stock</th>
                <th className="text-right px-4 py-2.5 font-mono text-slate-500 uppercase tracking-wider text-[10px]">Burn Rate</th>
                <th className="text-right px-4 py-2.5 font-mono text-slate-500 uppercase tracking-wider text-[10px]">Endurance</th>
                <th className="text-center px-4 py-2.5 font-mono text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {logistics.inventory.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.itemName}</p>
                    <p className="text-[10px] font-mono text-slate-400 capitalize">{item.category}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {item.quantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {item.consumptionRate} {item.consumptionUnit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={cn(item.estimatedDaysRemaining < 21 && item.category === 'fuel' ? 'text-amber-700 font-bold' : item.estimatedDaysRemaining < 15 ? 'text-rose-700 font-bold' : 'text-slate-700')}>
                      {item.estimatedDaysRemaining === 0 ? 'DEPLETED' : `${item.estimatedDaysRemaining}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase', statusColor(item.status))}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fuel donut + Resupply */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 md:col-span-5 p-5 flex flex-col items-center">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-4">Bulk Fuel Storage T-50</p>
          <svg viewBox="0 0 200 200" width="180" height="180">
            <circle cx="100" cy="100" r="80" fill="#F8FAFC" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="#F1F5F9" strokeWidth="28" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="#F59E0B" strokeWidth="28"
              strokeDasharray={`${(logistics.inventory.find(i => i.category === 'fuel')?.quantity ?? 38200) / 80000 * 502} 502`}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
            />
            <text x="100" y="95" textAnchor="middle" style={{ fontFamily: 'JetBrains Mono', fontSize: '24px', fontWeight: 'bold', fill: '#0F172A' }}>
              {Math.round((logistics.inventory.find(i => i.category === 'fuel')?.quantity ?? 38200) / 80000 * 100)}%
            </text>
            <text x="100" y="114" textAnchor="middle" style={{ fontFamily: 'Inter', fontSize: '10px', fill: '#94A3B8' }}>
              {(logistics.inventory.find(i => i.category === 'fuel')?.quantity ?? 38200).toLocaleString()} L
            </text>
          </svg>
          <p className="text-[10px] font-mono text-slate-400 mt-2">Capacity: 80,000 L · Burn: {logistics.fuelBurnLpd.toLocaleString()} L/day</p>
        </Card>

        <Card className="col-span-12 md:col-span-7 p-5">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-4">Resupply Status</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🚢</div>
            <div>
              <p className="font-bold text-slate-800">{logistics.resupply.vessel}</p>
              <p className="text-xs font-mono text-slate-500">{logistics.resupply.status}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-mono font-bold text-slate-800">ETA {logistics.resupply.etaDays}d</p>
            </div>
          </div>

          {hasGap && !demoState.ecoModeActive && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="rose">SUPPLY GAP {(logistics.resupply.etaDays - fuelDays).toFixed(1)} DAYS</Badge>
              </div>
              <p className="text-xs text-rose-700 mt-1">
                ETA {logistics.resupply.etaDays}d &gt; Endurance {fuelDays.toFixed(1)}d.
                Eco-Mode +6.8 days suggested.
              </p>
            </div>
          )}
          {demoState.ecoModeActive && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
              <Badge variant="emerald">GAP CLOSED — ECO-MODE ACTIVE</Badge>
              <p className="text-xs text-emerald-700 mt-1">Endurance extended to 24.0 days. Vessel ETA covered.</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono text-xs">Cargo</span>
              <span className="text-slate-700 font-mono text-xs">Fuel · Rations · Medical · Spares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono text-xs">Fuel Gap</span>
              <span className={cn('font-mono text-xs font-bold', hasGap && !demoState.ecoModeActive ? 'text-rose-600' : 'text-emerald-600')}>
                {demoState.ecoModeActive ? 'NONE (Eco-Mode)' : hasGap ? `${(logistics.resupply.etaDays - fuelDays).toFixed(1)} DAYS` : 'NONE'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={reorderConfirm}
        onClose={() => setReorderConfirm(false)}
        onConfirm={() => { requestReorder(); toast.success('Emergency reorder dispatch queued. (simulated)', { icon: '📦' }); }}
        title="Trigger Emergency Reorder Dispatch?"
        description="This will transmit an emergency resupply request to NCPOR HQ via SATCOM. Action is simulated in this prototype."
        confirmLabel="DISPATCH REORDER"
        variant="primary"
      />
    </div>
  );
};

// ─── OPERATIONS PAGE ──────────────────────────────────────────────────────────
const OperationsPage: React.FC = () => {
  const { selectedStationId } = useStationStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'energy';
  const [reportOpen, setReportOpen] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const { demoState } = useUiStore();

  const setTab = (tab: string) => setSearchParams({ tab });

  const energy = getEnergyOverview(selectedStationId);

  const handleTransmitReport = () => {
    setTransmitting(true);
    setTimeout(() => {
      setTransmitting(false);
      setReportOpen(false);
      toast.success('Report dispatched! (simulated)', { icon: '📡' });
    }, 1300);
  };

  const tabs = [
    { id: 'energy', label: 'Energy & Power Grid', badge: `${energy.totalGenerationKw} kW` },
    { id: 'environment', label: 'Polar Environment', badge: selectedStationId === 'maitri' ? 'BLIZZARD' : 'CLEAR' },
    { id: 'logistics', label: 'Logistics & Inventory', badge: `${demoState.ecoModeActive ? '24.0' : energy.estimatedDaysRemaining.toFixed(1)}d Fuel` },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Station Sector 04 // Tactical Operations Hub"
        subtitle="Mission Grid & Environmental Logistics"
        badges={[{ label: selectedStationId.toUpperCase(), variant: 'slate' }]}
        actions={
          <Button size="sm" variant="secondary" onClick={() => setReportOpen(true)}>
            Export Telemetry
          </Button>
        }
      />

      <Tabs
        tabs={tabs}
        active={activeTab}
        onChange={setTab}
        className="mb-6"
      />

      {activeTab === 'energy' && <EnergyTab stationId={selectedStationId} />}
      {activeTab === 'environment' && <EnvironmentTab stationId={selectedStationId} />}
      {activeTab === 'logistics' && <LogisticsTab stationId={selectedStationId} />}

      {/* Export Report Modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="GENERATE EXPEDITION REPORT">
        {transmitting ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <Spinner size="lg" className="text-cyan-600" />
            <p className="font-mono text-slate-600 text-sm">Transmitting via SATCOM…</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 text-xs font-mono space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Station</span><span>{selectedStationId.toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Classification</span><span>RESEARCH — UNCLASSIFIED</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sensor Count</span><span>148</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Format</span><span>CSV / JSON</span></div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => {
                const data = generateEnergyHistory(selectedStationId, 48);
                const csv = ['timestamp,powerGenerated,powerConsumed,fuelLiters,batteryPct',
                  ...data.map((r) => `${r.timestamp},${r.powerGenerated},${r.powerConsumed},${r.fuelLiters},${r.batteryPct}`)
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `expedition-report-${selectedStationId}.csv`; a.click();
                setReportOpen(false);
                toast.success('CSV report downloaded');
              }}>Download CSV</Button>
              <Button variant="primary" className="flex-1 justify-center" onClick={handleTransmitReport}>
                Transmit Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OperationsPage;
