import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState } from 'react';
import { ClipboardList, Plus, CheckCircle, XCircle, Send, Printer, Clock } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { RequisitionRequest, RequestUrgency, RequestStatus } from '../types/inventory';
import { PrintDocumentData, PrintModal } from '../components/PrintModal';
import { ViewKey } from '../components/Sidebar';

interface RequestsViewProps {
  onNavigateToRelease?: (requestId: string) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ onNavigateToRelease }) => {
  const pageTitle = usePageTitle('requests', 'Ward & Department Requisitions');
  const pageSubtitle = usePageSubtitle('requests', 'Manage ward and department requests for medicines and supplies.')
  const [requests, setRequests] = useState<RequisitionRequest[]>(() => inventoryService.getRequests());
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  // New Request Form State
  const settings = inventoryService.getSettings();
  const items = inventoryService.getItems();
  const currentUser = inventoryService.getCurrentUser();

  const [requestingWard, setRequestingWard] = useState(settings.requestingWards[0] || 'Inpatient Ward 3B');
  const [urgency, setUrgency] = useState<RequestUrgency>('Routine');
  const [notes, setNotes] = useState('Routine ward restocking for shift consumption');
  const [reqItems, setReqItems] = useState([
    {
      itemId: items[0]?.id || '',
      requestedQty: 10,
      unit: items[0]?.primaryUnit || 'Vial',
      notes: ''
    }
  ]);

  const refreshList = () => {
    setRequests(inventoryService.getRequests());
  };

  const handleAddItem = () => {
    const item = items[0];
    setReqItems([
      ...reqItems,
      {
        itemId: item?.id || '',
        requestedQty: 5,
        unit: item?.primaryUnit || 'Piece',
        notes: ''
      }
    ]);
  };

  const handleUpdateItem = (idx: number, field: string, val: any) => {
    const updated = [...reqItems];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'itemId') {
      const itm = items.find(i => i.id === val);
      if (itm) updated[idx].unit = itm.primaryUnit;
    }
    setReqItems(updated);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedItems = reqItems.map(ri => {
        const itm = items.find(i => i.id === ri.itemId)!;
        return {
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          requestedQty: Number(ri.requestedQty) || 1,
          unit: itm.primaryUnit,
          notes: ri.notes
        };
      });

      inventoryService.createRequest({
        requestingWard,
        requestedBy: currentUser?.fullName || 'Ward Staff',
        urgency,
        items: formattedItems,
        notes
      });

      refreshList();
      setIsNewModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit requisition');
    }
  };

  const handleApprove = (req: RequisitionRequest) => {
    try {
      const approvalList = req.items.map(i => ({
        itemId: i.itemId,
        approvedQty: i.requestedQty
      }));
      inventoryService.approveRequest(req.id, approvalList);
      refreshList();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = (req: RequisitionRequest) => {
    const reason = prompt('Please specify clinical/inventory reason for requisition rejection:');
    if (!reason) return;
    try {
      inventoryService.rejectRequest(req.id, reason);
      refreshList();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handlePrintRequest = (req: RequisitionRequest) => {
    const docData: PrintDocumentData = {
      title: 'Official Department Requisition Slip',
      docNumber: req.requestNumber,
      date: new Date(req.requestDate).toLocaleDateString(),
      departmentOrWard: req.requestingWard,
      preparedBy: req.requestedBy,
      verifiedBy: req.approvedBy,
      columnHeaders: ['Formulary Description', 'Item Code', 'Urgency', 'Requested Qty', 'Approved Qty', 'Notes'],
      items: req.items.map(i => ({
        col1: i.itemName,
        col2: i.itemCode,
        col3: req.urgency,
        col4: `${i.requestedQty} ${i.unit}`,
        col5: i.approvedQty !== undefined ? `${i.approvedQty} ${i.unit}` : 'Pending',
        col6: i.notes || '-'
      })),
      summaryNotes: `Clinical Status: ${req.status}. Requisition remarks: ${req.notes || 'None'}`
    };
    setPrintDoc(docData);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            {pageTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pageSubtitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit medication orders, review clinical urgencies, and link approved requisitions to FEFO release.
          </p>
        </div>

        {inventoryService.hasPermission('create_request') && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ward Requisition</span>
          </button>
        )}
      </div>

      {/* Requisitions List */}
      <div className="space-y-3">
        {requests.map(req => {
          const isPending = req.status === 'Pending';
          const isApproved = req.status === 'Approved';
          const isFulfilled = req.status === 'Fulfilled';

          return (
            <div
              key={req.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {req.requestNumber}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                    req.urgency === 'STAT Emergency'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : req.urgency === 'Urgent'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {req.urgency}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                    isFulfilled
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                      : isApproved
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : req.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintRequest(req)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Print Slip"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {isPending && inventoryService.hasPermission('approve_request') && (
                    <>
                      <button
                        onClick={() => handleApprove(req)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-900"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {isApproved && onNavigateToRelease && (
                    <button
                      onClick={() => onNavigateToRelease(req.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispense via FEFO Release &rarr;</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Requesting Ward: </span>
                  {req.requestingWard}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Requested By: </span>
                  {req.requestedBy}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Date: </span>
                  {new Date(req.requestDate).toLocaleString()}
                </div>
              </div>

              {/* Items List */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Requisition Items ({req.items.length}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {req.items.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200/80 dark:border-slate-700">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{i.itemName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{i.itemCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {i.requestedQty} {i.unit}s
                        </div>
                        {i.approvedQty !== undefined && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Approved: {i.approvedQty}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Requisition Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                Submit New Ward Requisition Order
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Requesting Ward Department *
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
                    Clinical Urgency
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as RequestUrgency)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Routine">Routine Shift Restock</option>
                    <option value="Urgent">Urgent Priority</option>
                    <option value="STAT Emergency">STAT Emergency Resuscitation</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Requisition Items:</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reqItems.map((ri, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                      <select
                        value={ri.itemId}
                        onChange={(e) => handleUpdateItem(idx, 'itemId', e.target.value)}
                        className="flex-1 p-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                      >
                        {items.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.itemCode} - {i.name} (Avail: {i.totalStock})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={ri.requestedQty}
                        onChange={(e) => handleUpdateItem(idx, 'requestedQty', Number(e.target.value))}
                        className="w-20 p-1.5 text-right font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                      />
                      <span className="text-slate-500 w-12 text-[11px]">{ri.unit}s</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Indication / Special Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Requisition Slip Modal */}
      <PrintModal
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        data={printDoc}
      />

    </div>
  );
};
