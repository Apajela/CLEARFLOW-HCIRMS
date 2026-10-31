import React, { useState } from 'react';
import { UserCheck, Plus, Printer, CheckCircle, Search, FileText } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { PatientUsageRecord } from '../types/inventory';
import { PrintDocumentData, PrintModal } from '../components/PrintModal';

export const PatientUsageView: React.FC = () => {
  const [usages, setUsages] = useState<PatientUsageRecord[]>(() => inventoryService.getPatientUsages());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  const items = inventoryService.getItems();
  const batches = inventoryService.getBatches();
  const settings = inventoryService.getSettings();
  const currentUser = inventoryService.getCurrentUser();

  // New Record State
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState(`PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [wardLocation, setWardLocation] = useState(settings.requestingWards[1] || 'Inpatient Ward 3B');
  const [roomBed, setRoomBed] = useState(settings.patientLocations[0] || 'Ward 3B - Bed 301');
  const [attendingPhysician, setAttendingPhysician] = useState('Dr. Arthur Vance, MD');
  const [diagnosis, setDiagnosis] = useState('Post-Operative Recovery / Surgical Care');

  const [usageItems, setUsageItems] = useState([
    {
      itemId: items[0]?.id || '',
      batchNumber: batches.find(b => b.itemId === items[0]?.id && b.status !== 'expired')?.batchNumber || '',
      quantity: 1
    }
  ]);

  const refreshList = () => {
    setUsages(inventoryService.getPatientUsages());
  };

  const handleAddItem = () => {
    setUsageItems([
      ...usageItems,
      {
        itemId: items[0]?.id || '',
        batchNumber: batches.find(b => b.itemId === items[0]?.id && b.status !== 'expired')?.batchNumber || '',
        quantity: 1
      }
    ]);
  };

  const handleUpdateItem = (idx: number, field: string, val: any) => {
    const updated = [...usageItems];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'itemId') {
      const b = batches.find(batch => batch.itemId === val && batch.status !== 'expired');
      if (b) updated[idx].batchNumber = b.batchNumber;
    }
    setUsageItems(updated);
  };

  const handleRemoveItem = (idx: number) => {
    setUsageItems(usageItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Patient Name is mandatory.');
      return;
    }

    try {
      const formattedItems = usageItems.map(ui => {
        const item = items.find(i => i.id === ui.itemId)!;
        return {
          itemId: item.id,
          itemName: item.name,
          batchNumber: ui.batchNumber || 'STANDARD',
          quantity: Number(ui.quantity) || 1,
          unit: item.primaryUnit,
          unitPrice: 0,
          totalAmount: 0
        };
      });

      const rec = inventoryService.recordPatientUsage({
        patientName,
        patientId,
        wardLocation,
        roomBed,
        attendingPhysician,
        diagnosis,
        administeredBy: currentUser?.fullName || 'Ward Nurse',
        items: formattedItems,
        totalBillAmount: 0,
        billingStatus: 'HMO Cleared'
      });

      refreshList();
      setIsModalOpen(false);
      handlePrintMAR(rec);
    } catch (err: any) {
      alert(err.message || 'Error recording patient consumption');
    }
  };

  const handlePrintMAR = (rec: PatientUsageRecord) => {
    const docData: PrintDocumentData = {
      title: 'Medication Administration Record',
      docNumber: rec.recordNumber,
      date: new Date(rec.administeredDate).toLocaleString(),
      departmentOrWard: `${rec.wardLocation} · ${rec.roomBed}`,
      preparedBy: rec.administeredBy,
      verifiedBy: rec.attendingPhysician,
      columnHeaders: ['Administered Medication', 'Batch Lot #', 'Notes', 'Quantity / Unit'],
      items: rec.items.map(i => ({
        col1: i.itemName,
        col2: i.batchNumber,
        col3: 'Clinical consumption',
        col4: `${i.quantity} ${i.unit}`
      })),
      summaryNotes: `Patient: ${rec.patientName} (ID: ${rec.patientId}). Diagnosis: ${rec.diagnosis}. Clinical consumption record only; no billing.`
    };
    setPrintDoc(docData);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            Patient Medication Consumption & Administration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track bedside medication usage by room/bed and attending physician for clinical documentation only.
          </p>
        </div>

        {inventoryService.hasPermission('patient_usage') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Patient Administration</span>
          </button>
        )}
      </div>

      {/* Consumption Records Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Record Ref</th>
                <th className="p-3">Patient Name & ID</th>
                <th className="p-3">Room / Bed</th>
                <th className="p-3">Attending Doctor</th>
                <th className="p-3">Medications Administered</th>
                <th className="p-3 text-center">Print MAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usages.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {u.recordNumber}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{u.patientName}</div>
                    <div className="font-mono text-[11px] text-slate-500">{u.patientId}</div>
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                    {u.roomBed}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{u.attendingPhysician}</td>
                  <td className="p-3">
                    {u.items.map((i, idx) => (
                      <div key={idx} className="text-[11px]">
                        <span className="font-semibold">{i.itemName}</span> ({i.quantity} {i.unit}) ·{' '}
                        <span className="font-mono text-slate-500">Lot: {i.batchNumber}</span>
                      </div>
                    ))}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handlePrintMAR(u)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>MAR Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Consumption Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600" />
                Record Patient Drug Consumption & Administration
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Hospital ID
                  </label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ward Department
                  </label>
                  <select
                    value={wardLocation}
                    onChange={(e) => setWardLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {settings.requestingWards.map((w, idx) => (
                      <option key={idx} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Bed Location
                  </label>
                  <select
                    value={roomBed}
                    onChange={(e) => setRoomBed(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {settings.patientLocations.map((l, idx) => (
                      <option key={idx} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attending Physician
                  </label>
                  <input
                    type="text"
                    value={attendingPhysician}
                    onChange={(e) => setAttendingPhysician(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Diagnosis
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Administered Medications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Administered Drugs & Batch Lots:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    + Add Medication
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {usageItems.map((ui, idx) => {
                    const itemBatches = batches.filter(b => b.itemId === ui.itemId && b.status !== 'expired');
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                        <select
                          value={ui.itemId}
                          onChange={(e) => handleUpdateItem(idx, 'itemId', e.target.value)}
                          className="flex-1 p-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                        >
                          {items.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} (₱{i.unitPrice})
                            </option>
                          ))}
                        </select>
                        <select
                          value={ui.batchNumber}
                          onChange={(e) => handleUpdateItem(idx, 'batchNumber', e.target.value)}
                          className="w-36 p-1.5 font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                        >
                          {itemBatches.map(b => (
                            <option key={b.id} value={b.batchNumber}>
                              {b.batchNumber} (Exp: {b.expiryDate})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={ui.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-16 p-1.5 text-right font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                        />
                        {usageItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  Save Administration Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable MAR Slip Modal */}
      <PrintModal
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        data={printDoc}
      />

    </div>
  );
};
