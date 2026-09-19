import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  suggestedFollowups?: string[];
  isFallback?: boolean;
}

interface FloatingSalesChatProps {
  onOpenConsole?: () => void;
}

const STORAGE_KEY = 'aravanta_ai_support_chat_v1';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-initial',
  sender: 'bot',
  text: 'Hello, I am the Aravanta AI Cloud Assistant. I can help you with cloud infrastructure, transparent INR pricing, low-latency Mumbai and Delhi sovereign regions, ArvK8s clusters, SOC 2 compliance, and 99.99% SLA guarantees. How can I assist you today?',
  timestamp: 'Just now',
  suggestedFollowups: [
    'What are your pricing plans in INR?',
    'How do I deploy a container?',
    'Is my data stored in India?',
    'What compliance certifications do you have?',
  ],
};

/**
 * Parses markdown bold (**text**), code blocks, and list items into clean JSX.
 * Automatically strips any unicode emojis to adhere strictly to the no-emoji requirement.
 */
function renderFormattedMessage(text: string) {
  // Strip any emoji characters (including flags, symbols, pictographs)
  const noEmojiText = text.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ''
  );

  const lines = noEmojiText.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
        const cleanContent = isBullet ? trimmed.replace(/^[•-]\s*/, '') : line;

        // Split on **bold** chunks
        const segments = cleanContent.split(/(\*\*[^*]+\*\*)/g);

        const renderedSegments = segments.map((seg, segIdx) => {
          if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
            return (
              <strong key={segIdx} className="font-semibold text-slate-900 dark:text-white">
                {seg.slice(2, -2)}
              </strong>
            );
          }
          if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
            return (
              <code
                key={segIdx}
                className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-brandGold-700 dark:text-brandGold-400"
              >
                {seg.slice(1, -1)}
              </code>
            );
          }
          return seg;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-0.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-brandGold-500 mt-1.5 shrink-0" />
              <span className="flex-1 leading-relaxed">{renderedSegments}</span>
            </div>
          );
        }

        return (
          <p key={lineIdx} className="leading-relaxed">
            {renderedSegments}
          </p>
        );
      })}
    </div>
  );
}

