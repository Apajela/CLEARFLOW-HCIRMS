import React, { useState, useEffect } from 'react';
import { inventoryService, DatabaseState } from './services/inventoryService';
import { UserAccount, InventoryRequest } from './types/inventory';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Views
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

import { LogOut, Lock } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<DatabaseState>(inventoryService.getState());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(inventoryService.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [preselectedRequest, setPreselectedRequest] = useState<InventoryRequest | null>(null);

  useEffect(() => {
    const unsubscribe = inventoryService.subscribe(newState => {
      setState({ ...newState });
      const user = inventoryService.getCurrentUser();
      setCurrentUser(user ? { ...user } : null);
    });
    return unsubscribe;
  }, []);

  // Synchronize dark/light theme mode with documentElement
  useEffect(() => {
    const isDark = state.settings?.themeMode === 'dark' || localStorage.getItem('medflow_theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings?.themeMode]);

  const handleLogout = () => {
    inventoryService.logout();
    setCurrentUser(null);
  };

  const handleOpenReleaseWithRequest = (req: InventoryRequest) => {
    setPreselectedRequest(req);
    setCurrentView('release');
  };

  const handleOpenQuickRelease = () => {
    setPreselectedRequest(null);
    setCurrentView('release');
  };

  // If user is not logged in, render the dedicated Login Screen
  if (!currentUser) {
    return (
      <LoginView
        settings={state.settings}
        onLoginSuccess={user => {
          setCurrentUser(user);
          setCurrentView('dashboard');
        }}
      />
    );
  }

  // Counts for sidebar badges
  const counts = {
    lowStock: state.items.filter(i => i.currentStock <= i.minStockAlert).length,
    nearExpiry: state.batches.filter(b => b.status === 'near_expiry').length,
    expired: state.batches.filter(b => b.status === 'expired').length,
    pendingRequests: state.requests.filter(r => r.status === 'Pending').length,
  };

  // Permission check for active view
  const getViewPermissionRequirement = (view: string): { permission: any; requiresFullAccess?: boolean } => {
    switch (view) {
      case 'dashboard':
        return { permission: 'view_dashboard' };
      case 'inventory':
        return { permission: 'view_inventory' };
      case 'stock_in':
        return { permission: 'stock_in' };
      case 'requests':
        return { permission: 'create_request' };
      case 'release':
        return { permission: 'stock_release' };
      case 'patient_usage':
        return { permission: 'patient_usage' };
      case 'stock_adjustment':
        return { permission: 'stock_adjustment' };
      case 'billing_finance':
        return { permission: 'view_billing' };
      case 'monthly_overview':
      case 'reports':
        return { permission: 'view_reports' };
      case 'users':
        return { permission: 'manage_users', requiresFullAccess: true };
      case 'settings':
        return { permission: 'manage_settings' };
      case 'audit_logs':
        return { permission: 'view_audit_logs' };
      case 'backup_restore':
        return { permission: 'backup_restore' };
      default:
        return { permission: 'view_dashboard' };
    }
  };

  const req = getViewPermissionRequirement(currentView);
  const isAllowed = currentUser.isFullAccess || currentUser.permissions.includes(req.permission);
  const isRestrictedByFullAccess = req.requiresFullAccess && !currentUser.isFullAccess;
  const canAccessCurrentView = isAllowed && !isRestrictedByFullAccess;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        settings={state.settings}
        onLogout={handleLogout}
        activeView={currentView}
        onNavigate={setCurrentView}
        onOpenQuickRelease={handleOpenQuickRelease}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onSelectView={view => {
            if (view !== 'release') {
              setPreselectedRequest(null);
            }
            setCurrentView(view);
          }}
          currentUser={currentUser}
          counts={counts}
        />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {canAccessCurrentView ? (
              <>
                {currentView === 'dashboard' && (
                  <DashboardView
                    state={state}
                    currentUser={currentUser}
                    onNavigate={setCurrentView}
                    onOpenRelease={handleOpenQuickRelease}
                  />
                )}

                {currentView === 'inventory' && (
                  <InventoryView state={state} currentUser={currentUser} />
                )}

                {currentView === 'stock_in' && (
                  <StockInView state={state} currentUser={currentUser} />
                )}

                {currentView === 'requests' && (
                  <RequestsView
                    state={state}
                    currentUser={currentUser}
                    onOpenReleaseWithRequest={handleOpenReleaseWithRequest}
                  />
                )}

                {currentView === 'release' && (
                  <ReleaseView
                    state={state}
                    currentUser={currentUser}
                    preselectedRequest={preselectedRequest}
                    onClearPreselectedRequest={() => setPreselectedRequest(null)}
                  />
                )}

                {currentView === 'patient_usage' && (
                  <PatientUsageView state={state} currentUser={currentUser} />
                )}

                {currentView === 'stock_adjustment' && (
                  <StockAdjustmentView state={state} currentUser={currentUser} />
                )}

                {currentView === 'billing_finance' && (
                  <BillingFinanceView state={state} currentUser={currentUser} />
                )}

                {currentView === 'monthly_overview' && (
                  <MonthlyOverviewView state={state} currentUser={currentUser} />
                )}

                {currentView === 'reports' && (
                  <ReportsView state={state} currentUser={currentUser} />
                )}

                {currentView === 'users' && (
                  <UserManagementView state={state} currentUser={currentUser} />
                )}

                {currentView === 'settings' && (
                  <SettingsView state={state} currentUser={currentUser} />
                )}

                {currentView === 'audit_logs' && (
                  <AuditLogsView state={state} currentUser={currentUser} />
                )}

                {currentView === 'backup_restore' && (
                  <BackupRestoreView state={state} currentUser={currentUser} />
                )}
              </>
            ) : (
              /* Security Barrier Screen (Requirement 12 & 18) */
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-12 text-center shadow-xs max-w-2xl mx-auto my-12">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Access Denied: Security Policy Restriction
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Your current account <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</span> ({currentUser.roleLabel}) does not have permission to access <span className="font-mono font-semibold text-red-700 dark:text-red-400">[{req.permission}]</span>.
                  {req.requiresFullAccess && ' This administrative panel is restricted strictly to Full Access accounts.'}
                </p>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-mono text-left max-w-md mx-auto">
                  <div>Active Account: {currentUser.username} ({currentUser.id})</div>
                  <div>Department: {currentUser.department}</div>
                  <div>Granted Permissions: {currentUser.permissions.length} active</div>
                  <div className="text-red-700 dark:text-red-400 mt-1">Status: Blocked by Authoritative Security Engine</div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Return to Allowed Dashboard
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign In with Different Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
