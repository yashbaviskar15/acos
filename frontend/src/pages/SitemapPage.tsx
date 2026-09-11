import React from 'react';
import { motion } from 'framer-motion';
import {
  Map,
  Layers,
  Cpu,
  BookOpen,
  Sparkles,
  Users,
  Code2,
  GraduationCap,
  Briefcase,
  Scale,
  Shield,
  FileText,
  AlertTriangle,
  Headphones,
  Mail,
  HelpCircle,
  ChevronRight,
  Rocket,
  DollarSign,
  Building2,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

interface SitemapLink {
  label: string;
  view?: LandingView;
  href?: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface SitemapGroup {
  title: string;
  subtitle: string;
  accent: 'gold' | 'emerald' | 'sky';
  icon: React.ComponentType<any>;
  links: SitemapLink[];
}

const groups: SitemapGroup[] = [
  {
    title: 'Product',
    subtitle: 'Platform services and documentation',
    accent: 'gold',
    icon: Layers,
    links: [
      { label: 'Get Started', view: 'getting-started', description: '5-minute quickstart guide', icon: Rocket },
      { label: 'Platform Features', view: 'features', description: 'Compute, K8s, Storage, Databases, CI/CD', icon: Cpu },
      { label: 'Documentation', view: 'documentation', description: 'API references, guides, and tutorials', icon: BookOpen },
      { label: 'Pricing', view: 'pricing', description: 'Usage-based plans in INR and USD', icon: DollarSign },
    ],
  },
  {
    title: 'Community',
    subtitle: 'Learn, build, and connect with engineers',
    accent: 'emerald',
    icon: Users,
    links: [
      { label: 'Beginners', view: 'getting-started', description: 'New to cloud? Start here.', icon: Sparkles },
      { label: 'Developers', view: 'community', description: 'SDKs, CLI tools, and Terraform provider', icon: Code2 },
      { label: 'Students', view: 'community', description: 'Fellowship program and campus chapters', icon: GraduationCap },
      { label: 'Professionals', view: 'community', description: 'Enterprise adoption and case studies', icon: Briefcase },
    ],
  },
  {
    title: 'Legal',
    subtitle: 'Policies, terms, and compliance',
    accent: 'gold',
    icon: Scale,
    links: [
      { label: 'Privacy Policy', view: 'privacy', description: 'Data handling and DPDPA compliance', icon: Shield },
      { label: 'Terms of Use', view: 'terms', description: 'Platform usage agreement', icon: FileText },
      { label: 'Disclaimer', view: 'disclaimer', description: 'SLA and shared responsibility', icon: AlertTriangle },
    ],
  },
  {
    title: 'Support',
    subtitle: 'Help, guidance, and human assistance',
    accent: 'sky',
    icon: Headphones,
    links: [
      { label: 'Contact Us', view: 'contact', description: 'Sales, support, and security contacts', icon: Mail },
      { label: 'FAQ', view: 'faq', description: 'Common platform questions answered', icon: HelpCircle },
      { label: 'About Us', view: 'about', description: 'Our story and engineering principles', icon: Building2 },
    ],
  },
];

const accentMap: Record<string, string> = {
  gold: 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

const badgeVariant: Record<string, string> = {
  gold: 'gold',
  emerald: 'success',
  sky: 'info',
};

export const SitemapPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const totalLinks = groups.reduce((sum, g) => sum + g.links.length, 0);
  const totalGroups = groups.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="sitemap"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'Sitemap' },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="pb-12 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 mb-12 text-center"
              >
                <Badge variant="gold" size="md" dot>
                  <Map className="w-3.5 h-3.5" /> {totalGroups} sections &middot; {totalLinks} pages
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                  Sitemap
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                  A complete, human-readable index of every page, section, and resource in Aravanta Cloud OS. Jump straight to what you need, or explore product areas and support channels from one place.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 gap-5">
                {groups.map((group, idx) => {
                  const GIcon = group.icon;
                  return (
                    <motion.div
                      key={group.title}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.45, delay: 0.06 * idx }}
                    >
                      <Card goldAccent>
                        <CardBody className="!p-6 sm:!p-8 space-y-5">
                          <div className="flex items-start gap-4 pb-1 border-b border-slate-100 dark:border-brandObsidian-700/60">
                            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${accentMap[group.accent]}`}>
                              <GIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                  {group.title}
                                </h2>
                                <Badge variant={badgeVariant[group.accent] as any} size="sm">
                                  {group.links.length} {group.links.length === 1 ? 'link' : 'links'}
                                </Badge>
                              </div>
                              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                                {group.subtitle}
                              </p>
                            </div>
                          </div>

                          <ul className="divide-y divide-slate-100 dark:divide-brandObsidian-700/40">
                            {group.links.map((link) => {
                              const LIcon = link.icon;
                              return (
                                <li key={link.label}>
                                  <button
                                    type="button"
                                    onClick={() => link.view && onNavigate?.(link.view)}
                                    className="w-full flex items-center gap-4 py-3.5 px-1 rounded-lg text-left transition-colors hover:bg-slate-50 dark:hover:bg-brandObsidian-700/30 group"
                                  >
                                    <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accentMap[group.accent]} transition-transform group-hover:scale-110`}>
                                      <LIcon className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors">
                                        {link.label}
                                      </div>
                                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {link.description}
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-brandGold-500 transition-colors shrink-0" />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-12"
              >
                <Card className="bg-gradient-to-br from-brandGold-50 via-white to-white dark:from-brandGold-600/10 dark:via-brandObsidian-900 dark:to-brandObsidian-900">
                  <CardBody className="!p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Ready to deploy?
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        Start with the free tier &mdash; no credit card required. Scale as you grow.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        size="lg"
                        variant="primary"
                        onClick={onGoToRegister}
                        rightIcon={<Rocket className="w-4.5 h-4.5" />}
                      >
                        Get Started Free
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
