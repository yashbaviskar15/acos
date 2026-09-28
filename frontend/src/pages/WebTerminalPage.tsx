import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Code2, Terminal, Download, ShieldCheck } from 'lucide-react';
import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { CLIPage } from './CLIPage';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  token?: string | null;
  user?: any;
}

export const WebTerminalPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  token = null,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'install' | 'reference'>('terminal');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors flex flex-col justify-between">
      <div>
        <Navbar
          onGoToLogin={onGoToLogin}
          onGoToRegister={onGoToRegister}
          onOpenCommandPalette={onOpenCommandPalette}
          onNavigate={onNavigate}
          currentView="cli"
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-6">
          {/* Top Bar: Breadcrumbs + Live Telemetry Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Developer Tools' },
                { label: 'Interactive Web Terminal' },
              ]}
            />

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE CONTROL PLANE
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-200 dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-brandObsidian-700">
                arv CLI v2.4
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-brandGold-500" />
                Zero-Install Sandbox
              </span>
            </div>
          </div>

          {/* Compact Header & Integrated Tab Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/90 dark:border-brandObsidian-800 mb-4"
          >
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-brandGold-500/15 text-brandGold-600 dark:text-brandGold-400 border border-brandGold-500/30 shrink-0">
                  <Terminal className="w-5 h-5" />
                </span>
                Interactive Cloud Shell &amp; Terminal Console
              </h1>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                Execute cloud commands, manage virtual machines, query Kubernetes pods, inspect S3 buckets, and view real-time API logs directly from your browser.
              </p>
            </div>

            {/* View Selector Tabs & Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Segmented Control */}
              <div className="flex items-center p-1 bg-slate-200/80 dark:bg-brandObsidian-900 border border-slate-300/80 dark:border-brandObsidian-800 rounded-xl shadow-xs">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'terminal'
                      ? 'bg-white dark:bg-brandObsidian-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Web Terminal</span>
                </button>
                <button
                  onClick={() => setActiveTab('install')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'install'
                      ? 'bg-white dark:bg-brandObsidian-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>Install CLI</span>
                </button>
                <button
                  onClick={() => setActiveTab('reference')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'reference'
                      ? 'bg-white dark:bg-brandObsidian-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-brandGold-500" />
                  <span>Reference</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onGoToRegister}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold whitespace-nowrap"
                  rightIcon={<Rocket className="w-3.5 h-3.5" />}
                >
                  Launch Workspace
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.('documentation')}
                  leftIcon={<Code2 className="w-3.5 h-3.5" />}
                  className="whitespace-nowrap"
                >
                  Docs
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Interactive Shell Content */}
          <div className="w-full">
            <CLIPage
              token={token}
              user={user}
              activeView={activeTab}
              onViewChange={setActiveTab}
              hideTopCard={true}
              terminalHeightClass="h-[calc(100vh-215px)] min-h-[460px] max-h-[720px]"
            />
          </div>
        </main>
      </div>

      <Footer onNavigate={onNavigate} onGoToLogin={onGoToLogin} onGoToRegister={onGoToRegister} />
    </div>
  );
};
