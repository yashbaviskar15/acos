import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Cookie Consent Banner ───
export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('aravanta_cookie_consent');
    if (!consent) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (all: boolean) => {
    const value = all
      ? { necessary: true, analytics: true, marketing: true, timestamp: Date.now() }
      : { ...preferences, necessary: true, timestamp: Date.now() };
    localStorage.setItem('aravanta_cookie_consent', JSON.stringify(value));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(
      'aravanta_cookie_consent',
      JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() })
    );
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-5"
        >
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
            {/* Main bar */}
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Cookie className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800 leading-snug">
                    We use cookies to improve your experience
                  </p>
                  <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">
                    We use essential cookies for core functionality and optional cookies for analytics and personalisation.
                    Read our{' '}
                    <PrivacyPolicyLink />{' '}
                    for details.
                  </p>
                </div>
                <button
                  onClick={decline}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 text-slate-400 hover:text-slate-600"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Expandable preferences */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      {/* Necessary */}
                      <CookieToggle
                        label="Strictly Necessary"
                        description="Required for the site to function. Cannot be disabled."
                        checked={true}
                        disabled
                      />
                      {/* Analytics */}
                      <CookieToggle
                        label="Analytics"
                        description="Help us understand how visitors interact with the site."
                        checked={preferences.analytics}
                        onChange={(v) => setPreferences((p) => ({ ...p, analytics: v }))}
                      />
                      {/* Marketing */}
                      <CookieToggle
                        label="Marketing"
                        description="Used to deliver relevant advertisements and track campaigns."
                        checked={preferences.marketing}
                        onChange={(v) => setPreferences((p) => ({ ...p, marketing: v }))}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => accept(true)}
                  className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Accept All
                </button>
                <button
                  onClick={() => showDetails ? accept(false) : decline()}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {showDetails ? 'Save Preferences' : 'Reject Optional'}
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-9 px-3 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                >
                  {showDetails ? 'Less' : 'Customise'}
                  {showDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Cookie Toggle Row ───
const CookieToggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (val: boolean) => void;
}> = ({ label, description, checked, disabled, onChange }) => (
  <label className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
    disabled ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-150 hover:border-slate-200 cursor-pointer'
  }`}>
    <div>
      <p className="text-[13px] font-medium text-slate-700 leading-tight">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
    </div>
    <div className="relative shrink-0">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <div className={`w-9 h-5 rounded-full transition-colors ${
        disabled
          ? 'bg-slate-300'
          : checked
            ? 'bg-blue-600'
            : 'bg-slate-200'
      }`} />
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </div>
  </label>
);


// ─── Privacy Policy Link (opens modal) ───
const PrivacyPolicyLink: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="underline underline-offset-2 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer font-medium"
      >
        Privacy Policy
      </button>
      <PrivacyPolicyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

// ─── Privacy Policy Modal ───
export const PrivacyPolicyModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  // Lock scroll when open
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-bold text-slate-900">Privacy & Cookie Policy</h2>
                <p className="text-[11px] text-slate-400 font-medium">Last updated: August 2026</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-[13px] text-slate-600 leading-relaxed space-y-5">
              <Section title="1. Information We Collect">
                <p>
                  When you use Aravanta CloudOS, we collect information you provide directly — such as your name,
                  email address, and organisation name when creating an account. We also automatically collect
                  technical data including IP address, browser type, device information, and usage patterns
                  through cookies and similar technologies.
                </p>
              </Section>

              <Section title="2. How We Use Your Information">
                <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
                  <li>Provide, maintain, and improve Aravanta CloudOS services</li>
                  <li>Process transactions and send related notifications</li>
                  <li>Respond to support requests and communicate updates</li>
                  <li>Monitor infrastructure usage for billing and capacity planning</li>
                  <li>Detect, prevent, and address security incidents</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                </ul>
              </Section>

              <Section title="3. Cookies & Tracking">
                <p>We use three categories of cookies:</p>
                <div className="mt-2 space-y-2">
                  <CookieRow name="Strictly Necessary" purpose="Authentication, session management, security protections" retention="Session" />
                  <CookieRow name="Analytics" purpose="Usage patterns, feature adoption, error tracking" retention="12 months" />
                  <CookieRow name="Marketing" purpose="Campaign attribution, personalised content" retention="6 months" />
                </div>
                <p className="mt-2 text-slate-400 text-[12px]">
                  You can manage your cookie preferences at any time using the cookie settings at the bottom of any page.
                </p>
              </Section>

              <Section title="4. Data Storage & Security">
                <p>
                  All data is processed and stored within SOC 2 Type II certified infrastructure located in India.
                  We employ encryption at rest (AES-256) and in transit (TLS 1.3), role-based access controls,
                  and continuous audit logging to protect your information.
                </p>
              </Section>

              <Section title="5. Data Sharing">
                <p>
                  We do not sell your personal data. We may share information with service providers who assist in
                  operating our platform (e.g., payment processors, monitoring tools), but only under strict
                  contractual obligations. We may also disclose data when required by law or to protect our rights.
                </p>
              </Section>

              <Section title="6. Your Rights">
                <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
                  <li>Access, correct, or delete your personal data</li>
                  <li>Export your data in a portable format</li>
                  <li>Withdraw consent for optional data processing</li>
                  <li>Object to automated decision-making</li>
                  <li>Lodge a complaint with a supervisory authority</li>
                </ul>
              </Section>

              <Section title="7. Data Retention">
                <p>
                  We retain account data for as long as your account is active. After account deletion, we remove
                  personal data within 30 days, except where retention is required for legal, tax, or audit purposes
                  (up to 7 years for financial records).
                </p>
              </Section>

              <Section title="8. Contact">
                <p>
                  For privacy-related inquiries, contact us at{' '}
                  <a href="mailto:privacy@aravanta.cloud" className="text-blue-600 hover:underline font-medium">
                    privacy@aravanta.cloud
                  </a>.
                </p>
              </Section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50">
              <button
                onClick={onClose}
                className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
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


// ─── Helper Components ───
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-[14px] font-semibold text-slate-800 mb-2">{title}</h3>
    {children}
  </div>
);

const CookieRow: React.FC<{ name: string; purpose: string; retention: string }> = ({ name, purpose, retention }) => (
  <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg text-[12px]">
    <span className="font-semibold text-slate-700 whitespace-nowrap w-28 shrink-0">{name}</span>
    <span className="text-slate-500 flex-1">{purpose}</span>
    <span className="text-slate-400 whitespace-nowrap shrink-0">{retention}</span>
  </div>
);
