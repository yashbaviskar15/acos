import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';

interface FloatingSalesChatProps {
  onOpenConsole?: () => void;
}

export const FloatingSalesChat: React.FC<FloatingSalesChatProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [workload, setWorkload] = useState('Compute & Kubernetes');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsOpen(false);
      setEmail('');
    }, 2500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden text-slate-900"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    AC
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Enterprise Cloud Specialist</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Online • Instant Response</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 text-xs">
              {isSubmitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                  <h5 className="font-bold text-slate-900 text-sm">Inquiry Received!</h5>
                  <p className="text-slate-500 text-xs">
                    Our cloud solutions architect will contact you within 15 minutes.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <p className="text-slate-700 font-medium">
                      👋 Hi! Need custom cloud capacity, migration assistance, or invoice billing?
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Workload Requirements
                      </label>
                      <select
                        value={workload}
                        onChange={(e) => setWorkload(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                      >
                        <option value="Compute & Kubernetes">Compute VMs & Kubernetes Pools</option>
                        <option value="S3 Object Storage">S3 Storage & Content Delivery</option>
                        <option value="Managed Databases">Managed PostgreSQL / MySQL DBs</option>
                        <option value="Enterprise Custom SLA">Enterprise Custom SLA & Compliance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Enterprise Quote</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-2xl border border-slate-700 transition-all cursor-pointer group"
        aria-label="Talk to Sales"
      >
        <div className="relative">
          <MessageSquare className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <span className="hidden sm:inline">Talk to Sales</span>
      </motion.button>
    </div>
  );
};
