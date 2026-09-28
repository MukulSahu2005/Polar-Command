import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStationStore } from '@/store/stationStore';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { STATIONS } from '@/mock/stations';
import { getAlertCounts } from '@/mock/alerts';
import { getEnergyOverview } from '@/mock/energy';
import { getEnvironmentOverview } from '@/mock/environment';
import { Badge, StatusDot, Button, Modal, FeatureInProgress } from '@/components/ui';
import { cn } from '@/utils/severity';
import { formatDegrees, windKtsToLabel } from '@/utils/format';
import toast from 'react-hot-toast';

// ─── TOPBAR ──────────────────────────────────────────────────────────────────
export const Topbar: React.FC = () => {
  const { selectedStationId, setSelectedStation } = useStationStore();
  const { demoState, setAudioMuted } = useUiStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [utcTime, setUtcTime] = useState(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [lockoutOpen, setLockoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const env = getEnvironmentOverview(selectedStationId);
  const isBlizzard = env.windKts >= 40;

  const handleStationChange = (id: string) => {
    setSelectedStation(id);
    const station = STATIONS.find((s) => s.id === id);
    toast.success(`Station changed to ${station?.name}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 gap-4 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.71.71m12.73 12.73l.71.71M3 12h1m16 0h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800 text-sm tracking-wider">POLAR COMMAND</span>
              <Badge variant="slate" size="xs">v4.2-EXP</Badge>
            </div>
            <p className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">Antarctic Research Telemetry Network</p>
          </div>
        </div>

        {/* Station selector - center */}
        <div className="flex-1 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            {STATIONS.map((station) => (
              <button
                key={station.id}
                onClick={() => handleStationChange(station.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  selectedStationId === station.id
                    ? 'bg-white text-cyan-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                )}
              >
                <StatusDot status={station.status === 'operational' ? 'normal' : station.status === 'warning' ? 'warning' : 'critical'} />
                <span className="font-mono">[{station.code}]</span>
                <span className="hidden lg:inline">{station.name}</span>
              </button>
            ))}
          </div>

          {/* Quick weather strip */}
          <div className="hidden xl:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-slate-400 text-[10px]">OAT</span>
              <span className="font-bold text-slate-800">{env.temperatureC}°C</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-slate-400 text-[10px]">WIND</span>
              <span className="font-bold text-slate-800">{env.windKts} kts</span>
              <span className="text-slate-400 text-[10px]">{env.windDirLabel}</span>
              {isBlizzard && <Badge variant="rose" size="xs">BLIZZARD</Badge>}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 min-w-fit">
          {/* SATCOM + Clock */}
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>SATCOM LINK 99.8%</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">
              {utcTime.toUTCString().slice(17, 25)} UTC
            </span>
          </div>

          {/* Demo badge */}
          <Badge variant="amber">DEMO TELEMETRY</Badge>

          {/* Audio toggle */}
          <button
            onClick={() => {
              const newVal = !demoState.audioMuted;
              setAudioMuted(newVal);
              toast.success(newVal ? 'Audio alerts muted' : 'Audio alerts enabled');
            }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border',
              demoState.audioMuted
                ? 'bg-slate-100 text-slate-500 border-slate-200'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            )}
            title={demoState.audioMuted ? 'Enable audio' : 'Mute audio'}
          >
            {demoState.audioMuted ? '🔇' : '🔊'}
            <span className="hidden sm:inline">{demoState.audioMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>

          {/* Lockout button */}
          <button
            onClick={() => setLockoutOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            LOCKOUT
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.initials || 'AS'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-none">{user?.fullName || 'Cmdr. Dr. A. Sharma'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{user?.expedition || 'Expedition 44'}</p>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                <button
                  className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={() => { setSettingsOpen(true); setUserMenuOpen(false); }}
                >
                  Settings
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Lockout Modal */}
      <Modal open={lockoutOpen} onClose={() => setLockoutOpen(false)} title="STATION LOCKOUT PROTOCOL" size="sm">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <p className="text-sm text-slate-600">Station lockout broadcast is simulated in this prototype. Physical lockout requires direct SCADA integration.</p>
          <FeatureInProgress feature="Station Lockout Broadcast" compact />
          <Button variant="secondary" className="w-full" onClick={() => setLockoutOpen(false)}>Close</Button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="SETTINGS" size="md">
        <FeatureInProgress feature="Settings" description="Advanced settings panel is planned for a future release. Audio and theme preferences are available in the topbar." />
      </Modal>
    </>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
export const Sidebar: React.FC = () => {
  const { selectedStationId } = useStationStore();
  const { sidebarCollapsed, setSidebarCollapsed } = useUiStore();
  const alertCounts = getAlertCounts(selectedStationId);
  const energy = getEnergyOverview(selectedStationId);
  const [opsExpanded, setOpsExpanded] = useState(true);

  const navItem = (to: string, label: string, icon: React.ReactNode, badge?: number) => (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
        isActive
          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!sidebarCollapsed && (
        <>
          <span className="flex-1 text-xs tracking-wide">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside className={cn(
      'fixed top-16 left-0 bottom-10 z-30 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 overflow-hidden',
      sidebarCollapsed ? 'w-14' : 'w-56'
    )}>
      {!sidebarCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Mission Navigation</p>
          <p className="text-[9px] font-mono text-slate-300 tracking-widest">STN-SYS</p>
        </div>
      )}

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {navItem('/dashboard', 'Dashboard', (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        ))}

        {navItem('/digital-twin', 'Digital Twin', (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
          </svg>
        ))}

        {/* Operations expandable */}
        <div>
          <button
            onClick={() => setOpsExpanded(!opsExpanded)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-xs tracking-wide">Operations</span>
                <svg className={cn('w-3.5 h-3.5 transition-transform', opsExpanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
          {opsExpanded && !sidebarCollapsed && (
            <div className="ml-7 mt-1 space-y-0.5">
              <NavLink to="/operations?tab=energy" className={({ isActive }) => cn('block px-3 py-1.5 text-xs rounded-lg transition-colors', isActive ? 'text-cyan-700 bg-cyan-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
                ⚡ Energy & Power
              </NavLink>
              <NavLink to="/operations?tab=environment" className={({ isActive }) => cn('block px-3 py-1.5 text-xs rounded-lg transition-colors', isActive ? 'text-cyan-700 bg-cyan-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
                🌡️ Environment
              </NavLink>
              <NavLink to="/operations?tab=logistics" className={({ isActive }) => cn('block px-3 py-1.5 text-xs rounded-lg transition-colors', isActive ? 'text-cyan-700 bg-cyan-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
                📦 Logistics
              </NavLink>
            </div>
          )}
        </div>

        {navItem('/alerts', 'Alerts & Anomalies', (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        ), alertCounts.total)}

        {navItem('/simulation', 'What-If Simulation', (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .27 2.8-1.11 2.8H4.908c-1.38 0-2.112-1.8-1.11-2.8L5 14.5" />
          </svg>
        ))}
      </nav>

      {/* Primary Array widget */}
      {!sidebarCollapsed && (
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Primary Array</span>
              <span className="text-[9px] font-mono text-emerald-600 font-bold">ONLINE</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (energy.consumptionKw / energy.totalGenerationKw) * 100)}%` }} />
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              <div>PWR DRAW {energy.consumptionKw} kW</div>
              <div className="text-[9px] text-slate-400 mt-0.5">RADAR SWEEP 100km ACTIVE</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Collapse
          </button>
        </div>
      )}

      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="px-2 py-3 flex items-center justify-center text-slate-400 hover:text-slate-600 border-t border-slate-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}
    </aside>
  );
};

