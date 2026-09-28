import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { useStationStore } from '@/store/stationStore';
import { useUiStore } from '@/store/uiStore';
import { STATIONS } from '@/mock/stations';
import { getEnergyOverview, generateEnergyHistory } from '@/mock/energy';
import { getEnvironmentOverview } from '@/mock/environment';
import { getLogistics } from '@/mock/logistics';
import { getAlertCounts, getAlerts } from '@/mock/alerts';
import {
  Card, Badge, StatusBadge, StatusDot, ProgressBar, Button, Modal, Spinner, ConfirmDialog, FeatureInProgress
} from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { cn } from '@/utils/severity';
import { formatNumber, formatDegrees, formatTimeAgo } from '@/utils/format';
import toast from 'react-hot-toast';

// ─── DIAGNOSTIC MODAL ─────────────────────────────────────────────────────────
const DiagnosticModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [currentCheck, setCurrentCheck] = useState('Initializing diagnostic sequence...');

  const checks = [
    'Scanning IoT node registry...', 'Pinging 148 sensor nodes...', 'Checking power grid integrity...',
    'Verifying HVAC subsystems...', 'Running anomaly detection sweep...', 'Cross-referencing telemetry...',
    'Compiling health report...'
  ];

  useEffect(() => {
    if (!open) { setProgress(0); setDone(false); setCurrentCheck(checks[0]); return; }
    let p = 0;
    const timer = setInterval(() => {
      p += 2;
      setProgress(p);
      const checkIdx = Math.floor((p / 100) * checks.length);
      setCurrentCheck(checks[Math.min(checkIdx, checks.length - 1)]);
      if (p >= 100) { clearInterval(timer); setDone(true); }
    }, 60);
    return () => clearInterval(timer);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="STATION DIAGNOSTIC — RUNNING" size="md">
      {!done ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Spinner className="text-cyan-600" />
            <p className="text-sm text-slate-600 font-mono">{currentCheck}</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-cyan-500 h-full rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-400 font-mono text-right">{progress}% complete</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-sm">DIAGNOSTIC COMPLETE</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Nodes Scanned</span>
              <span className="font-mono font-bold text-slate-800">148</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Nodes OK</span>
              <span className="font-mono font-bold text-emerald-600">147</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Nodes Warning</span>
              <span className="font-mono font-bold text-amber-600">1 (GEN-02)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Critical Faults</span>
              <span className="font-mono font-bold text-slate-800">0</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-mono">⚠ GEN-02: Thermal & vibration anomaly confirmed. Immediate inspection recommended.</p>
          <Button variant="secondary" className="w-full justify-center" onClick={onClose}>Close Report</Button>
        </div>
      )}
    </Modal>
  );
};

