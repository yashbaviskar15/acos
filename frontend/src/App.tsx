import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
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
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aravanta_token'));
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('aravanta_user');
    return saved ? JSON.parse(saved) : null;
  });

  // ─── Persist authViewState across reloads ───
  // Read from localStorage on mount so the page stays where it was after reload
  const [authViewState, setAuthViewState] = useState<'landing' | 'login' | 'register'>(() => {
    const saved = localStorage.getItem('aravanta_auth_view');
    if (saved === 'login' || saved === 'register' || saved === 'landing') {
      return saved;
    }
    return 'landing';
  });

  // Remember current page tab across browser refreshes for authenticated users
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('aravanta_active_tab') || 'dashboard';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Persist token
  useEffect(() => {
    if (token) {
      localStorage.setItem('aravanta_token', token);
    } else {
      localStorage.removeItem('aravanta_token');
    }
  }, [token]);

  // Persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem('aravanta_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aravanta_user');
    }
  }, [user]);

  // Persist current tab
  useEffect(() => {
    localStorage.setItem('aravanta_active_tab', activeTab);
  }, [activeTab]);

  // ─── Persist authViewState to localStorage on change ───
  useEffect(() => {
    localStorage.setItem('aravanta_auth_view', authViewState);
  }, [authViewState]);

  const handleLoginSuccess = (userData: any, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    // Clear the auth view state once logged in
    localStorage.removeItem('aravanta_auth_view');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aravanta_token');
    localStorage.removeItem('aravanta_user');
    localStorage.removeItem('aravanta_active_tab');
    localStorage.removeItem('aravanta_auth_view');
    setAuthViewState('landing');
  };

  // ─── Unauthenticated Views ───
  if (!token) {
    if (authViewState === 'landing') {
      return (
        <>
          <LandingPage
            onGoToLogin={() => setAuthViewState('login')}
            onGoToRegister={() => setAuthViewState('register')}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={() => {
              setIsCommandPaletteOpen(false);
              setAuthViewState('login');
            }}
          />
        </>
      );
    }

    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onGoToLanding={() => setAuthViewState('landing')}
        initialTab={authViewState === 'register' ? 'register' : 'signin'}
      />
    );
  }

  // ─── Authenticated Console ───
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Command Center';
      case 'compute': return 'ArvCompute — Virtual Machines';
      case 'kubernetes': return 'ArvKube — Managed Kubernetes Clusters';
      case 'storage': return 'ArvStore — S3 Object Storage Buckets';
      case 'database': return 'ArvDB — Managed Database Engines';
      case 'cicd': return 'CI/CD Pipelines & Artifact Releases';
      case 'monitoring': return 'ArvWatch — Telemetry & Metrics';
      case 'security': return 'Security, RBAC & Audit Trail';
      case 'billing': return 'Billing & Cost Analytics (INR ₹)';
      case 'profile': return 'User Profile & IAM Settings';
      case 'guide': return 'Getting Started — Service Usage Guide';
      default: return 'Aravanta CloudOS Control Plane';
    }
  };

  const getTabSubtitle = () => {
    const region = 'arv-us-east-1';
    const userName = user?.full_name || user?.email?.split('@')[0] || 'User';
    return `Environment: Production • Region: ${region} • User: ${userName}`;
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#0A1628] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      {/* Fixed Sidebar Container */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Right Area */}
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
        />

        {/* Main Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 min-w-0">
          {activeTab === 'dashboard' && <Dashboard token={token} onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'compute' && <Compute token={token} />}
          {activeTab === 'kubernetes' && <Kubernetes token={token} />}
          {activeTab === 'storage' && <Storage token={token} />}
          {activeTab === 'database' && <Databases token={token} />}
          {activeTab === 'cicd' && <CICD />}
          {activeTab === 'monitoring' && <Monitoring token={token} />}
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
        </main>

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      </div>
    </div>
  );
}
