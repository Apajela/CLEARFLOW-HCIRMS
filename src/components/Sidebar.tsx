import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ClipboardList,
  Send,
  UserCheck,
  SlidersHorizontal,
  Wallet,
  BarChart3,
  FileText,
  Users,
  Settings,
  ShieldAlert,
  Database
} from 'lucide-react';
import { UserAccount, PermissionKey } from '../types/inventory';
import { inventoryService } from '../services/inventoryService';

export type ViewKey =
  | 'dashboard'
  | 'inventory'
  | 'stock_in'
  | 'requests'
  | 'release'
  | 'patient_usage'
  | 'stock_adjustment'
  | 'billing_finance'
  | 'monthly_overview'
  | 'reports'
  | 'users'
  | 'settings'
  | 'audit_logs'
  | 'backup_restore';

interface SidebarProps {
  currentView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  currentUser: UserAccount;
}

interface NavItem {
  id: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionKey;
  badge?: string;
  section: 'Clinical Core' | 'Logistics & FEFO' | 'Financial & Audits' | 'Administration';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  currentUser
}) => {
  const requests = inventoryService.getRequests();
  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;

  const batches = inventoryService.getBatches();
  const expiredCount = batches.filter(b => inventoryService.isExpired(b.expiryDate)).length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      permission: 'view_dashboard',
      section: 'Clinical Core'
    },
    {
      id: 'inventory',
      label: 'Medical Inventory',
      icon: Package,
      permission: 'view_inventory',
      section: 'Clinical Core'
    },
    {
      id: 'stock_in',
      label: 'Stock In & Receiving',
      icon: ArrowDownToLine,
      permission: 'stock_in',
      section: 'Logistics & FEFO'
    },
    {
      id: 'requests',
      label: 'Ward Requisitions',
      icon: ClipboardList,
      permission: 'create_request',
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined,
      section: 'Logistics & FEFO'
    },
    {
      id: 'release',
      label: 'FEFO Stock Release',
      icon: Send,
      permission: 'release_stock',
      section: 'Logistics & FEFO'
    },
    {
      id: 'patient_usage',
      label: 'Patient Consumption',
      icon: UserCheck,
      permission: 'patient_usage',
      section: 'Logistics & FEFO'
    },
    {
      id: 'stock_adjustment',
      label: 'Stock Adjustments',
      icon: SlidersHorizontal,
      permission: 'stock_adjustment',
      section: 'Logistics & FEFO'
    },
    {
      id: 'billing_finance',
      label: 'Finance – Expenses',
      icon: Wallet,
      permission: 'billing_finance',
      section: 'Financial & Audits'
    },
    {
      id: 'monthly_overview',
      label: 'October 2026 Overview',
      icon: BarChart3,
      permission: 'view_reports',
      section: 'Financial & Audits'
    },
    {
      id: 'reports',
      label: 'Safety Alerts & Reports',
      icon: FileText,
      permission: 'view_reports',
      badge: expiredCount > 0 ? `${expiredCount}` : undefined,
      section: 'Financial & Audits'
    },
    {
      id: 'users',
      label: 'User & Permissions',
      icon: Users,
      permission: 'manage_users',
      section: 'Administration'
    },
    {
      id: 'settings',
      label: 'Locations & Settings',
      icon: Settings,
      permission: 'manage_settings',
      section: 'Administration'
    },
    {
      id: 'audit_logs',
      label: 'System Audit Logs',
      icon: ShieldAlert,
      permission: 'audit_logs',
      section: 'Administration'
    },
    {
      id: 'backup_restore',
      label: 'Backup & Restore',
      icon: Database,
      permission: 'backup_restore',
      section: 'Administration'
    }
  ];

  const sections: Array<NavItem['section']> = [
    'Clinical Core',
    'Logistics & FEFO',
    'Financial & Audits',
    'Administration'
  ];

  return (
    <aside className="no-print w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
      <div className="p-4 space-y-6">
        {sections.map(section => {
          const items = navItems.filter(item => item.section === section);
          const visibleItems = items.filter(
            item => !item.permission || inventoryService.hasPermission(item.permission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section} className="space-y-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                {section}
              </div>

              <div className="space-y-0.5 pt-1">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectView(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          item.id === 'reports'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
