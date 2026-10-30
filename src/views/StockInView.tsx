import React, { useState } from 'react';
import { ArrowDownToLine, Plus, Printer, CheckCircle2, AlertCircle, Trash2, Calendar, FileText } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { StockInRecord, StockInItem } from '../types/inventory';
import { PrintDocumentData, PrintModal } from '../components/PrintModal';
import { PasswordVerificationModal } from '../components/PasswordVerificationModal';

export const StockInView: React.FC = () => {
  const [stockIns, setStockIns] = useState<StockInRecord[]>(() => inventoryService.getStockInRecords());
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);

  // Print Modal
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  // Security password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);

  // New Receiving Form
  const settings = inventoryService.getSettings();
  const items = inventoryService.getItems();
  const currentUser = inventoryService.getCurrentUser();

  const [drNumber, setDrNumber] = useState(`DR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [poNumber, setPoNumber] = useState(`PO-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [supplierName, setSupplierName] = useState(settings.accreditedSuppliers[0] || 'Zuellig Pharma Corp.');
  const [remarks, setRemarks] = useState('Hospital receiving verified with physical count and cold-chain compliance.');

  const [receivingItems, setReceivingItems] = useState<StockInItem[]>([
    {
      itemId: items[0]?.id || '',
      itemCode: items[0]?.itemCode || '',
      itemName: items[0]?.name || '',
      batchNumber: `LOT-2026-IN${Math.floor(100 + Math.random() * 900)}`,
      manufacturingDate: '2025-01-10',
      expiryDate: '2027-12-31',
      quantity: 50,
      unit: items[0]?.primaryUnit || 'Vial',
      unitCost: items[0]?.unitCost || 100,
      subtotal: (items[0]?.unitCost || 100) * 50,
      shelf: items[0]?.locationShelf || settings.storageShelves[0]
    }
  ]);

  const refreshList = () => {
    setStockIns(inventoryService.getStockInRecords());
  };

  const handleAddItemLine = () => {
    const defaultItem = items[0];
    setReceivingItems([
      ...receivingItems,
      {
        itemId: defaultItem?.id || '',
        itemCode: defaultItem?.itemCode || '',
        itemName: defaultItem?.name || '',
        batchNumber: `LOT-2026-IN${Math.floor(100 + Math.random() * 900)}`,
        manufacturingDate: '2025-01-10',
        expiryDate: '2027-12-31',
        quantity: 20,
        unit: defaultItem?.primaryUnit || 'Piece',
        unitCost: defaultItem?.unitCost || 100,
        subtotal: (defaultItem?.unitCost || 100) * 20,
        shelf: defaultItem?.locationShelf || settings.storageShelves[0]
      }
    ]);
  };

  const handleUpdateItemLine = (idx: number, field: keyof StockInItem, val: any) => {
    const updated = [...receivingItems];
    updated[idx] = { ...updated[idx], [field]: val };

    if (field === 'itemId') {
      const selected = items.find(i => i.id === val);
      if (selected) {
        updated[idx].itemCode = selected.itemCode;
        updated[idx].itemName = selected.name;
        updated[idx].unit = selected.primaryUnit;
        updated[idx].unitCost = selected.unitCost;
        updated[idx].shelf = selected.locationShelf;
        updated[idx].subtotal = selected.unitCost * updated[idx].quantity;
      }
    }

    if (field === 'quantity' || field === 'unitCost') {
      updated[idx].subtotal = updated[idx].quantity * updated[idx].unitCost;
    }

    setReceivingItems(updated);
  };

  const handleRemoveLine = (idx: number) => {
    setReceivingItems(receivingItems.filter((_, i) => i !== idx));
  };

  const totalDeliveryCost = receivingItems.reduce((acc, itm) => acc + itm.subtotal, 0);

  const handleSubmitReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drNumber.trim() || receivingItems.length === 0) {
      alert('DR Number and at least one item line are required.');
      return;
    }

    setPendingSubmit(() => () => {
      try {
        const record = inventoryService.receiveStock({
          drNumber,
          poNumber,
          supplierName,
          receivedBy: currentUser?.fullName || 'Pharmacy Receiver',
          receivedDate: new Date().toISOString(),
          items: receivingItems,
          totalCost: totalDeliveryCost,
          remarks
        });
        refreshList();
        setIsReceivingModalOpen(false);
        handlePrintVoucher(record);
      } catch (err: any) {
        alert(err.message || 'Receiving failed');
      }
    });

    setPasswordModalOpen(true);
  };

  const handlePrintVoucher = (rec: StockInRecord) => {
    const docData: PrintDocumentData = {
      title: 'Official Receiving Voucher & Goods Receipt',
      docNumber: rec.drNumber,
      date: new Date(rec.receivedDate).toLocaleDateString(),
      departmentOrWard: `Central Clinical Pharmacy · Supplier: ${rec.supplierName}`,
      preparedBy: rec.receivedBy,
      columnHeaders: ['Formulary Description', 'Batch / Lot #', 'Expiry Date', 'Received Qty', 'Unit Cost', 'Subtotal'],
      items: rec.items.map(i => ({
        col1: `${i.itemCode} - ${i.itemName}`,
        col2: i.batchNumber,
        col3: i.expiryDate,
        col4: `${i.quantity} ${i.unit}`,
        col5: `₱${i.unitCost.toFixed(2)}`,
        col6: `₱${i.subtotal.toFixed(2)}`
      })),
      totalAmountText: `₱${rec.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      summaryNotes: `PO Reference: ${rec.poNumber}. Remarks: ${rec.remarks}`
    };
    setPrintDoc(docData);
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-teal-600" />
            Stock In & Supplier Receiving
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log Delivery Receipts (DR #), Purchase Orders, lot batch creation, and payable invoices.
          </p>
        </div>

        {inventoryService.hasPermission('stock_in') && (
          <button
            onClick={() => setIsReceivingModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Process New Delivery Receipt</span>
          </button>
        )}
      </div>

      {/* Receiving History Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">DR Number</th>
                <th className="p-3">PO Reference</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Items Received</th>
                <th className="p-3 text-right">Total Invoice</th>
                <th className="p-3">Received By</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Print Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stockIns.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {rec.drNumber}
                  </td>
                  <td className="p-3 font-mono text-slate-500">{rec.poNumber}</td>
                  <td className="p-3 font-medium">{rec.supplierName}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold">{rec.items.length} line(s)</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">
                      {rec.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-teal-600 dark:text-teal-400">
                    ₱{rec.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{rec.receivedBy}</td>
                  <td className="p-3 text-slate-500 text-[11px] font-mono">
                    {new Date(rec.receivedDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handlePrintVoucher(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Voucher</span>
                    </button>
                  </td>
                </tr>
              ))}
              {stockIns.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No delivery records logged yet. Click "Process New Delivery Receipt" to receive incoming stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Receiving Modal */}
      {isReceivingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-teal-600" />
                Process Stock-In Delivery Receipt
              </h3>
              <button
                onClick={() => setIsReceivingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitReceiving} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Receipt # (DR) *
                  </label>
                  <input
                    type="text"
                    required
                    value={drNumber}
                    onChange={(e) => setDrNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Order # (PO)
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Accredited Supplier *
                  </label>
                  <select
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {settings.accreditedSuppliers.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Sub-table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Delivered Formulary Items & Batch Registrations:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    + Add Another Item
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2 min-w-[180px]">Item</th>
                        <th className="p-2 min-w-[120px]">Batch #</th>
                        <th className="p-2 min-w-[110px]">Expiry Date</th>
                        <th className="p-2 min-w-[80px]">Qty</th>
                        <th className="p-2 min-w-[90px]">Unit Cost (₱)</th>
                        <th className="p-2 min-w-[130px]">Shelf</th>
                        <th className="p-2 min-w-[90px] text-right">Subtotal</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {receivingItems.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={line.itemId}
                              onChange={(e) => handleUpdateItemLine(idx, 'itemId', e.target.value)}
                              className="w-full p-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
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
                              value={line.batchNumber}
                              onChange={(e) => handleUpdateItemLine(idx, 'batchNumber', e.target.value)}
                              className="w-full p-1 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={line.expiryDate}
                              onChange={(e) => handleUpdateItemLine(idx, 'expiryDate', e.target.value)}
                              className="w-full p-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleUpdateItemLine(idx, 'quantity', Number(e.target.value))}
                              className="w-full p-1 text-right font-semibold text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={line.unitCost}
                              onChange={(e) => handleUpdateItemLine(idx, 'unitCost', Number(e.target.value))}
                              className="w-full p-1 text-right text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={line.shelf}
                              onChange={(e) => handleUpdateItemLine(idx, 'shelf', e.target.value)}
                              className="w-full p-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
                            >
                              {settings.storageShelves.map((s, sIdx) => (
                                <option key={sIdx} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">
                            ₱{line.subtotal.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            {receivingItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receiving Inspection Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-500">Total Purchase Payable: </span>
                  <span className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400">
                    ₱{totalDeliveryCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReceivingModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                  >
                    Post Stock-In (Password Required)
                  </button>
                </div>
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
          if (pendingSubmit) pendingSubmit();
        }}
        actionTitle="Authorize Stock-In Receiving"
        transactionDescription={`Post Delivery Receipt ${drNumber} from ${supplierName} for ₱${totalDeliveryCost.toLocaleString()}`}
      />

      {/* Official Printable Voucher Modal */}
      <PrintModal
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        data={printDoc}
      />

    </div>
  );
};
