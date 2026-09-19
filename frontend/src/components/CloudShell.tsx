import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Maximize2, Minimize2, Trash2, CornerDownLeft, Sparkles } from 'lucide-react';
import { apiFetch } from '../config/api';

interface CloudShellProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  user?: any;
}

interface HistoryItem {
  command: string;
  output: string;
  isError?: boolean;
}

const WELCOME_BANNER = `
   ___                                 __          ________             __ 
  / _ |  _______ __  _____ ____  __ __/ /____ _   / ___/ /__  __ _____/ / 
 / __ | / __/ _ \`/ |/ / _ \`/ _ \\/ // / __/ _ \`/  / /__/ / _ \\/ // / _  /  
/_/ |_|/_/  \\_,_/|___/\\_,_/_//_/\\_,_/\\__/\\_,_/   \\___/_/\\___/\\_,_/\\_,_/   
========================================================================
 Aravanta Cloud OS — Interactive Web CLI Terminal
 Connected to: https://arv-backend.vercel.app
 Type 'help' or 'aravanta --help' for available commands.
========================================================================
`;

export const CloudShell: React.FC<CloudShellProps> = ({ isOpen, onClose, token, user }) => {
  const [history, setHistory] = useState<HistoryItem[]>([
    { command: 'init', output: WELCOME_BANNER }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const username = user?.email ? user.email.split('@')[0] : 'cloud-operator';

  const runCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInputVal('');

    if (cmd.toLowerCase() === 'clear') {
      setHistory([]);
      return;
    }

    if (cmd.toLowerCase() === 'help' || cmd.toLowerCase() === 'aravanta --help' || cmd.toLowerCase() === 'aravanta -h') {
      const helpText = `Available Aravanta Cloud OS CLI commands:
  aravanta whoami                 Show active user, tenant & role
  aravanta org list               List accessible organizations
  aravanta project list           List cloud projects
  aravanta compute list           List active compute VM instances
  aravanta resource list          List all unified cloud resources
  aravanta compute create <name>  Launch a new compute instance
  aravanta compute stop <id>      Stop a compute instance
  aravanta compute start <id>     Start a compute instance
  aravanta version                Print CLI platform version
  clear                           Clear terminal screen`;
      setHistory((prev) => [...prev, { command: cmd, output: helpText }]);
      return;
    }

    if (cmd.toLowerCase() === 'aravanta version' || cmd.toLowerCase() === 'version') {
      setHistory((prev) => [...prev, { command: cmd, output: 'aravanta-cli v1.0.0 (API v1.0.0)' }]);
      return;
    }

    setLoading(true);

    try {
      if (cmd.startsWith('aravanta whoami') || cmd === 'whoami') {
        const res = await apiFetch<any>('/api/v1/auth/me', { token });
        const out = `User:     ${res.email}\nName:     ${res.full_name}\nRole:     ${res.role}\nAccount:  ${res.account_id || 'N/A'}`;
        setHistory((prev) => [...prev, { command: cmd, output: out }]);
      } else if (cmd.startsWith('aravanta org list') || cmd === 'org list') {
        const orgs = await apiFetch<any[]>('/api/v1/organizations', { token });
        if (!orgs || orgs.length === 0) {
          setHistory((prev) => [...prev, { command: cmd, output: 'No organizations found.' }]);
        } else {
          const rows = orgs.map(o => `ID: ${o.id.padEnd(20)} NAME: ${o.name.padEnd(25)} SLUG: ${o.slug}`).join('\n');
          setHistory((prev) => [...prev, { command: cmd, output: rows }]);
        }
      } else if (cmd.startsWith('aravanta project list') || cmd === 'project list') {
        const prjs = await apiFetch<any[]>('/api/v1/projects', { token });
        if (!prjs || prjs.length === 0) {
          setHistory((prev) => [...prev, { command: cmd, output: 'No projects found.' }]);
        } else {
          const rows = prjs.map(p => `ID: ${p.id.padEnd(20)} NAME: ${p.name.padEnd(25)} REGION: ${p.region}`).join('\n');
          setHistory((prev) => [...prev, { command: cmd, output: rows }]);
        }
      } else if (cmd.startsWith('aravanta compute list') || cmd === 'compute list') {
        const resList = await apiFetch<any[]>('/api/v1/resources?type=compute', { token });
        if (!resList || resList.length === 0) {
          setHistory((prev) => [...prev, { command: cmd, output: 'No compute instances running. Create one with: aravanta compute create <name>' }]);
        } else {
          const rows = resList.map(r => `ID: ${r.id.padEnd(18)} NAME: ${r.name.padEnd(20)} STATUS: ${r.status.padEnd(12)} IP: ${r.metadata?.private_ip || '10.240.0.1'}`).join('\n');
          setHistory((prev) => [...prev, { command: cmd, output: rows }]);
        }
      } else if (cmd.startsWith('aravanta resource list') || cmd === 'resource list') {
        const resList = await apiFetch<any[]>('/api/v1/resources', { token });
        if (!resList || resList.length === 0) {
          setHistory((prev) => [...prev, { command: cmd, output: 'No resources found.' }]);
        } else {
          const rows = resList.map(r => `ID: ${r.id.padEnd(18)} TYPE: ${r.type.padEnd(12)} STATUS: ${r.status.padEnd(12)} NAME: ${r.name}`).join('\n');
          setHistory((prev) => [...prev, { command: cmd, output: rows }]);
        }
      } else if (cmd.startsWith('aravanta compute create') || cmd.startsWith('compute create')) {
        const parts = cmd.split(/\s+/);
        const nameIdx = parts.findIndex(p => p === 'create') + 1;
        const name = parts[nameIdx] || `vm-${Date.now().toString().slice(-4)}`;
        
        // Find default project
        const prjs = await apiFetch<any[]>('/api/v1/projects', { token });
        const prjId = prjs && prjs.length > 0 ? prjs[0].id : 'default';

        const created = await apiFetch<any>('/api/v1/resources', {
          method: 'POST',
          token,
          body: JSON.stringify({
            name,
            type: 'compute',
            project_id: prjId,
            region: 'arv-us-east-1',
            spec: { cpu: 2, ram_mb: 4096, os_image: 'Ubuntu 22.04 LTS' }
          })
        });
        const out = `[SUCCESS] Instance created:\nID:       ${created.id}\nName:     ${created.name}\nStatus:   ${created.status}\nIP:       ${created.metadata?.private_ip || 'Provisioning...'}`;
        setHistory((prev) => [...prev, { command: cmd, output: out }]);
      } else if (cmd.startsWith('aravanta compute stop') || cmd.startsWith('compute stop')) {
        const parts = cmd.split(/\s+/);
        const id = parts[parts.length - 1];
        const res = await apiFetch<any>(`/api/v1/resources/${id}/actions`, {
          method: 'POST',
          token,
          body: JSON.stringify({ action: 'stop' })
        });
        setHistory((prev) => [...prev, { command: cmd, output: `Instance ${id} state updated to: ${res.status}` }]);
      } else if (cmd.startsWith('aravanta compute start') || cmd.startsWith('compute start')) {
        const parts = cmd.split(/\s+/);
        const id = parts[parts.length - 1];
        const res = await apiFetch<any>(`/api/v1/resources/${id}/actions`, {
          method: 'POST',
          token,
          body: JSON.stringify({ action: 'start' })
        });
        setHistory((prev) => [...prev, { command: cmd, output: `Instance ${id} state updated to: ${res.status}` }]);
      } else {
        setHistory((prev) => [
          ...prev,
          { command: cmd, output: `bash: ${cmd}: command not found. Type 'help' for available commands.`, isError: true }
        ]);
      }
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        { command: cmd, output: `Error: ${err?.message || 'Failed to execute command on API.'}`, isError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = historyIdx + 1 < cmdHistory.length ? historyIdx + 1 : historyIdx;
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[cmdHistory.length - 1 - nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[cmdHistory.length - 1 - nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 shadow-2xl flex flex-col ${
        isExpanded ? 'top-16 bg-[#0B132B]/95 backdrop-blur-md' : 'h-96 bg-[#0B132B] border-t border-slate-700'
      }`}
    >
      {/* Top Terminal Bar */}
      <div className="h-10 bg-[#070D1E] px-4 flex items-center justify-between border-b border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Aravanta Cloud Shell</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE API
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title={isExpanded ? 'Restore' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Close Terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-200 space-y-2 select-text">
        {history.map((h, i) => (
          <div key={i} className="space-y-1">
            {h.command !== 'init' && (
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="text-slate-400">{username}@aravanta:~$</span>
                <span>{h.command}</span>
              </div>
            )}
            <pre className={`whitespace-pre-wrap font-mono ${h.isError ? 'text-rose-400' : 'text-slate-300'}`}>
              {h.output}
            </pre>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-brandGold-400 text-xs py-1">
            <span className="animate-spin">/</span> Executing via Aravanta API...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Quick Commands */}
      <div className="px-4 py-1.5 bg-[#070D1E]/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] font-mono shrink-0">
        <span className="text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brandGold-400" /> Quick:
        </span>
        {['aravanta whoami', 'aravanta compute list', 'aravanta project list', 'aravanta resource list', 'help', 'clear'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => runCommand(cmd)}
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-brandGold-500/20 text-slate-300 hover:text-brandGold-300 border border-slate-700/60 hover:border-brandGold-500/40 shrink-0 transition-colors cursor-pointer"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input Prompt */}
      <div className="h-11 bg-[#070D1E] px-4 flex items-center gap-2 border-t border-slate-800 shrink-0">
        <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
          {username}@aravanta:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an aravanta command or 'help'..."
          disabled={loading}
          className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder-slate-500"
        />
        <button
          onClick={() => runCommand(inputVal)}
          disabled={loading || !inputVal.trim()}
          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 disabled:opacity-30 rounded transition-colors"
          title="Run (Enter)"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
