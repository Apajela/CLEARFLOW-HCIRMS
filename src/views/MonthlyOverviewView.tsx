import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  ArrowDownToLine,
  Send,
  AlertTriangle,
  Clock,
  SlidersHorizontal,
  DollarSign,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { PrintDocumentData, PrintModal } from '../components/PrintModal';

type SubReportTab =
  | 'stock_in'
  | 'stock_out'
  | 'balance'
  | 'expired'
  | 'near_expiry'
  | 'low_stock'
  | 'adjustment'
  | 'valuation';

export const MonthlyOverviewView: React.FC = () => {
  const pageTitle = usePageTitle('monthly_overview', 'Monthly Inventory Overview — October 2026');
  const pageSubtitle = usePageSubtitle('monthly_overview', 'Review monthly stock movement, balances, and inventory valuation.')
  const [activeSubReport, setActiveSubReport] = useState<SubReportTab>('balance');
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  const items = inventoryService.getItems();
  const batches = inventoryService.getBatches();
  const stockIns = inventoryService.getStockInRecords();
  const releases = inventoryService.getReleases();
  const adjustments = inventoryService.getAdjustments();
  const valuation = inventoryService.getStockValuation();

  // Exactly requested October 2026 figures
  const beginningStock = 1250;
  const stockReceived = 350;
  const stockReleased = 280;
  const endingStock = 1320; // 1250 + 350 - 280 = 1320

  const expiredBatches = batches.filter(b => inventoryService.isExpired(b.expiryDate));
  const nearExpiryBatches = batches.filter(b => inventoryService.isNearExpiry(b.expiryDate));
  const lowStockItems = items.filter(i => i.totalStock <= i.minimumStock);

  const handlePrintFullReport = () => {
    const docData: PrintDocumentData = {
      title: 'October 2026 Comprehensive Monthly Inventory Reconciliation',
      docNumber: 'REP-OCT-2026-FINAL',
      date: 'October 29, 2026',
      departmentOrWard: 'Central Clinical Pharmacy & Therapeutics Committee',
      preparedBy: 'Teresa Mendoza, RPh (Chief Pharmacist)',
      verifiedBy: 'Dr. Arthur Vance, MD (Medical Director)',
      columnHeaders: ['Formulary Description', 'Code', 'Category', 'Closing Stock', 'Unit Cost', 'Total Valuation'],
      items: items.map(i => ({
        col1: i.name,
        col2: i.itemCode,
        col3: i.category,
        col4: `${i.totalStock} ${i.primaryUnit}s`,
        col5: `₱${i.unitCost.toFixed(2)}`,
        col6: `₱${(i.totalStock * i.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      })),
      totalAmountText: `₱${valuation.totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      summaryNotes: `AUDITED SUMMARY — Beginning Stock: ${beginningStock.toLocaleString()} | Stock Received: +${stockReceived.toLocaleString()} | Stock Released: -${stockReleased.toLocaleString()} | Ending Balance: ${endingStock.toLocaleString()} units.`
    };
    setPrintDoc(docData);
  };

  const subReportTabs: Array<{ id: SubReportTab; label: string; count?: number }> = [
    { id: 'balance', label: 'Beginning & Ending Balance' },
    { id: 'stock_in', label: 'Stock In Summary', count: stockIns.length },
    { id: 'stock_out', label: 'Stock Out Summary', count: releases.length },
    { id: 'expired', label: 'Expired Items', count: expiredBatches.length },
    { id: 'near_expiry', label: 'Near Expiry Items', count: nearExpiryBatches.length },
    { id: 'low_stock', label: 'Low Stock Monitoring', count: lowStockItems.length },
    { id: 'adjustment', label: 'Inventory Adjustment', count: adjustments.length },
    { id: 'valuation', label: 'Monthly Stock Valuation' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
              Audited Hospital Ledger
            </span>
            <span className="text-xs text-slate-500 font-mono">Cycle: October 2026</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {pageTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pageSubtitle}</p>
        </div>

        <button
          onClick={handlePrintFullReport}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official October 2026 Report</span>
        </button>
      </div>

      {/* October 2026 Reconciliation Grid */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-2xl shadow-md border border-teal-800/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
            <Calendar className="w-4 h-4" />
            <span>Official Monthly Flow Reconciliation Formula</span>
          </div>
          <div className="text-xs font-mono text-teal-200/80">
            Beginning + Received - Released = Ending Balance
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-[11px] font-semibold text-slate-300 uppercase">Beginning Stock</div>
            <div className="text-3xl font-extrabold font-mono text-white">
              {beginningStock.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">Audited Opening Balance (Oct 1)</div>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase flex items-center gap-1">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Stock Received
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">
              +{stockReceived.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-200/70">Incoming Supplier Deliveries</div>
          </div>

          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 space-y-1">
            <div className="text-[11px] font-semibold text-amber-300 uppercase flex items-center gap-1">
              <Send className="w-3.5 h-3.5" />
              Stock Released
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-400">
              -{stockReleased.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-200/70">FEFO Automated Dispatches</div>
          </div>

          <div className="p-4 bg-teal-500/20 rounded-xl border border-teal-400/40 space-y-1">
            <div className="text-[11px] font-semibold text-teal-200 uppercase">Ending Stock</div>
            <div className="text-3xl font-extrabold font-mono text-teal-300">
              {endingStock.toLocaleString()}
            </div>
            <div className="text-[10px] text-teal-200/70">Reconciled Closing Stock (Oct 29)</div>
          </div>
        </div>
      </div>

      {/* 8 Sub-Reports Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
          {subReportTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubReport(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeSubReport === tab.id
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* SUB-REPORT 1: Stock In Summary */}
        {activeSubReport === 'stock_in' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-800 dark:text-slate-200">
              1. Monthly Stock In Summary (Deliveries Total: +350 Units)
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">DR Number</th>
                  <th className="p-3">PO #</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Received Items</th>
                  <th className="p-3 text-right">Invoice Value</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stockIns.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold">{rec.drNumber}</td>
                    <td className="p-3 font-mono text-slate-500">{rec.poNumber}</td>
                    <td className="p-3 font-medium">{rec.supplierName}</td>
                    <td className="p-3">{rec.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}</td>
                    <td className="p-3 text-right font-mono font-bold text-teal-600">
                      ₱{rec.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{new Date(rec.receivedDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-REPORT 2: Stock Out Summary */}
        {activeSubReport === 'stock_out' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-800 dark:text-slate-200">
              2. Monthly Stock Out Summary (Dispatches Total: -280 Units)
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Release #</th>
                  <th className="p-3">Ward Destination</th>
                  <th className="p-3">Items & Lots</th>
                  <th className="p-3">Dispatched By</th>
                  <th className="p-3">Receiving Staff</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {releases.map(rel => (
                  <tr key={rel.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold">{rel.releaseNumber}</td>
                    <td className="p-3 font-medium">{rel.requestingWard}</td>
                    <td className="p-3">{rel.items.map(i => `${i.itemName} (${i.totalQty})`).join(', ')}</td>
                    <td className="p-3 text-slate-600">{rel.releasedBy}</td>
                    <td className="p-3 text-slate-600">{rel.receivingStaff}</td>
                    <td className="p-3 font-mono text-slate-500">{new Date(rel.releaseDate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-REPORT 3: Beginning and Ending Balance */}
        {activeSubReport === 'balance' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-800 dark:text-slate-200">
              3. Formulary Beginning and Ending Balance Schedule
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Formulary Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Closing Balance</th>
                  <th className="p-3 text-right">Unit Acquisition Cost</th>
                  <th className="p-3 text-right">Closing Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold">{i.itemCode}</td>
                    <td className="p-3 font-semibold">{i.name}</td>
                    <td className="p-3 text-slate-500">{i.category}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {i.totalStock} {i.primaryUnit}s
                    </td>
                    <td className="p-3 text-right font-mono">₱{i.unitCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-teal-600">
                      ₱{(i.totalStock * i.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-REPORT 4: Expired Items */}
        {activeSubReport === 'expired' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 font-semibold text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
              <span>4. Expired Pharmaceutical Stock (Quarantine Cage Q-101)</span>
              <span className="font-mono">{expiredBatches.length} Batches Locked</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Lot Number</th>
                  <th className="p-3">Medication Name</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-right">Quarantined Qty</th>
                  <th className="p-3">Storage Shelf</th>
                  <th className="p-3">Dispense Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expiredBatches.map(b => (
                  <tr key={b.id} className="bg-rose-50/30">
                    <td className="p-3 font-mono font-bold text-rose-700">{b.batchNumber}</td>
                    <td className="p-3 font-semibold">{b.itemName}</td>
                    <td className="p-3 font-mono text-rose-600 font-bold">{b.expiryDate}</td>
                    <td className="p-3 text-right font-mono font-bold">{b.quantity} Units</td>
                    <td className="p-3">{b.locationShelf}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700">
                        BLOCKED / NON-DISPENSABLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-REPORT 5: Near Expiry Items */}
        {activeSubReport === 'near_expiry' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 font-semibold text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>5. Near-Expiry Batches (&lt; 90 Days · FEFO Priority Allocation)</span>
              <span className="font-mono">{nearExpiryBatches.length} Batches Tracked</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Formulary Item</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Days Remaining</th>
                  <th className="p-3 text-right">Available Qty</th>
                  <th className="p-3">FEFO Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {nearExpiryBatches.map(b => {
                  const days = inventoryService.getDaysToExpiry(b.expiryDate);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-amber-700">{b.batchNumber}</td>
                      <td className="p-3 font-semibold">{b.itemName}</td>
                      <td className="p-3 font-mono">{b.expiryDate}</td>
                      <td className="p-3 font-bold text-amber-600">{days} days</td>
                      <td className="p-3 text-right font-mono font-bold">{b.quantity} Units</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800">
                          PRIORITY 1 DISPENSE
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-REPORT 6: Low Stock Monitoring */}
        {activeSubReport === 'low_stock' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-800 dark:text-slate-200">
              6. Low Stock Threshold & Reorder Trigger Monitoring
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Medication Name</th>
                  <th className="p-3 text-right">Current Stock</th>
                  <th className="p-3 text-right">Minimum Level</th>
                  <th className="p-3 text-right">Reorder Point</th>
                  <th className="p-3">Restock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map(i => {
                  const isLow = i.totalStock <= i.minimumStock;
                  return (
                    <tr key={i.id} className={isLow ? 'bg-amber-50/30' : ''}>
                      <td className="p-3 font-mono font-bold">{i.itemCode}</td>
                      <td className="p-3 font-semibold">{i.name}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {i.totalStock} {i.primaryUnit}s
                      </td>
                      <td className="p-3 text-right font-mono">{i.minimumStock}</td>
                      <td className="p-3 text-right font-mono">{i.reorderLevel}</td>
                      <td className="p-3">
                        {isLow ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800">
                            REORDER REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-emerald-100 text-emerald-800">
                            Adequate Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-REPORT 7: Inventory Adjustment */}
        {activeSubReport === 'adjustment' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-800 dark:text-slate-200">
              7. Inventory Adjustment Log & Audit Memoranda
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Adjustment #</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Medication</th>
                  <th className="p-3 text-right">Quantity Delta</th>
                  <th className="p-3">Audit Reason</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold">{adj.adjustmentNumber}</td>
                    <td className="p-3 font-semibold">{adj.type}</td>
                    <td className="p-3">{adj.itemName}</td>
                    <td className="p-3 text-right font-mono font-bold">{adj.quantity}</td>
                    <td className="p-3 text-slate-600 italic">{adj.reason}</td>
                    <td className="p-3 font-mono text-slate-500">{new Date(adj.adjustedDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-REPORT 8: Monthly Stock Valuation */}
        {activeSubReport === 'valuation' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs space-y-4 p-5">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                8. Monthly Stock Asset Valuation by Therapeutic Category
              </span>
              <span className="text-sm font-bold font-mono text-teal-600">
                Total Acquisition Cost: ₱{valuation.totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(valuation.byCategory).map(([cat, data]) => (
                <div key={cat} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">{cat}</div>
                  <div className="text-slate-500 text-[11px]">
                    {data.count} formulations · {data.totalQty.toLocaleString()} units
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Total Asset Value:</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                      ₱{data.costValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Printable Reconciliation Report Modal */}
      <PrintModal
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        data={printDoc}
      />

    </div>
  );
};
