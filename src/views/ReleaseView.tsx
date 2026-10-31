import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, ShieldCheck, Printer, CheckCircle, Clock, Check, X } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { StockRelease, BatchAllocation, ReleaseItem } from '../types/inventory';
import { PrintDocumentData, PrintModal } from '../components/PrintModal';
import { PasswordVerificationModal } from '../components/PasswordVerificationModal';

interface ReleaseViewProps {
  initialRequestId?: string | null;
}

export const ReleaseView: React.FC<ReleaseViewProps> = ({ initialRequestId }) => {
  const pageTitle = usePageTitle('release', 'FEFO Stock Release & Automated Dispensing');
  const pageSubtitle = usePageSubtitle('release', 'Automatically dispatch eligible lots using First-Expiry, First-Out controls.')
  const [releases, setReleases] = useState<StockRelease[]>(() => inventoryService.getReleases());
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  // Security password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingReleaseExecution, setPendingReleaseExecution] = useState<(() => void) | null>(null);

  const items = inventoryService.getItems();
  const settings = inventoryService.getSettings();
  const requests = inventoryService.getRequests();
  const currentUser = inventoryService.getCurrentUser();

  // Selected item to release
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [releaseQuantity, setReleaseQuantity] = useState<number>(10);
  const [requestingWard, setRequestingWard] = useState<string>(settings.requestingWards[0] || 'Intensive Care Unit (ICU)');
  const [receivingStaff, setReceivingStaff] = useState<string>('Carla Gomez, RN');
  const [selectedRequestId, setSelectedRequestId] = useState<string>(initialRequestId || '');
  const [remarks, setRemarks] = useState('FEFO release confirmed by clinical pharmacy dispensing counter');

  // Load request details if initialRequestId is provided
  useEffect(() => {
    if (initialRequestId) {
      const req = requests.find(r => r.id === initialRequestId);
      if (req) {
        setSelectedRequestId(req.id);
        setRequestingWard(req.requestingWard);
        if (req.items[0]) {
          setSelectedItemId(req.items[0].itemId);
          setReleaseQuantity(req.items[0].approvedQty || req.items[0].requestedQty);
        }
      }
    }
  }, [initialRequestId, requests]);

  const refreshList = () => {
    setReleases(inventoryService.getReleases());
  };

  // Live FEFO Allocation Engine Computation
  const currentItem = items.find(i => i.id === selectedItemId);
  const fefoCalculation = inventoryService.calculateFEFOAllocations(selectedItemId, releaseQuantity);

  const handleExecuteRelease = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentItem) return;

    if (!fefoCalculation.canFulfill) {
      alert(fefoCalculation.error || 'Cannot fulfill requested quantity under FEFO safety rules.');
      return;
    }

    if (fefoCalculation.allocations.length === 0) {
      alert('No valid non-expired batch found.');
      return;
    }

    // Set pending transaction to execute upon password verification
    setPendingReleaseExecution(() => () => {
      try {
        const releaseItem: ReleaseItem = {
          itemId: currentItem.id,
          itemCode: currentItem.itemCode,
          itemName: currentItem.name,
          allocatedBatches: fefoCalculation.allocations,
          totalQty: releaseQuantity,
          unit: currentItem.primaryUnit
        };

        const release = inventoryService.dispatchRelease({
          requestId: selectedRequestId || undefined,
          requestingWard,
          releasedBy: currentUser?.fullName || 'Pharmacy Dispenser',
          receivingStaff,
          items: [releaseItem],
          remarks
        });

        refreshList();
        handlePrintRelease(release);
        alert(`FEFO Release ${release.releaseNumber} completed! Stock automatically deducted.`);
      } catch (err: any) {
        alert(err.message || 'Dispatch release failed');
      }
    });

    setPasswordModalOpen(true);
  };

  const handlePrintRelease = (rel: StockRelease) => {
    const docData: PrintDocumentData = {
      title: 'Official FEFO Stock Release Slip & Gate Pass',
      docNumber: rel.releaseNumber,
      date: new Date(rel.releaseDate).toLocaleDateString(),
      departmentOrWard: rel.requestingWard,
      preparedBy: rel.releasedBy,
      verifiedBy: rel.receivingStaff,
      columnHeaders: ['Formulary Item', 'Allocated Batch Lot', 'Lot Expiry Date', 'Dispatched Qty', 'Unit'],
      items: rel.items.flatMap(i =>
        i.allocatedBatches.map(alloc => ({
          col1: `${i.itemCode} - ${i.itemName}`,
          col2: alloc.batchNumber,
          col3: alloc.expiryDate,
          col4: `${alloc.quantityAllocated}`,
          col5: i.unit
        }))
      ),
      totalAmountText: `${rel.items.reduce((acc, i) => acc + i.totalQty, 0)} Units Dispatched`,
      summaryNotes: `Dispensed under First-Expired, First-Out (FEFO) clinical protocols. Remarks: ${rel.remarks || 'Standard ward transfer'}`
    };
    setPrintDoc(docData);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-teal-600" />
            {pageTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pageSubtitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pinakamalapit na expiry ang unang ilalabas. Strict quarantine locks on expired batches.
          </p>
        </div>
      </div>

      {/* FEFO Dispatch Engine Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Release Parameters Form (Left Column) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              FEFO Dispense Order Setup
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
              Automatic Sorting
            </span>
          </div>

          <form onSubmit={handleExecuteRelease} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Medical Formulary Item *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.itemCode} - {i.name} (Total Stock: {i.totalStock} {i.primaryUnit}s)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity to Release *
                </label>
                <input
                  type="number"
                  min="1"
                  value={releaseQuantity}
                  onChange={(e) => setReleaseQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Unit
                </label>
                <input
                  type="text"
                  disabled
                  value={currentItem?.primaryUnit || 'Unit'}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Ward / Department *
              </label>
              <select
                value={requestingWard}
                onChange={(e) => setRequestingWard(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {settings.requestingWards.map((w, idx) => (
                  <option key={idx} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receiving Staff / Nurse *
              </label>
              <input
                type="text"
                required
                value={receivingStaff}
                onChange={(e) => setReceivingStaff(e.target.value)}
                placeholder="e.g. Carla Gomez, RN"
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dispensing Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={!fefoCalculation.canFulfill}
              className="w-full py-2.5 px-4 font-semibold text-xs text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:hover:bg-teal-600 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authorize FEFO Dispatch & Deduct Stock</span>
            </button>
          </form>
        </div>

        {/* Live FEFO Allocation Engine Visualizer (Right Column) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Live FEFO Allocation Preview: {currentItem?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Algorithm sorts batches by earliest expiry date and protects expired inventory.
              </p>
            </div>
            {fefoCalculation.canFulfill ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md">
                <Check className="w-3.5 h-3.5" />
                Sufficient Unexpired Stock
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                Shortfall ({fefoCalculation.shortfall} Units)
              </span>
            )}
          </div>

          {/* Allocation Breakdown Cards */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Allocated Batches (Sequenced by Earliest Expiry):
            </div>

            {fefoCalculation.allocations.map((alloc, idx) => (
              <div
                key={alloc.batchId}
                className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-800 text-xs flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-800 dark:text-teal-300 font-mono">
                      Priority #{idx + 1}: {alloc.batchNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-teal-600 bg-teal-100 dark:bg-teal-900 px-1.5 py-0.2 rounded">
                      Earliest Out
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Expiry Date: {alloc.expiryDate} (
                    {inventoryService.getDaysToExpiry(alloc.expiryDate)} days remaining)
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-teal-700 dark:text-teal-300 font-mono">
                    {alloc.quantityAllocated} {currentItem?.primaryUnit}s
                  </div>
                  <div className="text-[10px] text-slate-400">Allocated from batch</div>
                </div>
              </div>
            ))}

            {fefoCalculation.allocations.length === 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center text-xs text-slate-500">
                No eligible unexpired batches available to allocate.
              </div>
            )}

            {/* Quarantined Expired Batches Block Warning */}
            {fefoCalculation.expiredBatchesFound.length > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Expired Stock Blocked by Quarantine Protocol</span>
                </div>
                <div className="space-y-1 pl-5 text-rose-700 dark:text-rose-400">
                  {fefoCalculation.expiredBatchesFound.map(b => (
                    <div key={b.id} className="flex items-center justify-between font-mono text-[11px]">
                      <span>Batch: {b.batchNumber} (Expired: {b.expiryDate})</span>
                      <span className="font-bold">{b.quantity} Units BLOCKED</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 italic pl-5">
                  Hospital FEFO policy strictly blocks dispensing of any expired pharmaceutical lots.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Historical Stock Releases Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Recent FEFO Dispatch Releases
          </h3>
          <span className="text-xs text-slate-500 font-mono">{releases.length} Dispatches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Release #</th>
                <th className="p-3">Ward Destination</th>
                <th className="p-3">Items & Batch Lots</th>
                <th className="p-3">Dispensed By</th>
                <th className="p-3">Receiving Nurse</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Print Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {releases.map(rel => (
                <tr key={rel.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {rel.releaseNumber}
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                    {rel.requestingWard}
                  </td>
                  <td className="p-3">
                    {rel.items.map((i, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {i.itemName} ({i.totalQty} {i.unit}s)
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Batches: {i.allocatedBatches.map(b => `${b.batchNumber} (${b.quantityAllocated})`).join(', ')}
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{rel.releasedBy}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{rel.receivingStaff}</td>
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {new Date(rel.releaseDate).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handlePrintRelease(rel)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Gate Pass</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Password Verification Window */}
      <PasswordVerificationModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          if (pendingReleaseExecution) pendingReleaseExecution();
        }}
        actionTitle="Authorize FEFO Stock Release"
        transactionDescription={`Dispatch ${releaseQuantity} units of ${currentItem?.name} to ${requestingWard} received by ${receivingStaff}`}
      />

      {/* Printable Release Slip Modal */}
      <PrintModal
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        data={printDoc}
      />

    </div>
  );
};
