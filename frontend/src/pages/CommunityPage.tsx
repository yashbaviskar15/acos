import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Code2,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Github,
  Users,
  TrendingUp,
  MessageSquare,
  Rocket,
  BookMarked,
  Video,
  Hash,
  TerminalSquare,
  Package,
  ScrollText,
  GitPullRequest,
  Award,
  Lightbulb,
  Building2,
  ClipboardCheck,
  Trophy,
  Calendar,
  Sparkles,
  Target,
  FileCheck2,
  Server,
} from 'lucide-react';

import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import {
  TabContainer,
  TabList,
  Tab,
  TabPanel,
} from '../components/ui/Tabs';

interface PageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (view: LandingView) => void;
}

const communityStats = [
  { label: 'Engineers', value: '12,000+', icon: Users },
  { label: 'Contributors', value: '450+', icon: TrendingUp },
  { label: 'Discord Members', value: '3,200+', icon: MessageSquare },
  { label: 'Latest Release', value: 'v2.4', icon: Rocket },
];

const beginnersCards = [
  {
    icon: BookOpen,
    title: 'Getting Started Guide',
    body: 'Step-by-step walkthrough for creating your first workspace, deploying a VM, and connecting to your infrastructure via the Aravanta CLI.',
    cta: 'Read Guide',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    body: 'Watch 20+ curated videos covering compute provisioning, Kubernetes basics, storage management, and CI/CD pipeline setup.',
    cta: 'Watch Videos',
    ctaVariant: 'outline' as const,
  },
  {
    icon: BookMarked,
    title: 'Cloud Glossary',
    body: 'A-to-Z reference of cloud terminology &#8212; from VPCs and subnets to load balancers, autoscaling groups, and observability stacks.',
    cta: 'Browse Glossary',
    ctaVariant: 'outline' as const,
  },
  {
    icon: Server,
    title: 'Architecture Templates',
    body: 'Reference architectures for common workloads: 3-tier web apps, event-driven microservices, data pipelines, and ML inference endpoints.',
    cta: 'View Templates',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Hash,
    title: '#beginners Discord Channel',
    body: 'A dedicated space for first questions. Community mentors are online daily to help you get unblocked &#8212; no question is too basic.',
    cta: 'Join #beginners',
    ctaVariant: 'outline' as const,
  },
];

const developersCards = [
  {
    icon: ScrollText,
    title: 'API Documentation',
    body: 'Full REST API reference with OpenAPI 3.1 spec, request/response examples, pagination guides, and interactive playground.',
    cta: 'Open API Docs',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Github,
    title: 'GitHub Repository',
    body: 'The open-source home for the Aravanta CLI, Terraform provider, Go/Python/Node SDKs, and infrastructure templates.',
    cta: 'View on GitHub',
    ctaVariant: 'outline' as const,
  },
  {
    icon: GitPullRequest,
    title: 'Contribution Guide',
    body: 'Everything you need to land your first PR: dev setup, testing workflow, commit conventions, and code review expectations.',
    cta: 'Read Guide',
    ctaVariant: 'outline' as const,
  },
  {
    icon: TerminalSquare,
    title: 'Code Snippets',
    body: 'Copy-paste CLI commands and install scripts for quick setup.',
    snippet: [
      { label: 'Install CLI', code: 'npm install -g @aravanta/cli' },
      { label: 'Init project', code: 'arv init --template microservice' },
    ],
    cta: 'Copy Snippets',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Package,
    title: 'SDK Packages',
    body: 'arv-go v1.2, arv-python v1.1, arv-node v1.3 &#8212; lightweight, typed, and tree-shakeable. Zero runtime dependencies.',
    cta: 'View Packages',
    ctaVariant: 'outline' as const,
  },
];

