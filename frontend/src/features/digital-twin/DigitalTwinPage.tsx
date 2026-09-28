import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStationStore } from '@/store/stationStore';
import { useUiStore } from '@/store/uiStore';
import { getAssets, MAITRI_ASSETS } from '@/mock/assets';
import type { Asset } from '@/types';
import {
  Card, Badge, StatusBadge, StatusDot, ProgressBar, Button, FeatureInProgress, ConfirmDialog
} from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { cn } from '@/utils/severity';
import { formatTimeAgo } from '@/utils/format';
import toast from 'react-hot-toast';

// Generate 72h efficiency/fuel drift chart data for an asset
function generateAssetHistory(assetId: string) {
  const isGen02 = assetId === 'GEN-02';
  const points = [];
  for (let i = 72; i >= 0; i -= 2) {
    const t = new Date(Date.now() - i * 3600000);
    const progress = (72 - i) / 72;
    points.push({
      time: t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      efficiency: isGen02 ? Math.round(88 - progress * 12 + (Math.random() - 0.5) * 1.5) : 91 + (Math.random() - 0.5) * 2,
      fuelBurn: isGen02 ? Math.round(650 + progress * 170 + (Math.random() - 0.5) * 15) : 400 + (Math.random() - 0.5) * 20,
    });
  }
  return points;
}

