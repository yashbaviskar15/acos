import React from 'react';
import { motion } from 'framer-motion';
import { Server, Boxes, HardDrive, Database, ArrowRight } from 'lucide-react';

interface MegaMenuProps {
  onSelectModule?: (moduleId: string) => void;
  onClose?: () => void;
}

const MODULES = [
  {
    id: 'compute',
    name: 'ArvCompute',
    title: 'Elastic Virtual Compute',
    desc: 'High-frequency CPU VMs & NVMe storage in under 10s',
    icon: Server,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50/80',
  },
  {
    id: 'kube',
    name: 'ArvKube',
    title: 'Managed Kubernetes',
    desc: 'Auto-scaling K8s clusters with rolling upgrades',
    icon: Boxes,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50/80',
  },
  {
    id: 'storage',
    name: 'ArvStore',
    title: 'S3-Compatible Object Storage',
    desc: '99.999999999% durable bucket storage & global CDN',
    icon: HardDrive,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50/80',
  },
  {
    id: 'db',
    name: 'ArvDB',
    title: 'Managed Databases',
    desc: 'PostgreSQL, MySQL & Redis with automated failover',
    icon: Database,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50/80',
  },
];

export const MegaMenu: React.FC<MegaMenuProps> = ({ onSelectModule, onClose }) => {
  const handleClick = (id: string) => {
    if (onSelectModule) {
      onSelectModule(id);
    }
    if (onClose) {
      onClose();
    }
    const el = document.querySelector('#features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute top-full left-0 mt-2 w-[540px] bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/60 p-4 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
          Core Cloud Modules
        </span>
        <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
          Explore Architecture <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => handleClick(mod.id)}
              className="p-3 text-left rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/60 group cursor-pointer flex items-start gap-3"
            >
              <div className={`w-9 h-9 ${mod.bgColor} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 ${mod.color}`} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {mod.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-tight">
                  {mod.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Banner in MegaMenu */}
      <div className="mt-3 pt-2.5 px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium text-[11px]">
          Need custom enterprise capacity?
        </span>
        <span className="font-bold text-blue-600 hover:underline cursor-pointer text-[11px]">
          Talk to Cloud Architect &rarr;
        </span>
      </div>
    </motion.div>
  );
};
