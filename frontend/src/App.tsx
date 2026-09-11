import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Infrastructure } from './pages/Infrastructure';
import { Applications } from './pages/Applications';
import { Deployments } from './pages/Deployments';
import { Containers } from './pages/Containers';
import { Logs } from './pages/Logs';
import { Alerts } from './pages/Alerts';
import { Incidents } from './pages/Incidents';
import { Automation } from './pages/Automation';
import { Backups } from './pages/Backups';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { Compute } from './pages/Compute';
import { Kubernetes } from './pages/Kubernetes';
import { Storage } from './pages/Storage';
import { Databases } from './pages/Database';
import { CICD } from './pages/CICD';
import { Monitoring } from './pages/Monitoring';
import { Security } from './pages/Security';
import { Billing } from './pages/Billing';
import { Profile } from './pages/Profile';
import { GettingStarted } from './pages/GettingStarted';
import { CommandPalette } from './components/CommandPalette';
import { ConsoleCopilot } from './components/copilot/ConsoleCopilot';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { CommunityPage } from './pages/CommunityPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { TermsOfUsePage } from './pages/TermsOfUsePage';
import { ContactUsPage } from './pages/ContactUsPage';
import { FAQPage } from './pages/FAQPage';
import { SitemapPage } from './pages/SitemapPage';
import type { LandingView } from './components/ui/Navbar';
import { CookieConsent } from './components/ui/CookieConsent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { apiFetch } from './config/api';
import { canAccessTab } from './utils/rbac';
import { AccessDenied } from './components/AccessDenied';

