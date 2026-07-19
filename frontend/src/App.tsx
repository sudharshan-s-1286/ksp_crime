import React, { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { StatusBar } from './components/StatusBar';

// Import Views
import { Dashboard } from './views/Dashboard';
import { AICrimeCopilot } from './views/AICrimeCopilot';
import { CrimeDatabase } from './views/CrimeDatabase';
import { InvestigationWorkspace } from './views/InvestigationWorkspace';
import { CriminalNetwork } from './views/CriminalNetwork';
import { CrimeAnalytics } from './views/CrimeAnalytics';
import { OffenderProfiling } from './views/OffenderProfiling';
import { FinancialIntelligence } from './views/FinancialIntelligence';
import { CrimeForecasting } from './views/CrimeForecasting';
import { Reports } from './views/Reports';
import { AuditLogs } from './views/AuditLogs';
import { Settings } from './views/Settings';
import { AIAgentMonitoring } from './views/AIAgentMonitoring';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Handled inside our Axios interceptor
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { user } = useAuth();
  const [role, setRole] = useState<string>('Investigator');
  const mainRef = useRef<HTMLElement>(null);
  
  // Keep track of visited tabs so we can lazily mount them and keep them alive
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['dashboard']));

  useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Sync role selector in header with authenticated user's default role
  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  // Programmatically reset scroll position of main content area only
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const VIEWS: Record<string, React.ReactNode> = {
    'dashboard': <Dashboard />,
    'copilot': <AICrimeCopilot />,
    'database': <CrimeDatabase />,
    'investigations': <InvestigationWorkspace />,
    'network': <CriminalNetwork />,
    'analytics': <CrimeAnalytics />,
    'profiling': <OffenderProfiling />,
    'financial': <FinancialIntelligence />,
    'forecasting': <CrimeForecasting />,
    'reports': <Reports />,
    'audit': <AuditLogs />,
    'agent-monitoring': <AIAgentMonitoring />,
    'settings': <Settings />,
  };

  return (
    <div className="app-shell" style={{ position: 'relative', display: 'flex', height: '100vh', overflow: 'hidden', background: '#000', color: '#fff', fontFamily: 'var(--font-sans)' }}>
      {/* Ambient background glows */}
      <div 
        className="absolute pointer-events-none rounded-full blur-[150px] opacity-[0.03]" 
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #FF7A00 0%, transparent 80%)',
          top: '-150px',
          right: '-100px',
        }}
      />
      <div 
        className="absolute pointer-events-none rounded-full blur-[180px] opacity-[0.02]" 
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, #00A3FF 0%, transparent 80%)',
          bottom: '-100px',
          left: '-50px',
        }}
      />

      {/* Sidebar as Flex Item */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
      />

      {/* Main Content Area - standard flex column taking remaining width */}
      <div 
        className="main-content-area"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <TopNav role={role} setRole={setRole} />
        
        {/* Viewport content area — handles scrolling natively and permanently reserves scrollbar space to prevent width reflow */}
        <main 
          ref={mainRef}
          style={{
            flex: 1,
            overflowY: 'scroll',
            overflowX: 'hidden',
            background: 'rgba(9, 9, 11, 0.2)',
            position: 'relative',
          }}
        >
          {Object.entries(VIEWS).map(([id, Component]) => {
            if (!visitedTabs.has(id) && activeTab !== id) return null;
            return (
              <div key={id} style={{ display: activeTab === id ? 'block' : 'none' }}>
                {Component}
              </div>
            );
          })}
        </main>

        <StatusBar role={role} />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
