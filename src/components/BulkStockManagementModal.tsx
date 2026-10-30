import React, { useState, useMemo } from 'react';
import {
  Layers,
  ArrowDownToLine,
  SlidersHorizontal,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  AlertTriangle,
  UploadCloud,
  Trash2,
  History,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Download
} from 'lucide-react';
import { MedicalItem, BatchLot, ItemStatus, StockAdjustmentRecord } from '../types/inventory';
import { inventoryService } from '../services/inventoryService';
import { PasswordVerificationModal } from './PasswordVerificationModal';

interface BulkStockManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

type TabType =
  | 'stock_in'
  | 'adjustment'
  | 'transfer'
  | 'price'
  | 'batch'
  | 'status'
  | 'expiry'
  | 'import'
  | 'delete'
  | 'audit';

export const BulkStockManagementModal: React.FC<BulkStockManagementModalProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('stock_in');
  const [searchFilter, setSearchFilter] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password verification modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingActionTitle, setPendingActionTitle] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');
  const [pendingActionCallback, setPendingActionCallback] = useState<(() => void) | null>(null);

  const items = inventoryService.getItems();
  const batches = inventoryService.getBatches();
  const settings = inventoryService.getSettings();
  const auditLogs = inventoryService.getAuditLogs();

  // --- 1. Bulk Stock In State ---
  interface StockInRow {
    itemId: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    unitCost: number;
    shelf: string;
    supplier: string;
  }
  const [stockInRows, setStockInRows] = useState<StockInRow[]>([
    {
      itemId: items[0]?.id || '',
      batchNumber: `LOT-2026-B${Math.floor(100 + Math.random() * 900)}`,
      quantity: 50,
      expiryDate: '2027-12-31',
      unitCost: items[0]?.unitCost || 100,
      shelf: settings.storageShelves[0] || 'Central Pharmacy - Shelf A1',
      supplier: settings.accreditedSuppliers[0] || 'Zuellig Pharma Corp.'
    }
  ]);

  const addStockInRow = () => {
    setStockInRows([
      ...stockInRows,
      {
        itemId: items[0]?.id || '',
        batchNumber: `LOT-2026-B${Math.floor(100 + Math.random() * 900)}`,
        quantity: 20,
        expiryDate: '2027-12-31',
        unitCost: items[0]?.unitCost || 100,
        shelf: settings.storageShelves[0] || 'Central Pharmacy - Shelf A1',
        supplier: settings.accreditedSuppliers[0] || 'Zuellig Pharma Corp.'
      }
    ]);
  };

  const removeStockInRow = (index: number) => {
    setStockInRows(stockInRows.filter((_, idx) => idx !== index));
  };

  const updateStockInRow = (index: number, field: keyof StockInRow, value: any) => {
    const updated = [...stockInRows];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'itemId') {
      const itm = items.find(i => i.id === value);
      if (itm) {
        updated[index].unitCost = itm.unitCost;
        updated[index].shelf = itm.locationShelf;
      }
    }
    setStockInRows(updated);
  };

  // --- 2. Bulk Adjustment State ---
  interface AdjustmentRow {
    itemId: string;
    batchId: string;
    changeQty: number;
    type: StockAdjustmentRecord['type'];
    reason: string;
  }
  const [adjustmentRows, setAdjustmentRows] = useState<AdjustmentRow[]>([
    {
      itemId: items[0]?.id || '',
      batchId: batches.find(b => b.itemId === items[0]?.id)?.id || '',
      changeQty: -5,
      type: 'Damage',
      reason: 'Physical packaging tear during handling'
    }
  ]);

  const addAdjustmentRow = () => {
    setAdjustmentRows([
      ...adjustmentRows,
      {
        itemId: items[0]?.id || '',
        batchId: '',
        changeQty: -1,
        type: 'Damage',
        reason: 'Clinical inspection discrepancy'
      }
    ]);
  };

  // --- 3. Bulk Transfer State ---
  const [transferSelections, setTransferSelections] = useState<{ [batchId: string]: string }>({});

  // --- 4. Bulk Price Update State ---
  const [priceUpdates, setPriceUpdates] = useState<{ [itemId: string]: { cost: number; price: number } }>({});

  // --- 5. Bulk Batch Update State ---
  const [batchUpdates, setBatchUpdates] = useState<{
    [batchId: string]: { batchNumber: string; expiryDate: string; quantity: number; shelf: string };
  }>({});

  // --- 6. Bulk Status Update State ---
  const [statusSelectedItems, setStatusSelectedItems] = useState<string[]>([]);
  const [targetStatus, setTargetStatus] = useState<ItemStatus>('Active');

  // --- 8. Bulk Import (CSV) State ---
  const [csvText, setCsvText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);

  // --- 9. Bulk Delete State ---
  const [deleteSelectedItems, setDeleteSelectedItems] = useState<string[]>([]);

  // Trigger Security Verification before execution
  const requireSecurityVerification = (
    title: string,
    description: string,
    callback: () => void
  ) => {
    setPendingActionTitle(title);
    setPendingDescription(description);
    setPendingActionCallback(() => callback);
    setPasswordModalOpen(true);
  };

  // --- Action Handlers ---

  const handleCommitStockIn = () => {
    const validRows = stockInRows.filter(r => r.quantity > 0 && r.itemId);
    if (validRows.length === 0) {
      setErrorMessage('Please add at least one valid item with quantity > 0.');
      return;
    }
    requireSecurityVerification(
      'Authorize Bulk Stock-In',
      `Add incoming stock for ${validRows.length} item line(s).`,
      () => {
        try {
          inventoryService.executeBulkStockIn(validRows);
          setSuccessMessage(`Successfully received bulk inventory across ${validRows.length} lines.`);
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Bulk stock-in failed');
        }
      }
    );
  };

  const handleCommitAdjustments = () => {
    const validRows = adjustmentRows.filter(r => r.changeQty !== 0 && r.itemId && r.reason);
    if (validRows.length === 0) {
      setErrorMessage('Please specify adjustment quantities and mandatory reasons.');
      return;
    }
    requireSecurityVerification(
      'Authorize Bulk Stock Adjustments',
      `Execute stock level modifications for ${validRows.length} record(s).`,
      () => {
        try {
          inventoryService.executeBulkAdjustment(validRows);
          setSuccessMessage(`Successfully processed ${validRows.length} stock adjustment(s).`);
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Adjustment failed');
        }
      }
    );
  };

  const handleCommitTransfers = () => {
    const transfers = Object.entries(transferSelections)
      .filter(([_, shelf]) => !!shelf)
      .map(([batchId, toShelf]) => ({ batchId, toShelf }));

    if (transfers.length === 0) {
      setErrorMessage('Please select destination storage shelves for the target batches.');
      return;
    }

    requireSecurityVerification(
      'Authorize Bulk Stock Transfer',
      `Transfer ${transfers.length} batch lot(s) to new storage locations.`,
      () => {
        try {
          inventoryService.executeBulkTransfer(transfers);
          setSuccessMessage(`Transferred ${transfers.length} batches to new locations.`);
          setTransferSelections({});
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Transfer failed');
        }
      }
    );
  };

  const handleCommitPrices = () => {
    const updates = Object.entries(priceUpdates).map(([itemId, val]) => ({
      itemId,
      newCost: val.cost,
      newPrice: val.price
    }));

    if (updates.length === 0) {
      setErrorMessage('No pricing modifications detected.');
      return;
    }

    requireSecurityVerification(
      'Authorize Bulk Price Matrix Update',
      `Update acquisition costs and retail prices for ${updates.length} items.`,
      () => {
        try {
          inventoryService.executeBulkPriceUpdate(updates);
          setSuccessMessage(`Updated pricing for ${updates.length} item(s).`);
          setPriceUpdates({});
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Price update failed');
        }
      }
    );
  };

  const handleCommitBatchUpdates = () => {
    const updates = Object.entries(batchUpdates).map(([batchId, val]) => ({
      batchId,
      newBatchNumber: val.batchNumber,
      newExpiryDate: val.expiryDate,
      newQuantity: val.quantity,
      newShelf: val.shelf
    }));

    if (updates.length === 0) {
      setErrorMessage('No batch revisions modified.');
      return;
    }

    requireSecurityVerification(
      'Authorize Bulk Batch Modification',
      `Commit revisions for ${updates.length} batch lots (dates, lot numbers, quantities).`,
      () => {
        try {
          inventoryService.executeBulkBatchUpdate(updates);
          setSuccessMessage(`Successfully updated ${updates.length} batch lots.`);
          setBatchUpdates({});
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Batch update failed');
        }
      }
    );
  };

  const handleCommitStatusUpdate = () => {
    if (statusSelectedItems.length === 0) {
      setErrorMessage('Please select at least one item to update status.');
      return;
    }

    requireSecurityVerification(
      'Authorize Bulk Status Change',
      `Set status to '${targetStatus}' for ${statusSelectedItems.length} medical items.`,
      () => {
        try {
          inventoryService.executeBulkStatusUpdate(statusSelectedItems, targetStatus);
          setSuccessMessage(`Set ${statusSelectedItems.length} items to '${targetStatus}'.`);
          setStatusSelectedItems([]);
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Status update failed');
        }
      }
    );
  };

  const handleCommitQuarantineExpired = () => {
    requireSecurityVerification(
      'Authorize Expired Stock Quarantine',
      'Move all past-expiry batches into locked Quarantine Cage Q-101.',
      () => {
        try {
          const count = inventoryService.executeBulkQuarantineExpired();
          setSuccessMessage(`Quarantined ${count} expired batches.`);
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Quarantine failed');
        }
      }
    );
  };

  // CSV Parsing & Sample Download
  const downloadSampleCsv = () => {
    const sample = `itemCode,name,genericName,category,form,primaryUnit,conversionFactor,batchNumber,quantity,expiryDate,unitCost,unitPrice,shelf
MED-AMX-500,Amoxicillin 500mg Capsule,Amoxicillin,Antibiotics & Anti-Infectives,Capsule,Capsule,100,LOT-AMX-2027A,200,2027-11-30,4.50,12.00,Central Pharmacy - Shelf A1 (Antibiotics)
MED-CIP-500,Ciprofloxacin 500mg Tablet,Ciprofloxacin HCl,Antibiotics & Anti-Infectives,Tablet,Tablet,100,LOT-CIP-2027B,150,2027-09-15,6.20,15.50,Central Pharmacy - Shelf A1 (Antibiotics)
MED-IV-D5W,Dextrose 5% in Water 500mL,D5W Infusion,Intravenous Fluids & Electrolytes,Infusion Bag,Bag,24,LOT-D5W-2028,80,2028-03-31,38.00,85.00,Central Pharmacy - Shelf A2 (Injectables & Vials)`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MedFlow_Bulk_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    try {
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setParsedPreview([]);
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim());
      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(',').map(v => v.trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = vals[idx] || '';
        });
        rows.push(rowObj);
      }
      setParsedPreview(rows);
      setErrorMessage(null);
    } catch (e: any) {
      setErrorMessage('Failed to parse CSV: ' + e.message);
    }
  };

  const handleCommitCsvImport = () => {
    if (parsedPreview.length === 0) {
      setErrorMessage('No parsed CSV data to import.');
      return;
    }

    requireSecurityVerification(
      'Authorize Bulk CSV Import',
      `Import ${parsedPreview.length} records into medical catalog & batch inventory.`,
      () => {
        try {
          const res = inventoryService.executeBulkImport(parsedPreview);
          setSuccessMessage(`Successfully created ${res.itemsCreated} items and ${res.batchesCreated} batches.`);
          setCsvText('');
          setParsedPreview([]);
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Import failed');
        }
      }
    );
  };

  const handleCommitBulkDelete = () => {
    if (deleteSelectedItems.length === 0) {
      setErrorMessage('Please select items to archive/delete.');
      return;
    }

    requireSecurityVerification(
      'Authorize Bulk Delete / Archive',
      `Attempting to delete ${deleteSelectedItems.length} selected items. Active stock items will be protected.`,
      () => {
        try {
          const res = inventoryService.executeBulkDelete(deleteSelectedItems);
          setSuccessMessage(`Deleted ${res.deletedCount} items. (${res.blockedCount} items protected due to active stock).`);
          setDeleteSelectedItems([]);
          onRefreshData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Delete failed');
        }
      }
    );
  };

  // Filtered views
  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return items;
    const q = searchFilter.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.itemCode.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }, [items, searchFilter]);

  const filteredBatches = useMemo(() => {
    if (!searchFilter.trim()) return batches;
    const q = searchFilter.toLowerCase();
    return batches.filter(b =>
      b.batchNumber.toLowerCase().includes(q) ||
      b.itemName.toLowerCase().includes(q) ||
      b.locationShelf.toLowerCase().includes(q)
    );
  }, [batches, searchFilter]);

  const bulkAuditLogs = useMemo(() => {
    return auditLogs.filter(a =>
      a.actionType.startsWith('BULK_') ||
      a.actionType.startsWith('PASSWORD_VERIFY')
    );
  }, [auditLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-lg border border-teal-200 dark:border-teal-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Bulk Stock Management & Updates
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Password-Protected
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage high-volume inventory batches, price schedules, multi-line transfers, and CSV uploads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mx-6 mt-3 flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-3 flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs rounded-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs (10 Functions) */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50/40 dark:bg-slate-900/40 text-xs font-medium">
          {[
            { id: 'stock_in', label: '1. Bulk Stock In', icon: ArrowDownToLine },
            { id: 'adjustment', label: '2. Stock Adjustment', icon: SlidersHorizontal },
            { id: 'transfer', label: '3. Stock Transfer', icon: ArrowRightLeft },
            { id: 'price', label: '4. Price Update', icon: DollarSign },
            { id: 'batch', label: '5. Batch & Expiry', icon: Calendar },
            { id: 'status', label: '6. Status Update', icon: CheckCircle2 },
            { id: 'expiry', label: '7. Expiry Monitor', icon: AlertTriangle },
            { id: 'import', label: '8. CSV Import', icon: UploadCloud },
            { id: 'delete', label: '9. Archive / Delete', icon: Trash2 },
            { id: 'audit', label: '10. Bulk Audit Trail', icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-400 font-semibold bg-white dark:bg-slate-800/80 rounded-t-md'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-md'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* TAB 1: BULK STOCK IN */}
          {activeTab === 'stock_in' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Stock In — Multi-Item Receiving Grid
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add quantities and batch details for multiple medical items simultaneously.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addStockInRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 min-w-[200px]">Item Formulation</th>
                      <th className="p-2.5 min-w-[130px]">Batch / Lot #</th>
                      <th className="p-2.5 min-w-[90px]">Qty Received</th>
                      <th className="p-2.5 min-w-[120px]">Expiry Date</th>
                      <th className="p-2.5 min-w-[100px]">Unit Cost (₱)</th>
                      <th className="p-2.5 min-w-[170px]">Storage Shelf</th>
                      <th className="p-2.5 min-w-[160px]">Supplier</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stockInRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2">
                          <select
                            value={row.itemId}
                            onChange={(e) => updateStockInRow(idx, 'itemId', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          >
                            {items.map(i => (
                              <option key={i.id} value={i.id}>
                                {i.itemCode} - {i.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.batchNumber}
                            onChange={(e) => updateStockInRow(idx, 'batchNumber', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => updateStockInRow(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs font-semibold text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={row.expiryDate}
                            onChange={(e) => updateStockInRow(idx, 'expiryDate', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={row.unitCost}
                            onChange={(e) => updateStockInRow(idx, 'unitCost', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.shelf}
                            onChange={(e) => updateStockInRow(idx, 'shelf', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          >
                            {settings.storageShelves.map((s, sIdx) => (
                              <option key={sIdx} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={row.supplier}
                            onChange={(e) => updateStockInRow(idx, 'supplier', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          >
                            {settings.accreditedSuppliers.map((s, sIdx) => (
                              <option key={sIdx} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          {stockInRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeStockInRow(idx)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total Items: {stockInRows.length} line(s) · Total Units:{' '}
                  {stockInRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)}
                </div>
                <button
                  type="button"
                  onClick={handleCommitStockIn}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Password & Post Bulk Stock-In</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BULK STOCK ADJUSTMENT */}
          {activeTab === 'adjustment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Stock Adjustment — Discrepancies, Damage & Quarantine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apply increases (+) or decreases (-) across multiple items with required clinical reasons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAdjustmentRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 min-w-[200px]">Item Formulation</th>
                      <th className="p-2.5 min-w-[150px]">Target Batch Lot</th>
                      <th className="p-2.5 min-w-[100px]">Stock Delta (+/-)</th>
                      <th className="p-2.5 min-w-[160px]">Adjustment Category</th>
                      <th className="p-2.5 min-w-[240px]">Clinical Reason / Memo</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {adjustmentRows.map((row, idx) => {
                      const itemBatches = batches.filter(b => b.itemId === row.itemId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2">
                            <select
                              value={row.itemId}
                              onChange={(e) => {
                                const newItmId = e.target.value;
                                const updated = [...adjustmentRows];
                                updated[idx].itemId = newItmId;
                                updated[idx].batchId = batches.find(b => b.itemId === newItmId)?.id || '';
                                setAdjustmentRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            >
                              {items.map(i => (
                                <option key={i.id} value={i.id}>
                                  {i.itemCode} - {i.name} (Stock: {i.totalStock})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={row.batchId}
                              onChange={(e) => {
                                const updated = [...adjustmentRows];
                                updated[idx].batchId = e.target.value;
                                setAdjustmentRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            >
                              <option value="">-- Apply to Catalog --</option>
                              {itemBatches.map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.batchNumber} (Qty: {b.quantity}, Exp: {b.expiryDate})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={row.changeQty}
                              onChange={(e) => {
                                const updated = [...adjustmentRows];
                                updated[idx].changeQty = Number(e.target.value);
                                setAdjustmentRows(updated);
                              }}
                              className={`w-full px-2 py-1 text-xs font-semibold text-right bg-white dark:bg-slate-950 border rounded-md ${
                                row.changeQty < 0
                                  ? 'border-rose-300 text-rose-600 dark:text-rose-400'
                                  : 'border-emerald-300 text-emerald-600 dark:text-emerald-400'
                              }`}
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={row.type}
                              onChange={(e) => {
                                const updated = [...adjustmentRows];
                                updated[idx].type = e.target.value as StockAdjustmentRecord['type'];
                                setAdjustmentRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            >
                              <option value="Damage">Damage / Packaging Defect</option>
                              <option value="Expired Quarantine">Expired Quarantine Transfer</option>
                              <option value="Return to Supplier">Return to Supplier (Recall/Defect)</option>
                              <option value="Ward Return">Ward Return</option>
                              <option value="Discrepancy / Lost">Discrepancy / Lost Count</option>
                              <option value="Correction">Audit Physical Count Correction</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Clinical audit reason..."
                              value={row.reason}
                              onChange={(e) => {
                                const updated = [...adjustmentRows];
                                updated[idx].reason = e.target.value;
                                setAdjustmentRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {adjustmentRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setAdjustmentRows(adjustmentRows.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCommitAdjustments}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Password & Execute Adjustments</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BULK STOCK TRANSFER */}
          {activeTab === 'transfer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Stock Transfer — Shelves & Pharmacy Locations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Relocate multiple batch lots between shelves, cold chain refrigerators, and quarantine bins.
                  </p>
                </div>
                <div className="w-64">
                  <input
                    type="text"
                    placeholder="Search batch or shelf..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Batch / Lot #</th>
                      <th className="p-2.5">Medication Name</th>
                      <th className="p-2.5">Quantity</th>
                      <th className="p-2.5">Current Location Shelf</th>
                      <th className="p-2.5">Transfer To Destination Shelf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBatches.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2 font-mono font-medium text-slate-900 dark:text-white">
                          {b.batchNumber}
                        </td>
                        <td className="p-2">{b.itemName}</td>
                        <td className="p-2 font-semibold">{b.quantity}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          {b.locationShelf}
                        </td>
                        <td className="p-2">
                          <select
                            value={transferSelections[b.id] || ''}
                            onChange={(e) => {
                              setTransferSelections({
                                ...transferSelections,
                                [b.id]: e.target.value
                              });
                            }}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          >
                            <option value="">-- Keep Current ({b.locationShelf}) --</option>
                            {settings.storageShelves.map((s, idx) => (
                              <option key={idx} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Transfers Selected: {Object.values(transferSelections).filter(Boolean).length}
                </div>
                <button
                  type="button"
                  onClick={handleCommitTransfers}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Password & Commit Transfers</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: BULK PRICE UPDATE */}
          {activeTab === 'price' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Price Update — Unit Costs & Retail Selling Prices
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adjust acquisition purchase costs and inpatient billing prices across catalog items.
                  </p>
                </div>
                <div className="w-64">
                  <input
                    type="text"
                    placeholder="Search formulary..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Formulary Item Name</th>
                      <th className="p-2.5">Current Cost</th>
                      <th className="p-2.5">New Unit Cost (₱)</th>
                      <th className="p-2.5">Current Price</th>
                      <th className="p-2.5">New Retail Price (₱)</th>
                      <th className="p-2.5">Margin Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredItems.map(item => {
                      const costVal = priceUpdates[item.id]?.cost ?? item.unitCost;
                      const priceVal = priceUpdates[item.id]?.price ?? item.unitPrice;
                      const margin = priceVal > 0 ? (((priceVal - costVal) / priceVal) * 100).toFixed(1) : '0';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono font-medium text-slate-900 dark:text-white">{item.itemCode}</td>
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2 text-slate-500">₱{item.unitCost.toFixed(2)}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={costVal}
                              onChange={(e) => {
                                setPriceUpdates({
                                  ...priceUpdates,
                                  [item.id]: {
                                    cost: Number(e.target.value),
                                    price: priceVal
                                  }
                                });
                              }}
                              className="w-24 px-2 py-1 text-xs text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-2 text-slate-500">₱{item.unitPrice.toFixed(2)}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={priceVal}
                              onChange={(e) => {
                                setPriceUpdates({
                                  ...priceUpdates,
                                  [item.id]: {
                                    cost: costVal,
                                    price: Number(e.target.value)
                                  }
                                });
                              }}
                              className="w-24 px-2 py-1 text-xs text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-semibold text-teal-600 dark:text-teal-400"
                            />
                          </td>
                          <td className="p-2 font-mono text-slate-600 dark:text-slate-300">
                            {margin}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Modified Items: {Object.keys(priceUpdates).length}
                </div>
                <button
                  type="button"
                  onClick={handleCommitPrices}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Password & Update Prices</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: BULK BATCH UPDATE */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Batch Update — Lot Numbers, Expiry Dates & Quantities
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modify active batch metadata, correct expiry dates, and update inventory counts.
                  </p>
                </div>
                <div className="w-64">
                  <input
                    type="text"
                    placeholder="Search batch or medication..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Medication</th>
                      <th className="p-2.5">Lot / Batch #</th>
                      <th className="p-2.5">Expiry Date</th>
                      <th className="p-2.5">Batch Qty</th>
                      <th className="p-2.5">Storage Shelf</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBatches.map(b => {
                      const cur = batchUpdates[b.id] || {
                        batchNumber: b.batchNumber,
                        expiryDate: b.expiryDate,
                        quantity: b.quantity,
                        shelf: b.locationShelf
                      };

                      const isExp = inventoryService.isExpired(cur.expiryDate);
                      const isNear = inventoryService.isNearExpiry(cur.expiryDate);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-medium">{b.itemName}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={cur.batchNumber}
                              onChange={(e) => {
                                setBatchUpdates({
                                  ...batchUpdates,
                                  [b.id]: { ...cur, batchNumber: e.target.value }
                                });
                              }}
                              className="w-32 px-2 py-1 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={cur.expiryDate}
                              onChange={(e) => {
                                setBatchUpdates({
                                  ...batchUpdates,
                                  [b.id]: { ...cur, expiryDate: e.target.value }
                                });
                              }}
                              className="w-32 px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={cur.quantity}
                              onChange={(e) => {
                                setBatchUpdates({
                                  ...batchUpdates,
                                  [b.id]: { ...cur, quantity: Number(e.target.value) }
                                });
                              }}
                              className="w-20 px-2 py-1 text-xs text-right font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={cur.shelf}
                              onChange={(e) => {
                                setBatchUpdates({
                                  ...batchUpdates,
                                  [b.id]: { ...cur, shelf: e.target.value }
                                });
                              }}
                              className="w-48 px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                            >
                              {settings.storageShelves.map((s, sIdx) => (
                                <option key={sIdx} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ${
                              isExp
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : isNear
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {isExp ? 'Expired' : isNear ? 'Near Expiry' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Batches Modified: {Object.keys(batchUpdates).length}
                </div>
                <button
                  type="button"
                  onClick={handleCommitBatchUpdates}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Password & Save Batch Updates</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: BULK STATUS UPDATE */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Status Update — Active, Inactive, Hold
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Change formulary availability states for multiple inventory items.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as ItemStatus)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active (Available for Dispense)</option>
                    <option value="Hold">Hold (Under Clinical Review)</option>
                    <option value="Inactive">Inactive (Decommissioned)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleCommitStatusUpdate}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Apply Status</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={statusSelectedItems.length === items.length && items.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setStatusSelectedItems(items.map(i => i.id));
                            else setStatusSelectedItems([]);
                          }}
                          className="rounded text-teal-600"
                        />
                      </th>
                      <th className="p-2.5">Item Code</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Current Status</th>
                      <th className="p-2.5">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={statusSelectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setStatusSelectedItems([...statusSelectedItems, item.id]);
                              else setStatusSelectedItems(statusSelectedItems.filter(id => id !== item.id));
                            }}
                            className="rounded text-teal-600"
                          />
                        </td>
                        <td className="p-2 font-mono font-medium">{item.itemCode}</td>
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2 text-slate-500">{item.category}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                            item.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'Hold'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2 font-semibold">{item.totalStock} {item.primaryUnit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Selected: {statusSelectedItems.length} of {items.length} items
              </div>
            </div>
          )}

          {/* TAB 7: BULK EXPIRY MONITORING */}
          {activeTab === 'expiry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Expiry Monitoring & Automated Quarantine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live scan of expired stock and lots expiring within 90 days.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCommitQuarantineExpired}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lock All Expired Lots to Quarantine Cage Q-101</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expired Lots */}
                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Critical Expired Batches (Strictly Blocked)
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                      {batches.filter(b => inventoryService.isExpired(b.expiryDate)).length} Lots
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {batches
                      .filter(b => inventoryService.isExpired(b.expiryDate))
                      .map(b => (
                        <div
                          key={b.id}
                          className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900/40 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{b.batchNumber}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{b.quantity} Units</span>
                          </div>
                          <div className="text-slate-800 dark:text-slate-200 font-medium">{b.itemName}</div>
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span>Expired: {b.expiryDate}</span>
                            <span>{b.locationShelf}</span>
                          </div>
                        </div>
                      ))}
                    {batches.filter(b => inventoryService.isExpired(b.expiryDate)).length === 0 && (
                      <p className="text-xs text-slate-500 py-4 text-center">No expired batches in inventory.</p>
                    )}
                  </div>
                </div>

                {/* Near Expiry Lots */}
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Near-Expiry Batches (&lt; 90 Days · FEFO Priority)
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      {batches.filter(b => inventoryService.isNearExpiry(b.expiryDate)).length} Lots
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {batches
                      .filter(b => inventoryService.isNearExpiry(b.expiryDate))
                      .map(b => {
                        const days = inventoryService.getDaysToExpiry(b.expiryDate);
                        return (
                          <div
                            key={b.id}
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{b.batchNumber}</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{b.quantity} Units</span>
                            </div>
                            <div className="text-slate-800 dark:text-slate-200 font-medium">{b.itemName}</div>
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>Expiry: {b.expiryDate} ({days} days remaining)</span>
                              <span className="text-teal-600 dark:text-teal-400 font-medium">FEFO Priority 1</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BULK IMPORT (CSV / EXCEL) */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Import — CSV / Spreadsheet Parser
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste CSV or tab-delimited records with headers or download the standardized hospital template.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Template</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paste CSV Records Below:
                </label>
                <textarea
                  rows={5}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    parseCsvText(e.target.value);
                  }}
                  placeholder="itemCode,name,genericName,category,form,primaryUnit,conversionFactor,batchNumber,quantity,expiryDate,unitCost,unitPrice,shelf"
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Parsed Spreadsheet Preview ({parsedPreview.length} rows recognized):
                    </span>
                    <button
                      type="button"
                      onClick={handleCommitCsvImport}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Password & Import {parsedPreview.length} Rows</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs max-h-56">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          {Object.keys(parsedPreview[0]).map((h, idx) => (
                            <th key={idx} className="p-2 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedPreview.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/50">
                            {Object.values(row).map((v: any, vIdx) => (
                              <td key={vIdx} className="p-2 whitespace-nowrap">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: BULK ARCHIVE / DELETE */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Catalog Archive / Delete
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Safely delete decommissioned or inactive records. Built-in clinical safeguard protects items with active stock.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCommitBulkDelete}
                  disabled={deleteSelectedItems.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-40"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Password & Delete Selected ({deleteSelectedItems.length})</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={deleteSelectedItems.length === items.length && items.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setDeleteSelectedItems(items.map(i => i.id));
                            else setDeleteSelectedItems([]);
                          }}
                          className="rounded text-rose-600"
                        />
                      </th>
                      <th className="p-2.5">Item Code</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Total Stock</th>
                      <th className="p-2.5">Active Batches</th>
                      <th className="p-2.5">Deletion Safety Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map(item => {
                      const itemBatches = batches.filter(b => b.itemId === item.id && b.quantity > 0);
                      const hasStock = itemBatches.length > 0 || item.totalStock > 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={deleteSelectedItems.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) setDeleteSelectedItems([...deleteSelectedItems, item.id]);
                                else setDeleteSelectedItems(deleteSelectedItems.filter(id => id !== item.id));
                              }}
                              className="rounded text-rose-600"
                            />
                          </td>
                          <td className="p-2 font-mono font-medium">{item.itemCode}</td>
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2 font-semibold">{item.totalStock} {item.primaryUnit}</td>
                          <td className="p-2 text-slate-500">{itemBatches.length} batch(es)</td>
                          <td className="p-2">
                            {hasStock ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Protected (Active Stock &gt; 0)
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Safe to Archive / Delete
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: BULK AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bulk Stock & Password Verification Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Immutable security log of all bulk updates, imports, password verifications, and authorized commits.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {bulkAuditLogs.length} Logged Events
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">User & Role</th>
                      <th className="p-2.5">Action Event</th>
                      <th className="p-2.5">Entity</th>
                      <th className="p-2.5">Details</th>
                      <th className="p-2.5">Terminal / IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bulkAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2 font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2">
                          <div className="font-semibold text-slate-900 dark:text-white">{log.userName}</div>
                          <div className="text-[10px] text-slate-500">{log.userRole}</div>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                            log.actionType === 'PASSWORD_VERIFY_SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.actionType === 'PASSWORD_VERIFY_FAILED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          }`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-2 font-medium">{log.entityAffected}</td>
                        <td className="p-2 text-slate-700 dark:text-slate-300">{log.details}</td>
                        <td className="p-2 font-mono text-[10px] text-slate-500">{log.terminal} ({log.ipAddress})</td>
                      </tr>
                    ))}
                    {bulkAuditLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                          No bulk transactions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Authoritative Permission & Password Verification Enforced</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>

      {/* Embedded Password Verification Window */}
      <PasswordVerificationModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          if (pendingActionCallback) {
            pendingActionCallback();
          }
        }}
        actionTitle={pendingActionTitle}
        transactionDescription={pendingDescription}
      />
    </div>
  );
};
