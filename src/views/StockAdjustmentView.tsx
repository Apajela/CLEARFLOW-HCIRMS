import React, { useState } from 'react';
import { SlidersHorizontal, Plus, AlertTriangle, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { StockAdjustmentRecord, AdjustmentType } from '../types/inventory';
import { PasswordVerificationModal } from '../components/PasswordVerificationModal';

export const StockAdjustmentView: React.FC = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>(() => inventoryService.getAdjustments());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Security password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingAdjustmentCallback, setPendingAdjustmentCallback] = useState<(() => void) | null>(null);

  const items = inventoryService.getItems();
  const batches = inventoryService.getBatches();
  const currentUser = inventoryService.getCurrentUser();

  // Form State
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('Damage');
  const [quantity, setQuantity] = useState<number>(-1);
  const [reason, setReason] = useState('Packaging defect identified during shift inspection');

  const refreshList = () => {
    setAdjustments(inventoryService.getAdjustments());
  };

  const currentItem = items.find(i => i.id === selectedItemId);
  const itemBatches = batches.filter(b => b.itemId === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !reason.trim() || quantity === 0) {
      alert('Please fill out all mandatory fields and enter a valid non-zero adjustment quantity.');
      return;
    }

    setPendingAdjustmentCallback(() => () => {
      try {
        inventoryService.recordStockAdjustment({
          type: adjustmentType,
          itemId: currentItem.id,
          itemName: currentItem.name,
          batchNumber: batchNumber || 'ALL',
          quantity: Number(quantity),
          reason: reason.trim(),
          adjustedBy: currentUser?.fullName || 'Inventory Officer'
        });

        refreshList();
        setIsModalOpen(false);
        alert('Stock adjustment recorded and logged to audit trail.');
      } catch (err: any) {
        alert(err.message || 'Stock adjustment failed');
      }
    });

    setPasswordModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-teal-600" />
            Stock Adjustments & Quarantine Transfers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log returns to supplier, ward returns, damaged goods, expired quarantine transfers, and discrepancy reconciliations.
          </p>
        </div>

        {inventoryService.hasPermission('stock_adjustment') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Stock Adjustment</span>
          </button>
        )}
      </div>

      {/* Adjustments Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Adj #</th>
                <th className="p-3">Category</th>
                <th className="p-3">Medication</th>
                <th className="p-3">Batch Lot #</th>
                <th className="p-3 text-right">Delta Qty</th>
                <th className="p-3 text-right">Prev / New Stock</th>
                <th className="p-3">Audit Reason</th>
                <th className="p-3">Authorized By</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {adjustments.map(adj => (
                <tr key={adj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {adj.adjustmentNumber}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                      adj.type === 'Expired Quarantine'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : adj.type === 'Damage'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {adj.type}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white">
                    {adj.itemName}
                  </td>
                  <td className="p-3 font-mono text-slate-500">{adj.batchNumber}</td>
                  <td className={`p-3 text-right font-mono font-bold ${
                    adj.quantity < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {adj.previousStock} &rarr; {adj.newStock}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 italic">{adj.reason}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{adj.adjustedBy}</td>
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {new Date(adj.adjustedDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                Record Stock Level Adjustment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medication Formulary Item *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.itemCode} - {i.name} (Current Stock: {i.totalStock} {i.primaryUnit}s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Batch Lot #
                  </label>
                  <select
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">-- Apply to Catalog --</option>
                    {itemBatches.map(b => (
                      <option key={b.id} value={b.batchNumber}>
                        {b.batchNumber} (Qty: {b.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adjustment Reason Category *
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Damage">Damage / Packaging Defect</option>
                    <option value="Expired Quarantine">Expired Quarantine Transfer</option>
                    <option value="Return to Supplier">Return to Supplier (Recall/Defect)</option>
                    <option value="Ward Return">Ward Return</option>
                    <option value="Discrepancy / Lost">Discrepancy / Lost Count</option>
                    <option value="Correction">Audit Physical Count Correction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity Adjustment Delta (+ for increase, - for decrease) *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Clinical / Audit Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detail the physical cause or discrepancy..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Commit Adjustment (Password Required)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Password Verification Window */}
      <PasswordVerificationModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          if (pendingAdjustmentCallback) pendingAdjustmentCallback();
        }}
        actionTitle="Authorize Stock Adjustment"
        transactionDescription={`Adjust ${quantity > 0 ? '+' : ''}${quantity} units of ${currentItem?.name} (${adjustmentType})`}
      />

    </div>
  );
};
