import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { ServicesTabs } from '../components/landing/ServicesTabs';
import { Pricing } from '../components/landing/Pricing';
import { FAQ } from '../components/landing/FAQ';
import { Footer } from '../components/landing/Footer';
import { ScrollProgressBar } from '../components/landing/ScrollReveal';
import { FloatingSalesChat } from '../components/landing/FloatingSalesChat';
import { CookieConsent } from '../components/landing/CookieConsent';

// ─── TypeScript Interfaces ───
interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onOpenCommandPalette?: () => void;
}

/**
 * Detect the user's region from browser locale and return a currency code.
 */
function detectRegionCurrency(): string {
  try {
    const locale = navigator.language || 'en-IN';
    const region = locale.split('-')[1]?.toUpperCase();
    const regionMap: Record<string, string> = {
      IN: 'INR',
      US: 'USD',
      GB: 'GBP',
      DE: 'EUR',
      FR: 'EUR',
      IT: 'EUR',
      ES: 'EUR',
      NL: 'EUR',
      AT: 'EUR',
      BE: 'EUR',
      JP: 'JPY',
    };
    return regionMap[region] || 'INR';
  } catch {
    return 'INR';
  }
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Currency state: load from localStorage, fallback to region detection
  const [currency, setCurrency] = useState<string>(() => {
    const saved = localStorage.getItem('aravanta_currency');
    if (saved) return saved;
    return detectRegionCurrency();
  });

  // Persist currency choice
  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('aravanta_currency', newCurrency);
  };

  // Simulate initial load (800ms skeleton)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative">
      {/* ── Top Scroll Progress Bar ── */}
      <ScrollProgressBar />

      {/* 1. Navbar */}
      <Navbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenCommandPalette={onOpenCommandPalette}
      />

      {/* 2. Hero Section */}
      <Hero
        isLoading={isLoading}
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
      />

      {/* 3. Core Infrastructure Services */}
      <ServicesTabs
        isLoading={isLoading}
        onGoToRegister={onGoToRegister}
      />

      {/* 4. Pricing Section */}
      <Pricing
        isLoading={isLoading}
        onGoToRegister={onGoToRegister}
        currency={currency}
      />

      {/* 5. FAQ Section */}
      <FAQ isLoading={isLoading} />

      {/* 6. Footer */}
      <Footer
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
      />

      {/* 7. Floating Sales Chat Widget */}
      <FloatingSalesChat />

      {/* 8. Cookies & Privacy Policy Consent Popup */}
      <CookieConsent />
    </div>
  );
};
