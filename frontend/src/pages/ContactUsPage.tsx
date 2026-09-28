import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MessageSquare,
  Headphones,
  CreditCard,
  ShieldAlert,
  Send,
  MapPin,
  Clock3,
  CheckCircle2,
  User,
  AtSign,
  FileText,
  Globe2,
  Building,
  Server,
  Copy,
  Check,
  ChevronRight,
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

const contactCards = [
  {
    icon: MessageSquare,
    title: 'Enterprise Sales & Custom Pricing',
    subtitle: 'Dedicated clusters, sovereign datacenters & volume discounts',
    email: 'sales@aravanta.cloud',
    phone: '+91 80 4567 8900',
    hours: 'Mon\u2013Fri, 9:00 AM \u2013 6:00 PM IST',
    tone: 'gold',
    tag: '1-Hour Sales SLA',
  },
  {
    icon: Headphones,
    title: 'Technical Support & SRE Desk',
    subtitle: 'Kubernetes orchestration, ArvS3 storage & VM hypervisors',
    email: 'support@aravanta.cloud',
    phone: '+91 80 4567 8901',
    hours: '24\u00d77 for P1 incidents \u00b7 9\u20136 IST P2+',
    tone: 'emerald',
    tag: '24×7 Active SREs',
  },
  {
    icon: CreditCard,
    title: 'FinOps & Invoicing',
    subtitle: 'GST input tax credit, INR billing statements & receipts',
    email: 'billing@aravanta.cloud',
    phone: '+91 80 4567 8902',
    hours: 'Mon\u2013Fri, 10:00 AM \u2013 5:00 PM IST',
    tone: 'sky',
    tag: 'GSTIN Verified',
  },
  {
    icon: ShieldAlert,
    title: 'Security Incident & War-Room',
    subtitle: 'Responsible disclosure, CERT-In compliance & P1 hotline',
    email: 'security@aravanta.cloud',
    phone: 'War-Room: +91 80 4567 8999',
    hours: '24\u00d77 Emergency Hotline \u00b7 Ack < 1h',
    tone: 'rose',
    tag: 'Critical Escalations',
  },
];