const studentsCards = [
  {
    icon: GraduationCap,
    title: 'Learning Resources',
    body: 'University-aligned curriculum: cloud architecture fundamentals, DevOps practices, SRE principles, and infrastructure-as-code.',
    cta: 'Browse Curriculum',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Briefcase,
    title: 'Internship Opportunities',
    body: 'Paid remote internships in platform engineering, SRE, and developer tooling. Work alongside senior engineers on production systems.',
    cta: 'Apply Now',
    ctaVariant: 'outline' as const,
  },
  {
    icon: Lightbulb,
    title: 'Project Ideas',
    body: 'Curated mini-projects to build your cloud skills.',
    projects: [
      'Deploy a microservices app with ArvKube',
      'Set up a full CI/CD pipeline with GitOps',
      'Build a monitoring dashboard with Grafana',
    ],
    cta: 'See All Ideas',
    ctaVariant: 'outline' as const,
  },
  {
    icon: Award,
    title: 'Certification Program',
    body: 'Aravanta Certified Cloud Engineer &#8212; online exam with hands-on projects. Verified badge for LinkedIn and partner job boards.',
    cta: 'Get Certified',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Calendar,
    title: 'Hackathons & Events',
    body: 'Monthly virtual cloud hackathons with prizes, mentorship from core engineers, and opportunities to ship features to production.',
    cta: 'See Upcoming',
    ctaVariant: 'outline' as const,
  },
];

const professionalsCards = [
  {
    icon: Building2,
    title: 'Case Studies',
    body: 'Deep dives into real-world deployments: fintech migration to multi-cloud, e-commerce scaling during flash sales, and healthcare data residency compliance.',
    cta: 'Read Case Studies',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Target,
    title: 'Enterprise Adoption Guide',
    body: 'A proven 90-day rollout playbook for large teams: governance setup, platform integration, training plan, and KPI tracking.',
    cta: 'Download Playbook',
    ctaVariant: 'outline' as const,
  },
  {
    icon: ClipboardCheck,
    title: 'On-Site Training',
    body: 'Custom 2&#8211;5 day workshops for your engineering teams. Tailored to your workloads, delivered by core Aravanta platform engineers.',
    cta: 'Book a Workshop',
    ctaVariant: 'outline' as const,
  },
  {
    icon: FileCheck2,
    title: 'Governance & Compliance',
    body: 'Audit-ready documentation: SOC 2 Type II reports, ISO 27001 alignment, DPDPA mapping, and procurement-friendly SOW templates.',
    cta: 'Review Docs',
    ctaVariant: 'primary' as const,
  },
  {
    icon: Trophy,
    title: 'Customer Success Stories',
    body: 'How teams achieved 3x deployment speed, 60% infrastructure cost reduction, and 99.99% uptime after adopting Aravanta Cloud OS.',
    cta: 'Read Stories',
    ctaVariant: 'outline' as const,
  },
];

const joinCards = [
  {
    platform: 'Discord',
    icon: MessageCircle,
    description:
      'Real-time chat with 3,200+ engineers. Channels for compute, Kubernetes, storage, databases, and a dedicated #beginners support channel.',
    link: 'https://discord.gg/aravanta',
    accent: 'from-brandGold-500/20 to-amber-500/5',
  },
  {
    platform: 'GitHub Discussions',
    icon: Github,
    description:
      'Long-form conversations about RFCs, roadmap proposals, feature requests, and release notes. Threads are preserved and searchable.',
    link: 'https://github.com/aravanta/cloud-os/discussions',
    accent: 'from-slate-500/20 to-slate-500/5',
  },
  {
    platform: 'Slack',
    icon: Hash,
    description:
      'Enterprise workspace for partner organisations and large teams. Private channels, SSO integration, and designated community managers.',
    link: 'https://aravanta.slack.com',
    accent: 'from-rose-500/20 to-orange-500/5',
  },
];

