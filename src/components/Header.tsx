import React from 'react';
import { LogOut, Sun, Moon, Shield, Bell, User } from 'lucide-react';
import { UserAccount } from '../types/inventory';
import { inventoryService } from '../services/inventoryService';

interface HeaderProps {
  currentUser: UserAccount;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  theme,
  onToggleTheme
}) => {
  const settings = inventoryService.getSettings();
  const batches = inventoryService.getBatches();
  const expiredCount = batches.filter(b => inventoryService.isExpired(b.expiryDate)).length;
  const nearExpiryCount = batches.filter(b => inventoryService.isNearExpiry(b.expiryDate)).length;

  return (
    <header className="no-print h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Hospital Identity & Branding */}
      <div className="flex items-center gap-3">
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="Hospital Logo"
            className="w-10 h-10 object-contain rounded-md border border-slate-200 dark:border-slate-700 bg-white"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {settings.systemTitle || 'MedFlow Hospital Inventory'}
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {settings.subtitle || 'FEFO Pharmacy Engine'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
            {settings.hospitalName}
          </p>
        </div>
      </div>

      {/* Right Controls: Expiry Badges, Theme Toggle, User Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Safety Alert Badges */}
        {expiredCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs rounded-md font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span>{expiredCount} Expired (Blocked)</span>
          </div>
        )}
        {nearExpiryCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-xs rounded-md font-medium">
            <span>{nearExpiryCount} Near-Expiry</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Active Staff Account Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-end gap-1">
              {currentUser.fullName}
              {currentUser.isFullAccess && (
                <span title="Full Access Administrator">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {currentUser.role} · {currentUser.department}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
            {currentUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>

          <button
            onClick={onLogout}
            title="Log Out Session"
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