export default function App() {
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('invite_token');
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aravanta_token');
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('aravanta_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing stored user from localStorage:', e);
    }
    return null;
  });

  const [authViewState, setAuthViewState] = useState<'landing' | 'login' | 'register'>(() => {
    try {
      const saved = localStorage.getItem('aravanta_auth_view');
      if (saved === 'login' || saved === 'register' || saved === 'landing') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'landing';
  });

  const [landingView, setLandingView] = useState<LandingView>(() => {
    try {
      const saved = localStorage.getItem('aravanta_landing_view') as LandingView | null;
      const validViews: LandingView[] = [
        'home',
        'getting-started',
        'features',
        'developers',
        'documentation',
        'pricing',
        'about',
        'community',
        'privacy',
        'terms',
        'disclaimer',
        'sitemap',
        'contact',
        'faq',
        'foundations',
        'components',
        'patterns',
        'resources',
      ];
      if (saved && validViews.includes(saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'home';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return localStorage.getItem('aravanta_active_tab') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Global Cmd+K (Command Palette) and Cmd+J / Cmd+Shift+K (Console Copilot) shortcut listeners
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'j' || (e.shiftKey && e.key.toLowerCase() === 'k'))) {
        e.preventDefault();
        setIsCopilotOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleUniversalNavigate = (target: string) => {
    setIsCommandPaletteOpen(false);
    const validLandingViews: LandingView[] = [
      'home',
      'getting-started',
      'features',
      'developers',
      'documentation',
      'pricing',
      'about',
      'community',
      'privacy',
      'terms',
      'disclaimer',
      'sitemap',
      'contact',
      'faq',
      'foundations',
      'components',
      'patterns',
      'resources',
    ];

    if (validLandingViews.includes(target as LandingView)) {
      setLandingView(target as LandingView);
      setAuthViewState('landing');
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    } else if (target === 'login') {
      setAuthViewState('login');
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    } else if (target === 'register') {
      setAuthViewState('register');
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    } else {
      if (token) {
        setActiveTab(target);
      } else {
        // Redirect to login if user clicks a private console tab without auth
        setAuthViewState('login');
      }
    }
  };

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('aravanta_token', token);
        // Refresh full user profile and MFA state in background
        apiFetch<any>('/api/v1/auth/me', { token })
          .then((freshUser: any) => {
            if (freshUser && freshUser.id) {
              setUser((prev: any) => ({ ...prev, ...freshUser, is_mfa_enabled: Boolean(freshUser.is_mfa_enabled) }));
            }
          })
          .catch((err: any) => {
            // Only clear token if the server explicitly returned HTTP 401 Unauthorized
            // Never log out on network connectivity errors, CORS preflights, or server boots
            if (err && err.status === 401) {
              handleLogout();
            }
          });
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('aravanta_user', JSON.stringify(user));
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('aravanta_auth_view', authViewState);
    } catch {}
  }, [authViewState]);

  useEffect(() => {
    try {
      localStorage.setItem('aravanta_landing_view', landingView);
    } catch {}
  }, [landingView]);

  useEffect(() => {
    try {
      localStorage.setItem('aravanta_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  const handleNavigate = (view: LandingView) => {
    const validViews: LandingView[] = [
      'home',
      'getting-started',
      'features',
      'developers',
      'documentation',
      'pricing',
      'about',
      'community',
      'privacy',
      'terms',
      'disclaimer',
      'sitemap',
      'contact',
      'faq',
      'foundations',
      'components',
      'patterns',
      'resources',
    ];
    if (validViews.includes(view)) {
      setLandingView(view);
      // Ensure we're in landing mode (not login/register)
      if (authViewState !== 'landing') setAuthViewState('landing');
      try {
        window.scrollTo({ top: 0, behavior: 'auto' });
      } catch {}
    }
  };

  const handleGoToLogin = () => {
    setAuthViewState('login');
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {}
  };

  const handleGoToRegister = () => {
    setAuthViewState('register');
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {}
  };

  const handleLoginSuccess = (userData: any, newToken: string) => {
    // Synchronously persist to localStorage BEFORE setting React state
    try {
      localStorage.setItem('aravanta_token', newToken);
      localStorage.setItem('aravanta_user', JSON.stringify(userData));
      localStorage.setItem('aravanta_active_tab', 'dashboard');
    } catch {}
    setToken(newToken);
    setUser(userData);
    setActiveTab('dashboard');
    setAuthViewState('landing');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('aravanta_token');
      localStorage.removeItem('aravanta_user');
      localStorage.removeItem('aravanta_active_tab');
    } catch {}
    setAuthViewState('landing');
  };

  if (!token) {
    if (inviteToken || authViewState === 'login' || authViewState === 'register') {
      return (
        <ErrorBoundary>
          <Login 
            onLoginSuccess={handleLoginSuccess}
            initialTab={inviteToken ? 'invite' : (authViewState === 'register' ? 'register' : 'signin')}
            inviteToken={inviteToken}
            onGoToLanding={() => {
              setInviteToken(null);
              setAuthViewState('landing');
            }}
          />
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={handleUniversalNavigate}
          />
          <CookieConsent />
        </ErrorBoundary>
      );
    }

    const sharedLandingProps = {
      onNavigate: handleNavigate,
      currentView: landingView,
      onGoToLogin: handleGoToLogin,
      onGoToRegister: handleGoToRegister,
      onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    };

    let PageComponent: React.ComponentType<any>;
    switch (landingView) {
      case 'home':
        PageComponent = LandingPage;
        break;
      case 'getting-started':
        PageComponent = DocumentationPage;
        break;
      case 'features':
        PageComponent = FeaturesPage;
        break;
      case 'developers':
        PageComponent = DevelopersPage;
        break;
      case 'documentation':
        PageComponent = DocumentationPage;
        break;
      case 'pricing':
        PageComponent = PricingPage;
        break;
      case 'about':
        PageComponent = AboutPage;
        break;
      case 'community':
        PageComponent = CommunityPage;
        break;
      case 'privacy':
        PageComponent = PrivacyPolicyPage;
        break;
      case 'terms':
        PageComponent = TermsOfUsePage;
        break;
      case 'disclaimer':
        PageComponent = DisclaimerPage;
        break;
      case 'sitemap':
        PageComponent = SitemapPage;
        break;
      case 'contact':
        PageComponent = ContactUsPage;
        break;
      case 'faq':
        PageComponent = FAQPage;
        break;
      case 'foundations':
      case 'components':
      case 'patterns':
      case 'resources':
        PageComponent = DocumentationPage;
        break;
      default:
        PageComponent = LandingPage;
        break;
    }

    return (
      <ErrorBoundary>
        <PageComponent {...sharedLandingProps} />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={handleUniversalNavigate}
        />
        <CookieConsent />
      </ErrorBoundary>
    );
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard & Fleet SRE Console';
      case 'infrastructure': return 'Infrastructure — Multi-Cloud Resource Inventory';
      case 'applications': return 'Applications — Microservices Catalog & Workloads';
      case 'deployments': return 'Deployments — GitOps Release Pipeline & Rollback Engine';
      case 'containers': return 'Containers — Pod Fleet Telemetry & Live Logs';
      case 'monitoring': return 'ArvWatch — Observability Hub & Telemetry Engine';
      case 'logs': return 'Log Explorer — Real-Time Stdout/Stderr Stream';
      case 'alerts': return 'Alertmanager — Firing Rules & Alert Triage';
      case 'incidents': return 'Incidents — War-Room Incident Command Center';
      case 'automation': return 'Automation — Self-Healing Runbooks & Playbooks';
      case 'backups': return 'Backups — Disaster Recovery & 1-Click Snapshot Restore';
      case 'compute': return 'ArvCompute — Virtual Machines (EC2/GCE Equivalent)';
      case 'kubernetes': return 'ArvKube — Managed Kubernetes (EKS/GKE Equivalent)';
      case 'storage': return 'ArvStore — S3 Object Storage Buckets';
      case 'database': return 'ArvDB — Managed Database Engines (Postgres/Redis/MySQL)';
      case 'cicd': return 'CI/CD Pipelines & Container Artifact Releases';
      case 'security': return 'Security & Granular RBAC Permissions Matrix';
      case 'audit': return 'Security Audit Trail & Compliance Log Stream';
      case 'billing': return 'Billing, FinOps & Cost Analytics (INR ₹)';
      case 'settings': return 'Platform Settings & SRE Microservices Health Matrix';
      case 'profile': return 'User Profile & IAM API Credentials';
      case 'guide': return 'Operations Guide & SOP Documentation';
      default: return 'Aravanta CloudOS Control Plane';
    }
  };

  const getTabSubtitle = () => {
    const userName = user?.full_name || user?.email?.split('@')[0] || 'User';
    return `Environment: Production • Control Plane: Active • User: ${userName}`;
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#0A1628] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Header
          title={getTabTitle()}
          subtitle={getTabSubtitle()}
          user={user}
          onUpdateUser={(updatedUser: any, newToken?: string) => {
            setUser(updatedUser);
            if (newToken) setToken(newToken);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onNavigateToProfile={() => setActiveTab('profile')}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleCopilot={() => setIsCopilotOpen(prev => !prev)}
        />

        {/* Dynamic Route Pages with Error Boundary Protection */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 min-w-0">
          <ErrorBoundary onReset={() => setActiveTab('dashboard')}>
            {!canAccessTab(activeTab, user?.role || user?.roles?.[0] || 'SuperAdmin') ? (
              <AccessDenied
                tabId={activeTab}
                userRole={user?.role || user?.roles?.[0] || 'SuperAdmin'}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard token={token} onNavigate={(tab) => setActiveTab(tab)} searchTerm={searchTerm} />}
                {activeTab === 'infrastructure' && <Infrastructure token={token} />}
                {activeTab === 'applications' && <Applications token={token} />}
                {activeTab === 'deployments' && <Deployments token={token} />}
                {activeTab === 'containers' && <Containers token={token} />}
                {activeTab === 'monitoring' && <Monitoring token={token} />}
                {activeTab === 'logs' && <Logs token={token} />}
                {activeTab === 'alerts' && <Alerts token={token} onNavigate={(tab) => setActiveTab(tab)} />}
                {activeTab === 'incidents' && <Incidents token={token} />}
                {activeTab === 'automation' && <Automation token={token} />}
                {activeTab === 'backups' && <Backups token={token} />}
                {activeTab === 'audit' && <AuditLogs token={token} />}
                {activeTab === 'settings' && <Settings token={token} />}
                
                {/* Cloud Resources */}
                {activeTab === 'compute' && <Compute token={token} />}
                {activeTab === 'kubernetes' && <Kubernetes token={token} />}
                {activeTab === 'storage' && <Storage token={token} />}
                {activeTab === 'database' && <Databases token={token} />}
                {activeTab === 'cicd' && <CICD />}
                {activeTab === 'security' && <Security token={token} />}
                {activeTab === 'billing' && <Billing />}
                {activeTab === 'profile' && (
                  <Profile
                    user={user}
                    onUpdateUser={(updatedUser: any, newToken?: string) => {
                      setUser(updatedUser);
                      if (newToken) setToken(newToken);
                    }}
                    onNavigateToBilling={() => setActiveTab('billing')}
                  />
                )}
                {activeTab === 'guide' && <GettingStarted onNavigate={(tab) => setActiveTab(tab)} />}
                
                {/* Fallback for unhandled tab */}
                {![
                  'dashboard', 'infrastructure', 'applications', 'deployments', 
                  'containers', 'monitoring', 'logs', 'alerts', 'incidents', 
                  'automation', 'backups', 'audit', 'settings', 'compute', 
                  'kubernetes', 'storage', 'database', 'cicd', 'security', 
                  'billing', 'profile', 'guide'
                ].includes(activeTab) && (
                  <Dashboard token={token} onNavigate={(tab) => setActiveTab(tab)} searchTerm={searchTerm} />
                )}
              </>
            )}
          </ErrorBoundary>
        </main>

        {/* Console Copilot AI Assistant Layer */}
        <ConsoleCopilot
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          currentTab={activeTab}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsCopilotOpen(false);
          }}
        />

        {/* Floating Copilot Launcher Orb (when drawer is closed) */}
        {!isCopilotOpen && (
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-brandGold-600 to-brandGold-500 hover:from-brandGold-500 hover:to-brandGold-600 text-white font-mono font-bold text-xs shadow-xl shadow-brandGold-500/25 border border-brandGold-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Ask Console Copilot AI (Ctrl+J)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>Copilot AI</span>
          </button>
        )}

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={handleUniversalNavigate}
        />
        <CookieConsent />
      </div>
    </div>
  );
}
