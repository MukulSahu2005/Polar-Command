import type { Status, Severity } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function statusToColor(status: Status): string {
  switch (status) {
    case 'healthy':
    case 'normal':
      return 'emerald';
    case 'warning':
      return 'amber';
    case 'critical':
      return 'rose';
    case 'offline':
      return 'slate';
    case 'maintenance':
      return 'sky';
    case 'unknown':
    default:
      return 'slate';
  }
}

export function statusToLabel(status: Status): string {
  switch (status) {
    case 'healthy': return 'HEALTHY';
    case 'normal': return 'NOMINAL';
    case 'warning': return 'WARNING';
    case 'critical': return 'CRITICAL';
    case 'offline': return 'OFFLINE';
    case 'maintenance': return 'MAINTENANCE';
    case 'unknown': return 'UNKNOWN';
    default: return 'UNKNOWN';
  }
}

export function statusToBgClass(status: Status): string {
  switch (status) {
    case 'healthy':
    case 'normal':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'critical':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'offline':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'maintenance':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'unknown':
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

export function statusToDotClass(status: Status): string {
  switch (status) {
    case 'healthy':
    case 'normal':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'critical':
      return 'bg-rose-500 status-dot-critical';
    case 'offline':
      return 'bg-slate-400';
    case 'maintenance':
      return 'bg-sky-500';
    case 'unknown':
    default:
      return 'bg-slate-300';
  }
}

export function severityToBgClass(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'info': return 'bg-sky-100 text-sky-800 border-sky-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function severityToBorderClass(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'border-l-rose-500';
    case 'warning': return 'border-l-amber-500';
    case 'info': return 'border-l-sky-400';
    default: return 'border-l-slate-300';
  }
}
