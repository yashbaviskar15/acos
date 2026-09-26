import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Zap, Plus, Play, FileText, Trash2, Edit2, 
  Activity, Clock, ServerCrash, CheckCircle2, X
} from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';
import { motion, AnimatePresence } from 'framer-motion';

interface FunctionsProps {
  token: string | null;
  user?: any;
}

export const FunctionsPage: React.FC<FunctionsProps> = ({ token: _token }) => {
  const [functions, setFunctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // Realistic fallback functions
    setTimeout(() => {
      setFunctions([
        { id: 'fn-1', name: 'process-payments', runtime: 'nodejs20', memory: 512, timeout: 30, trigger: 'HTTP', invocations: 145023, avgLatency: '124ms', status: 'ACTIVE' },
        { id: 'fn-2', name: 'generate-reports', runtime: 'python3.11', memory: 1024, timeout: 120, trigger: 'Cron', invocations: 45, avgLatency: '8.4s', status: 'ACTIVE' },
        { id: 'fn-3', name: 'image-resizer', runtime: 'go1.22', memory: 2048, timeout: 45, trigger: 'Event', invocations: 8904, avgLatency: '45ms', status: 'ACTIVE' },
        { id: 'fn-4', name: 'webhook-handler', runtime: 'nodejs20', memory: 256, timeout: 15, trigger: 'HTTP', invocations: 56780, avgLatency: '89ms', status: 'ERROR' },
        { id: 'fn-5', name: 'data-sync', runtime: 'rust', memory: 512, timeout: 60, trigger: 'Cron', invocations: 12, avgLatency: '1.2s', status: 'DEPLOYING' },
        { id: 'fn-6', name: 'email-sender', runtime: 'nodejs20', memory: 256, timeout: 20, trigger: 'Event', invocations: 3450, avgLatency: '210ms', status: 'ACTIVE' },
        { id: 'fn-7', name: 'log-parser', runtime: 'go1.22', memory: 1024, timeout: 30, trigger: 'Event', invocations: 99999, avgLatency: '15ms', status: 'ACTIVE' },
        { id: 'fn-8', name: 'legacy-api', runtime: 'python3.11', memory: 512, timeout: 60, trigger: 'HTTP', invocations: 0, avgLatency: '—', status: 'DISABLED' },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  const filteredFunctions = functions.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.runtime.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const paginatedFunctions = filteredFunctions.slice((page - 1) * pageSize, page * pageSize);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>;
      case 'DEPLOYING': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><Activity className="w-3.5 h-3.5 animate-pulse text-[#C6923B]" /> Deploying</span>;
      case 'ERROR': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"><ServerCrash className="w-3.5 h-3.5" /> Error</span>;
      case 'DISABLED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20">Disabled</span>;
      default: return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-[#C6923B] dark:text-[#D4A347]" />
            ArvFunctions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Serverless Compute Engine — Run code without provisioning infrastructure.
          </p>
        </div>
        <button 
          onClick={() => setShowDeployModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C6923B] hover:bg-[#B07B28] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-[#C6923B]/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Deploy Function
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#C6923B] dark:text-[#D4A347]" /> Total Functions
          </span>
          <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">{functions.length}</span>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Invocations (24h)
          </span>
          <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">314.3K</span>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Avg Duration
          </span>
          <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">142ms</span>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <ServerCrash className="w-4 h-4 text-rose-500" /> Error Rate
          </span>
          <span className="text-2xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">0.04%</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/75 dark:bg-[#0e1624]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Deployed Functions Fleet</h2>
          <div className="relative w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search functions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C6923B] w-full sm:w-64"
            />
            <Activity className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto w-full min-w-full">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-[#0c1322] border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Runtime</th>
                <th className="px-4 py-3">Memory</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Invocations</th>
                <th className="px-4 py-3">Avg Latency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading functions...</td>
                </tr>
              ) : paginatedFunctions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No functions found.</td>
                </tr>
              ) : (
                paginatedFunctions.map((fn) => (
                  <tr key={fn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{fn.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{fn.runtime}</span></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{fn.memory} MB</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fn.trigger}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{fn.invocations.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{fn.avgLatency}</td>
                    <td className="px-4 py-3">{getStatusBadge(fn.status)}</td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C6923B] transition cursor-pointer" title="Invoke"><Play className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-cyan-500 transition cursor-pointer" title="View Logs"><FileText className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e1624]">
          <DataTablePagination 
            currentPage={page} 
            pageSize={pageSize} 
            totalItems={filteredFunctions.length} 
            onPageChange={setPage} 
            onPageSizeChange={setPageSize}
            itemName="functions" 
          />
        </div>
      </div>

      {/* Deploy Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showDeployModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-2xs" onClick={() => setShowDeployModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0e1624]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C6923B]" /> Deploy Serverless Function
                  </h3>
                  <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 flex flex-col gap-3.5 overflow-y-auto max-h-[70vh] text-xs font-sans">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">FUNCTION NAME</label>
                    <input type="text" className="px-3 py-2 bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono text-xs" placeholder="e.g. process-payments" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">RUNTIME</label>
                    <select className="px-3 py-2 bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono text-xs">
                      <option>nodejs20</option>
                      <option>python3.11</option>
                      <option>go1.22</option>
                      <option>rust</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">HANDLER</label>
                    <input type="text" className="px-3 py-2 bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono text-xs" placeholder="index.handler" defaultValue="index.handler" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px] flex justify-between">
                      ALLOCATED MEMORY <span className="text-[#C6923B] dark:text-[#D4A347]">512 MB</span>
                    </label>
                    <input type="range" min="128" max="8192" step="128" defaultValue="512" className="w-full accent-[#C6923B]" />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>128 MB</span>
                      <span>8192 MB</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">TRIGGER TYPE</label>
                    <select className="px-3 py-2 bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C6923B] font-mono text-xs">
                      <option>HTTP Endpoint</option>
                      <option>Cron Schedule</option>
                      <option>Event Bus</option>
                    </select>
                  </div>
                </div>
                <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50 dark:bg-[#0e1624]">
                  <button onClick={() => setShowDeployModal(false)} className="px-3.5 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                  <button onClick={() => setShowDeployModal(false)} className="px-4 py-1.5 bg-[#C6923B] hover:bg-[#B07B28] text-white rounded-lg text-xs font-bold shadow-md cursor-pointer">Deploy</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
