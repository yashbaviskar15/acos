export interface RecentServiceItem {
  id: string;
  name: string;
  category: string;
  route: string;
  iconName: string;
  accessedAt: string; // ISO string
  description?: string;
  status?: string;
}

const STORAGE_KEY = 'aravanta_recent_services';

export const SERVICE_REGISTRY: Record<string, Omit<RecentServiceItem, 'accessedAt'>> = {
  compute: {
    id: 'compute',
    name: 'ArvCompute (VMs)',
    category: 'Compute',
    route: 'compute',
    iconName: 'Server',
    description: 'Elastic Virtual Machines, Bare Metal & Auto-scaling nodes',
    status: 'Operational'
  },
  kubernetes: {
    id: 'kubernetes',
    name: 'ArvKube (K8s)',
    category: 'Containers',
    route: 'kubernetes',
    iconName: 'Boxes',
    description: 'Managed Kubernetes clusters with containerd runtime',
    status: 'Operational'
  },
  database: {
    id: 'database',
    name: 'ArvDB (Databases)',
    category: 'Databases',
    route: 'database',
    iconName: 'Database',
    description: 'High-Availability PostgreSQL, MySQL & Redis clusters',
    status: 'Operational'
  },
  storage: {
    id: 'storage',
    name: 'ArvStore (S3)',
    category: 'Storage',
    route: 'storage',
    iconName: 'HardDrive',
    description: 'S3-compatible distributed object storage and volumes',
    status: 'Operational'
  },
  functions: {
    id: 'functions',
    name: 'ArvFunctions (FaaS)',
    category: 'Serverless',
    route: 'functions',
    iconName: 'Zap',
    description: 'Event-driven serverless functions with micro-second billing',
    status: 'Operational'
  },
  vault: {
    id: 'vault',
    name: 'ArvVault (KMS)',
    category: 'Security',
    route: 'vault',
    iconName: 'KeyRound',
    description: 'KMS cryptographic secrets & envelope encryption',
    status: 'Operational'
  },
  events: {
    id: 'events',
    name: 'ArvEvents (Queues)',
    category: 'Integration',
    route: 'events',
    iconName: 'Radio',
    description: 'FIFO / Standard message queues and event broker',
    status: 'Operational'
  },
  deployments: {
    id: 'deployments',
    name: 'Deployments & CI/CD',
    category: 'DevOps',
    route: 'deployments',
    iconName: 'GitBranch',
    description: 'Automated release pipelines and zero-downtime rollbacks',
    status: 'Operational'
  },
  automation: {
    id: 'automation',
    name: 'IaC Blueprints',
    category: 'DevOps',
    route: 'automation',
    iconName: 'Code2',
    description: 'Terraform and OpenTofu automated cloud infrastructure',
    status: 'Operational'
  },
  monitoring: {
    id: 'monitoring',
    name: 'ArvWatch Observability',
    category: 'Observability',
    route: 'monitoring',
    iconName: 'Activity',
    description: 'Prometheus metrics, Grafana dashboards and alerts',
    status: 'Operational'
  },
  security: {
    id: 'security',
    name: 'ArvGuard RBAC',
    category: 'Governance',
    route: 'security',
    iconName: 'ShieldCheck',
    description: 'Role-based access control, session governance and audit logs',
    status: 'Operational'
  },
  billing: {
    id: 'billing',
    name: 'FinOps & Billing',
    category: 'Finance',
    route: 'billing',
    iconName: 'CreditCard',
    description: 'Metered usage analytics, prepaid credits and invoice payments',
    status: 'Operational'
  }
};

const DEFAULT_RECENT_KEYS = ['compute', 'database', 'storage', 'functions'];

export function getRecentServices(): RecentServiceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Baseline defaults if user hasn't visited any services yet in this browser session
  const now = new Date();
  return DEFAULT_RECENT_KEYS.map((key, idx) => {
    const reg = SERVICE_REGISTRY[key] || {
      id: key,
      name: key,
      category: 'Cloud',
      route: key,
      iconName: 'Server',
      description: 'Cloud Infrastructure Service',
      status: 'Operational'
    };
    const pastMinutes = (idx + 1) * 15;
    const pastTime = new Date(now.getTime() - pastMinutes * 60000);
    return {
      ...reg,
      accessedAt: pastTime.toISOString()
    };
  });
}

export function recordServiceAccess(tabId: string): void {
  const reg = SERVICE_REGISTRY[tabId];
  if (!reg) return;

  try {
    const current = getRecentServices();
    const filtered = current.filter(item => item.id !== reg.id);
    const updated: RecentServiceItem[] = [
      {
        ...reg,
        accessedAt: new Date().toISOString()
      },
      ...filtered
    ].slice(0, 8); // Keep top 8 recent

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('acos:recent-services-updated', { detail: updated }));
  } catch {}
}

export function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}
