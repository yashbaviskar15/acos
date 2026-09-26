import React, { useState, useEffect, useMemo } from 'react';
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  RotateCw, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Search, 
  Code2, 
  AlertTriangle, 
  Play, 
  CheckCircle2, 
  X, 
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '../config/api';

interface CloudAPIPageProps {
  token: string | null;
  user?: any;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export const CloudAPIPage: React.FC<CloudAPIPageProps> = ({ token }) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Create Key Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['*']);
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [createLoading, setCreateLoading] = useState(false);

  // Newly Created Secret Modal
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ id: string; name: string; secret: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Revoke / Roll Confirmation Modals
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null);
  const [keyToRoll, setKeyToRoll] = useState<ApiKeyItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Interactive API Quickstart Test
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'node' | 'go'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/operations/infrastructure/inventory');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ApiKeyItem[]>('/api/v1/auth/api-keys', { token });
      if (Array.isArray(data)) {
        setKeys(data);
      }
    } catch (err: any) {
      console.warn('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [token]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await apiFetch<any>('/api/v1/auth/api-keys', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: keyName.trim(),
          scopes: selectedScopes.length ? selectedScopes : ['*'],
          expires_in_days: expiryDays
        })
      });

      if (res && res.secret_key) {
        setNewlyCreatedKey({
          id: res.id,
          name: res.name,
          secret: res.secret_key
        });
        setIsCreateOpen(false);
        setKeyName('');
        setSelectedScopes(['*']);
        setExpiryDays(90);
        fetchKeys();
      }
    } catch (err: any) {
      showToast(`Error creating key: ${err.message || 'Unknown error'}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!keyToRevoke) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/v1/auth/api-keys/${keyToRevoke.id}`, {
        method: 'DELETE',
        token
      });
      showToast(`API Key "${keyToRevoke.name}" has been revoked.`);
      setKeyToRevoke(null);
      fetchKeys();
    } catch (err: any) {
      showToast(`Failed to revoke key: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollConfirm = async () => {
    if (!keyToRoll) return;
    setActionLoading(true);
    try {
      const res = await apiFetch<any>(`/api/v1/auth/api-keys/${keyToRoll.id}/roll`, {
        method: 'POST',
        token
      });
      if (res && res.secret_key) {
        setNewlyCreatedKey({
          id: res.id,
          name: res.name,
          secret: res.secret_key
        });
        setKeyToRoll(null);
        showToast(`API Key "${res.name}" rolled with a new secret.`);
        fetchKeys();
      }
    } catch (err: any) {
      showToast(`Failed to roll key: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunLiveTest = async () => {
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await apiFetch<any>(selectedEndpoint, { token });
      setTestResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setTestResult(JSON.stringify({ error: err.message || 'API request failed' }, null, 2));
    } finally {
      setTestRunning(false);
    }
  };

  const filteredKeys = useMemo(() => {
    return keys.filter(k => 
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.key_prefix.toLowerCase().includes(search.toLowerCase()) ||
      (k.scopes || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    );
  }, [keys, search]);

  const activeKeySample = keys[0]?.key_prefix ? `${keys[0].key_prefix}••••••••••••••••` : 'arv_live_9a7f8b3c••••••••';

  const formatRelative = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 2) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn font-mono text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C6923B]/10 dark:bg-[#C6923B]/20 text-[#C6923B] dark:text-[#D4A347] flex items-center justify-center border border-[#C6923B]/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Cloud API &amp; Programmatic Keys
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authenticate CI/CD pipelines, Terraform providers, Aravanta CLI, and external microservices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={fetchKeys}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
            title="Refresh keys"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C6923B] hover:bg-[#b58332] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New API Key</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active API Keys</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{keys.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Ready for production</p>
        </div>

        <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gateway Auth Protocol</span>
          <p className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">X-API-Key / Bearer</p>
          <p className="text-[11px] text-slate-400 mt-1">SHA-256 HMAC hashed</p>
        </div>

        <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rate Limit Policy</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">10,000 / min</p>
          <p className="text-[11px] text-slate-400 mt-1">Burst allowance: 25,000 req</p>
        </div>

        <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gateway Availability</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">99.99%</p>
          <p className="text-[11px] text-slate-400 mt-1">ap-south-1 Edge PoP active</p>
        </div>
      </div>

      {/* API Keys Table Card */}
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Programmatic Credentials</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keys possess workspace-scoped permissions according to assigned policy rules.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keys by name or prefix..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#C6923B]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Name &amp; Identifier</th>
                <th className="py-3 px-4">Key Prefix</th>
                <th className="py-3 px-4">Assigned Scopes</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#C6923B]" />
                    <p className="font-medium text-xs">No API keys found</p>
                    <p className="text-[11px] mt-0.5">Click "Generate New API Key" to provision credentials.</p>
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{k.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{k.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-800 dark:text-slate-200">
                          {k.key_prefix}••••••••
                        </span>
                        <button
                          onClick={() => copyToClipboard(k.key_prefix, k.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Copy prefix"
                        >
                          {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(k.scopes || ['*']).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/20"
                          >
                            {s === '*' ? 'Full Platform (*)' : s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Active'}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {formatRelative(k.last_used_at)}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setKeyToRoll(k)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                          title="Regenerate token secret"
                        >
                          <RotateCw className="w-3 h-3 text-[#C6923B]" />
                          <span>Roll</span>
                        </button>

                        <button
                          onClick={() => setKeyToRevoke(k)}
                          className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                          title="Revoke and disable key"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive API Explorer & Quickstart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Snippets */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#C6923B]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">API Integration Quickstart</h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
              {(['curl', 'python', 'node', 'go'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSnippetTab(tab)}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${activeSnippetTab === tab ? 'bg-white dark:bg-slate-800 text-[#C6923B] dark:text-[#D4A347] shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pass your generated token in the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#C6923B] font-mono text-[11px]">X-API-Key</code> request header or as a standard <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">Bearer</code> token.
          </p>

          <div className="relative bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs border border-slate-800 overflow-x-auto">
            <button
              onClick={() => {
                let code = '';
                if (activeSnippetTab === 'curl') {
                  code = `curl -X GET "https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory" \\\n  -H "X-API-Key: ${activeKeySample}" \\\n  -H "Accept: application/json"`;
                } else if (activeSnippetTab === 'python') {
                  code = `import requests\n\nheaders = {\n    "X-API-Key": "${activeKeySample}",\n    "Accept": "application/json"\n}\nresponse = requests.get("https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory", headers=headers)\nprint(response.json())`;
                } else if (activeSnippetTab === 'node') {
                  code = `const response = await fetch("https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory", {\n  headers: {\n    "X-API-Key": "${activeKeySample}",\n    "Accept": "application/json"\n  }\n});\nconst data = await response.json();\nconsole.log(data);`;
                } else {
                  code = `package main\n\nimport (\n    "fmt"\n    "net/http"\n    "io/ioutil"\n)\n\nfunc main() {\n    req, _ := http.NewRequest("GET", "https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory", nil)\n    req.Header.Set("X-API-Key", "${activeKeySample}")\n    resp, _ := http.DefaultClient.Do(req)\n    defer resp.Body.Close()\n    body, _ := ioutil.ReadAll(resp.Body)\n    fmt.Println(string(body))\n}`;
                }
                copyToClipboard(code, 'snippet');
              }}
              className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition cursor-pointer"
            >
              {copiedId === 'snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy</span>
            </button>

            {activeSnippetTab === 'curl' && (
              <pre className="text-emerald-400">
                <span className="text-blue-400">curl</span> -X GET <span className="text-amber-300">"https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory"</span> \<br />
                &nbsp;&nbsp;-H <span className="text-amber-300">"X-API-Key: {activeKeySample}"</span> \<br />
                &nbsp;&nbsp;-H <span className="text-amber-300">"Accept: application/json"</span>
              </pre>
            )}

            {activeSnippetTab === 'python' && (
              <pre className="text-slate-200">
                <span className="text-purple-400">import</span> requests<br /><br />
                headers = &#123;<br />
                &nbsp;&nbsp;<span className="text-amber-300">"X-API-Key"</span>: <span className="text-amber-300">"{activeKeySample}"</span>,<br />
                &nbsp;&nbsp;<span className="text-amber-300">"Accept"</span>: <span className="text-amber-300">"application/json"</span><br />
                &#125;<br /><br />
                response = requests.<span className="text-blue-400">get</span>(<br />
                &nbsp;&nbsp;<span className="text-amber-300">"https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory"</span>,<br />
                &nbsp;&nbsp;headers=headers<br />
                )<br />
                <span className="text-blue-400">print</span>(response.json())
              </pre>
            )}

            {activeSnippetTab === 'node' && (
              <pre className="text-slate-200">
                <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-amber-300">"https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory"</span>, &#123;<br />
                &nbsp;&nbsp;headers: &#123;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"X-API-Key"</span>: <span className="text-amber-300">"{activeKeySample}"</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"Accept"</span>: <span className="text-amber-300">"application/json"</span><br />
                &nbsp;&nbsp;&#125;<br />
                &#125;);<br />
                <span className="text-purple-400">const</span> data = <span className="text-purple-400">await</span> response.<span className="text-blue-400">json</span>();<br />
                console.<span className="text-blue-400">log</span>(data);
              </pre>
            )}

            {activeSnippetTab === 'go' && (
              <pre className="text-slate-200">
                <span className="text-purple-400">package</span> main<br /><br />
                <span className="text-purple-400">import</span> (<br />
                &nbsp;&nbsp;<span className="text-amber-300">"fmt"</span><br />
                &nbsp;&nbsp;<span className="text-amber-300">"net/http"</span><br />
                &nbsp;&nbsp;<span className="text-amber-300">"io/ioutil"</span><br />
                )<br /><br />
                <span className="text-purple-400">func</span> <span className="text-blue-400">main</span>() &#123;<br />
                &nbsp;&nbsp;req, _ := http.<span className="text-blue-400">NewRequest</span>(<span className="text-amber-300">"GET"</span>, <span className="text-amber-300">"https://api.aravanta.cloud/api/v1/operations/infrastructure/inventory"</span>, nil)<br />
                &nbsp;&nbsp;req.Header.<span className="text-blue-400">Set</span>(<span className="text-amber-300">"X-API-Key"</span>, <span className="text-amber-300">"{activeKeySample}"</span>)<br />
                &nbsp;&nbsp;resp, _ := http.DefaultClient.<span className="text-blue-400">Do</span>(req)<br />
                &nbsp;&nbsp;<span className="text-purple-400">defer</span> resp.Body.<span className="text-blue-400">Close</span>()<br />
                &nbsp;&nbsp;body, _ := ioutil.<span className="text-blue-400">ReadAll</span>(resp.Body)<br />
                &nbsp;&nbsp;fmt.<span className="text-blue-400">Println</span>(string(body))<br />
                &#125;
              </pre>
            )}
          </div>
        </div>

        {/* Right: Live Interactive API Tester */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Endpoint Tester</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Live HTTP
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Endpoint</label>
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-[#C6923B]"
              >
                <option value="/api/v1/operations/infrastructure/inventory">GET /api/v1/operations/infrastructure/inventory</option>
                <option value="/api/v1/operations/billing/plan">GET /api/v1/operations/billing/plan</option>
                <option value="/api/v1/operations/health">GET /api/v1/operations/health</option>
                <option value="/api/v1/billing/breakdown">GET /api/v1/billing/breakdown</option>
              </select>
            </div>

            <button
              onClick={handleRunLiveTest}
              disabled={testRunning}
              className="w-full py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 text-emerald-400 ${testRunning ? 'animate-spin' : ''}`} />
              <span>{testRunning ? 'Executing Request...' : 'Send Live Request'}</span>
            </button>

            {testResult && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Status: 200 OK</span>
                  <button
                    onClick={() => copyToClipboard(testResult, 'test-res')}
                    className="hover:text-slate-200 transition"
                  >
                    {copiedId === 'test-res' ? 'Copied!' : 'Copy Response'}
                  </button>
                </div>
                <pre className="max-h-48 overflow-y-auto bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[11px] border border-slate-800">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Create Key Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#C6923B]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate Cloud API Key</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Name / Description
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. github-actions-cicd-runner"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#C6923B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Access Scopes &amp; Privileges
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: '*', label: 'Full Access (*)' },
                    { id: 'compute:*', label: 'Compute (VMs & Bare Metal)' },
                    { id: 'storage:*', label: 'Storage & S3 Buckets' },
                    { id: 'database:*', label: 'Database Clusters' },
                    { id: 'functions:*', label: 'Serverless Functions' },
                    { id: 'operations:read', label: 'Read-Only Telemetry' }
                  ].map(s => {
                    const isChecked = selectedScopes.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${isChecked ? 'bg-[#C6923B]/10 border-[#C6923B] text-slate-900 dark:text-white font-medium' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (s.id === '*') {
                              setSelectedScopes(e.target.checked ? ['*'] : []);
                            } else {
                              const withoutWildcard = selectedScopes.filter(item => item !== '*');
                              if (e.target.checked) {
                                setSelectedScopes([...withoutWildcard, s.id]);
                              } else {
                                setSelectedScopes(withoutWildcard.filter(item => item !== s.id));
                              }
                            }
                          }}
                          className="accent-[#C6923B]"
                        />
                        <span>{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expiration Duration
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-[#C6923B]"
                >
                  <option value={30}>30 Days (Recommended for CI/CD)</option>
                  <option value={90}>90 Days (Standard Corporate Policy)</option>
                  <option value={180}>180 Days (Half Year)</option>
                  <option value={365}>365 Days (1 Year)</option>
                  <option value={0}>Never Expire (Permanent)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl bg-[#C6923B] hover:bg-[#b58332] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  {createLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reveal Generated Key Modal (One-time viewing) */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-[#C6923B]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">API Key Generated Successfully</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Security Alert:</strong> Copy this secret key immediately. For zero-trust compliance, this secret will <em>never be displayed again</em>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Secret Token ({newlyCreatedKey.name})
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs">
                <span className="flex-1 select-all break-all text-amber-300">
                  {showSecret ? newlyCreatedKey.secret : newlyCreatedKey.secret.slice(0, 14) + '••••••••••••••••••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title={showSecret ? "Hide secret" : "Reveal secret"}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newlyCreatedKey.secret, 'new-secret')}
                  className="px-2.5 py-1 rounded bg-[#C6923B] hover:bg-[#b58332] text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedId === 'new-secret' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setNewlyCreatedKey(null);
                  setShowSecret(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                I Have Saved My Secret Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Revoke Confirmation */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revoke Cloud API Key?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to revoke <strong>"{keyToRevoke.name}"</strong> ({keyToRevoke.id})? Any active scripts or CI/CD pipelines using this key will immediately fail with HTTP 401 Unauthorized.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setKeyToRevoke(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Revoke Key</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Roll Key Confirmation */}
      {keyToRoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-[#C6923B]/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#C6923B] dark:text-[#D4A347]">
              <RotateCw className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Roll API Key Secret?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Rolling <strong>"{keyToRoll.name}"</strong> will immediately generate a fresh secret token and invalidate the old key secret. All permissions and scope rules will remain unchanged.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setKeyToRoll(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRollConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-[#C6923B] hover:bg-[#b58332] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Roll Secret</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
