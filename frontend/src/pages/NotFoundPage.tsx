import React from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  ArrowLeft,
  Home,
  Compass,
  FileCode,
  Search,
  LifeBuoy,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';

interface NotFoundPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  requestedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  requestedPath,
}) => {
  const currentPath = requestedPath || (typeof window !== 'undefined' ? window.location.pathname : '/unknown');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="not-found"
      />

      <main className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl text-center">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Badge variant="warning" size="md" dot>
              Status: 404 Not Found
            </Badge>
            <Badge variant="outline" size="md">
              Control Plane Routing
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Resource Endpoint{' '}
            <span className="bg-gradient-to-r from-brandGold-600 via-brandGold-500 to-amber-400 bg-clip-text text-transparent">
              Unreachable
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed"
          >
            The control plane endpoint or resource route you requested does not exist or has been decommissioned across current clusters.
          </motion.p>

          {/* Terminal Diagnostics Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-8 text-left"
          >
            <Card className="bg-[#0F172A] border-slate-800 text-slate-300 font-mono text-xs overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-[11px] text-slate-400 font-medium">arv-gateway-triage</span>
                </div>
                <span className="text-[10px] text-slate-500">HTTP/2.0 — ERR_NOT_FOUND</span>
              </div>
              <CardBody className="p-4 space-y-2 text-[11px] sm:text-xs">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>ROUTE_LOOKUP_FAILURE: Target route table returned 0 matches</span>
                </div>
                <div className="text-slate-400 pl-5">
                  Requested Path: <span className="text-brandGold-400">{currentPath}</span>
                </div>
                <div className="text-slate-500 pl-5 text-[10px]">
                  Tracing ID: arv-trace-node-mumbai • Region: in-south-1 (Mumbai)
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              variant="primary"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
              onClick={() => onNavigate ? onNavigate('home') : onGoToLogin()}
            >
              Return to Home
            </Button>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<Compass className="w-4 h-4" />}
              onClick={() => onNavigate ? onNavigate('features') : onGoToLogin()}
            >
              Explore Features
            </Button>

            {onOpenCommandPalette && (
              <Button
                variant="outline"
                size="md"
                leftIcon={<Search className="w-4 h-4" />}
                onClick={onOpenCommandPalette}
              >
                Search (Ctrl+K)
              </Button>
            )}

            <Button
              variant="ghost"
              size="md"
              leftIcon={<LifeBuoy className="w-4 h-4" />}
              onClick={() => onNavigate ? onNavigate('contact') : undefined}
            >
              Contact Support
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} onGoToLogin={onGoToLogin} />
    </div>
  );
};
