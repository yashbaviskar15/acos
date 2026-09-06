import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Shield, ChevronDown, ChevronUp, Lock, ExternalLink } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  timestamp?: number;
}

const COOKIE_STORAGE_KEY = 'aravanta_cookie_consent';
const COOKIE_NAME = 'aravanta_cookie_consent';

// ─── Utility to set actual browser cookie ───
const writeBrowserCookie = (prefs: CookiePreferences) => {
  try {
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
    const expires = 'expires=' + d.toUTCString();
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(prefs))}; ${expires}; path=/; SameSite=Lax${secure}`;
  } catch (err) {
    console.warn('Unable to write browser cookie:', err);
  }
};

// ─── Helper to open preferences from anywhere in the app ───
export const openCookiePreferences = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open_cookie_preferences'));
  }
};

// ─── Main Cookie Consent Banner & Preferences ───
export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    preferences: true,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      } else {
        // Small delay for smooth entry after initial page load
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  // Listen for global reopen trigger (e.g. from footer or settings)
  useEffect(() => {
    const handleReopen = () => {
      setVisible(true);
      setShowDetails(true);
    };
    window.addEventListener('open_cookie_preferences', handleReopen);
    return () => window.removeEventListener('open_cookie_preferences', handleReopen);
  }, []);

  const saveConsent = useCallback((prefs: CookiePreferences) => {
    const finalPrefs = { ...prefs, necessary: true, timestamp: Date.now() };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(finalPrefs));
      writeBrowserCookie(finalPrefs);
      window.dispatchEvent(new CustomEvent('aravanta_cookie_consent_updated', { detail: finalPrefs }));
    } catch (e) {
      console.error('Failed to save cookie consent:', e);
    }
    setPreferences(finalPrefs);
    setVisible(false);
  }, []);

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      preferences: true,
      marketing: true,
    });
  };

  const rejectOptional = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false,
    });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed bottom-3 sm:bottom-5 right-3 sm:right-5 left-3 sm:left-auto z-[80] sm:max-w-md w-auto"
          >
            <div className="bg-white/95 dark:bg-[#0F2038]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden font-sans text-slate-900 dark:text-slate-100">
              {/* Header Accent Bar */}
              <div className="h-1 w-full bg-gradient-to-r from-brandGold-400 via-brandGold-500 to-amber-600" />

              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Top Row: Icon + Title + Close Button */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brandGold-500/15 border border-brandGold-500/30 flex items-center justify-center shrink-0 mt-0.5 text-brandGold-500">
                    <Cookie className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        Cookie & Telemetry Preferences
                      </h3>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      We use essential cookies to maintain secure sessions and multi-cloud telemetry. Optional cookies help us optimize SRE tooling and service observability.
                    </p>
                  </div>
                  <button
                    onClick={rejectOptional}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
                    title="Dismiss optional cookies"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Expandable Category Toggles */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                        {/* Strictly Necessary */}
                        <CookieToggleRow
                          title="Strictly Necessary"
                          description="JWT auth tokens, workspace routing, and security rate limits. Cannot be disabled."
                          checked={true}
                          disabled
                          badge="Required"
                        />

                        {/* Observability & Telemetry */}
                        <CookieToggleRow
                          title="Observability & Telemetry"
                          description="ArvWatch telemetry pings, error logging, and latency metrics."
                          checked={preferences.analytics}
                          onChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                        />

                        {/* Experience & Regional Preferences */}
                        <CookieToggleRow
                          title="Console Preferences"
                          description="Currency preference (INR/USD), dark/light mode, and sidebar layout."
                          checked={preferences.preferences}
                          onChange={(checked) => setPreferences(prev => ({ ...prev, preferences: checked }))}
                        />

                        {/* Product Updates */}
                        <CookieToggleRow
                          title="Feature Updates & Notices"
                          description="New service announcements and maintenance notices."
                          checked={preferences.marketing}
                          onChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Links & Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-brandGold-600 dark:text-brandGold-400 hover:underline font-medium cursor-pointer flex items-center gap-1"
                    >
                      Privacy & SOC 2 Policy <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      {showDetails ? (
                        <>Less <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Customize <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>

                  {/* Button Group */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={acceptAll}
                      className="py-2 px-3 bg-brandGold-500 hover:bg-brandGold-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm hover:shadow-brandGold-500/20 text-center cursor-pointer"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={showDetails ? saveCustom : rejectOptional}
                      className="py-2 px-3 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-800 transition-colors text-center cursor-pointer"
                    >
                      {showDetails ? 'Save Selected' : 'Essential Only'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded Privacy & SOC 2 Modal */}
      <PrivacyPolicyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </>
  );
};

// ─── Category Toggle Row ───
interface CookieToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onChange?: (val: boolean) => void;
}

const CookieToggleRow: React.FC<CookieToggleRowProps> = ({
  title,
  description,
  checked,
  disabled,
  badge,
  onChange,
}) => {
  return (
    <label className={`flex items-start justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
      disabled 
        ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60' 
        : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-brandGold-500/40 cursor-pointer'
    }`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{description}</p>
      </div>

      <div className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <div className={`w-8 h-4.5 rounded-full transition-colors ${
          disabled
            ? 'bg-slate-300 dark:bg-slate-700'
            : checked
              ? 'bg-brandGold-500'
              : 'bg-slate-200 dark:bg-slate-800'
        }`} />
        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-100 shadow-sm transition-transform flex items-center justify-center ${
          checked ? 'translate-x-3.5' : 'translate-x-0'
        }`}>
          {disabled && <Lock className="w-2 h-2 text-slate-500" />}
        </div>
      </div>
    </label>
  );
};

