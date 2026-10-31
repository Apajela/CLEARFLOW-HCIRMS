import React from 'react';
import {
  TrendingUp,
  Package,
  ArrowDownToLine,
  Send,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { ViewKey } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (view: ViewKey) => void;
  onOpenBulkModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenBulkModal
}) => {
  const items = inventoryService.getItems();
  const batches = inventoryService.getBatches();
  const requests = inventoryService.getRequests();
  const valuation = inventoryService.getStockValuation();

  const expiredBatches = batches.filter(b => inventoryService.isExpired(b.expiryDate));
  const nearExpiryBatches = batches.filter(b => inventoryService.isNearExpiry(b.expiryDate));
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const lowStockItems = items.filter(i => i.totalStock <= i.minimumStock);

  // October 2026 exact reconciled figures
  const beginningStock = 1250;
  const stockReceived = 350;
  const stockReleased = 280;
  const endingStock = 1320;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl shadow-sm border border-teal-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-700/60">
              October 2026 Active Cycle
            </span>
            <span className="text-xs text-slate-300">· Real-Time Clinical Inventory</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Central Pharmacy & FEFO Dispensing Console
          </h2>
          <p className="text-xs text-teal-100/80 max-w-xl">
            Authoritative FEFO automatic dispatch, clinical expired lot blocking, and high-volume bulk stock operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {inventoryService.hasPermission('bulk_stock_management') && (
            <button
              onClick={onOpenBulkModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-teal-300 hover:bg-teal-200 rounded-lg shadow-sm transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Bulk Stock Management</span>
            </button>
          )}
          {inventoryService.hasPermission('release_stock') && (
            <button
              onClick={() => onNavigate('release')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>FEFO Release</span>
            </button>
          )}
        </div>
      </div>

      {/* October 2026 Reconciliation Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            October 2026 Inventory Flow Reconciliation
          </h3>
          <button
            onClick={() => onNavigate('monthly_overview')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Reconciliation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Beginning Stock (Oct 1)
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {beginningStock.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">Audited opening inventory</div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Stock Received
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              +{stockReceived.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">Deliveries from suppliers</div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Send className="w-3.5 h-3.5" />
              Stock Released
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              -{stockReleased.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">Dispatched via FEFO rules</div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-teal-500/40 dark:border-teal-500/30 bg-teal-50/20 dark:bg-teal-950/10 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
              Ending Stock (Oct 29)
            </div>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300 font-mono">
              {endingStock.toLocaleString()}
            </div>
            <div className="text-[11px] text-teal-600/80 dark:text-teal-400/80">Reconciled balance</div>
          </div>
        </div>
      </div>

      {/* Safety & Operational Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Expired Stock Safety Warning */}
        <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-lg">
            <AlertTriangle className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Strict Quarantine Lockout
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              {expiredBatches.length} batch(es) past expiry date are locked in Quarantine Cage Q-101. Release attempts are automatically halted.
            </p>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-rose-800 dark:text-rose-300 hover:underline pt-1 inline-block"
            >
              Inspect Quarantine Lots &rarr;
            </button>
          </div>
        </div>

        {/* Near Expiry Monitoring */}
        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-lg">
            <Clock className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              FEFO Priority Queue
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {nearExpiryBatches.length} batch(es) expiring within 90 days are staged at the front of the FEFO dispensing pipeline.
            </p>
            <button
              onClick={() => onNavigate('release')}
              className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline pt-1 inline-block"
            >
              Stage FEFO Allocation &rarr;
            </button>
          </div>
        </div>

        {/* Total Stock Valuation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
            <CreditCard className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Stock Asset Valuation
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              ₱{valuation.totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Inventory acquisition value (based on unit cost)
            </p>
          </div>
        </div>

      </div>

      {/* Grid: Pending Ward Requisitions & Low Stock Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Requisitions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Pending Ward Requisitions ({pendingRequests.length})
            </h3>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Manage Requests &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingRequests.slice(0, 3).map(req => (
              <div
                key={req.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{req.requestNumber}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      req.urgency === 'STAT Emergency'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {req.urgency}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    {req.requestingWard} · {req.items.length} items requested
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('requests')}
                  className="px-2.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 rounded border border-teal-200 dark:border-teal-800 transition-colors"
                >
                  Review
                </button>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                All ward requisitions have been approved and dispensed.
              </p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Low Stock & Reorder Thresholds ({lowStockItems.length})
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              View Inventory Catalog &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Code: {item.itemCode} · Shelf: {item.locationShelf}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {item.totalStock} {item.primaryUnit}
                  </div>
                  <div className="text-[10px] text-slate-400">Min: {item.minimumStock}</div>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                All inventory levels are above minimum clinical reserve thresholds.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
