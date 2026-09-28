import React from 'react';
import { cn } from '@/utils/severity';

// ─── BUTTON ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'cyan' | 'warning' | 'default';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props
}) => {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary: 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm',
    cyan: 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm',
    default: 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
    outline: 'border border-cyan-600 text-cyan-700 hover:bg-cyan-50 active:bg-cyan-100',
  };
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
};

// ─── ICON BUTTON ─────────────────────────────────────────────────────────────
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'primary';
}

export const IconButton: React.FC<IconButtonProps> = ({ label, size = 'md', variant = 'ghost', className, children, ...props }) => {
  const sizes = { sm: 'p-1.5', md: 'p-2', lg: 'p-2.5' };
  const variants = {
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    outline: 'border border-slate-200 text-slate-600 hover:bg-slate-50',
    primary: 'text-cyan-600 hover:bg-cyan-50',
  };
  return (
    <button
      aria-label={label}
      className={cn('rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500', sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

// ─── CARD ─────────────────────────────────────────────────────────────────────
interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, onClick, hover }) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200 bg-white shadow-sm',
      hover && 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-150',
      className
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── BADGE ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'sky' | 'violet' | 'danger' | 'warning' | 'secondary' | 'critical';
  size?: 'xs' | 'sm';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    sky: 'bg-sky-100 text-sky-800 border-sky-200',
    violet: 'bg-violet-100 text-violet-800 border-violet-200',
  };
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-[11px]',
  };
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-mono font-semibold tracking-wider uppercase',
      variants[variant], sizes[size], className
    )}>
      {children}
    </span>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
import type { Status, Severity } from '@/types';
import { statusToBgClass, statusToLabel, severityToBgClass } from '@/utils/severity';

interface StatusBadgeProps {
  status?: Status;
  severity?: Severity;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, severity, className }) => {
  const bgClass = status ? statusToBgClass(status) : severity ? severityToBgClass(severity) : '';
  const label = status ? statusToLabel(status) : severity ? severity.toUpperCase() : '';
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-mono font-semibold tracking-wider uppercase',
      bgClass, className
    )}>
      {label}
    </span>
  );
};

// ─── STATUS DOT ──────────────────────────────────────────────────────────────
import { statusToDotClass } from '@/utils/severity';

export const StatusDot: React.FC<{ status: Status; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => (
  <span className={cn(
    'inline-block rounded-full flex-shrink-0',
    size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
    statusToDotClass(status)
  )} />
);

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, variant = 'cyan', size = 'md', className, showLabel }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
  };
  return (
    <div className={cn('relative', className)}>
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-[10px] font-mono text-slate-500 ml-1">{pct.toFixed(0)}%</span>}
    </div>
  );
};

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-8 h-8' };
  return (
    <svg className={cn('animate-spin', sizes[size], className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

// ─── SKELETON ────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('skeleton', className)} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn('p-4 space-y-3', className)}>
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
  </Card>
);

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="text-slate-300 mb-4">{icon}</div>}
    <p className="font-semibold text-slate-500 text-sm">{title}</p>
    {description && <p className="text-slate-400 text-xs mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── ERROR STATE ──────────────────────────────────────────────────────────────
export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
      <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <p className="font-semibold text-slate-600 text-sm">
      {message || 'Unable to load station data. The latest telemetry could not be retrieved.'}
    </p>
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        TRY AGAIN
      </Button>
    )}
  </div>
);

// ─── MODAL ───────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md', className }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-xl border border-slate-200 w-full animate-fade-in', sizes[size], className)}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm tracking-wide">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'primary'
}) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="text-center">
      <h3 className="font-bold text-slate-800 text-base mb-2">{title}</h3>
      {description && <p className="text-slate-500 text-sm mb-6">{description}</p>}
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
);

// ─── TABS ─────────────────────────────────────────────────────────────────────
interface Tab { id: string; label: string; badge?: string | number }
interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className }) => (
  <div className={cn('flex border-b border-slate-200', className)}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'px-4 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors relative',
          active === tab.id
            ? 'text-cyan-700 border-b-2 border-cyan-600 -mb-px'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        {tab.label}
        {tab.badge !== undefined && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {tab.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─── SELECT ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{label}</label>}
    <select
      className={cn(
        'px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400',
        className
      )}
      {...props}
    />
  </div>
);

// ─── INPUT ───────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{label}</label>}
    <input
      className={cn(
        'px-3 py-2 text-sm text-slate-700 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors',
        error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-cyan-400',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-rose-500">{error}</p>}
  </div>
);

// ─── TOGGLE ──────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled }) => (
  <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
    <div
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors',
        checked ? 'bg-cyan-600' : 'bg-slate-200'
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
        checked && 'translate-x-4'
      )} />
    </div>
    {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
  </label>
);

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => (
  <div className={cn('relative group', className)}>
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {content}
    </div>
  </div>
);

// ─── FEATURE IN PROGRESS ─────────────────────────────────────────────────────
interface FeatureInProgressProps {
  feature: string;
  description?: string;
  compact?: boolean;
}

export const FeatureInProgress: React.FC<FeatureInProgressProps> = ({ feature, description, compact }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 border border-dashed border-amber-300 rounded-lg bg-amber-50">
        <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-amber-800">{feature} — Under Development</p>
          {description && <p className="text-xs text-amber-700">{description}</p>}
        </div>
        <Badge variant="amber" size="xs">IN PROGRESS</Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-amber-200 rounded-xl bg-amber-50 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <Badge variant="amber" className="mb-3">IN PROGRESS</Badge>
      <h3 className="font-bold text-amber-900 text-sm mb-1">Feature Under Development</h3>
      <p className="text-amber-700 text-xs max-w-xs">
        {description || `${feature} is not available in this prototype yet. It is planned for a future release.`}
      </p>
    </div>
  );
};

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  status?: Status;
  subtext?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, delta, status, subtext, className }) => (
  <Card className={cn('p-4', className)}>
    <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-mono font-bold text-slate-800">{value}</span>
      {unit && <span className="text-sm text-slate-500 font-mono">{unit}</span>}
    </div>
    {delta && <p className="text-xs text-emerald-600 font-mono mt-1">{delta}</p>}
    {status && <StatusBadge status={status} className="mt-2" />}
    {subtext && <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>}
  </Card>
);