// ─── Privacy & Cookie Policy Modal ───
export const PrivacyPolicyModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="w-8 h-8 rounded-xl bg-brandGold-500/10 border border-brandGold-500/25 flex items-center justify-center text-brandGold-500 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Aravanta CloudOS Privacy & Cookie Architecture
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">SOC 2 Type II Certified • GDPR & DPDP Compliant</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 font-sans">
              <section>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">1. Architectural Data Governance</h4>
                <p>
                  Aravanta CloudOS processes control-plane telemetry, IAM identity tokens, and infrastructure state across enterprise clusters. Data stored in your workspace remains strictly under customer sovereignty with encryption at rest (AES-256) and TLS 1.3 in transit.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">2. First-Party Cookies & Local Storage</h4>
                <p>We maintain three explicit categories of browser storage:</p>
                <div className="mt-2 space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <strong className="text-brandGold-600 dark:text-brandGold-400">Strictly Necessary:</strong> aravanta_token, aravanta_user, CSRF tokens. Required for cryptographic session verification and multi-cloud API routing.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <strong className="text-blue-600 dark:text-blue-400">Telemetry & Analytics:</strong> ArvWatch sub-second latency profiling, Prometheus metrics caching, and aggregate error reporting.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <strong className="text-emerald-600 dark:text-emerald-400">Preferences:</strong> Active workspace ID, currency selection (INR ₹ / USD $), and user interface theme state.
                  </div>
                </div>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">3. Zero Third-Party Tracker Guarantee</h4>
                <p>
                  Aravanta CloudOS does not sell customer information or allow third-party behavioral ad trackers inside the enterprise console. Telemetry is used strictly for platform reliability and FinOps cost analytics.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">4. Retention & Deletion Rights</h4>
                <p>
                  You may clear your cookie state at any time via your browser or the Cookie Settings button in the footer. To request complete IAM data erasure, contact our compliance officer at{' '}
                  <a href="mailto:privacy@aravanta.cloud" className="text-brandGold-500 hover:underline font-bold">
                    privacy@aravanta.cloud
                  </a>.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <span className="text-[11px] text-slate-400">Data Center: ap-south-1 Mumbai</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
