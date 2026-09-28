import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ServiceCatalog } from './ServiceCatalog';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
  onGoToConsole?: () => void;
  token?: string | null;
  user?: any;
}

export const ServiceCatalogPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
  onGoToConsole,
  token = null,
  user,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        onGoToConsole={onGoToConsole}
        user={user}
        token={token}
        currentView="services"
      />

      <main>
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-4 sm:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Cloud Architecture' },
                { label: 'Service Catalog' },
              ]}
            />
          </div>
        </section>

        {/* Hero Title Strip */}
        <section className="pb-8 sm:pb-12 border-b border-slate-200/80 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3 max-w-3xl"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gold" size="sm" dot>
                    Service Inventory &amp; Catalog
                  </Badge>
                  <Badge variant="outline" size="sm" className="font-mono">
                    20+ Production Services
                  </Badge>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-mono font-medium">
                    ap-south-1 Sovereign
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  Cloud Infrastructure &amp; Platform Services Catalog
                </h1>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Browse the comprehensive catalog of Aravanta Cloud OS primitives. From virtual machines and managed Kubernetes to distributed S3 storage, serverless functions, and FinOps predictive AI.
                </p>
              </motion.div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onGoToRegister}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                  rightIcon={<Rocket className="w-4 h-4" />}
                >
                  Create Workspace
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onNavigate?.('features')}
                >
                  Features Matrix
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Embedded Service Catalog Container */}
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ServiceCatalog
              token={token}
              onNavigate={(tab) => {
                if (tab === 'pricing') onNavigate?.('pricing');
                else if (tab === 'docs') onNavigate?.('documentation');
                else if (tab === 'cli') onNavigate?.('cli');
                else if (tab === 'features') onNavigate?.('features');
                else if (token && onGoToConsole) {
                  onGoToConsole();
                } else if (onNavigate) {
                  onNavigate('features');
                }
              }}
            />
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} onGoToLogin={onGoToLogin} onGoToRegister={onGoToRegister} />
    </div>
  );
};
