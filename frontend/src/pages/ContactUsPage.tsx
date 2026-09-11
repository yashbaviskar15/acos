import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MessageSquare,
  Headphones,
  Handshake,
  ShieldAlert,
  Send,
  ChevronRight,
  MapPin,
  Clock3,
  CheckCircle2,
  User,
  AtSign,
  FileText,
  Globe2,
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
    title: 'Sales & Enquiries',
    subtitle: 'Pricing, demos, and platform questions',
    email: 'sales@aravanta.cloud',
    phone: '+91 80 4567 8900',
    hours: 'Mon\u2013Fri, 9 AM \u2013 6 PM IST',
    tone: 'gold',
  },
  {
    icon: Headphones,
    title: 'Technical Support',
    subtitle: 'Platform issues, bugs, and implementation help',
    email: 'support@aravanta.cloud',
    phone: '+91 80 4567 8901',
    hours: '24\u00d77 for P1 incidents \u00b7 9\u20136 IST P2+',
    tone: 'emerald',
  },
  {
    icon: Handshake,
    title: 'Billing & Accounts',
    subtitle: 'Invoices, plan changes, and payment queries',
    email: 'billing@aravanta.cloud',
    phone: '+91 80 4567 8902',
    hours: 'Mon\u2013Fri, 10 AM \u2013 5 PM IST',
    tone: 'sky',
  },
  {
    icon: ShieldAlert,
    title: 'Security & Compliance',
    subtitle: 'Vulnerability reports, SOC2 queries, and data requests',
    email: 'security@aravanta.cloud',
    phone: 'War-Room: +91 80 4567 8999',
    hours: '24\u00d77 for incidents \u00b7 Ack < 1h',
    tone: 'rose',
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
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [focused, setFocused] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 6000);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const inputWrap = (key: string) =>
    [
      'w-full rounded-lg border bg-white dark:bg-brandObsidian-900 transition-all shadow-sm',
      focused[key]
        ? 'border-brandGold-500 ring-2 ring-brandGold-500/30'
        : 'border-slate-200 dark:border-brandObsidian-700 hover:border-slate-300 dark:hover:border-brandObsidian-600',
    ].join(' ');

  const inputCls =
    'w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onOpenCommandPalette={onOpenCommandPalette}
        onNavigate={onNavigate}
        currentView="contact"
      />

      <main>
        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto">
              <Breadcrumbs
                items={[
                  { label: 'Platform', onClick: () => onNavigate?.('home') },
                  { label: 'Contact Us' },
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
                  <Headphones className="w-3.5 h-3.5" /> We&apos;re here to help
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.03] text-slate-900 dark:text-white">
                  Contact Us
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                  Whether you need platform support, want to explore enterprise plans, or need to report a security concern &mdash; the Aravanta Cloud OS team is one message away. We reply to every query within one business day.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-14"
              >
                {contactCards.map((c, idx) => {
                  const CIcon = c.icon;
                  return (
                    <motion.div
                      key={c.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.05 * idx }}
                    >
                      <Card hover className="h-full">
                        <CardBody className="!p-5 sm:!p-6 h-full space-y-4">
                          <div className="flex items-start gap-4">
                            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${toneClass[c.tone]}`}>
                              <CIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                {c.title}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                {c.subtitle}
                              </p>
                            </div>
                          </div>
                          <ul className="space-y-2.5 text-sm pt-1">
                            <li className="flex items-start gap-3">
                              <Mail className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
                              <span className="font-mono text-slate-700 dark:text-slate-200 break-all">{c.email}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Phone className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
                              <span className="font-medium text-slate-700 dark:text-slate-200">{c.phone}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Clock3 className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
                              <span className="text-slate-600 dark:text-slate-300">{c.hours}</span>
                            </li>
                          </ul>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start"
              >
                <div className="lg:col-span-3">
                  <Card>
                    <CardBody className="!p-6 sm:!p-8">
                      <div className="flex items-center gap-2 mb-6">
                        <MessageSquare className="w-5 h-5 text-brandGold-600 dark:text-brandGold-400" />
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                          Send us a message
                        </h2>
                      </div>

                      {submitted ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                        >
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message sent!</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                            Our team will get back to you within one business day. Check your email for a confirmation.
                          </p>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                                <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Full name
                              </label>
                              <div className={inputWrap('name')}>
                                <input
                                  type="text"
                                  required
                                  value={form.name}
                                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                                  onFocus={() => setFocused({ ...focused, name: true })}
                                  onBlur={() => setFocused({ ...focused, name: false })}
                                  placeholder="Jane Doe"
                                  className={`${inputCls} px-3.5 py-2.5`}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                                <AtSign className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Email
                              </label>
                              <div className={inputWrap('email')}>
                                <input
                                  type="email"
                                  required
                                  value={form.email}
                                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                                  onFocus={() => setFocused({ ...focused, email: true })}
                                  onBlur={() => setFocused({ ...focused, email: false })}
                                  placeholder="jane@company.com"
                                  className={`${inputCls} px-3.5 py-2.5`}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Subject
                            </label>
                            <div className={inputWrap('subject')}>
                              <input
                                type="text"
                                required
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                onFocus={() => setFocused({ ...focused, subject: true })}
                                onBlur={() => setFocused({ ...focused, subject: false })}
                                placeholder="e.g. Enterprise plan enquiry"
                                className={`${inputCls} px-3.5 py-2.5`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Message
                            </label>
                            <div className={inputWrap('message')}>
                              <textarea
                                required
                                rows={5}
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                onFocus={() => setFocused({ ...focused, message: true })}
                                onBlur={() => setFocused({ ...focused, message: false })}
                                placeholder="Tell us how we can help..."
                                className={`${inputCls} px-3.5 py-2.5 resize-none`}
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            size="lg"
                            variant="primary"
                            className="w-full sm:w-auto"
                            rightIcon={<Send className="w-4 h-4" />}
                          >
                            Send message
                          </Button>
                        </form>
                      )}
                    </CardBody>
                  </Card>
                </div>

                <div className="lg:col-span-2 space-y-5">
                  <Card goldAccent>
                    <CardBody className="!p-5 sm:!p-6 space-y-4">
                      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                        Headquarters
                      </h3>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
                          <span className="text-slate-700 dark:text-slate-200">
                            Aravanta Technologies<br />
                            HSR Layout, Bengaluru 560102<br />
                            Karnataka, India
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Clock3 className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
                          <span className="text-slate-600 dark:text-slate-300">
                            Support: 24&times;7 for P1<br />
                            General: Mon&ndash;Fri 9 AM &ndash; 6 PM IST
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Globe2 className="w-4 h-4 text-brandGold-600 dark:text-brandGold-400 shrink-0 mt-0.5" />
                          <span className="text-slate-600 dark:text-slate-300">
                            Status: <a href="https://status.aravanta.cloud" target="_blank" rel="noreferrer" className="text-brandGold-600 dark:text-brandGold-400 underline underline-offset-2 hover:no-underline">status.aravanta.cloud</a>
                          </span>
                        </li>
                      </ul>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="!p-5 sm:!p-6 space-y-3">
                      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                        Prefer self-service?
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Check our FAQ for instant answers to common platform, billing, and security questions.
                      </p>
                      <Button
                        size="md"
                        variant="outline"
                        onClick={() => onNavigate?.('faq')}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Browse FAQ
                      </Button>
                    </CardBody>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
