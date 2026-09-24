import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Eye, RotateCw, Trash2, 
  Lock, Shield, Unlock, X
} from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultProps {
  token: string | null;
  user?: any;
}

export const VaultPage: React.FC<VaultProps> = ({ token: _token }) => {
  const [activeTab, setActiveTab] = useState<'secrets' | 'keys'>('secrets');
  const [secrets, setSecrets] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateSecret, setShowCreateSecret] = useState(false);
  const [showGenerateKey, setShowGenerateKey] = useState(false);
  
  // Pagination
  const [secretPage, setSecretPage] = useState(1);
  const [secretPageSize, setSecretPageSize] = useState(10);
  const [keyPage, setKeyPage] = useState(1);
  const [keyPageSize, setKeyPageSize] = useState(10);

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      setSecrets([
        { id: 'sec-1', name: 'prod-database-url', algo: 'AES-256-GCM', version: 3, autoRotate: '30 days', lastRotated: '2024-03-15T10:00:00Z', lastAccessed: '2 mins ago' },
        { id: 'sec-2', name: 'stripe-api-key', algo: 'AES-256-GCM', version: 1, autoRotate: 'Disabled', lastRotated: '2023-11-20T00:00:00Z', lastAccessed: '1 hour ago' },
        { id: 'sec-3', name: 'aws-access-credentials', algo: 'AES-256-GCM', version: 5, autoRotate: '90 days', lastRotated: '2024-01-10T00:00:00Z', lastAccessed: '5 mins ago' },
        { id: 'sec-4', name: 'redis-auth-token', algo: 'AES-256-GCM', version: 2, autoRotate: '30 days', lastRotated: '2024-02-28T00:00:00Z', lastAccessed: '10 secs ago' },
        { id: 'sec-5', name: 'jwt-signing-secret', algo: 'AES-256-GCM', version: 1, autoRotate: 'Disabled', lastRotated: '2023-09-01T00:00:00Z', lastAccessed: 'Just now' },
        { id: 'sec-6', name: 'sendgrid-api-key', algo: 'AES-256-GCM', version: 4, autoRotate: '60 days', lastRotated: '2024-03-01T00:00:00Z', lastAccessed: '1 day ago' },
        { id: 'sec-7', name: 'datadog-agent-key', algo: 'AES-256-GCM', version: 1, autoRotate: 'Disabled', lastRotated: '2023-12-15T00:00:00Z', lastAccessed: '5 mins ago' },
        { id: 'sec-8', name: 'github-webhook-secret', algo: 'AES-256-GCM', version: 2, autoRotate: '180 days', lastRotated: '2024-01-05T00:00:00Z', lastAccessed: '2 days ago' }
      ]);
      setKeys([
        { id: 'key-1', name: 'app-encryption-key-primary', algo: 'AES-256-GCM', purpose: 'Data Encryption', status: 'ACTIVE', created: '2023-01-10T00:00:00Z', lastRotated: '2024-01-10T00:00:00Z' },
        { id: 'key-2', name: 'tls-cert-signing-ca', algo: 'RSA-4096', purpose: 'Signature', status: 'ACTIVE', created: '2023-05-15T00:00:00Z', lastRotated: '-' },
        { id: 'key-3', name: 'auth-token-signer', algo: 'ECDSA-P256', purpose: 'Signature', status: 'ACTIVE', created: '2023-08-22T00:00:00Z', lastRotated: '2024-02-22T00:00:00Z' },
        { id: 'key-4', name: 'legacy-db-key', algo: 'AES-256-GCM', purpose: 'Data Encryption', status: 'DISABLED', created: '2022-01-01T00:00:00Z', lastRotated: '2022-12-01T00:00:00Z' },
        { id: 'key-5', name: 'backup-encryption-key', algo: 'AES-256-GCM', purpose: 'Data Encryption', status: 'ACTIVE', created: '2023-11-11T00:00:00Z', lastRotated: '-' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const paginatedSecrets = secrets.slice((secretPage - 1) * secretPageSize, secretPage * secretPageSize);
  const paginatedKeys = keys.slice((keyPage - 1) * keyPageSize, keyPage * keyPageSize);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-500" />
            ArvVault
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Secrets & Key Management Service — Securely store and rotate credentials.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'secrets' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          onClick={() => setActiveTab('secrets')}
        >
          Secrets
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'keys' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          onClick={() => setActiveTab('keys')}
        >
          Encryption Keys
        </button>
      </div>

      {activeTab === 'secrets' ? (
        <div className="flex flex-col gap-4">
          {/* Secrets Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Total Secrets</span>
              <span className="text-2xl font-bold text-zinc-100">{secrets.length}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Auto-Rotating</span>
              <span className="text-2xl font-bold text-zinc-100">5</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Pending Rotation</span>
              <span className="text-2xl font-bold text-amber-500">1</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1 items-end justify-center">
               <button 
                onClick={() => setShowCreateSecret(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Create Secret
              </button>
            </div>
          </div>

          {/* Secrets Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-100">Stored Secrets</h2>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Value</th>
                    <th className="px-4 py-3 font-semibold">Version</th>
                    <th className="px-4 py-3 font-semibold">Auto-Rotate</th>
                    <th className="px-4 py-3 font-semibold">Last Rotated</th>
                    <th className="px-4 py-3 font-semibold">Last Accessed</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-800/50">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Loading secrets...</td></tr>
                  ) : paginatedSecrets.map((sec) => (
                    <tr key={sec.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-200 flex items-center gap-2"><Lock className="w-4 h-4 text-zinc-500" /> {sec.name}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono tracking-widest">••••••••</td>
                      <td className="px-4 py-3 text-zinc-300">v{sec.version}</td>
                      <td className="px-4 py-3 text-zinc-300">{sec.autoRotate}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(sec.lastRotated).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{sec.lastAccessed}</td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition" title="Reveal"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition" title="Rotate"><RotateCw className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <DataTablePagination currentPage={secretPage} pageSize={secretPageSize} totalItems={secrets.length} onPageChange={setSecretPage} onPageSizeChange={setSecretPageSize} itemName="secrets" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Keys Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Total Keys</span>
              <span className="text-2xl font-bold text-zinc-100">{keys.length}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Active Keys</span>
              <span className="text-2xl font-bold text-emerald-500">4</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">Ops (24h)</span>
              <span className="text-2xl font-bold text-zinc-100">1.2M</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-1 items-end justify-center">
               <button 
                onClick={() => setShowGenerateKey(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Generate Key
              </button>
            </div>
          </div>

          {/* Keys Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-100">Cryptographic Keys</h2>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Algorithm</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Last Rotated</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-800/50">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Loading keys...</td></tr>
                  ) : paginatedKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-200 flex items-center gap-2"><Key className="w-4 h-4 text-zinc-500" /> {k.name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">{k.algo}</span></td>
                      <td className="px-4 py-3 text-zinc-300">{k.purpose}</td>
                      <td className="px-4 py-3">
                        {k.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400">Disabled</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(k.created).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{k.lastRotated !== '-' ? new Date(k.lastRotated).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition" title="Encrypt"><Lock className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition" title="Decrypt"><Unlock className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition" title="Rotate"><RotateCw className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <DataTablePagination currentPage={keyPage} pageSize={keyPageSize} totalItems={keys.length} onPageChange={setKeyPage} onPageSizeChange={setKeyPageSize} itemName="keys" />
            </div>
          </div>
        </div>
      )}

      {/* Create Secret Modal */}
      <AnimatePresence>
        {showCreateSecret && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowCreateSecret(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Lock className="w-5 h-5 text-indigo-400" /> Create Secret</h3>
                <button onClick={() => setShowCreateSecret(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Secret Name</label>
                  <input type="text" className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="e.g. prod-db-password" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Secret Value</label>
                  <textarea rows={4} className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono" placeholder="Enter sensitive value here..."></textarea>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Auto-Rotation</label>
                  <select className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                    <option>Disabled</option>
                    <option>Every 30 days</option>
                    <option>Every 60 days</option>
                    <option>Every 90 days</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/50">
                <button onClick={() => setShowCreateSecret(false)} className="px-4 py-2 bg-transparent hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition">Cancel</button>
                <button onClick={() => setShowCreateSecret(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">Save Secret</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generate Key Modal */}
      <AnimatePresence>
        {showGenerateKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowGenerateKey(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Key className="w-5 h-5 text-indigo-400" /> Generate Key</h3>
                <button onClick={() => setShowGenerateKey(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Key Name</label>
                  <input type="text" className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="e.g. app-encryption-key-v2" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Algorithm</label>
                  <select className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                    <option>AES-256-GCM (Symmetric)</option>
                    <option>RSA-4096 (Asymmetric)</option>
                    <option>ECDSA-P256 (Asymmetric)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Purpose</label>
                  <select className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                    <option>Data Encryption/Decryption</option>
                    <option>Digital Signature</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/50">
                <button onClick={() => setShowGenerateKey(false)} className="px-4 py-2 bg-transparent hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition">Cancel</button>
                <button onClick={() => setShowGenerateKey(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">Generate</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
