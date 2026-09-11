import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, X, Send, Sparkles, Shield, Trash2, 
  Maximize2, Minimize2, CheckCircle2, ChevronRight, ExternalLink
} from 'lucide-react';
import { apiFetch } from '../../config/api';

export interface ConsoleCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

interface MetricCard {
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  content: string;
  timestamp: string;
  intent?: string;
  citations?: string[];
  suggestedFollowups?: string[];
  metricCards?: MetricCard[];
}

export const ConsoleCopilot: React.FC<ConsoleCopilotProps> = ({
  isOpen,
  onClose,
  currentTab = 'dashboard',
  onNavigate
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'copilot',
      content: "### Welcome to Console Copilot\nI am your read-only infrastructure assistant, grounded live in **ArvWatch Observability Hub** (Prometheus, Loki, eBPF) and internal runbooks.\n\nAsk me anything about your virtual machines, Kubernetes cluster health, billing spend, or release deployments.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: ['[Doc: architecture.md]', '[Telemetry: Prometheus Hub]'],
      suggestedFollowups: [
        'What is the status of my virtual machines?',
        'Check Kubernetes cluster health',
        'How much have we spent this month?',
        'Are there any firing alerts?'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch contextual suggestions when current tab changes
  useEffect(() => {
    if (isOpen) {
      apiFetch<{ tab: string; suggestions: string[] }>(`/api/v1/ai/copilot/suggestions?tab=${currentTab}`)
        .then((res) => {
          if (res && res.suggestions) {
            setSuggestions(res.suggestions);
          }
        })
        .catch(() => {
          setSuggestions([
            'What is the status of my infrastructure?',
            'Check Kubernetes pod status',
            'Explain our per-second billing'
          ]);
        });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [currentTab, isOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Keyboard shortcut listener: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiFetch<{
        reply: string;
        intent: string;
        citations: string[];
        suggested_followups: string[];
        metric_cards: MetricCard[];
      }>('/api/v1/ai/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          tab_context: currentTab
        })
      });

      const copilotMessage: Message = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        citations: response.citations,
        suggestedFollowups: response.suggested_followups,
        metricCards: response.metric_cards
      };

      setMessages((prev) => [...prev, copilotMessage]);
    } catch {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        content: "I encountered an issue connecting to the Aravanta AI grounding service. Please ensure the backend is running and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: ['[Error: Telemetry Timeout]']
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'copilot',
        content: "Chat history cleared. How can I assist you with your infrastructure?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowups: [
          'What is the status of my virtual machines?',
          'Check Kubernetes cluster health',
          'Show billing breakdown'
        ]
      }
    ]);
  };

  const handleIntentNavigation = (intent?: string) => {
    if (!onNavigate || !intent) return;
    const tabMap: Record<string, string> = {
      compute_status: 'compute',
      k8s_status: 'kubernetes',
      billing_status: 'billing',
      deployment_status: 'deployments',
      runbook_triage: 'incidents'
    };
    const target = tabMap[intent];
    if (target) {
      onNavigate(target);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none animate-fadeIn">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <aside 
        className={`relative z-10 h-full bg-white dark:bg-[#0F1E34] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col pointer-events-auto transition-all duration-300 ${
          isExpanded ? 'w-full md:w-[720px]' : 'w-full md:w-[480px]'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0A1628]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brandGold-400 to-brandGold-600 flex items-center justify-center shadow-md shadow-brandGold-500/20 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight font-sans">
                  Console Copilot
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 border border-brandGold-500/20">
                  AI v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Grounded via Observability Hub & Docs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block cursor-pointer"
              title={isExpanded ? 'Collapse view' : 'Expand view'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={clearChat}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Copilot (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Read-Only Safety Banner */}
        <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Read-Only Guardrail: Enforced (No state mutations)</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase">Tab: {currentTab}</span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {msg.sender === 'user' ? 'You' : 'Aravanta Copilot'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-brandGold-600 to-brandGold-500 text-white rounded-br-xs font-medium'
                    : 'bg-slate-100 dark:bg-[#132742] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 rounded-bl-xs'
                }`}
              >
                {/* Message Body with Markdown formatting support */}
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.content.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="font-bold text-sm text-brandGold-600 dark:text-brandGold-400 pt-1 pb-0.5">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 ml-1">
                          <span className="text-brandGold-500 font-bold">•</span>
                          <span>{line.replace('- ', '')}</span>
                        </div>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>

                {/* Structured Metric Cards */}
                {msg.metricCards && msg.metricCards.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    {msg.metricCards.map((card, cIdx) => (
                      <div 
                        key={cIdx}
                        className="bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                      >
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{card.label}</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono mt-0.5 truncate">{card.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Source Citations & Deep Link */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/40 flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Grounded Sources:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cite, cIdx) => (
                        <span 
                          key={cIdx} 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{cite}</span>
                        </span>
                      ))}
                    </div>

                    {msg.intent && onNavigate && (
                      <button
                        onClick={() => handleIntentNavigation(msg.intent)}
                        className="self-start mt-1 text-[11px] font-mono text-brandGold-600 dark:text-brandGold-400 hover:text-brandGold-700 dark:hover:text-brandGold-300 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>View in {msg.intent.split('_')[0].toUpperCase()} Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Follow-up suggestion pills */}
              {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.suggestedFollowups.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(sug)}
                      className="text-[11px] text-left px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-brandGold-50 dark:hover:bg-brandGold-950/40 text-slate-700 dark:text-slate-300 hover:text-brandGold-700 dark:hover:text-brandGold-400 border border-slate-200 dark:border-slate-700/80 hover:border-brandGold-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{sug}</span>
                      <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-[#132742] rounded-2xl rounded-bl-xs border border-slate-200 dark:border-slate-800 max-w-[240px]">
              <div className="w-4 h-4 border-2 border-brandGold-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Querying Observability Hub...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock & Prompt Suggestions */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0A1628]/90 shrink-0">
          {/* Contextual Pills */}
          {suggestions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brandGold-500" />
                Suggested:
              </span>
              {suggestions.slice(0, 3).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brandGold-500/40 hover:text-brandGold-600 shrink-0 truncate max-w-[200px] transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Ask Copilot about ${currentTab} or infrastructure...`}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#10223B] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brandGold-500 focus:ring-1 focus:ring-brandGold-500/30 transition-all font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-brandGold-500 to-brandGold-600 hover:from-brandGold-600 hover:to-brandGold-700 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brandGold-500/20 shrink-0 cursor-pointer"
              title="Send question (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
            <span>Press Enter to send</span>
            <span>Aravanta Cloud OS AI Agent Layer</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
