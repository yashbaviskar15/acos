export type UserRole = 'SuperAdmin' | 'Admin' | 'Operator' | 'Developer' | 'Viewer';

/**
 * Normalizes any role string into a canonical UserRole enum.
 */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'Viewer';
  const r = role.trim().toLowerCase();
  if (r === 'superadmin') return 'SuperAdmin';
  if (r === 'admin') return 'Admin';
  if (r === 'operator') return 'Operator';
  if (r === 'developer') return 'Developer';
  if (r === 'viewer' || r === 'read-only' || r === 'readonly') return 'Viewer';
  return 'Viewer';
}

/**
 * Allowed roles for each console tab.
 * SuperAdmin is always granted access.
 */
export const TAB_PERMISSIONS: Record<string, UserRole[]> = {
  dashboard: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  infrastructure: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  applications: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  deployments: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  containers: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  monitoring: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  logs: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  alerts: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  incidents: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  automation: ['SuperAdmin', 'Admin', 'Operator', 'Developer'],
  backups: ['SuperAdmin', 'Admin', 'Operator'],
  compute: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  kubernetes: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  database: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  storage: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  cicd: ['SuperAdmin', 'Admin', 'Operator', 'Developer'],
  security: ['SuperAdmin', 'Admin', 'Operator'],
  audit: ['SuperAdmin', 'Admin', 'Operator'],
  billing: ['SuperAdmin', 'Admin'],
  settings: ['SuperAdmin', 'Admin'],
  profile: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
  guide: ['SuperAdmin', 'Admin', 'Operator', 'Developer', 'Viewer'],
};

/**
 * Checks whether the specified role can navigate to and view a console tab.
 */
export function canAccessTab(tabId: string, role?: string | null): boolean {
  const norm = normalizeRole(role);
  if (norm === 'SuperAdmin') return true;
  const allowed = TAB_PERMISSIONS[tabId];
  if (!allowed) return true;
  return allowed.includes(norm);
}

/**
 * Checks whether the specified role can perform a specific state-modifying action.
 */
export function canPerformAction(action: string, role?: string | null): boolean {
  const norm = normalizeRole(role);
  if (norm === 'SuperAdmin' || norm === 'Admin') return true;
  
  switch (action) {
    case 'terminate_instance':
    case 'delete_cluster':
    case 'delete_database':
    case 'delete_bucket':
    case 'delete_application':
    case 'manage_billing':
    case 'manage_users':
    case 'invite_member':
    case 'update_settings':
      return false; // Only SuperAdmin / Admin
      
    case 'create_instance':
    case 'create_cluster':
    case 'create_database':
    case 'provision_resource':
    case 'manage_backups':
    case 'resolve_incident':
      return norm === 'Operator';
      
    case 'start_instance':
    case 'stop_instance':
    case 'reboot_instance':
    case 'scale_cluster':
    case 'upload_object':
    case 'trigger_deployment':
    case 'rollback_deployment':
    case 'acknowledge_alert':
    case 'mute_alert':
    case 'run_automation':
      return norm === 'Operator' || norm === 'Developer';
      
    case 'view':
      return true;
      
    default:
      return norm !== 'Viewer';
  }
}
