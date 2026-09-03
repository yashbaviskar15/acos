import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  Bug,
  Pause,
  Play
} from 'lucide-react';
import { apiFetch } from '../config/api';

interface LogItem {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  container: string;
  message: string;
  environment: string;
}

export const Logs: React.FC<{ token: string | null }> = ({ token }) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedService !== 'all') params.append('service', selectedService);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (searchTerm) params.append('query', searchTerm);
      params.append('limit', '150');

      const data = await apiFetch<LogItem[]>(`/api/v1/operations/logs?${params.toString()}`, { token });
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService, selectedLevel, searchTerm, token]);

  // Auto-refresh interval (every 4 seconds if enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, selectedService, selectedLevel, searchTerm]);

  const handleCopyLine = (log: LogItem) => {
    const text = `[${log.timestamp}] [${log.level}] [${log.service}] ${log.message}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aravanta-logs-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelStyle = (level: string) => {
    switch ((level || '').toUpperCase()) {
      case 'ERROR':
        return {
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: AlertOctagon,
          text: 'text-rose-400'
        };
      case 'WARN':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          text: 'text-amber-400'
        };
      case 'INFO':
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: Info,
          text: 'text-blue-300'
        };
      case 'DEBUG':
        return {
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          icon: Bug,
          text: 'text-slate-400'
        };
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          icon: Info,
          text: 'text-slate-300'
        };
    }
  };

  const infoCount = logs.filter(l => l.level === 'INFO').length;
  const warnCount = logs.filter(l => l.level === 'WARN').length;
  const errorCount = logs.filter(l => l.level === 'ERROR').length;

  return (
    <div className="space-y-6">
      {/* KPI Severity Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div 
          onClick={() => setSelectedLevel('all')}
          className={`bg-white dark:bg-[#0F2038] border p-4 rounded-2xl shadow-sm cursor-pointer transition-all ${selectedLevel === 'all' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}`}
        >
          <span className="text-xs font-bold text-slate-500">Total Stream Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{logs.length}</p>
        </div>

        <div 
          onClick={() => setSelectedLevel('ERROR')}
          className={`bg-white dark:bg-[#0F2038] border p-4 rounded-2xl shadow-sm cursor-pointer transition-all ${selectedLevel === 'ERROR' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'}`}
        >
          <span className="text-xs font-bold text-rose-500">ERROR Events</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{errorCount}</p>
        </div>

        <div 
          onClick={() => setSelectedLevel('WARN')}
          className={`bg-white dark:bg-[#0F2038] border p-4 rounded-2xl shadow-sm cursor-pointer transition-all ${selectedLevel === 'WARN' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800'}`}
        >
          <span className="text-xs font-bold text-amber-500">WARN Warnings</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{warnCount}</p>
        </div>

        <div 
          onClick={() => setSelectedLevel('INFO')}
          className={`bg-white dark:bg-[#0F2038] border p-4 rounded-2xl shadow-sm cursor-pointer transition-all ${selectedLevel === 'INFO' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}`}
        >
          <span className="text-xs font-bold text-blue-500">INFO Telemetry</span>
          <p className="text-2xl font-black text-blue-500 mt-1">{infoCount}</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search regex, HTTP status, path, message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Service: All Services</option>
              <option value="api-gateway">api-gateway</option>
              <option value="auth-service">auth-service</option>
              <option value="telemetry-engine">telemetry-engine</option>
              <option value="web-console">web-console</option>
              <option value="postgres-primary">postgres-primary</option>
              <option value="k8s-scheduler">k8s-scheduler</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Severity: All Levels</option>
              <option value="INFO">INFO Only</option>
              <option value="WARN">WARN Only</option>
              <option value="ERROR">ERROR Only</option>
              <option value="DEBUG">DEBUG Only</option>
            </select>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                autoRefresh
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={autoRefresh ? 'Live stream active (click to pause)' : 'Stream paused (click to resume)'}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>LIVE (4s)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>PAUSED</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportLogs}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export filtered logs as JSON"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Terminal Log Viewer */}
        <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[580px] overflow-y-auto space-y-1.5 shadow-inner">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
              <span>Streaming operational log events...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-slate-400">No log entries matching current query</p>
              <p className="text-[11px] mt-1 text-slate-600">Try broadening your severity level or clearing the search term</p>
            </div>
          ) : (
            logs.map((log) => {
              const style = getLevelStyle(log.level);
              const LevelIcon = style.icon;
              return (
                <div 
                  key={log.id} 
                  className="flex items-start justify-between gap-2 py-1 px-2 rounded hover:bg-slate-900/80 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-slate-500 text-[11px] shrink-0 select-none">
                      {log.timestamp.replace('T', ' ').replace('Z', '')}
                    </span>

                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 flex items-center gap-1 ${style.bg}`}>
                      <LevelIcon className="w-3 h-3 shrink-0" />
                      {log.level}
                    </span>

                    <span className="text-purple-400 font-bold shrink-0 select-none">
                      [{log.service}]
                    </span>

                    <span className={`break-all ${style.text}`}>
                      {log.message}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyLine(log)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-1 rounded transition-opacity shrink-0 cursor-pointer"
                    title="Copy log line"
                  >
                    {copiedId === log.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
