import React, { useState, useEffect } from 'react';
import { 
  Radio, Plus, Send, Download, Trash2, GitMerge, 
  Settings2, Eye, X, MessageSquare
} from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';
import { motion, AnimatePresence } from 'framer-motion';

interface EventsProps {
  token: string | null;
  user?: any;
}

export const EventsPage: React.FC<EventsProps> = ({ token: _token }) => {
  const [activeTab, setActiveTab] = useState<'queues' | 'topics' | 'rules'>('queues');
  const [queues, setQueues] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateQueue, setShowCreateQueue] = useState(false);
  
  // Pagination
  const [qPage, setQPage] = useState(1);
  const [qPageSize, setQPageSize] = useState(10);
  const [tPage, setTPage] = useState(1);
  const [tPageSize, setTPageSize] = useState(10);
  const [rPage, setRPage] = useState(1);
  const [rPageSize, setRPageSize] = useState(10);

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      setQueues([
        { id: 'q-1', name: 'order-processing', type: 'FIFO', messages: 1450, inFlight: 12, dlqCount: 0, retention: '14 days', status: 'ACTIVE' },
        { id: 'q-2', name: 'email-notifications', type: 'STANDARD', messages: 5600, inFlight: 450, dlqCount: 23, retention: '4 days', status: 'ACTIVE' },
        { id: 'q-3', name: 'image-resize-jobs', type: 'STANDARD', messages: 0, inFlight: 0, dlqCount: 0, retention: '1 day', status: 'ACTIVE' },
        { id: 'q-4', name: 'payment-webhooks', type: 'FIFO', messages: 89, inFlight: 5, dlqCount: 2, retention: '14 days', status: 'ACTIVE' },
        { id: 'q-5', name: 'analytics-events', type: 'STANDARD', messages: 125000, inFlight: 1200, dlqCount: 450, retention: '7 days', status: 'ACTIVE' },
        { id: 'q-6', name: 'legacy-data-sync', type: 'STANDARD', messages: 0, inFlight: 0, dlqCount: 15, retention: '4 days', status: 'PAUSED' },
      ]);
      setTopics([
        { id: 't-1', name: 'user-events', subscribers: 4, messagesToday: 45000, created: '2023-10-01' },
        { id: 't-2', name: 'system-alerts', subscribers: 2, messagesToday: 120, created: '2023-10-15' },
        { id: 't-3', name: 'order-updates', subscribers: 5, messagesToday: 8900, created: '2023-11-20' },
        { id: 't-4', name: 'deployment-hooks', subscribers: 1, messagesToday: 45, created: '2024-01-10' },
      ]);
      setRules([
        { id: 'r-1', name: 'route-high-priority-orders', source: 'order-updates', pattern: '{"priority": ["high"]}', targetType: 'Queue', target: 'order-processing', enabled: true },
        { id: 'r-2', name: 'trigger-email-on-signup', source: 'user-events', pattern: '{"type": ["user_registered"]}', targetType: 'Function', target: 'email-sender', enabled: true },
        { id: 'r-3', name: 'log-all-errors', source: 'system-alerts', pattern: '{"level": ["error", "critical"]}', targetType: 'LogGroup', target: '/acos/alerts', enabled: true },
        { id: 'r-4', name: 'sync-legacy-users', source: 'user-events', pattern: '{"type": ["user_updated"]}', targetType: 'Queue', target: 'legacy-data-sync', enabled: false },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const paginatedQueues = queues.slice((qPage - 1) * qPageSize, qPage * qPageSize);
  const paginatedTopics = topics.slice((tPage - 1) * tPageSize, tPage * tPageSize);
  const paginatedRules = rules.slice((rPage - 1) * rPageSize, rPage * rPageSize);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Radio className="w-7 h-7 text-cyan-500" />
            ArvEvents
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Distributed Event Bus & Message Queues — Decouple and scale microservices.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'queues' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`} onClick={() => setActiveTab('queues')}>Queues</button>
        <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'topics' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`} onClick={() => setActiveTab('topics')}>Topics</button>
        <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rules' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`} onClick={() => setActiveTab('rules')}>Event Rules</button>
      </div>

      {/* Tab Content */}
      {activeTab === 'queues' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Total Queues</span>
              <span className="text-2xl font-bold text-zinc-100">{queues.length}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Messages In-Flight</span>
              <span className="text-2xl font-bold text-cyan-400">1,667</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">DLQ Messages</span>
              <span className="text-2xl font-bold text-red-400">490</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1 items-end justify-center">
               <button onClick={() => setShowCreateQueue(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold transition">
                <Plus className="w-4 h-4" /> Create Queue
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50"><h2 className="text-lg font-bold text-zinc-100">Message Queues</h2></div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold text-right">Messages</th>
                    <th className="px-4 py-3 font-semibold text-right">In-Flight</th>
                    <th className="px-4 py-3 font-semibold text-right">DLQ</th>
                    <th className="px-4 py-3 font-semibold">Retention</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-800/50">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Loading queues...</td></tr>
                  ) : paginatedQueues.map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-200 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-zinc-500" /> {q.name}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider border ${q.type === 'FIFO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{q.type}</span></td>
                      <td className="px-4 py-3 text-zinc-300 text-right font-mono">{q.messages.toLocaleString()}</td>
                      <td className="px-4 py-3 text-cyan-400 text-right font-mono">{q.inFlight.toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-400 text-right font-mono">{q.dlqCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400">{q.retention}</td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition" title="Send Message"><Send className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition" title="Poll"><Download className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition" title="Purge"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <DataTablePagination currentPage={qPage} pageSize={qPageSize} totalItems={queues.length} onPageChange={setQPage} onPageSizeChange={setQPageSize} itemName="queues" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Total Topics</span><span className="text-2xl font-bold text-zinc-100">{topics.length}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Total Subscriptions</span><span className="text-2xl font-bold text-zinc-100">12</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Published (24h)</span><span className="text-2xl font-bold text-cyan-400">54.0K</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50"><h2 className="text-lg font-bold text-zinc-100">Pub/Sub Topics</h2></div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Subscribers</th>
                    <th className="px-4 py-3 font-semibold">Messages (Today)</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-800/50">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Loading topics...</td></tr>
                  ) : paginatedTopics.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-200 flex items-center gap-2"><Radio className="w-4 h-4 text-zinc-500" /> {t.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{t.subscribers}</td>
                      <td className="px-4 py-3 text-cyan-400 font-mono">{t.messagesToday.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400">{t.created}</td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition" title="Publish"><Send className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition" title="View Subs"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <DataTablePagination currentPage={tPage} pageSize={tPageSize} totalItems={topics.length} onPageChange={setTPage} onPageSizeChange={setTPageSize} itemName="topics" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-zinc-100">Event Routing Rules</h2>
              <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-sm font-medium transition flex items-center gap-2"><Plus className="w-4 h-4" /> Create Rule</button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Source Topic</th>
                    <th className="px-4 py-3 font-semibold">Pattern</th>
                    <th className="px-4 py-3 font-semibold">Target</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-800/50">
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Loading rules...</td></tr>
                  ) : paginatedRules.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-200 flex items-center gap-2"><GitMerge className="w-4 h-4 text-zinc-500" /> {r.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{r.source}</td>
                      <td className="px-4 py-3"><code className="px-2 py-1 bg-zinc-950 rounded text-xs text-zinc-400 border border-zinc-800">{r.pattern}</code></td>
                      <td className="px-4 py-3 text-zinc-300"><span className="text-zinc-500 text-xs">{r.targetType}:</span> {r.target}</td>
                      <td className="px-4 py-3">
                        <div className={`w-10 h-5 rounded-full p-0.5 cursor-pointer ${r.enabled ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${r.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"><Settings2 className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <DataTablePagination currentPage={rPage} pageSize={rPageSize} totalItems={rules.length} onPageChange={setRPage} onPageSizeChange={setRPageSize} itemName="rules" />
            </div>
          </div>
        </div>
      )}

      {/* Create Queue Modal */}
      <AnimatePresence>
        {showCreateQueue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowCreateQueue(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-cyan-400" /> Create Queue</h3>
                <button onClick={() => setShowCreateQueue(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Queue Name</label>
                  <input type="text" className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500" placeholder="e.g. image-processing" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Type</label>
                  <select className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500">
                    <option>Standard (Best-effort ordering, high throughput)</option>
                    <option>FIFO (Strict ordering, exact-once processing)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Visibility Timeout (Seconds)</label>
                  <input type="number" min="0" max="43200" defaultValue="30" className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Message Retention (Days)</label>
                  <input type="number" min="1" max="14" defaultValue="4" className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/50">
                <button onClick={() => setShowCreateQueue(false)} className="px-4 py-2 bg-transparent hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition">Cancel</button>
                <button onClick={() => setShowCreateQueue(false)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold transition">Create Queue</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
