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
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aravanta_token'));
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('aravanta_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authViewState, setAuthViewState] = useState<'landing' | 'login' | 'register'>(() => {
    const saved = localStorage.getItem('aravanta_auth_view');
    if (saved === 'login' || saved === 'register' || saved === 'landing') {
      return saved;
    }
    return 'landing';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('aravanta_active_tab') || 'dashboard';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('aravanta_token', token);
    } else {
      localStorage.removeItem('aravanta_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aravanta_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aravanta_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aravanta_auth_view', authViewState);
  }, [authViewState]);

  useEffect(() => {
    localStorage.setItem('aravanta_active_tab', activeTab);
  }, [activeTab]);

  const handleLoginSuccess = (userData: any, newToken: string) => {
    setToken(newToken);
    setUser(userData);
    setAuthViewState('landing');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aravanta_token');
    localStorage.removeItem('aravanta_user');
    localStorage.removeItem('aravanta_active_tab');
    setAuthViewState('landing');
  };

  if (!token) {
    if (authViewState === 'login' || authViewState === 'register') {
      return (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          initialTab={authViewState === 'register' ? 'register' : 'signin'}
          onGoToLanding={() => setAuthViewState('landing')}
        />
      );
    }

    return (
      <LandingPage
        onGoToLogin={() => setAuthViewState('login')}
        onGoToRegister={() => setAuthViewState('register')}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
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
        />

        {/* Dynamic Route Pages */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 min-w-0">
          {activeTab === 'dashboard' && <Dashboard token={token} onNavigate={(tab) => setActiveTab(tab)} />}
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
