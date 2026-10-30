import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { AuditLog, AuditActionType } from '../types/inventory';

export const AuditLogsView: React.FC = () => {
  const [logs] = useState<AuditLog[]>(() => inventoryService.getAuditLogs());
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchType = selectedType === 'ALL' || log.actionType === selectedType;
    const q = search.toLowerCase();
    const matchSearch =
      log.userName.toLowerCase().includes(q) ||
      log.entityAffected.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.terminal.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const actionTypes = [
    'ALL',
    'LOGIN',
    'PASSWORD_VERIFY_SUCCESS',
    'PASSWORD_VERIFY_FAILED',
    'STOCK_IN',
    'FEFO_RELEASE',
    'BULK_STOCK_IN',
    'BULK_ADJUSTMENT',
    'BULK_TRANSFER',
    'BULK_PRICE_UPDATE',
    'BULK_BATCH_UPDATE',
    'BULK_STATUS_UPDATE',
    'BULK_IMPORT',
    'BULK_DELETE',
    'STOCK_ADJUSTMENT',
    'PATIENT_USAGE',
    'SECURITY_BLOCKED',
    'PERMISSION_CHANGE',
    'SETTINGS_UPDATE',
    'BACKUP_RESTORE'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            System Audit Trail & Security Events
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable log of all user activities, FEFO releases, password authorizations, security denials, and bulk updates.
          </p>
        </div>

        <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {logs.length} Recorded Security Events
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, entity, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          >
            {actionTypes.map(t => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Event Types' : t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Entity Affected</th>
                <th className="p-3">Activity Details</th>
                <th className="p-3 font-mono">Terminal / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => {
                const isBlocked = log.actionType === 'SECURITY_BLOCKED' || log.actionType === 'PASSWORD_VERIFY_FAILED';
                const isSuccessVerify = log.actionType === 'PASSWORD_VERIFY_SUCCESS';
                const isBulk = log.actionType.startsWith('BULK_');

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{log.userName}</div>
                      <div className="text-[10px] text-slate-500">{log.userRole}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        isBlocked
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : isSuccessVerify
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isBulk
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : log.actionType === 'FEFO_RELEASE'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {log.entityAffected}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 max-w-md">
                      {log.details}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {log.terminal} ({log.ipAddress})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
