import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Zap,
  Activity,
  Search,
  Filter,
  Clock,
  ChevronRight,
  CheckSquare,
  Radio,
  FileCheck2,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { MAITRI_ALERTS } from '@/mock/alerts';
import type { Alert, Severity } from '@/types';
import { useStationStore } from '@/store/stationStore';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedStationId } = useStationStore();

  const [alerts, setAlerts] = useState<Alert[]>(MAITRI_ALERTS);
  const [activeSeverity, setActiveSeverity] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>(selectedStationId || 'all');
  const [subsystemFilter, setSubsystemFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'risk' | 'recency' | 'severity'>('risk');
  const [audioMuted, setAudioMuted] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklist, setChecklist] = useState({
    recall: true,
    vents: true,
    gen3Prewarm: true,
    satcomStow: false,
    galleyPowerShed: false,
  });

  const selectedAlertId = searchParams.get('id') || alerts[0]?.id;
  const selectedAlert = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId) || alerts[0],
    [alerts, selectedAlertId]
  );

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        if (activeSeverity !== 'all' && a.severity !== activeSeverity) return false;
        if (stationFilter !== 'all' && a.stationId !== stationFilter) return false;
        if (subsystemFilter !== 'all' && a.subsystem !== subsystemFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            a.id.toLowerCase().includes(q) ||
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            (a.assetId && a.assetId.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') return (b.riskScore ?? 0) - (a.riskScore ?? 0);
        if (sortBy === 'recency')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'severity') {
          const weights: Record<Severity, number> = { critical: 3, warning: 2, info: 1 };
          return weights[b.severity] - weights[a.severity];
        }
        return 0;
      });
  }, [alerts, activeSeverity, stationFilter, subsystemFilter, searchQuery, sortBy]);

  const counts = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length;
    const warning = alerts.filter((a) => a.severity === 'warning' && a.status === 'active').length;
    const info = alerts.filter((a) => a.severity === 'info' && a.status === 'active').length;
    return { total, critical, warning, info };
  }, [alerts]);

  const handleAcknowledge = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a))
    );
    toast.success(`Alert ${id} acknowledged`);
  };

  const handleMuteToggle = () => {
    setAudioMuted(!audioMuted);
    toast(audioMuted ? 'Audio harmonics telemetry unmuted' : 'Audio harmonics muted (59M remaining)');
  };

  const handleTransferLoad = (alert: Alert) => {
    toast.success(`Initiating automated load transfer from ${alert.assetId || 'Source'} to GEN-03`);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, status: 'acknowledged' } : a))
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ALERTS & ANOMALY TRIAGE</h1>
            <Badge variant="danger" className="font-mono text-xs">SEC-CON 1</Badge>
            <Badge variant="cyan" className="font-mono text-xs">TELEMETRY POLLING: 250ms</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Autonomous anomaly triage, IsolationForest predictive vectors, and operational mitigations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={audioMuted ? 'secondary' : 'default'}
            size="sm"
            onClick={handleMuteToggle}
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5" />}
            {audioMuted ? 'AUDIO MUTED (59M)' : 'MUTE HARMONICS'}
          </Button>
        </div>
      </div>

      {/* Severity Ribbon & Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveSeverity('all')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeSeverity === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">Total Active</div>
          <div className="text-xl font-bold font-mono">{counts.total}</div>
        </button>
        <button
          onClick={() => setActiveSeverity('critical')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeSeverity === 'critical'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">Critical / Surge</div>
          <div className="text-xl font-bold font-mono">{counts.critical}</div>
        </button>
        <button
          onClick={() => setActiveSeverity('warning')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeSeverity === 'warning'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">Warnings</div>
          <div className="text-xl font-bold font-mono">{counts.warning}</div>
        </button>
        <button
          onClick={() => setActiveSeverity('info')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeSeverity === 'info'
              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
              : 'bg-white text-cyan-600 border-cyan-200 hover:bg-cyan-50'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">Nominal / Info</div>
          <div className="text-xl font-bold font-mono">{counts.info}</div>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts by ID, asset, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Station Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-mono">
            {['all', 'maitri', 'bharati'].map((stn) => (
              <button
                key={stn}
                onClick={() => setStationFilter(stn)}
                className={`px-2.5 py-1 rounded-md uppercase transition-colors ${
                  stationFilter === stn
                    ? 'bg-white text-cyan-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {stn === 'all' ? 'All Stations' : stn}
              </button>
            ))}
          </div>

          {/* Subsystem Filter */}
          <select
            value={subsystemFilter}
            onChange={(e) => setSubsystemFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">ALL SUBSYSTEMS</option>
            <option value="energy">ENERGY & BUS</option>
            <option value="environment">ENVIRONMENT</option>
            <option value="logistics">LOGISTICS & FUEL</option>
            <option value="hvac">HVAC & CLIMATE</option>
            <option value="structural">STRUCTURAL</option>
            <option value="comms">SATCOM & COMMS</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="risk">SORT: RISK SCORE</option>
            <option value="recency">SORT: RECENCY</option>
            <option value="severity">SORT: SEVERITY</option>
          </select>
        </div>
      </div>

      {/* Main Alert Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Alert List (8 cols) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-3">
          {filteredAlerts.length === 0 ? (
            <Card className="p-8 text-center bg-slate-50 border-dashed">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">NO ACTIVE ALERTS</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                All monitored polar telemetry within configured threshold parameters.
              </p>
            </Card>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';
              const isAck = alert.status === 'acknowledged';

              return (
                <div
                  key={alert.id}
                  onClick={() => setSearchParams({ id: alert.id })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white ring-2 ring-cyan-500 shadow-md'
                      : 'bg-white hover:border-slate-300 shadow-xs'
                  } ${
                    isCrit
                      ? 'border-l-4 border-l-rose-500'
                      : isWarn
                      ? 'border-l-4 border-l-amber-500'
                      : 'border-l-4 border-l-cyan-500'
                  } ${isAck ? 'opacity-70 bg-slate-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{alert.id}</span>
                      <Badge
                        variant={isCrit ? 'danger' : isWarn ? 'warning' : 'cyan'}
                        className="text-[10px] uppercase font-mono"
                      >
                        {alert.severity}
                      </Badge>
                      {alert.assetId && (
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {alert.assetId}
                        </Badge>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {alert.stationId} • {alert.subsystem}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {alert.riskScore && (
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          RISK {alert.riskScore.toFixed(2)}
                        </span>
                      )}
                      {isAck && (
                        <Badge variant="secondary" className="text-[10px] font-mono text-slate-500">
                          ACKNOWLEDGED
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mt-2">{alert.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {alert.description}
                  </p>

                  {alert.recommendedAction && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-slate-700 font-mono leading-tight">
                        <strong>Prescription:</strong> {alert.recommendedAction}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-mono text-slate-400">
                      Source: {alert.source}
                    </span>

                    <div className="flex items-center gap-2">
                      {alert.id === 'ALT-8821' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransferLoad(alert);
                          }}
                          className="text-[11px] font-mono py-1 px-2.5 h-auto"
                        >
                          AUTO-TRANSFER LOAD
                        </Button>
                      )}

                      {alert.id === 'ALT-8819' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChecklistOpen(true);
                          }}
                          className="text-[11px] font-mono py-1 px-2.5 h-auto"
                        >
                          SAFETY CHECKLIST
                        </Button>
                      )}

                      {alert.assetId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/digital-twin?asset=${alert.assetId}`);
                          }}
                          className="text-[11px] font-mono py-1 px-2 h-auto flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3" />
                          TWIN LOCATOR
                        </Button>
                      )}

                      {!isAck && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => handleAcknowledge(alert.id, e)}
                          className="text-[11px] font-mono py-1 px-2.5 h-auto"
                        >
                          ACKNOWLEDGE
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Deep Dive Panel (4 cols) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          {selectedAlert ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-20 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    TELEMETRY DEEP DIVE
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {selectedAlert.id} // {selectedAlert.assetId || 'STATION-WIDE'}
                  </div>
                </div>
                <Badge
                  variant={
                    selectedAlert.severity === 'critical'
                      ? 'danger'
                      : selectedAlert.severity === 'warning'
                      ? 'warning'
                      : 'cyan'
                  }
                  className="font-mono text-xs uppercase"
                >
                  {selectedAlert.severity}
                </Badge>
              </div>

              {/* Anomaly Gauge */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-slate-600">ML INFERENCE CONFIDENCE</span>
                  <span className="text-xs font-mono font-bold text-rose-600">
                    {((selectedAlert.riskScore || 0.85) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(selectedAlert.riskScore || 0.85) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                  <span>MODEL: ISOLATION-FOREST-V4</span>
                  <span>P-VAL &lt; 0.001</span>
                </div>
              </div>

              {/* Metrics / Diagnostics */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                  Diagnostic Envelope
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400">EST. TIME TO FAILURE</div>
                    <div className="text-sm font-bold text-rose-600">01h 42m</div>
                    <div className="text-[10px] text-slate-400">ACCELERATING</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400">RECURRENCE RATE</div>
                    <div className="text-sm font-bold text-slate-800">3.4%</div>
                    <div className="text-[10px] text-slate-400">2 IN 180 DAYS</div>
                  </div>
                </div>
              </div>

              {/* Audit Trail Timeline */}
              {selectedAlert.events && selectedAlert.events.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                    Telemetry & Audit Trail
                  </div>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1">
                    {selectedAlert.events.map((evt) => (
                      <div key={evt.id} className="text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                          <span className="font-bold text-slate-700">{evt.label}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{evt.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {selectedAlert.assetId === 'GEN-02' && (
                  <Button
                    variant="danger"
                    className="w-full font-mono text-xs flex items-center justify-center gap-2"
                    onClick={() => {
                      toast.success('Bus switch command dispatched. Micro-break duration ~42ms.');
                      handleAcknowledge(selectedAlert.id);
                    }}
                  >
                    COMMIT BUS SWITCH TO GEN #03 NOW
                  </Button>
                )}

                <Button
                  variant="primary"
                  className="w-full font-mono text-xs flex items-center justify-center gap-2"
                  onClick={() =>
                    navigate(
                      `/simulation?asset=${selectedAlert.assetId || 'GEN-02'}&scenario=A`
                    )
                  }
                >
                  <Activity className="w-3.5 h-3.5" />
                  RUN WHAT-IF SIMULATION
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-6 text-center text-slate-400 font-mono text-xs">
              Select an alert from the feed to inspect diagnostics
            </Card>
          )}
        </div>
      </div>

      {/* Safety Checklist Modal */}
      {checklistOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">POLAR STORM SAFETY CHECKLIST</h3>
              </div>
              <button
                onClick={() => setChecklistOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-mono">
              Mandatory protocol steps for Category 4 Polar Gale (&gt;65 kts).
            </p>

            <div className="space-y-2 text-xs">
              {Object.entries({
                recall: 'Recall all exterior EVA & research personnel to Main Habitat',
                vents: 'Seal exterior air intakes & activate recirculated scrubber mode',
                gen3Prewarm: 'Ensure Generator #03 jacket heater maintains 45°C ready state',
                satcomStow: 'Lock SATCOM dish into storm horizon aerodynamic park profile',
                galleyPowerShed: 'Pre-arm load shedding Stage 1 on Tier 4/5 galley & lab circuits',
              }).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={(checklist as any)[key]}
                    onChange={() =>
                      setChecklist((prev) => ({
                        ...prev,
                        [key]: !(prev as any)[key],
                      }))
                    }
                    className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-slate-700 font-sans leading-tight">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button size="sm" variant="secondary" onClick={() => setChecklistOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  toast.success('Storm protocol verified & logged in expedition telemetry journal.');
                  setChecklistOpen(false);
                }}
              >
                Confirm Protocol
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
