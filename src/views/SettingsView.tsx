import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState } from 'react';
import {
  Settings,
  Building,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sun,
  Moon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Check,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { HospitalMasterSettings } from '../types/inventory';

const PAGE_TITLE_DEFAULTS: Record<string, string> = {
  dashboard: 'Central Pharmacy & FEFO Dispensing Console',
  inventory: 'Medical Inventory & Unit Conversions',
  stock_in: 'Stock In & Supplier Receiving',
  requests: 'Ward & Department Requisitions',
  release: 'FEFO Stock Release & Automated Dispensing',
  patient_usage: 'Patient Medication Consumption & Administration',
  stock_adjustment: 'Stock Adjustments & Quarantine Transfers',
  finance: 'Finance – Expense Monitoring',
  monthly_overview: 'Monthly Inventory Overview',
  reports: 'Safety Alerts & Compliance Reports',
  users: 'User & Account Management',
  settings: 'Locations & Master Facility Settings',
  audit_logs: 'System Audit Trail & Security Events',
  backup_restore: 'Database Backup & Disaster Recovery'
};

const PAGE_SUBTITLE_DEFAULTS: Record<string, string> = {
  audit_logs: 'Track user actions, security events, and changes across the system.',
  backup_restore: 'Create and restore backups to protect operational records.',
  finance: 'Monitor actual center expenses, transactions, and spending categories.',
  dashboard: 'Authoritative FEFO automatic dispatch, clinical expired lot blocking, and high-volume bulk stock operations.',
  inventory: 'View stock levels, item details, batch availability, and inventory valuation.',
  monthly_overview: 'Review monthly stock movement, balances, and inventory valuation.',
  patient_usage: 'Record and review medication consumption for clinical documentation.',
  release: 'Automatically dispatch eligible lots using First-Expiry, First-Out controls.',
  reports: 'Review expiry, stock safety, and compliance reporting.',
  requests: 'Manage ward and department requests for medicines and supplies.',
  settings: 'Configure facility locations, page branding, storage shelves, and suppliers.',
  stock_adjustment: 'Record authorized stock corrections, quarantine, and transfers.',
  stock_in: 'Receive supplier deliveries and record incoming inventory batches.',
  users: 'Manage staff accounts, access roles, and permissions.'
};

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onRefreshSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  onRefreshSettings
}) => {
  const pageTitle = usePageTitle('settings', 'Locations & Master Facility Settings');
  const pageSubtitle = usePageSubtitle('settings', 'Configure facility locations, page branding, storage shelves, and suppliers.')
  const [settings, setSettings] = useState<HospitalMasterSettings>(() => { const current = inventoryService.getSettings(); return { ...current, pageTitles: { ...PAGE_TITLE_DEFAULTS, ...(current.pageTitles || {}) }, pageSubtitles: { ...PAGE_SUBTITLE_DEFAULTS, ...(current.pageSubtitles || {}) } }; });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New item inputs
  const [newWard, setNewWard] = useState('');
  const [newPatientLoc, setNewPatientLoc] = useState('');
  const [newShelf, setNewShelf] = useState('');
  const [newSupplier, setNewSupplier] = useState('');

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (.png, .jpg, .jpeg, .svg, .webp).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      alert('File size exceeds 2.5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      inventoryService.uploadLogo(dataUrl);
      setSettings(inventoryService.getSettings());
      onRefreshSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    inventoryService.resetLogo();
    setSettings(inventoryService.getSettings());
    onRefreshSettings();
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      inventoryService.updateSettings({
        systemTitle: settings.systemTitle,
        subtitle: settings.subtitle,
        hospitalName: settings.hospitalName,
        address: settings.address,
        licenseNumber: settings.licenseNumber,
        contactNumber: settings.contactNumber,
        email: settings.email
      });
      onRefreshSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    }
  };

  // Ward Handlers
  const handleAddWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWard.trim()) return;
    inventoryService.addRequestingWard(newWard);
    setNewWard('');
    setSettings(inventoryService.getSettings());
  };

  const handleRenameWard = (oldName: string) => {
    const newName = prompt(`Enter new name for '${oldName}':`, oldName);
    if (newName && newName.trim() && newName !== oldName) {
      inventoryService.renameRequestingWard(oldName, newName.trim());
      setSettings(inventoryService.getSettings());
    }
  };

  const handleDeleteWard = (name: string) => {
    if (confirm(`Remove '${name}' from ward options?`)) {
      inventoryService.deleteRequestingWard(name);
      setSettings(inventoryService.getSettings());
    }
  };

  // Patient Location Handlers
  const handleAddPatientLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientLoc.trim()) return;
    inventoryService.addPatientLocation(newPatientLoc);
    setNewPatientLoc('');
    setSettings(inventoryService.getSettings());
  };

  const handleRenamePatientLoc = (oldLoc: string) => {
    const newLoc = prompt(`Enter new format for '${oldLoc}':`, oldLoc);
    if (newLoc && newLoc.trim() && newLoc !== oldLoc) {
      inventoryService.renamePatientLocation(oldLoc, newLoc.trim());
      setSettings(inventoryService.getSettings());
    }
  };

  const handleDeletePatientLoc = (loc: string) => {
    if (confirm(`Remove '${loc}'?`)) {
      inventoryService.deletePatientLocation(loc);
      setSettings(inventoryService.getSettings());
    }
  };

  // Storage Shelf Handlers
  const handleAddShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelf.trim()) return;
    inventoryService.addStorageShelf(newShelf);
    setNewShelf('');
    setSettings(inventoryService.getSettings());
  };

  const handleRenameShelf = (oldShelf: string) => {
    const newS = prompt(`Enter new name for shelf '${oldShelf}':`, oldShelf);
    if (newS && newS.trim() && newS !== oldShelf) {
      inventoryService.renameStorageShelf(oldShelf, newS.trim());
      setSettings(inventoryService.getSettings());
    }
  };

  const handleDeleteShelf = (shelf: string) => {
    if (confirm(`Delete storage shelf '${shelf}'?`)) {
      inventoryService.deleteStorageShelf(shelf);
      setSettings(inventoryService.getSettings());
    }
  };

  // Supplier Handlers
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.trim()) return;
    inventoryService.addSupplier(newSupplier);
    setNewSupplier('');
    setSettings(inventoryService.getSettings());
  };

  const handleRenameSupplier = (oldSupp: string) => {
    const newS = prompt(`Enter new name for supplier '${oldSupp}':`, oldSupp);
    if (newS && newS.trim() && newS !== oldSupp) {
      inventoryService.renameSupplier(oldSupp, newS.trim());
      setSettings(inventoryService.getSettings());
    }
  };

  const handleDeleteSupplier = (supp: string) => {
    if (confirm(`Remove supplier '${supp}'?`)) {
      inventoryService.deleteSupplier(supp);
      setSettings(inventoryService.getSettings());
    }
  };

  const handleSavePageTitles = () => {
    inventoryService.updateSettings({ pageTitles: { ...PAGE_TITLE_DEFAULTS, ...(settings.pageTitles || {}) }, pageSubtitles: { ...PAGE_SUBTITLE_DEFAULTS, ...(settings.pageSubtitles || {}) } });
    setSettings(inventoryService.getSettings());
    onRefreshSettings();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            {pageTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pageSubtitle}</p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved and applied system-wide!</span>
          </div>
        )}
      </div>

      {/* Per-page editable titles */}
      <section className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Individual Page Titles</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Edit each module title and subtitle independently. Changes are saved to this device's current app storage.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(PAGE_TITLE_DEFAULTS).map(([key, fallback]) => (
            <label key={key} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              <input type="text" value={settings.pageTitles?.[key] ?? fallback}
                onChange={e => setSettings(prev => ({ ...prev, pageTitles: { ...PAGE_TITLE_DEFAULTS, ...(prev.pageTitles || {}), [key]: e.target.value } }))}
                className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-normal" />
              <span className="block mt-2">Subtitle / Description</span>
              <textarea rows={2} value={settings.pageSubtitles?.[key] ?? PAGE_SUBTITLE_DEFAULTS[key]}
                onChange={e => setSettings(prev => ({ ...prev, pageSubtitles: { ...PAGE_SUBTITLE_DEFAULTS, ...(prev.pageSubtitles || {}), [key]: e.target.value } }))}
                className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-normal" />
            </label>
          ))}
        </div>
        <button type="button" onClick={handleSavePageTitles} className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg">Save Page Titles</button>
      </section>

      {/* Theme & Appearance Section */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-teal-400" />}
          Theme & Visual Appearance
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Switch between clinical day shift palette and dark mode for low-glare 24-hour ward and ER stations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md pt-1">
          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') onToggleTheme();
            }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              theme === 'light'
                ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-semibold ring-2 ring-teal-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Sun className="w-5 h-5" />
            </div>
            <div className="text-left text-xs">
              <div className="font-bold">Light Mode</div>
              <div className="text-[11px] text-slate-500">Clinical White · Day Shift</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') onToggleTheme();
            }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'border-teal-500 bg-teal-950/40 text-teal-300 font-semibold ring-2 ring-teal-400/20'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-slate-800 text-teal-400">
              <Moon className="w-5 h-5" />
            </div>
            <div className="text-left text-xs">
              <div className="font-bold">Dark Mode</div>
              <div className="text-[11px] text-slate-400">Night Shift · Low Glare</div>
            </div>
          </button>
        </div>
      </div>

      {/* Hospital Logo Upload Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-teal-600" />
          Hospital & Pharmacy Seal / Logo Upload
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload custom institutional logo. Automatically updates the top header, staff login screen, and official printable vouchers.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center p-2 overflow-hidden shadow-xs">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Hospital Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-400 text-[10px]">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                Default Seal
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Logo File</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>

              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Institutional Seal</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Supports PNG, JPG, WebP, or SVG formats up to 2.5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Editable System Branding & Names */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-teal-600" />
          System Branding & Institutional Metadata (Fully Editable)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize header titles, subtitle tags, facility operating licenses, and official hospital address.
        </p>

        <form onSubmit={handleSaveBranding} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                System Name (Header Title)
              </label>
              <input
                type="text"
                value={settings.systemTitle}
                onChange={(e) => setSettings({ ...settings, systemTitle: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                System Subtitle / Engine Tagline
              </label>
              <input
                type="text"
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Hospital Name
              </label>
              <input
                type="text"
                value={settings.hospitalName}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operating License Number
              </label>
              <input
                type="text"
                value={settings.licenseNumber}
                onChange={(e) => setSettings({ ...settings, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hospital Address & Contact Information
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
            >
              Save Branding & Metadata
            </button>
          </div>
        </form>
      </div>

      {/* Ward Locations & Department Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Requesting Ward Departments */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              Requesting Ward Departments ({settings.requestingWards.length})
            </h4>
          </div>

          <form onSubmit={handleAddWard} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Pediatrics Ward 2A"
              value={newWard}
              onChange={(e) => setNewWard(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
            >
              Add Ward
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {settings.requestingWards.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/80 dark:border-slate-700"
              >
                <span className="text-slate-800 dark:text-slate-200 font-medium">{w}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRenameWard(w)}
                    title="Rename"
                    className="p-1 text-slate-400 hover:text-teal-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteWard(w)}
                    title="Delete"
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Bed / Room Locations */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              Patient Ward / Room / Bed Locations ({settings.patientLocations.length})
            </h4>
          </div>

          <form onSubmit={handleAddPatientLoc} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Ward 3B - Bed 309"
              value={newPatientLoc}
              onChange={(e) => setNewPatientLoc(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
            >
              Add Bed
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {settings.patientLocations.map((l, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/80 dark:border-slate-700"
              >
                <span className="text-slate-800 dark:text-slate-200 font-medium">{l}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRenamePatientLoc(l)}
                    title="Rename"
                    className="p-1 text-slate-400 hover:text-teal-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePatientLoc(l)}
                    title="Delete"
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Storage Shelves & Accredited Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Storage Shelves */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <h4 className="font-semibold text-slate-900 dark:text-white">
            Pharmacy Shelves & Storage Bins ({settings.storageShelves.length})
          </h4>

          <form onSubmit={handleAddShelf} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Central Pharmacy - Shelf D1"
              value={newShelf}
              onChange={(e) => setNewShelf(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
            >
              Add Shelf
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {settings.storageShelves.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/80 dark:border-slate-700"
              >
                <span className="text-slate-800 dark:text-slate-200 font-medium">{s}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRenameShelf(s)}
                    title="Rename"
                    className="p-1 text-slate-400 hover:text-teal-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteShelf(s)}
                    title="Delete"
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suppliers */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <h4 className="font-semibold text-slate-900 dark:text-white">
            Accredited Pharmaceutical Suppliers ({settings.accreditedSuppliers.length})
          </h4>

          <form onSubmit={handleAddSupplier} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Novartis Healthcare Phils"
              value={newSupplier}
              onChange={(e) => setNewSupplier(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
            >
              Add Supplier
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {settings.accreditedSuppliers.map((sup, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/80 dark:border-slate-700"
              >
                <span className="text-slate-800 dark:text-slate-200 font-medium">{sup}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRenameSupplier(sup)}
                    title="Rename"
                    className="p-1 text-slate-400 hover:text-teal-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(sup)}
                    title="Delete"
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