const renderCards = (cards: any[]) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
    {cards.map((card, idx) => {
      const CIcon = card.icon;
      return (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.04 * idx }}
        >
          <Card hover className="h-full group">
            <CardBody className="!p-5 sm:!p-6 h-full flex flex-col space-y-4">
              <div className="w-11 h-11 rounded-xl bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center transition-colors group-hover:bg-brandGold-500 group-hover:text-white duration-300">
                <CIcon className="w-5.5 h-5.5" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: card.body }} />
                {card.snippet && (
                  <div className="space-y-1.5 pt-1">
                    {card.snippet.map((s: any) => (
                      <div key={s.label} className="rounded-lg bg-slate-100 dark:bg-brandObsidian-900 px-3 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{s.label}</div>
                        <code className="text-xs font-mono text-brandGold-700 dark:text-brandGold-300">{s.code}</code>
                      </div>
                    ))}
                  </div>
                )}
                {card.projects && (
                  <ul className="space-y-1 pt-1">
                    {card.projects.map((p: string) => (
                      <li key={p} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brandGold-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button size="sm" variant={card.ctaVariant} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                {card.cta}
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      );
    })}
  </div>
);

export const CommunityPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="community"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'Community' },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6 mb-10"
            >
              <Badge variant="gold" size="md" dot>
                <Users className="w-3.5 h-3.5" /> Open community
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                Aravanta Cloud OS Community
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Join 12,000+ cloud engineers building, deploying, and operating infrastructure on Aravanta. Whether you&apos;re shipping your first container or managing a fleet of Kubernetes clusters, there&apos;s a place for you.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-14"
            >
              {communityStats.map((s) => {
                const SIcon = s.icon;
                return (
                  <Card key={s.label}>
                    <CardBody className="!p-4 sm:!p-5 text-center space-y-1.5">
                      <div className="w-9 h-9 mx-auto rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center">
                        <SIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                        {s.value}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {s.label}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TabContainer defaultValue="beginners">
              <TabList>
                <Tab value="beginners"><Sparkles className="w-4 h-4" /> Beginners</Tab>
                <Tab value="developers"><Code2 className="w-4 h-4" /> Developers</Tab>
                <Tab value="students"><GraduationCap className="w-4 h-4" /> Students</Tab>
                <Tab value="professionals"><Briefcase className="w-4 h-4" /> Professionals</Tab>
              </TabList>

              <TabPanel value="beginners">
                {renderCards(beginnersCards)}
              </TabPanel>

              <TabPanel value="developers">
                {renderCards(developersCards)}
              </TabPanel>

              <TabPanel value="students">
                {renderCards(studentsCards)}
              </TabPanel>

              <TabPanel value="professionals">
                {renderCards(professionalsCards)}
              </TabPanel>
            </TabContainer>
          </div>
        </section>

        <section className="pb-16 sm:pb-24 border-t border-slate-200 dark:border-brandObsidian-800 pt-16 sm:pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 mb-10"
            >
              <Badge variant="gold" size="md" dot>
                <MessageCircle className="w-3.5 h-3.5" /> Join the conversation
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Connect with the community
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Choose your preferred platform. All channels are monitored by Aravanta engineers and community moderators.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {joinCards.map((j, idx) => {
                const JIcon = j.icon;
                return (
                  <motion.div
                    key={j.platform}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.06 * idx }}
                  >
                    <Card hover className="h-full">
                      <CardBody className={`!p-6 h-full flex flex-col space-y-4 bg-gradient-to-br ${j.accent} rounded-2xl`}>
                        <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-brandObsidian-900/60 flex items-center justify-center text-slate-700 dark:text-slate-200">
                          <JIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                          {j.platform}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                          {j.description}
                        </p>
                        <a
                          href={j.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-brandGold-600 dark:text-brandGold-400 hover:underline underline-offset-2"
                        >
                          Join {j.platform} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-gradient-to-br from-brandGold-50 via-white to-white dark:from-brandGold-600/10 dark:via-brandObsidian-900 dark:to-brandObsidian-900">
                <CardBody className="!p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      Ready to build on Aravanta?
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                      Start with the free tier. Deploy your first workload in under 10 minutes.
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
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
