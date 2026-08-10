import React from 'react';
import { Logo } from '../Logo';

interface FooterProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoToLogin, onGoToRegister }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f1419] text-slate-400 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main footer content */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-x-8 gap-y-10">

          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4 space-y-4 pr-8">
            <Logo size="md" variant="dark" />
            <p className="text-[13px] leading-relaxed text-slate-500 max-w-xs">
              Deploy VMs, Kubernetes clusters, S3 storage, and managed databases from a single cloud console.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              All systems operational
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Products</h5>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">ArvCompute</a></li>
              <li><a href="#features" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">ArvKube</a></li>
              <li><a href="#features" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">ArvStore</a></li>
              <li><a href="#features" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">ArvDB</a></li>
              <li><a href="#features" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">ArvWatch</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Resources</h5>
            <ul className="space-y-2.5">
              <li><a href="#pricing" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">Pricing</a></li>
              <li><a href="#faq" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">FAQ</a></li>
              <li><a href="#features" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">Documentation</a></li>
              <li><a href="#features" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">API Reference</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Company</h5>
            <ul className="space-y-2.5">
              <li><a href="#faq" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">Privacy</a></li>
              <li><a href="#faq" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">Terms</a></li>
              <li><a href="#faq" className="text-[13px] text-slate-500 hover:text-slate-200 transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Account */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Account</h5>
            <div className="space-y-2.5">
              <button
                onClick={onGoToLogin}
                className="block text-[13px] text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={onGoToRegister}
                className="block text-[13px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Start free trial →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-600">
          <span>© {currentYear} Aravanta CloudOS</span>
          <span>Built in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
};