const toneClass: Record<string, string> = {
  gold: 'bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export const ContactUsPage: React.FC<PageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: 'sales',
    organization: '',
    scale: '1-10',
    subject: '',
    message: '',
  });
  const [focused, setFocused] = useState<Record<string, boolean>>({});
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomTicket = `TICK-ACOS-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(randomTicket);
    try {
      const tickets = JSON.parse(localStorage.getItem('aravanta_contact_tickets') || '[]');
      tickets.push({ ticketId: randomTicket, ...form, createdAt: new Date().toISOString() });
      localStorage.setItem('aravanta_contact_tickets', JSON.stringify(tickets));
    } catch {}
  };

  const handleCopyTicket = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const inputWrap = (key: string) =>
    [
      'w-full rounded-xl border bg-white dark:bg-brandObsidian-900 transition-all shadow-xs',
      focused[key]
        ? 'border-brandGold-500 ring-2 ring-brandGold-500/30'
        : 'border-slate-300 dark:border-brandObsidian-700 hover:border-slate-400 dark:hover:border-brandObsidian-600',
    ].join(' ');

  const inputCls =
    'w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="contact"
      />

      <main>
        {/* Breadcrumb Header */}
        <section className="pt-6 pb-4 sm:pt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: 'Platform', onClick: () => onNavigate?.('home') },
                { label: 'Support & Solutions' },
                { label: 'Contact Us' },
              ]}
            />
          </div>
        </section>

        {/* Hero Title Strip */}
        <section className="pb-10 sm:pb-14 border-b border-slate-200/80 dark:border-brandObsidian-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold" size="sm" dot>
                  Direct Engineering Support
                </Badge>
                <Badge variant="outline" size="sm" className="font-mono">
                  Sovereign Indian NOC &amp; SRE Desk
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Contact Aravanta Cloud OS
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Whether you are evaluating dedicated Kubernetes clusters, require urgent production incident escalation, or have GST billing questions &mdash; connect directly with our Bengaluru engineering and solutions teams.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Department Cards Grid */}
        <section className="py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
              {contactCards.map((c) => {
                const CIcon = c.icon;
                return (
                  <Card key={c.title} hover className="h-full flex flex-col justify-between">
                    <CardBody className="!p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneClass[c.tone]}`}>
                            <CIcon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-brandObsidian-700">
                            {c.tag}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {c.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {c.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-brandObsidian-800 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-brandGold-600 dark:text-brandGold-400 shrink-0" />
                          <a
                            href={`mailto:${c.email}`}
                            className="font-mono text-slate-700 dark:text-slate-200 hover:text-brandGold-600 dark:hover:text-brandGold-400 truncate"
                          >
                            {c.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-brandGold-600 dark:text-brandGold-400 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                            {c.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                          <Clock3 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.hours}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            {/* Form + Headquarters 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form (7 Cols) */}
              <div className="lg:col-span-7">
                <Card>
                  <CardBody className="!p-6 sm:!p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-brandGold-500/10 text-brandGold-600 dark:text-brandGold-400 flex items-center justify-center font-bold">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                          Dispatch an Inquiry or Escalation
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Routed immediately to the designated engineering or commercial queue.
                        </p>
                      </div>
                    </div>

                    {ticketId ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-10 text-center space-y-4"
                      >
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Inquiry Dispatched Successfully!
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            Your ticket has been logged into the Aravanta Cloud OS control plane. Our engineering desk will respond within the designated SLA window.
                          </p>
                        </div>

                        {/* Ticket Badge */}
                        <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-brandObsidian-900 border border-slate-200 dark:border-brandObsidian-800">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Reference Ticket ID:</span>
                          <span className="text-xs font-mono font-bold text-brandGold-600 dark:text-brandGold-400">
                            {ticketId}
                          </span>
                          <button
                            onClick={handleCopyTicket}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-brandObsidian-800 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                            title="Copy Ticket ID"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="pt-4">
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => {
                              setTicketId(null);
                              setForm({
                                name: '',
                                email: '',
                                department: 'sales',
                                organization: '',
                                scale: '1-10',
                                subject: '',
                                message: '',
                              });
                            }}
                          >
                            Submit Another Query
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Department Radio Pills */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-2">
                            Select Target Department
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'sales', label: 'Sales & Plans' },
                              { id: 'support', label: 'Technical SRE' },
                              { id: 'billing', label: 'FinOps & GST' },
                              { id: 'security', label: 'Security P1' },
                            ].map((dept) => (
                              <button
                                key={dept.id}
                                type="button"
                                onClick={() => setForm({ ...form, department: dept.id })}
                                className={[
                                  'py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer',
                                  form.department === dept.id
                                    ? 'bg-brandGold-500/15 border-brandGold-500 text-brandGold-700 dark:text-brandGold-300 font-bold'
                                    : 'border-slate-200 dark:border-brandObsidian-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-brandObsidian-600',
                                ].join(' ')}
                              >
                                {dept.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              <User className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-slate-400" />
                              Full Name
                            </label>
                            <div className={inputWrap('name')}>
                              <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                onFocus={() => setFocused({ ...focused, name: true })}
                                onBlur={() => setFocused({ ...focused, name: false })}
                                placeholder="Shubham Sharma"
                                className={`${inputCls} px-3.5 py-2.5`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              <AtSign className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-slate-400" />
                              Business Email
                            </label>
                            <div className={inputWrap('email')}>
                              <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                onFocus={() => setFocused({ ...focused, email: true })}
                                onBlur={() => setFocused({ ...focused, email: false })}
                                placeholder="shubham@company.com"
                                className={`${inputCls} px-3.5 py-2.5`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Organization + Scale */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              <Building className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-slate-400" />
                              Organization Name
                            </label>
                            <div className={inputWrap('org')}>
                              <input
                                type="text"
                                value={form.organization}
                                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                                onFocus={() => setFocused({ ...focused, org: true })}
                                onBlur={() => setFocused({ ...focused, org: false })}
                                placeholder="Acme Technologies Pvt Ltd"
                                className={`${inputCls} px-3.5 py-2.5`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              <Server className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-slate-400" />
                              Workload Scale (vCPUs)
                            </label>
                            <div className={inputWrap('scale')}>
                              <select
                                value={form.scale}
                                onChange={(e) => setForm({ ...form, scale: e.target.value })}
                                onFocus={() => setFocused({ ...focused, scale: true })}
                                onBlur={() => setFocused({ ...focused, scale: false })}
                                className={`${inputCls} px-3 py-2.5 cursor-pointer bg-white dark:bg-brandObsidian-900`}
                              >
                                <option value="1-10">1 &ndash; 10 vCPUs (Prototyping)</option>
                                <option value="10-50">10 &ndash; 50 vCPUs (Growth Team)</option>
                                <option value="50-250">50 &ndash; 250 vCPUs (Production SaaS)</option>
                                <option value="250+">250+ vCPUs (Enterprise Fleet)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                            <FileText className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-slate-400" />
                            Subject Line
                          </label>
                          <div className={inputWrap('subject')}>
                            <input
                              type="text"
                              required
                              value={form.subject}
                              onChange={(e) => setForm({ ...form, subject: e.target.value })}
                              onFocus={() => setFocused({ ...focused, subject: true })}
                              onBlur={() => setFocused({ ...focused, subject: false })}
                              placeholder="e.g. Inquiring regarding Mumbai ap-south-1 reserved bare-metal K8s nodes"
                              className={`${inputCls} px-3.5 py-2.5`}
                            />
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                            <MessageSquare className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-slate-400" />
                            Message &amp; Technical Requirements
                          </label>
                          <div className={inputWrap('message')}>
                            <textarea
                              required
                              rows={4}
                              value={form.message}
                              onChange={(e) => setForm({ ...form, message: e.target.value })}
                              onFocus={() => setFocused({ ...focused, message: true })}
                              onBlur={() => setFocused({ ...focused, message: false })}
                              placeholder="Describe your architecture requirements, container stack, or specific support questions..."
                              className={`${inputCls} px-3.5 py-2.5 resize-none`}
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          variant="primary"
                          className="w-full bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
                          rightIcon={<Send className="w-4 h-4" />}
                        >
                          Dispatch Inquiry
                        </Button>
                      </form>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Headquarters & Status (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                <Card goldAccent>
                  <CardBody className="!p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Headquarters &amp; Engineering Operations
                      </h3>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Aravanta CloudOS Technologies Inc.</p>
                      <p>HSR Layout, Sector 2, 27th Main Road</p>
                      <p>Bengaluru, Karnataka 560102, India</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-brandObsidian-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <p><strong>Primary Datacenter:</strong> Equinix MB1 &amp; MB2, Chandivali, Mumbai (ap-south-1)</p>
                      <p><strong>Disaster Recovery Facility:</strong> CtrlS Datacenter, Ambattur, Chennai (ap-south-2)</p>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="!p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                          Control Plane Status
                        </h4>
                      </div>
                      <Badge variant="success" size="sm" dot>
                        Operational
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      All control plane nodes, ArvS3 storage buckets, and hypervisor schedulers in Mumbai and Chennai are operating at 99.99% availability.
                    </p>
                    <a
                      href="https://status.aravanta.cloud"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brandGold-600 dark:text-brandGold-400 hover:underline"
                    >
                      <span>Inspect Live Latency Metrics</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="!p-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Prefer Instant Self-Service?
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Check our comprehensive FAQ for immediate answers regarding pricing rates in INR, CLI installation, TOTP setup, and Kubernetes versions.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate?.('faq')}
                      className="w-full text-xs"
                    >
                      Browse Frequently Asked Questions
                    </Button>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