// ─── STATION HEALTH CARD ──────────────────────────────────────────────────────
const StationHealthCard: React.FC<{ stationId: string }> = ({ stationId }) => {
  const { demoState } = useUiStore();
  const health = 87;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (health / 100) * circumference;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Station Health Index</span>
        <Badge variant="cyan" size="xs">SHI</Badge>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
            <circle
              cx="70" cy="70" r={radius}
              fill="none" stroke="#0891B2" strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="70" y="68" textAnchor="middle" className="fill-slate-800" style={{ fontFamily: 'JetBrains Mono', fontSize: '26px', fontWeight: 'bold' }}>{health}</text>
            <text x="70" y="84" textAnchor="middle" className="fill-slate-400" style={{ fontFamily: 'Inter', fontSize: '11px' }}>HEALTH %</text>
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status="warning" />
            <span className="text-xs text-slate-500 font-mono">Minor Anomaly</span>
          </div>
          <div className="text-xs font-mono space-y-1 text-slate-600">
            <div><span className="text-slate-400">Anomaly Vector:</span> PWR-GEN02</div>
            <div><span className="text-slate-400">MTBF Estimate:</span> 1,840 h</div>
            <div className="text-emerald-600">+1.4% /24h</div>
          </div>
          <div className="pt-2 space-y-1.5">
            {[
              { label: 'Hull', value: 99.1 },
              { label: 'Grid', value: 91.4 },
              { label: 'Life', value: 98.8 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-8 text-[10px] font-mono text-slate-400">{label}</span>
                <ProgressBar value={value} variant={value > 95 ? 'emerald' : value > 85 ? 'cyan' : 'amber'} size="sm" className="flex-1" />
                <span className="text-[10px] font-mono text-slate-500 w-10 text-right">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── ENERGY SUMMARY CARD ──────────────────────────────────────────────────────
const EnergySummaryCard: React.FC<{ stationId: string }> = ({ stationId }) => {
  const { demoState } = useUiStore();
  const navigate = useNavigate();
  const energy = getEnergyOverview(stationId);

  const gen2Out = demoState.gen2Isolated ? 0 : demoState.gen2Throttled ? 208 : energy.generators[1]?.outputKw ?? 260;
  const gen3Out = demoState.gen3Online ? 210 : 0;
  const totalGen = stationId === 'maitri'
    ? (430 + gen2Out + gen3Out + energy.solarKw + energy.windKw)
    : energy.totalGenerationKw;

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/operations?tab=energy')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Energy & Power Grid</span>
        <Badge variant={demoState.gen2Isolated ? 'amber' : 'emerald'} size="xs">
          {demoState.gen2Isolated ? 'GEN-02 ISOLATED' : 'LIVE'}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] font-mono text-slate-400">GENERATED</p>
          <p className="text-xl font-mono font-bold text-slate-800">{formatNumber(totalGen)} <span className="text-sm font-normal text-slate-500">kW</span></p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-slate-400">DEMAND</p>
          <p className="text-xl font-mono font-bold text-slate-800">{formatNumber(energy.consumptionKw)} <span className="text-sm font-normal text-slate-500">kW</span></p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">Grid Load</span>
          <span className="text-slate-700 font-semibold">{Math.round((energy.consumptionKw / totalGen) * 100)}%</span>
        </div>
        <ProgressBar value={energy.consumptionKw} max={totalGen} variant={energy.gridLoadPct > 90 ? 'rose' : energy.gridLoadPct > 80 ? 'amber' : 'emerald'} size="sm" />
        <div className="flex items-center justify-between text-xs font-mono mt-1">
          <span className="text-slate-500">Battery</span>
          <span className="text-cyan-700 font-bold">{energy.batteryPct}% FLOAT</span>
        </div>
      </div>
      {energy.generators.map((gen) => (
        <div key={gen.id} className="flex items-center gap-2 mt-1.5 py-1 border-t border-slate-50">
          <StatusDot status={gen.status === 'critical' ? 'critical' : gen.outputKw === 0 ? 'normal' : 'normal'} size="sm" />
          <span className="text-[10px] font-mono text-slate-500 flex-1">{gen.name.split('(')[0].trim()}</span>
          <span className="text-[10px] font-mono font-bold text-slate-700">{gen.id === 'GEN-02' ? (demoState.gen2Isolated ? 0 : gen2Out) : gen.outputKw} kW</span>
          <span className={cn('text-[10px] font-mono', gen.efficiency > 85 ? 'text-emerald-600' : 'text-amber-600')}>{gen.efficiency > 0 ? `${gen.efficiency}%` : 'STBY'}</span>
        </div>
      ))}
    </Card>
  );
};

// ─── ENVIRONMENT CARD ─────────────────────────────────────────────────────────
const EnvironmentCard: React.FC<{ stationId: string }> = ({ stationId }) => {
  const navigate = useNavigate();
  const env = getEnvironmentOverview(stationId);
  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/operations?tab=environment')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Polar Environment</span>
        {env.riskLevel === 'critical' && <Badge variant="rose" size="xs">BLIZZARD</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] font-mono text-slate-400">OUTSIDE TEMP</p>
          <p className="text-xl font-mono font-bold text-cyan-700">{env.temperatureC}°C</p>
          <p className="text-[10px] font-mono text-slate-400">Chill {env.windChillC}°C</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-slate-400">WIND</p>
          <p className="text-xl font-mono font-bold text-slate-800">{env.windKts} <span className="text-sm font-normal">kts</span></p>
          <p className="text-[10px] font-mono text-slate-400">{env.windDirLabel} · Gust {env.gustKts}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Barometer</span>
          <span className="text-slate-700">{env.pressureHpa} hPa {env.pressureTrend === 'falling' ? '▼' : '▲'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Visibility</span>
          <span className={env.visibilityKm < 0.1 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
            {env.visibilityKm < 0.1 ? '<50 m' : `${env.visibilityKm} km`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Solar</span>
          <span className="text-slate-700">{env.solarWm2} W/m²</span>
        </div>
      </div>
    </Card>
  );
};

// ─── LOGISTICS CARD ───────────────────────────────────────────────────────────
const LogisticsCard: React.FC<{ stationId: string }> = ({ stationId }) => {
  const navigate = useNavigate();
  const { demoState } = useUiStore();
  const logistics = getLogistics(stationId);
  const fuelItem = logistics.inventory.find((i) => i.category === 'fuel');
  const waterItem = logistics.inventory.find((i) => i.category === 'water');
  const foodItem = logistics.inventory.find((i) => i.itemName === 'Arctic Rations');
  const fuelDays = demoState.ecoModeActive
    ? logistics.fuelEnduranceDays + 6.8
    : logistics.fuelEnduranceDays;

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/operations?tab=logistics')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Logistics</span>
        <Badge variant={fuelDays < 21 ? 'amber' : 'emerald'} size="xs">
          {fuelDays < 21 ? 'REORDER' : 'ADEQUATE'}
        </Badge>
      </div>
      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-400">FUEL ENDURANCE</span>
            <span className={cn('font-bold', fuelDays < 21 ? 'text-amber-600' : 'text-emerald-600')}>{fuelDays.toFixed(1)} DAYS</span>
          </div>
          <ProgressBar value={fuelDays} max={60} variant={fuelDays < 21 ? 'amber' : 'emerald'} size="sm" />
          <div className="mt-1 flex items-center gap-1">
            <div className="text-[10px] font-mono text-slate-400">CRITICAL THRESHOLD</div>
            <div className="flex-1 h-px border-t-2 border-dashed border-amber-300" />
            <div className="text-[10px] font-mono text-amber-600">21 DAYS</div>
          </div>
        </div>
        {waterItem && (
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Water</span>
            <span className="text-emerald-600 font-bold">{Math.round((waterItem.quantity / 15000) * 100)}%</span>
          </div>
        )}
        {foodItem && (
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Food</span>
            <span className="text-slate-700">{foodItem.estimatedDaysRemaining} days</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">O₂</span>
          <span className="text-emerald-600">NOMINAL</span>
        </div>
        {demoState.ecoModeActive && (
          <Badge variant="emerald" size="xs">ECO-MODE ACTIVE +6.8 DAYS</Badge>
        )}
      </div>
    </Card>
  );
};

// ─── LIFE SUPPORT CARD ────────────────────────────────────────────────────────
const LifeSupportCard: React.FC = () => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Life Support & Habitat</span>
      <Badge variant="emerald" size="xs">NOMINAL</Badge>
    </div>
    <div className="space-y-2 text-xs font-mono">
      <div className="flex justify-between"><span className="text-slate-400">Cabin Pressure</span><span className="text-slate-700">101.3 kPa</span></div>
      <div className="flex justify-between"><span className="text-slate-400">CO₂</span><span className="text-emerald-600">410 ppm</span></div>
      <div className="flex justify-between"><span className="text-slate-400">Indoor Temp</span><span className="text-slate-700">+21.4°C</span></div>
      <div className="flex justify-between"><span className="text-slate-400">Air Exchange</span><span className="text-slate-700">4.2 ACH</span></div>
      <div className="flex justify-between"><span className="text-slate-400">Humidity</span><span className="text-slate-700">38%</span></div>
      <div className="flex justify-between"><span className="text-slate-400">O₂ Level</span><span className="text-emerald-600">20.9%</span></div>
    </div>
  </Card>
);

// ─── TWIN PREVIEW ─────────────────────────────────────────────────────────────
const TwinPreview: React.FC<{ stationId: string }> = ({ stationId }) => {
  const navigate = useNavigate();

  const modules = [
    { id: 'HAB-A1', label: 'Main Habitat', x: 20, y: 20, w: 130, h: 60, status: 'normal' },
    { id: 'GEN-02', label: 'PWR-GEN #02', x: 170, y: 20, w: 90, h: 60, status: 'critical', note: 'COEFF: 0.87 CRIT' },
    { id: 'LSS-01', label: 'Life Support', x: 20, y: 100, w: 110, h: 55, status: 'normal' },
    { id: 'LAB-01', label: 'Laboratory', x: 145, y: 100, w: 115, h: 55, status: 'normal' },
    { id: 'HVAC-02', label: 'Sec-B Hab', x: 20, y: 175, w: 110, h: 50, status: 'warning', note: 'FILTER HIGH ΔP' },
    { id: 'FUEL-01', label: 'Fuel Depot', x: 145, y: 175, w: 115, h: 50, status: 'warning' },
    { id: 'COM-01', label: 'Sat Dome', x: 275, y: 20, w: 80, h: 60, status: 'normal' },
  ];

  const statusColors: Record<string, string> = {
    normal: '#10B981', warning: '#F59E0B', critical: '#E11D48'
  };
  const statusFills: Record<string, string> = {
    normal: '#F0FDF4', warning: '#FFFBEB', critical: '#FFF1F2'
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Digital Twin Quick View</span>
          <div className="flex gap-2 mt-1">
            <Badge variant="slate" size="xs">5 Nominal</Badge>
            <Badge variant="amber" size="xs">1 Warning</Badge>
            <Badge variant="rose" size="xs">1 Anomaly</Badge>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate('/digital-twin')}>
          Launch Full 2D Twin →
        </Button>
      </div>

      <div className="relative bg-slate-50 rounded-xl overflow-hidden border border-slate-200" style={{ height: 260 }}>
        {/* Grid background */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <pattern id="dash-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dash-grid)" />
          {/* Power spine */}
          <line x1="215" y1="50" x2="215" y2="200" stroke="#0891B2" strokeWidth="2" strokeDasharray="6 3" opacity="0.5" />
          {/* Fault feedback */}
          <line x1="215" y1="50" x2="350" y2="50" stroke="#E11D48" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          {/* Modules */}
          {modules.map((m) => (
            <g key={m.id} onClick={() => navigate(`/digital-twin?asset=${m.id}`)} style={{ cursor: 'pointer' }}>
              <rect x={m.x} y={m.y} width={m.w} height={m.h} rx="6"
                fill={statusFills[m.status]}
                stroke={statusColors[m.status]}
                strokeWidth={m.status === 'critical' ? 2 : 1}
              />
              <text x={m.x + m.w / 2} y={m.y + m.h / 2 - 6} textAnchor="middle"
                style={{ fontFamily: 'Inter', fontSize: '10px', fontWeight: '600', fill: '#475569' }}>
                {m.label}
              </text>
              {m.status === 'critical' && (
                <text x={m.x + m.w / 2} y={m.y + m.h / 2 + 10} textAnchor="middle"
                  style={{ fontFamily: 'JetBrains Mono', fontSize: '8px', fill: '#E11D48', fontWeight: 'bold' }}>
                  {m.note || 'CRIT'}
                </text>
              )}
              {m.status === 'warning' && m.note && (
                <text x={m.x + m.w / 2} y={m.y + m.h / 2 + 10} textAnchor="middle"
                  style={{ fontFamily: 'JetBrains Mono', fontSize: '8px', fill: '#D97706', fontWeight: 'bold' }}>
                  {m.note}
                </text>
              )}
              {m.status === 'critical' && (
                <circle cx={m.x + m.w - 8} cy={m.y + 8} r="4" fill="#E11D48">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}
        </svg>

        {/* Footer stats */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex divide-x divide-slate-100 text-[10px] font-mono text-slate-500">
          <div className="px-3 py-1.5"><span className="text-slate-700 font-bold">99.1%</span> Hull Airtight</div>
          <div className="px-3 py-1.5"><span className="text-slate-700 font-bold">81%</span> Grid Load</div>
          <div className="px-3 py-1.5"><span className="text-rose-600 font-bold">0.87</span> Anomaly Idx</div>
          <div className="px-3 py-1.5"><span className="text-slate-700 font-bold">184</span> kg/m² Snow</div>
        </div>
      </div>
    </Card>
  );
};

// ─── ALERT SUMMARY ────────────────────────────────────────────────────────────
const AlertSummary: React.FC<{ stationId: string }> = ({ stationId }) => {
  const navigate = useNavigate();
  const { demoState, acknowledgeAlert, activateDeicing } = useUiStore();
  const [confirmIsolate, setConfirmIsolate] = useState(false);
  const { isolateGen2 } = useUiStore();
  const alerts = getAlerts(stationId).filter((a) => a.status === 'active' && !demoState.acknowledgedAlerts.has(a.id)).slice(0, 3);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Anomaly Alert Summary</span>
        <Badge variant="rose" size="xs">{alerts.length} UNRESOLVED</Badge>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className={cn(
            'rounded-lg p-3 border-l-4',
            alert.severity === 'critical' ? 'bg-rose-50 border-rose-500' : 'bg-amber-50 border-amber-400'
          )}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-[10px] font-mono font-bold', alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600')}>{alert.severity.toUpperCase()}</span>
                  <span className="text-[10px] font-mono text-slate-400">{alert.id}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-snug">{alert.title}</p>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              {alert.id === 'ALT-8821' && (
                <Button size="xs" variant="danger" onClick={() => setConfirmIsolate(true)}>ISOLATE UNIT</Button>
              )}
              {alert.id === 'ALT-8750' && (
                <Button size="xs" variant="outline" onClick={() => {
                  activateDeicing();
                  toast.success('De-icing sequence queued (simulated)', { icon: '❄️' });
                }}>DE-ICE LOUVER</Button>
              )}
              <Button size="xs" variant="ghost" onClick={() => navigate(`/alerts?id=${alert.id}`)}>View →</Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmIsolate}
        onClose={() => setConfirmIsolate(false)}
        onConfirm={() => {
          isolateGen2();
          toast.success('GEN-02 isolated. Load redistributed. (simulated)', { icon: '⚡' });
        }}
        title="Isolate Generator #02?"
        description="This will take GEN-02 offline and redistribute its 260 kW load. GEN-03 spin-up recommended."
        confirmLabel="ISOLATE"
        variant="danger"
      />
    </Card>
  );
};

// ─── MISSION INTERVENTIONS ────────────────────────────────────────────────────
const MissionInterventions: React.FC<{ stationId: string }> = ({ stationId }) => {
  const navigate = useNavigate();
  const { demoState, spinUpGen3, createTicket } = useUiStore();
  const [diagOpen, setDiagOpen] = useState(false);
  const [gen3Confirm, setGen3Confirm] = useState(false);
  const [emergencyFuelOpen, setEmergencyFuelOpen] = useState(false);

  const handleExportCSV = () => {
    const headers = ['timestamp', 'powerGenerated', 'powerConsumed', 'fuelLiters', 'batteryPct'];
    const data = generateEnergyHistory(stationId, 48);
    const csv = [
      headers.join(','),
      ...data.map((r) => `${r.timestamp},${r.powerGenerated},${r.powerConsumed},${r.fuelLiters},${r.batteryPct}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polar-telemetry-${stationId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Telemetry log exported');
  };

  return (
    <>
      <Card className="p-4">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-3">Mission Interventions</span>
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="secondary" size="sm" onClick={() => setDiagOpen(true)}>
            🔍 Run Station Diagnostic
          </Button>
          <Button className="w-full justify-start" variant="secondary" size="sm"
            onClick={() => { if (demoState.gen3Online) { toast('GEN-03 already online'); return; } setGen3Confirm(true); }}>
            ⚡ {demoState.gen3Online ? '✓ Gen #03 Online' : 'Switch to Generator #03'}
          </Button>
          <Button className="w-full justify-start" variant="secondary" size="sm"
            onClick={() => setEmergencyFuelOpen(true)}>
            ⛽ Emergency Fuel Protocol
          </Button>
          <Button className="w-full justify-start" variant="secondary" size="sm" onClick={handleExportCSV}>
            📊 Export Daily Telemetry Log
          </Button>
        </div>
      </Card>

      <DiagnosticModal open={diagOpen} onClose={() => setDiagOpen(false)} />
      <ConfirmDialog
        open={gen3Confirm}
        onClose={() => setGen3Confirm(false)}
        onConfirm={() => { spinUpGen3(); toast.success('GEN-03 spinning up → 210 kW online (simulated)', { icon: '⚡' }); }}
        title="Switch to Generator #03?"
        description="GEN-03 (Scania Tier-4 Emergency) will be brought online at 210 kW. Transfer micro-break ~42ms."
        confirmLabel="SPIN UP GEN-03"
      />
      <Modal open={emergencyFuelOpen} onClose={() => setEmergencyFuelOpen(false)} title="EMERGENCY FUEL PROTOCOL">
        <FeatureInProgress
          feature="Emergency Fuel Protocol"
          description="Emergency fuel protocol involves physical vault and manifold control systems. This requires direct SCADA integration and is not available in this prototype."
        />
        <Button variant="secondary" className="w-full mt-4 justify-center" onClick={() => setEmergencyFuelOpen(false)}>Close</Button>
      </Modal>
    </>
  );
};

// ─── LIVE TELEMETRY BUS ───────────────────────────────────────────────────────
const LiveTelemetryBus: React.FC = () => {
  const [values, setValues] = useState({
    voltage: 415.2, freq: 50.04, inverter: 98.1, jitter: 0.4, pm25: 12
  });

  useEffect(() => {
    const t = setInterval(() => {
      setValues((v) => ({
        voltage: +(v.voltage + (Math.random() - 0.5) * 0.4).toFixed(1),
        freq: +(v.freq + (Math.random() - 0.5) * 0.01).toFixed(3),
        inverter: +(v.inverter + (Math.random() - 0.5) * 0.2).toFixed(1),
        jitter: +(Math.max(0.1, v.jitter + (Math.random() - 0.5) * 0.1)).toFixed(2),
        pm25: Math.round(v.pm25 + (Math.random() - 0.5) * 0.5),
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const items = [
    { label: 'P-BUS', value: `${values.voltage}V` },
    { label: 'GRID FREQ', value: `${values.freq} Hz` },
    { label: 'INVERTER EFF', value: `${values.inverter}%` },
    { label: 'SAT JITTER', value: `${values.jitter}ms` },
    { label: 'HAB PM2.5', value: `${values.pm25} μg/m³` },
  ];

  return (
    <div className="mt-4 bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-2 overflow-x-auto">
      <span className="text-[10px] font-mono text-emerald-400 font-bold whitespace-nowrap">LIVE BUS ●</span>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <span className="text-slate-600">|</span>}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] font-mono text-slate-500">{item.label}</span>
            <span className="text-[11px] font-mono font-bold text-cyan-400">{item.value}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const { selectedStationId } = useStationStore();
  const station = STATIONS.find((s) => s.id === selectedStationId);
  const [syncing, setSyncing] = useState(false);
  const alertCounts = getAlertCounts(selectedStationId);

  const chartData = generateEnergyHistory(selectedStationId, 48);
  const chartPoints = chartData.filter((_, i) => i % 2 === 0).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    generated: r.powerGenerated,
    consumed: r.powerConsumed,
  }));

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); toast.success('Telemetry synchronized — 100 Hz OK'); }, 2200);
  };

  return (
    <div className="animate-fade-in">
      {/* Header strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="xs">ACTIVE COMMAND POST</Badge>
            <Badge variant="slate" size="xs">{selectedStationId === 'maitri' ? 'MAI-01' : 'BHR-02'}</Badge>
            {alertCounts.critical > 0 && <Badge variant="rose" size="xs">{alertCounts.critical} CRITICAL</Badge>}
          </div>
          <h1 className="text-xl font-bold text-slate-800">{station?.name}</h1>
          <p className="text-[11px] font-mono text-slate-500">
            {station ? formatDegrees(station.latitude, station.longitude) : ''} · {station?.elevationM}m ASL · {station?.region}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'px-3 py-1.5 rounded-lg border text-[10px] font-mono',
            syncing ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          )}>
            {syncing ? '⟳ SYNCING…' : 'STREAM: 100 Hz ●'}
          </div>
          <Button size="sm" variant="secondary" onClick={handleSync} loading={syncing}>
            FORCED SYNC
          </Button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Station health (4 cols) */}
        <div className="col-span-12 lg:col-span-4">
          <StationHealthCard stationId={selectedStationId} />
        </div>

        {/* 4 subsystem cards (8 cols, 2x2) */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
          <EnergySummaryCard stationId={selectedStationId} />
          <EnvironmentCard stationId={selectedStationId} />
          <LogisticsCard stationId={selectedStationId} />
          <LifeSupportCard />
        </div>
      </div>

      {/* Twin + Alerts + Interventions */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-12 xl:col-span-8">
          <TwinPreview stationId={selectedStationId} />
        </div>
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <AlertSummary stationId={selectedStationId} />
          <MissionInterventions stationId={selectedStationId} />
        </div>
      </div>

      {/* 24h Chart */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">24-HOUR STATION LOAD</h2>
            <p className="text-[11px] font-mono text-slate-400">Generation vs Consumption (kW)</p>
          </div>
          <Badge variant="slate" size="xs">DEMO DATA</Badge>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartPoints} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891B2" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} axisLine={false} unit=" kW" />
            <Tooltip
              contentStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', border: '1px solid #E2E8F0', borderRadius: 8 }}
              formatter={(val: any, name: any) => [`${val} kW`, name === 'generated' ? 'Generated' : 'Consumed']}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Inter' }} />
            <Area type="monotone" dataKey="generated" stroke="#0891B2" strokeWidth={2} fill="url(#genGrad)" name="Generated" />
            <Area type="monotone" dataKey="consumed" stroke="#F59E0B" strokeWidth={2} fill="url(#consGrad)" name="Consumed" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <LiveTelemetryBus />
    </div>
  );
};

export default DashboardPage;
