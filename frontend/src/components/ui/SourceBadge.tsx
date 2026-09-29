import React from 'react';
import { Database, Server, Cpu, Cloud, Radio } from 'lucide-react';

export interface ProvenanceData {
  source?: 'provider' | 'k8s-api' | 'prometheus' | 'host' | 'docker' | 'registry-only' | string;
  observed_at?: string | null;
  provider?: string | null;
  provider_resource_id?: string | null;
}

export interface SourceBadgeProps {
  source?: string;
  observedAt?: string | null;
  provenance?: ProvenanceData | null;
  telemetryStatus?: 'REAL_DATA' | 'NO_TELEMETRY' | 'UNAVAILABLE' | 'ERROR' | string;
  className?: string;
}

function formatAge(dateStr?: string | null): string {
  if (!dateStr) return 'never';
  try {
    const observed = new Date(dateStr).getTime();
    const diffSec = Math.max(0, Math.floor((Date.now() - observed) / 1000));
    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'unknown';
  }
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source: directSource,
  observedAt: directObservedAt,
  provenance,
  telemetryStatus,
  className = '',
}) => {
  const source = directSource || provenance?.source || 'registry-only';
  const age = formatAge(directObservedAt || provenance?.observed_at);
  const isReal = source !== 'registry-only' && telemetryStatus !== 'NO_TELEMETRY';

  let SourceIcon = Database;
  let sourceLabel = 'Control Plane Registry';

  if (source === 'provider') {
    SourceIcon = Cloud;
    sourceLabel = provenance?.provider ? `${provenance.provider} API` : 'Cloud Provider API';
  } else if (source === 'docker') {
    SourceIcon = Server;
    sourceLabel = 'Docker Daemon';
  } else if (source === 'k8s-api') {
    SourceIcon = Cpu;
    sourceLabel = 'Kubernetes API';
  } else if (source === 'host') {
    SourceIcon = Server;
    sourceLabel = 'Host Kernel Telemetry';
  } else if (source === 'prometheus') {
    SourceIcon = Radio;
    sourceLabel = 'Prometheus Metrics';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono select-none ${
      isReal
        ? 'bg-slate-50 dark:bg-brandObsidian-900 border-slate-200 dark:border-brandObsidian-800 text-slate-600 dark:text-slate-300'
        : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
    } ${className}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${isReal ? 'bg-emerald-500' : 'bg-amber-500'}`}
        title={isReal ? 'Live verified telemetry' : 'No telemetry or registry metadata'}
      />
      <SourceIcon className="w-3 h-3 text-slate-400" />
      <span>{sourceLabel}</span>
      {(directObservedAt || provenance?.observed_at) && (
        <span className="text-slate-400 dark:text-slate-500">· {age}</span>
      )}
      {telemetryStatus === 'NO_TELEMETRY' && (
        <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">
          (No Telemetry)
        </span>
      )}
    </div>
  );
};