// ─── ASSET DETAILS PANEL ─────────────────────────────────────────────────────
const AssetDetailsPanel: React.FC<{ asset: Asset; onClose: () => void }> = ({ asset, onClose }) => {
  const navigate = useNavigate();
  const { demoState, isolateGen2, spinUpGen3, createTicket } = useUiStore();
  const { selectedStationId } = useStationStore();
  const [transferConfirm, setTransferConfirm] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);
  const historyData = generateAssetHistory(asset.id);

  const isGen02 = asset.id === 'GEN-02';
  const isGen03 = asset.id === 'GEN-03';
  const isIsolated = demoState.gen2Isolated && isGen02;

  const handleDispatchTicket = () => {
    const ticket = createTicket(asset.id, `Maintenance Inspection — ${asset.name}`, selectedStationId);
    setTicketCreated(ticket.id);
    toast.success(`${ticket.id} created successfully (simulated)`, { icon: '🔧' });
  };

  const handleOverrideAlarm = () => {
    toast.success('Alarm silenced for 15 minutes (simulated)', { icon: '🔕' });
  };

  const anomalyScore = asset.anomalyScore ?? 0;
  const riskColor = anomalyScore > 0.8 ? 'text-rose-600' : anomalyScore > 0.5 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="h-full flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-100">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isGen02 && <Badge variant="rose" size="xs">CRIT-INSPECT</Badge>}
            <Badge variant="slate" size="xs">{asset.id}</Badge>
            <StatusBadge status={isIsolated ? 'maintenance' : asset.status} />
          </div>
          <h2 className="font-bold text-slate-800 text-sm">{asset.name}</h2>
          <p className="text-[11px] font-mono text-slate-400">{asset.module}</p>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 ml-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Anomaly Risk Engine */}
        {anomalyScore > 0 && (
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-rose-600 uppercase tracking-wider font-semibold">Anomaly Risk Engine</span>
              <span className={cn('text-2xl font-mono font-bold', riskColor)}>{anomalyScore.toFixed(2)}</span>
            </div>
            <div className="w-full bg-rose-100 rounded-full h-2 mb-2">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${anomalyScore * 100}%` }} />
            </div>
            <p className="text-[10px] font-mono text-rose-500">MODEL: ISOLATION-FOREST-V4 · P-VAL &lt;0.001 · CONF 94.2%</p>
            {isGen02 && (
              <p className="text-[10px] font-mono text-rose-700 mt-1 font-semibold">
                EST. TIME TO FAILURE: 01h 42m ACCELERATING
              </p>
            )}
          </div>
        )}

        {/* Critical Parameter Matrix */}
        <div>
          <h3 className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">Critical Parameter Matrix</h3>
          <div className="space-y-3">
            {asset.metrics.map((metric) => (
              <div key={metric.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{metric.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-sm font-mono font-bold',
                      metric.status === 'critical' ? 'text-rose-600' :
                      metric.status === 'warning' ? 'text-amber-600' : 'text-slate-800'
                    )}>
                      {metric.value}{metric.unit ? ` ${metric.unit}` : ''}
                    </span>
                    {metric.status && metric.status !== 'normal' && <StatusBadge status={metric.status} />}
                  </div>
                </div>
                {typeof metric.value === 'number' && metric.threshold !== undefined && (
                  <div className="relative">
                    <ProgressBar
                      value={metric.threshold > 0 ? metric.value : Math.abs(metric.value)}
                      max={metric.threshold > 0 ? metric.threshold * 1.2 : 100}
                      variant={metric.status === 'critical' ? 'rose' : metric.status === 'warning' ? 'amber' : 'emerald'}
                      size="sm"
                    />
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
                      Threshold: {metric.threshold}{metric.unit}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 72h Efficiency drift chart */}
        {(isGen02 || asset.type === 'generator') && (
          <div>
            <h3 className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">Efficiency & Fuel Drift (72h)</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={historyData} margin={{ top: 2, right: 2, bottom: 2, left: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} interval={8} />
                <YAxis yAxisId="l" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', border: '1px solid #E2E8F0', borderRadius: 6 }}
                  formatter={(v: any, name: any) => [name === 'efficiency' ? `${v}%` : `${v} L/day`, name]}
                />
                <Line yAxisId="l" type="monotone" dataKey="efficiency" stroke="#0891B2" strokeWidth={2} dot={false} name="Efficiency %" />
                <Line yAxisId="r" type="monotone" dataKey="fuelBurn" stroke="#E11D48" strokeWidth={1.5} dot={false} name="Fuel Burn L/day" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h3 className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">Recommended Actions // AI Risk Engine</h3>
          <div className="space-y-1.5">
            {asset.recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex gap-2 p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-mono font-bold text-cyan-600 flex-shrink-0">{i + 1}.</span>
                <p className="text-xs text-slate-600">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket banner */}
        {ticketCreated && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs font-mono text-emerald-700 font-bold">{ticketCreated}</p>
            <p className="text-[10px] text-emerald-600">Maintenance ticket created (simulated)</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        {isGen02 && !isIsolated && (
          <Button variant="primary" className="w-full justify-center" size="sm"
            onClick={() => setTransferConfirm(true)}>
            Transfer Load to Gen #03
          </Button>
        )}
        {isIsolated && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs font-mono text-amber-700 text-center">
            GEN-02 ISOLATED — Load on GEN-01 + GEN-03
          </div>
        )}
        {isGen03 && (
          <Button variant="primary" className="w-full justify-center" size="sm"
            onClick={() => { spinUpGen3(); toast.success('GEN-03 spinning up to 210 kW (simulated)', { icon: '⚡' }); }}>
            SPIN UP GEN-03
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1 justify-center" onClick={handleDispatchTicket}>
            Dispatch Ticket
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={handleOverrideAlarm}>
            Override Alarm
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={() => {}}>
            View History
          </Button>
          <Button variant="outline" size="sm" className="flex-1 justify-center"
            onClick={() => navigate(`/simulation?asset=${asset.id}&scenario=A`)}>
            Run What-If →
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={transferConfirm}
        onClose={() => setTransferConfirm(false)}
        onConfirm={() => {
          isolateGen2();
          spinUpGen3();
          toast.success('Load transferred to GEN-03. GEN-02 isolated. (simulated)', { icon: '✅' });
        }}
        title="Transfer Load to Gen #03?"
        description="GEN-02 will be isolated and load transferred to GEN-03 (210 kW). Estimated transfer micro-break: 42ms."
        confirmLabel="COMMIT TRANSFER"
      />
    </div>
  );
};

// ─── TWIN CANVAS ─────────────────────────────────────────────────────────────
const FILTER_TYPES: Record<string, string[]> = {
  all: [],
  power: ['generator', 'substation', 'fuel'],
  'life-support': ['hvac', 'water', 'storage'],
  research: ['laboratory'],
  storage: ['storage', 'fuel'],
  critical: [], // computed
};

const TwinCanvas: React.FC<{
  stationId: string;
  selectedAsset: Asset | null;
  onSelect: (asset: Asset) => void;
  filter: string;
  layers: Record<string, boolean>;
}> = ({ stationId, selectedAsset, onSelect, filter, layers }) => {
  const { demoState } = useUiStore();
  const assets = getAssets(stationId);
  const [zoom, setZoom] = useState(1);

  const getStatus = (asset: Asset) => {
    if (asset.id === 'GEN-02' && demoState.gen2Isolated) return 'maintenance';
    if (asset.id === 'GEN-03' && demoState.gen3Online) return 'normal';
    return asset.status;
  };

  const isVisible = (asset: Asset) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return getStatus(asset) === 'critical' || getStatus(asset) === 'warning';
    const types = FILTER_TYPES[filter] || [];
    return types.includes(asset.type);
  };

  const statusFill: Record<string, string> = {
    normal: '#F0FDF4', warning: '#FFFBEB', critical: '#FFF1F2', maintenance: '#F0F9FF', offline: '#F8FAFC'
  };
  const statusStroke: Record<string, string> = {
    normal: '#10B981', warning: '#F59E0B', critical: '#E11D48', maintenance: '#0EA5E9', offline: '#94A3B8'
  };

  const viewBox = stationId === 'maitri' ? '0 0 800 400' : '0 0 800 400';

  return (
    <div className="relative bg-blue-50/30 rounded-xl overflow-hidden border border-slate-200" style={{ minHeight: 480 }}>
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button onClick={() => setZoom(Math.min(2, zoom + 0.2))}
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 text-sm font-bold shadow-sm">
          +
        </button>
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 text-sm font-bold shadow-sm">
          −
        </button>
        <button onClick={() => setZoom(1)}
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xs shadow-sm">
          ↺
        </button>
      </div>

      {/* Header overlay */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">ORTHOGRAPHIC BLUEPRINT // DECK-1</p>
          <p className="text-[9px] font-mono text-slate-400">SCALE 1:125 METRIC · {stationId.toUpperCase()} SCHEMATIC</p>
        </div>
      </div>

      <svg
        viewBox={viewBox}
        width="100%"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease', minHeight: 480 }}
      >
        <defs>
          <pattern id="twin-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(8,145,178,0.12)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#twin-grid)" />

        {/* Conduit lines */}
        {layers.energy && (
          <>
            <line x1="580" y1="70" x2="500" y2="130" stroke="#0891B2" strokeWidth="2" strokeDasharray="8 4" opacity="0.6">
              <animate attributeName="stroke-dashoffset" values="24;0" dur="1s" repeatCount="indefinite" />
            </line>
            <line x1="580" y1="160" x2="500" y2="130" stroke="#E11D48" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5">
              <animate attributeName="stroke-dashoffset" values="20;0" dur="0.8s" repeatCount="indefinite" />
            </line>
            <line x1="500" y1="130" x2="100" y2="130" stroke="#0891B2" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.4">
              <animate attributeName="stroke-dashoffset" values="24;0" dur="1.2s" repeatCount="indefinite" />
            </line>
          </>
        )}
        {layers.hvac && (
          <line x1="280" y1="200" x2="280" y2="280" stroke="#10B981" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.5" />
        )}

        {/* Assets */}
        {assets.map((asset) => {
          const visible = isVisible(asset);
          const status = getStatus(asset);
          const isSelected = selectedAsset?.id === asset.id;
          const { x, y, w = 100, h = 70 } = asset.location;

          return (
            <g
              key={asset.id}
              onClick={() => onSelect(asset)}
              style={{ cursor: 'pointer', opacity: visible ? 1 : 0.25, filter: visible ? 'none' : 'grayscale(1)' }}
            >
              <rect
                x={x} y={y} width={w} height={h} rx="8"
                fill={statusFill[status] || '#F8FAFC'}
                stroke={isSelected ? '#0891B2' : statusStroke[status] || '#94A3B8'}
                strokeWidth={isSelected ? 3 : status === 'critical' ? 2 : 1}
              />
              {/* Selection glow */}
              {isSelected && (
                <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="11"
                  fill="none" stroke="#0891B2" strokeWidth="1.5" opacity="0.4" />
              )}
              {/* Module name */}
              <text x={x + w / 2} y={y + h / 2 - 8} textAnchor="middle"
                style={{ fontFamily: 'Inter', fontSize: '9px', fontWeight: '700', fill: '#334155' }}>
                {asset.name.split(' ').slice(0, 3).join(' ')}
              </text>
              <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '8px', fill: statusStroke[status] || '#64748B', fontWeight: '600' }}>
                {status.toUpperCase()}
              </text>
              <text x={x + w / 2} y={y + h / 2 + 17} textAnchor="middle"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '7px', fill: '#94A3B8' }}>
                {asset.id}
              </text>
              {/* Status indicator dot */}
              <circle cx={x + w - 8} cy={y + 8} r="4" fill={statusStroke[status] || '#94A3B8'}>
                {status === 'critical' && (
                  <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
                )}
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2">
        <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500">
          {[
            { color: '#10B981', label: 'NOMINAL' },
            { color: '#F59E0B', label: 'WARNING' },
            { color: '#E11D48', label: 'CRITICAL' },
            { color: '#0EA5E9', label: 'MAINTENANCE' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── DIGITAL TWIN PAGE ────────────────────────────────────────────────────────
const DigitalTwinPage: React.FC = () => {
  const { selectedStationId } = useStationStore();
  const { demoState } = useUiStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const assetParam = searchParams.get('asset');
  const assets = getAssets(selectedStationId);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(
    assetParam ? assets.find((a) => a.id === assetParam) ?? assets.find((a) => a.id === 'GEN-02') ?? null : assets.find((a) => a.id === 'GEN-02') ?? null
  );
  const [filter, setFilter] = useState('all');
  const [layers, setLayers] = useState({
    infrastructure: true, energy: true, environment: true, logistics: true, alerts: true, hvac: true
  });
  const [showLayerControl, setShowLayerControl] = useState(false);

  useEffect(() => {
    if (assetParam) {
      const found = assets.find((a) => a.id === assetParam);
      if (found) setSelectedAsset(found);
    }
  }, [assetParam]);

  const FILTERS = [
    { id: 'all', label: 'All Modules' },
    { id: 'power', label: 'Power' },
    { id: 'life-support', label: 'Life Support' },
    { id: 'research', label: 'Research' },
    { id: 'storage', label: 'Storage' },
    { id: 'critical', label: 'Critical Paths' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Station Digital Twin & Schematic HUD — ${selectedStationId === 'maitri' ? 'MAITRI' : 'BHARATI'}`}
        badges={[
          { label: 'SEC-7A', variant: 'slate' },
          { label: 'CAD-REF: MTR-SCHEMATIC-V8.42', variant: 'slate' },
          { label: 'LIVE TELEMETRY STREAM', variant: 'cyan' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <FeatureInProgress feature="3D VIEW" compact />
          </div>
        }
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              filter === f.id
                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Button size="sm" variant="secondary" onClick={() => setShowLayerControl(!showLayerControl)}>
            Layers ▾
          </Button>
          {showLayerControl && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-20 min-w-[160px]">
              {Object.entries(layers).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={(e) => setLayers((l) => ({ ...l, [key]: e.target.checked }))}
                    className="rounded text-cyan-600" />
                  <span className="text-xs font-mono capitalize text-slate-600">{key}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Canvas */}
        <div className={cn('col-span-12', selectedAsset ? 'xl:col-span-8' : 'xl:col-span-12')}>
          <TwinCanvas
            stationId={selectedStationId}
            selectedAsset={selectedAsset}
            onSelect={setSelectedAsset}
            filter={filter}
            layers={layers}
          />

          {/* Bottom summary */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <Card className="p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 mb-1">HABITAT TEMP</p>
              <p className="text-lg font-mono font-bold text-slate-800">+21.4°C</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 mb-1">SECTOR DEMAND</p>
              <p className="text-lg font-mono font-bold text-slate-800">705 kW</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 mb-1">GRID LOAD</p>
              <p className={cn('text-lg font-mono font-bold', demoState.gen2Isolated ? 'text-amber-600' : 'text-slate-800')}>
                {demoState.gen2Isolated ? '92%' : '81%'}
              </p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] font-mono text-slate-400 mb-1">ANOMALY INDEX</p>
              <p className="text-lg font-mono font-bold text-rose-600">RISK 0.87</p>
            </Card>
          </div>
        </div>

        {/* Asset details panel */}
        {selectedAsset && (
          <div className="col-span-12 xl:col-span-4">
            <Card className="h-full">
              <AssetDetailsPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalTwinPage;
