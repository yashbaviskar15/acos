import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Terminal, Globe, ChevronDown, Server, Boxes, HardDrive, Database } from 'lucide-react';
import { Logo } from '../Logo';

// ─── Interfaces ───
interface NavbarProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onOpenCommandPalette?: () => void;
}

interface CurrencyOption {
  code: string;
  flag: string;
  label: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', flag: '🇮🇳', label: 'INR ₹' },
  { code: 'USD', flag: '🇺🇸', label: 'USD $' },
  { code: 'EUR', flag: '🇪🇺', label: 'EUR €' },
  { code: 'GBP', flag: '🇬🇧', label: 'GBP £' },
  { code: 'JPY', flag: '🇯🇵', label: 'JPY ¥' },
];

const MODULES = [
  { name: 'ArvCompute', desc: 'Elastic virtual machines', icon: Server, color: 'text-blue-500' },
  { name: 'ArvKube', desc: 'Managed Kubernetes clusters', icon: Boxes, color: 'text-violet-500' },
  { name: 'ArvStore', desc: 'S3-compatible object storage', icon: HardDrive, color: 'text-emerald-500' },
  { name: 'ArvDB', desc: 'Managed database engines', icon: Database, color: 'text-amber-500' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onGoToLogin,
  onGoToRegister,
  currency,
  onCurrencyChange,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [activeId, setActiveId] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Scroll: sticky blur + hide-down/reveal-up + scroll spy ───
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);

      if (y > 120) {
        setVisible(y < lastY || y < 80);
      } else {
        setVisible(true);
      }
      setLastY(y);

      // Scroll spy
      for (const id of ['features', 'pricing', 'faq']) {
        const el = document.getElementById(id);
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top <= 100 && r.bottom > 100) {
            setActiveId(id);
            return;
          }
        }
      }
      setActiveId('');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  // Lock body on mobile menu
  useEffect(() => {
    if (mobileOpen) {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${sw}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => { document.body.style.overflow = ''; document.body.style.paddingRight = ''; };
  }, [mobileOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-currency]')) setCurrencyOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    setProductsOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const NAV_ITEMS = [
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-b border-slate-200/60'
            : 'bg-white border-b border-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="cursor-pointer focus:outline-none shrink-0"
            >
              <Logo size="md" variant="light" />
            </button>

            {/* ── Desktop Center Nav ── */}
            <nav className="hidden lg:flex items-center gap-1 ml-10">
              {/* Products dropdown */}
              <div
                className="relative"
                onMouseEnter={() => {
                  if (productsTimeout.current) clearTimeout(productsTimeout.current);
                  setProductsOpen(true);
                }}
                onMouseLeave={() => {
                  productsTimeout.current = setTimeout(() => setProductsOpen(false), 200);
                }}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
                    activeId === 'features' || productsOpen
                      ? 'text-slate-900 bg-slate-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Products
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {productsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-[340px] bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 p-2 z-50"
                    >
                      {MODULES.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <button
                            key={mod.name}
                            onClick={() => scrollTo('features')}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                          >
                            <div className={`w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 transition-colors`}>
                              <Icon className={`w-4 h-4 ${mod.color}`} />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800 leading-tight">{mod.name}</p>
                              <p className="text-[11px] text-slate-400 leading-tight">{mod.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simple nav links */}
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`relative px-3 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
                    activeId === item.id
                      ? 'text-slate-900 bg-slate-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* ── Desktop Right Actions ── */}
            <div className="hidden lg:flex items-center gap-2 ml-auto">

              {/* Currency */}
              <div className="relative" data-currency>
                <button
                  onClick={() => setCurrencyOpen(!currencyOpen)}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{curr.flag} {curr.code}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-full right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50"
                    >
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => { onCurrencyChange(c.code); setCurrencyOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg cursor-pointer transition-colors ${
                            currency === c.code
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{c.flag}</span>
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Sign In */}
              <button
                onClick={onGoToLogin}
                className="h-8 px-3 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Sign in
              </button>

              {/* Console CTA */}
              <button
                onClick={onGoToRegister}
                className="group h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-white z-50 lg:hidden shadow-2xl flex flex-col"
            >
              {/* Mobile Header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
                <Logo size="sm" variant="light" showText={false} />
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Mobile Links */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                <p className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>
                {[
                  { label: 'Products', id: 'features' },
                  { label: 'Pricing', id: 'pricing' },
                  { label: 'FAQ', id: 'faq' },
                ].map((item, idx) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * idx }}
                    onClick={() => scrollTo(item.id)}
                    className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </motion.button>
                ))}

                <div className="h-px bg-slate-100 my-3" />

                <p className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Region</p>
                <div className="px-3">
                  <select
                    value={currency}
                    onChange={(e) => onCurrencyChange(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="p-4 border-t border-slate-100 space-y-2 shrink-0">
                <button
                  onClick={() => { setMobileOpen(false); onGoToLogin(); }}
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setMobileOpen(false); onGoToRegister(); }}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  Get Started Free
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
