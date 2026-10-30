import React, { useState, useEffect } from 'react';
import { inventoryService } from './services/inventoryService';
import { UserAccount } from './types/inventory';
import { Header } from './components/Header';
import { Sidebar, ViewKey } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { StockInView } from './views/StockInView';
import { RequestsView } from './views/RequestsView';
import { ReleaseView } from './views/ReleaseView';
import { PatientUsageView } from './views/PatientUsageView';
import { StockAdjustmentView } from './views/StockAdjustmentView';
import { BillingFinanceView } from './views/BillingFinanceView';
import { MonthlyOverviewView } from './views/MonthlyOverviewView';
import { ReportsView } from './views/ReportsView';
import { UserManagementView } from './views/UserManagementView';
import { SettingsView } from './views/SettingsView';
import { AuditLogsView } from './views/AuditLogsView';
import { BackupRestoreView } from './views/BackupRestoreView';
import { BulkStockManagementModal } from './components/BulkStockManagementModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => inventoryService.getCurrentUser());
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => inventoryService.getTheme());
  
  // Bulk Stock Management Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);

  // Cross-view navigation state (e.g., from Requisition order directly into FEFO release)
  const [releaseRequestId, setReleaseRequestId] = useState<string | null>(null);

  // Settings update trigger to re-render header branding
  const [, setSettingsUpdateKey] = useState(0);

  useEffect(() => {
    // Sync theme
    inventoryService.setTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    inventoryService.setTheme(next);
  };

  const handleLogout = () => {
    inventoryService.logout();
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleNavigateToRelease = (requestId: string) => {
    setReleaseRequestId(requestId);
    setCurrentView('release');
  };

  // If user is not logged in, render the login page
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      
      {/* Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace with Sidebar & Dynamic View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => {
            setCurrentView(v);
            if (v !== 'release') setReleaseRequestId(null);
          }}
          currentUser={currentUser}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigate={(v) => setCurrentView(v)}
                onOpenBulkModal={() => setBulkModalOpen(true)}
              />
            )}

            {currentView === 'inventory' && (
              <InventoryView
                key={inventoryRefreshKey}
                onOpenBulkModal={() => setBulkModalOpen(true)}
              />
            )}

            {currentView === 'stock_in' && <StockInView />}

            {currentView === 'requests' && (
              <RequestsView onNavigateToRelease={handleNavigateToRelease} />
            )}

            {currentView === 'release' && (
              <ReleaseView initialRequestId={releaseRequestId} />
            )}

            {currentView === 'patient_usage' && <PatientUsageView />}

            {currentView === 'stock_adjustment' && <StockAdjustmentView />}

            {currentView === 'billing_finance' && <BillingFinanceView />}

            {currentView === 'monthly_overview' && <MonthlyOverviewView />}

            {currentView === 'reports' && <ReportsView />}

            {currentView === 'users' && <UserManagementView />}

            {currentView === 'settings' && (
              <SettingsView
                theme={theme}
                onToggleTheme={handleToggleTheme}
                onRefreshSettings={() => setSettingsUpdateKey(prev => prev + 1)}
              />
            )}

            {currentView === 'audit_logs' && <AuditLogsView />}

            {currentView === 'backup_restore' && <BackupRestoreView />}
          </div>
        </main>

      </div>

      {/* Global Bulk Stock Management & Updates Modal */}
      <BulkStockManagementModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onRefreshData={() => setInventoryRefreshKey(prev => prev + 1)}
      />

    </div>
  );
}