// ─── BOTTOM STATUS BAR ────────────────────────────────────────────────────────
export const BottomStatusBar: React.FC = () => {
  const { selectedStationId } = useStationStore();
  const { demoState } = useUiStore();
  const alertCounts = getAlertCounts(selectedStationId);
  const energy = getEnergyOverview(selectedStationId);
  const logistics = useStationStore();
  const [lastSync] = useState(new Date());

  const gen2Output = demoState.gen2Isolated ? 0 : demoState.gen2Throttled ? 208 : 260;
  const gen3Output = demoState.gen3Online ? 210 : 0;
  const totalGen = demoState.gen2Isolated || demoState.gen2Throttled || demoState.gen3Online
    ? (energy.totalGenerationKw - 260 + gen2Output + gen3Output)
    : energy.totalGenerationKw;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-slate-800 text-slate-300 flex items-center px-4 gap-6 text-[10px] font-mono z-30 border-t border-slate-700">
      <div className="flex items-center gap-4">
        {alertCounts.critical > 0 && (
          <span className="flex items-center gap-1 text-rose-400 status-dot-critical">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
            {alertCounts.critical} CRITICAL
          </span>
        )}
        {alertCounts.warning > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
            {alertCounts.warning} WARNINGS
          </span>
        )}
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          {alertCounts.info} NOMINAL
        </span>
      </div>

      <div className="h-4 w-px bg-slate-600" />

      <div className="flex items-center gap-4 text-slate-400">
        <span>SATCOM PING 32ms</span>
        <span>GRID LOAD {Math.round((energy.consumptionKw / totalGen) * 100)}%</span>
        <span>FUEL {selectedStationId === 'maitri' ? '17.2' : '24.1'} DAYS</span>
        <span>GRID FREQ 50.04 Hz</span>
      </div>

      <div className="ml-auto text-emerald-400">
        ALL TELEMETRY SYNCHRONIZED
      </div>
    </div>
  );
};

// ─── APP SHELL ────────────────────────────────────────────────────────────────
interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />
      <Sidebar />
      <BottomStatusBar />
      <main className={cn(
        'pt-16 pb-10 min-h-screen transition-all duration-200',
        sidebarCollapsed ? 'pl-14' : 'pl-56'
      )}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// ─── PROTECTED ROUTE ─────────────────────────────────────────────────────────
import { Navigate } from 'react-router-dom';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── PAGE HEADER ─────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badges?: { label: string; variant?: 'cyan' | 'slate' | 'amber' | 'rose' | 'emerald' }[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badges, actions }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {badges?.map((b, i) => (
          <Badge key={i} variant={b.variant || 'slate'} size="xs">{b.label}</Badge>
        ))}
      </div>
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5 font-mono">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
  </div>
);

// ─── CONNECTION BANNER ────────────────────────────────────────────────────────
export const ConnectionBanner: React.FC<{ visible: boolean; onRetry?: () => void }> = ({ visible, onRetry }) => {
  if (!visible) return null;
  return (
    <div className="fixed top-16 left-0 right-0 z-35 bg-amber-500 text-white text-xs font-semibold py-2 px-4 flex items-center justify-between">
      <span>⚠️ CONNECTION DEGRADED — showing latest available station data.</span>
      {onRetry && <button onClick={onRetry} className="underline ml-4">Retry</button>}
    </div>
  );
};
