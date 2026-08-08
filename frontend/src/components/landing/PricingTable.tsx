import React from 'react';
import { Check, X } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface PricingTableProps {
  onGoToRegister: () => void;
  currency: string;
}

interface FeatureRow {
  category: string;
  feature: string;
  tooltip?: string;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

const FEATURE_ROWS: FeatureRow[] = [
  // Compute & Hardware
  { category: 'Compute & Memory', feature: 'Virtual CPU Cores', starter: '2 vCPUs', pro: '4 vCPUs', enterprise: '16 vCPUs Dedicated' },
  { category: 'Compute & Memory', feature: 'RAM Memory Allocation', starter: '4GB DDR5', pro: '16GB DDR5', enterprise: '64GB DDR5 Dedicated' },
  { category: 'Compute & Memory', feature: 'NVMe SSD Storage', tooltip: 'High-speed solid-state drives with over 100,000 IOPS for enterprise workloads.', starter: '50GB NVMe', pro: '200GB NVMe', enterprise: '1TB+ Custom NVMe' },
  
  // Containers & Storage
  { category: 'Containers & Storage', feature: 'Managed Kubernetes (ArvKube)', tooltip: 'Production HA control plane with automated worker pool auto-scaling.', starter: false, pro: '1 Cluster Included', enterprise: 'Unlimited K8s Clusters' },
  { category: 'Containers & Storage', feature: 'S3 Object Storage (ArvStore)', tooltip: '99.999999999% durability S3-compatible API bucket storage.', starter: '10GB Included', pro: '100GB Included', enterprise: 'Unlimited Buckets' },
  { category: 'Containers & Storage', feature: 'Managed Databases (ArvDB)', tooltip: 'Fully automated PostgreSQL, MySQL, and Redis with daily backups.', starter: false, pro: '1 Database Instance', enterprise: 'Multi-AZ DB Clusters' },

  // Security & Compliance
  { category: 'Security & Compliance', feature: 'Zero-Trust RBAC', tooltip: 'Granular role-based access control with SuperAdmin, Admin, Developer, and Viewer roles.', starter: true, pro: true, enterprise: true },
  { category: 'Security & Compliance', feature: 'TOTP MFA Security', starter: true, pro: true, enterprise: true },
  { category: 'Security & Compliance', feature: 'Custom Audit Logs & Trail', starter: false, pro: '30-Day Logs', enterprise: '365-Day Compliance Trail' },

  // Support & SLA
  { category: 'Support & Operations', feature: 'Uptime SLA Guarantee', starter: '99.9%', pro: '99.95%', enterprise: '99.99% Custom SLA' },
  { category: 'Support & Operations', feature: 'Support Tier', starter: 'Community 48h', pro: '24/7 Priority 4h', enterprise: 'Dedicated TAM 1h Response' },
];

export const PricingTable: React.FC<PricingTableProps> = ({ onGoToRegister }) => {
  return (
    <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80 text-xs">
            <th className="p-4 sm:p-5 font-bold text-slate-900 w-2/5">Feature Comparison</th>
            <th className="p-4 sm:p-5 font-bold text-slate-800 text-center w-1/5">Starter</th>
            <th className="p-4 sm:p-5 font-bold text-blue-600 text-center w-1/5 bg-blue-50/40">Pro Production</th>
            <th className="p-4 sm:p-5 font-bold text-slate-900 text-center w-1/5">Enterprise</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {FEATURE_ROWS.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
              <td className="p-4 sm:p-5 font-medium text-slate-800">
                <div className="flex items-center gap-1.5">
                  <span>{row.feature}</span>
                  {row.tooltip && <Tooltip content={row.tooltip} term="" />}
                </div>
              </td>

              {/* Starter */}
              <td className="p-4 sm:p-5 text-center font-mono">
                {typeof row.starter === 'boolean' ? (
                  row.starter ? (
                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 mx-auto" />
                  )
                ) : (
                  <span>{row.starter}</span>
                )}
              </td>

              {/* Pro */}
              <td className="p-4 sm:p-5 text-center font-mono bg-blue-50/20 font-semibold text-blue-700">
                {typeof row.pro === 'boolean' ? (
                  row.pro ? (
                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 mx-auto" />
                  )
                ) : (
                  <span>{row.pro}</span>
                )}
              </td>

              {/* Enterprise */}
              <td className="p-4 sm:p-5 text-center font-mono font-bold text-slate-900">
                {typeof row.enterprise === 'boolean' ? (
                  row.enterprise ? (
                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 mx-auto" />
                  )
                ) : (
                  <span>{row.enterprise}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-slate-50/80 border-t border-slate-200">
            <td className="p-4 sm:p-5 text-xs text-slate-500 font-medium">Ready to deploy?</td>
            <td className="p-4 text-center">
              <button
                onClick={onGoToRegister}
                className="px-3 py-2 text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Choose Starter
              </button>
            </td>
            <td className="p-4 text-center bg-blue-50/40">
              <button
                onClick={onGoToRegister}
                className="px-3 py-2 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Choose Pro
              </button>
            </td>
            <td className="p-4 text-center">
              <button
                onClick={onGoToRegister}
                className="px-3 py-2 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
              >
                Contact Sales
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
