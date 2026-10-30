import React, { useState } from 'react';
import { Database, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export const BackupRestoreView: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const json = inventoryService.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MedFlow_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSuccessMsg('Database snapshot exported successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        inventoryService.importBackup(text);
        setSuccessMsg('Database backup successfully restored.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        setErrorMsg('Invalid backup file format: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToBaseline = () => {
    if (!confirm('Warning: This will reset all inventory, batches, and transactions back to the October 2026 demonstration baseline. Proceed?')) return;
    try {
      inventoryService.resetToDefaultData();
      setSuccessMsg('System reset to October 2026 baseline.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            Database Backup & Disaster Recovery
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export complete database state as JSON snapshot, restore previous archives, or reset demo data.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Export Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Download className="w-4 h-4 text-teal-600" />
            <span>Export Database Archive</span>
          </div>
          <p className="text-slate-500">
            Download an encrypted JSON file containing the formulary catalog, batch balances, patient consumption records, and audit logs.
          </p>
          <button
            onClick={handleExport}
            className="w-full py-2.5 px-4 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (.JSON)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Restore From File</span>
          </div>
          <p className="text-slate-500">
            Upload a previously exported MedFlow database file to restore formulary catalog and transaction logs.
          </p>
          <label className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Select Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset Demo Data Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Reset Demo Baseline</span>
          </div>
          <p className="text-slate-500">
            Restore original October 2026 data: 1,250 beginning stock, 350 stock in, 280 stock released, 1,320 ending stock.
          </p>
          <button
            onClick={handleResetToBaseline}
            className="w-full py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to October 2026</span>
          </button>
        </div>

      </div>

    </div>
  );
};
