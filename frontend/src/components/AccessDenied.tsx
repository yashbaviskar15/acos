import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { TAB_PERMISSIONS } from '../utils/rbac';

interface AccessDeniedProps {
  tabId: string;
  userRole?: string;
  onNavigate: (tab: string) => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  tabId,
  userRole = 'Viewer',
  onNavigate
}) => {
  const allowedRoles = TAB_PERMISSIONS[tabId] || ['SuperAdmin', 'Admin'];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
            HTTP 403 Forbidden
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight pt-1">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
            Your current role <strong className="text-slate-900 dark:text-white font-mono uppercase">[{userRole}]</strong> does not have permission to view or manage the <strong className="text-amber-600 dark:text-amber-400 font-mono">/{tabId}</strong> control plane module.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Required role privilege:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allowedRoles.map((r) => (
              <span
                key={r}
                className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-500/20"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#C6923B] hover:bg-[#B07B28] text-white font-mono font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