export const FloatingSalesChat: React.FC<FloatingSalesChatProps> = ({ onOpenConsole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from sessionStorage', e);
    }
    return [INITIAL_MESSAGE];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist chat messages to sessionStorage', e);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleClearChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const getGroundedFallbackResponse = (query: string): { reply: string; followups: string[]; isFallback: boolean } => {
    const q = query.toLowerCase();

    if (q.includes('pric') || q.includes('cost') || q.includes('inr') || q.includes('rupee') || q.includes('rate') || q.includes('plan')) {
      return {
        reply: "Aravanta Cloud OS offers transparent, pay-as-you-go billing priced in Indian Rupees (INR) with zero currency conversion fees:\n\n• **Compute VMs**: Starting at INR 249/mo (INR 0.35/hr) with dedicated vCPUs and NVMe SSDs\n• **Managed Kubernetes (ArvK8s)**: Free control plane; pay only for worker nodes with auto-scaling\n• **ArvS3 Object Storage**: INR 0.99/GB/month with 99.999999999% durability and zero egress fees within Indian regions\n• **Managed Databases**: High-availability PostgreSQL, MySQL, and Redis clusters from INR 699/mo\n• **AI Clusters**: On-demand NVIDIA H100 and A100 instances with hourly billing.",
        followups: ['How do I deploy a container?', 'Is my data stored in India?'],
        isFallback: false,
      };
    }

    if (q.includes('contain') || q.includes('deploy') || q.includes('k8s') || q.includes('kubernetes') || q.includes('docker')) {
      return {
        reply: "Deploying containers on Aravanta Cloud OS is fast and cloud-native:\n\n1. **ArvK8s Engine**: Connect via standard `kubectl` using downloadable Kubeconfig or the Web Terminal.\n2. **GitOps and CI/CD**: Connect GitHub or GitLab for automatic container builds and rollout on git push.\n3. **Serverless Containers**: Deploy pre-built Docker containers instantly with automated TLS certificates and load balancing.",
        followups: ['What are your pricing plans in INR?', 'What compliance certifications do you have?'],
        isFallback: false,
      };
    }

    if (q.includes('india') || q.includes('region') || q.includes('mumbai') || q.includes('delhi') || q.includes('residency') || q.includes('sovereign')) {
      return {
        reply: "Yes, all your customer data and compute workloads remain strictly within Indian borders:\n\n• **Mumbai Region (ap-south-mumbai-1)**: Tier-4 sovereign facility with sub-5ms latency across West and South India\n• **Delhi-NCR Region (ap-north-delhi-1)**: High-resilience sovereign zone for North and East India\n• **Data Sovereignty**: 100% compliant with the Indian Digital Personal Data Protection (DPDP) Act and RBI data localization directives.",
        followups: ['What compliance certifications do you have?', 'What are your pricing plans in INR?'],
        isFallback: false,
      };
    }

    if (q.includes('complian') || q.includes('cert') || q.includes('security') || q.includes('sla') || q.includes('iso') || q.includes('soc')) {
      return {
        reply: "Aravanta Cloud OS is engineered for enterprise-grade security and reliability:\n\n• **99.99% Uptime SLA**: Contractually backed with financial service credits\n• **Certifications**: SOC 2 Type II, ISO 27001, HIPAA, and PCI-DSS Level 1 compliance\n• **Hardware Isolation**: AMD SEV-SNP confidential computing, automated DDoS mitigation up to 2.5 Tbps, and AES-256 encryption at rest and in transit.",
        followups: ['Is my data stored in India?', 'What are your pricing plans in INR?'],
        isFallback: false,
      };
    }

    if (q.includes('human') || q.includes('contact') || q.includes('talk') || q.includes('sales') || q.includes('support') || q.includes('architect')) {
      return {
        reply: "Our enterprise cloud architects and technical support engineers are available 24/7/365 in India. You can connect with our solutions team directly at support@aravanta.cloud or submit an enterprise inquiry below.",
        followups: ['What are your pricing plans in INR?', 'Is my data stored in India?'],
        isFallback: true,
      };
    }

    return {
      reply: "I can answer questions regarding Aravanta Cloud OS architecture, INR pricing, ArvK8s, object storage, and our Mumbai and Delhi regions. If your inquiry requires a custom deployment or migration assistance, our solutions team is ready to assist.",
      followups: ['What are your pricing plans in INR?', 'Is my data stored in India?', 'Talk to a Human'],
      isFallback: true,
    };
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    let reply = '';
    let followups: string[] = [];
    let isFallback = false;

    try {
      const response = await apiFetch<{
        reply?: string;
        suggested_followups?: string[];
        is_fallback?: boolean;
      }>('/api/v1/ai/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          tab_context: 'landing',
        }),
        skipRetry: true,
      });

      if (response && response.reply) {
        reply = response.reply;
        followups = response.suggested_followups || [];
        isFallback = !!response.is_fallback;
      } else {
        const fallback = getGroundedFallbackResponse(text);
        reply = fallback.reply;
        followups = fallback.followups;
        isFallback = fallback.isFallback;
      }
    } catch {
      const fallback = getGroundedFallbackResponse(text);
      reply = fallback.reply;
      followups = fallback.followups;
      isFallback = fallback.isFallback;
    } finally {
      setIsTyping(false);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowups: followups.length > 0 ? followups : undefined,
        isFallback,
      };
      setMessages((prev) => [...prev, botMessage]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-[410px] max-w-[420px] h-[560px] max-h-[82vh] bg-white dark:bg-brandObsidian-950 border border-slate-200 dark:border-brandObsidian-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
          >
            {/* Header: White/Light surface with dark mode support */}
            <div className="px-4 py-3.5 bg-slate-50 dark:bg-brandObsidian-900 border-b border-slate-200 dark:border-brandObsidian-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-brandGold-500/15 dark:bg-brandGold-500/20 border border-brandGold-500/30 flex items-center justify-center text-brandGold-700 dark:text-brandGold-400 shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-brandObsidian-900 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                      Aravanta AI Support
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-brandGold-500/15 text-brandGold-700 dark:text-brandGold-400 border border-brandGold-500/30">
                      ArvAI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Online • 99.99% SLA • Mumbai and Delhi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Clear conversation"
                  aria-label="Clear chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Service Badges Ribbon */}
            <div className="px-4 py-1.5 bg-slate-100/70 dark:bg-brandObsidian-900/80 border-b border-slate-200/80 dark:border-brandObsidian-800/80 flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 shrink-0">
              <span className="flex items-center gap-1 text-brandGold-700 dark:text-brandGold-400 font-semibold">
                <ShieldCheck className="w-3 h-3" /> SOC 2 Type II
              </span>
              <span>INR Hourly Billing</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tier-4 DCs</span>
            </div>

            {/* Message Body: Light background, adaptive dark */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/50 dark:bg-brandObsidian-950/60">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brandGold-500 text-brandObsidian-950 font-medium rounded-tr-xs shadow-xs'
                        : 'bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {renderFormattedMessage(msg.text)}
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 px-1">
                    {msg.timestamp}
                  </span>

                  {/* Suggestions and action buttons */}
                  {msg.sender === 'bot' && (
                    <div className="mt-2 space-y-2 w-full">
                      {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.suggestedFollowups.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(suggestion)}
                              className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 hover:border-brandGold-500 hover:bg-brandGold-50/50 dark:hover:bg-brandGold-500/10 text-slate-700 dark:text-slate-300 hover:text-brandGold-700 dark:hover:text-brandGold-400 transition-all text-left cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-brandGold-500 shrink-0" />
                              <span>{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.isFallback && (
                        <div className="flex items-center gap-2 pt-1.5">
                          <a
                            href="mailto:support@aravanta.cloud?subject=Enterprise%20Cloud%20OS%20Inquiry"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Talk to Support</span>
                          </a>
                          {onOpenConsole && (
                            <button
                              onClick={onOpenConsole}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                              <span>Open Console</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-700 rounded-2xl rounded-tl-xs max-w-[100px] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-brandGold-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brandGold-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brandGold-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input form: White theme, dark adaptive */}
            <div className="p-3 bg-white dark:bg-brandObsidian-950 border-t border-slate-200 dark:border-brandObsidian-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about pricing, K8s, Mumbai region..."
                  disabled={isTyping}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-brandObsidian-900 border border-slate-300 dark:border-brandObsidian-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brandGold-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="p-2.5 rounded-xl bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer shrink-0 font-bold"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Grounded in CloudOS Docs
                </span>
                <span>ESC to minimize</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Bubble: White surface with gold accent */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-brandObsidian-900 text-slate-900 dark:text-white font-bold text-xs rounded-full shadow-xl border border-slate-200 dark:border-brandObsidian-700 hover:border-brandGold-500 transition-all cursor-pointer group"
        aria-label="AI Cloud Assistant"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-brandGold-500/15 border border-brandGold-500/40 flex items-center justify-center text-brandGold-700 dark:text-brandGold-400 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-brandObsidian-900" />
        </div>
        <div className="flex flex-col text-left">
          <span className="leading-tight text-slate-900 dark:text-white font-semibold">AI Support</span>
          <span className="text-[10px] text-brandGold-700 dark:text-brandGold-400 font-mono font-medium">Instant Answers</span>
        </div>
      </motion.button>
    </div>
  );
};
