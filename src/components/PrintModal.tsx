import React from 'react';
import { Printer, X } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export interface PrintDocumentData {
  title: string;
  docNumber: string;
  date: string;
  departmentOrWard: string;
  preparedBy: string;
  verifiedBy?: string;
  items: Array<{
    col1: string; // e.g. Item / Formulary
    col2: string; // e.g. Batch Lot #
    col3: string; // e.g. Expiry Date
    col4: string; // e.g. Quantity / Unit
    col5?: string;// e.g. Unit Price / Cost
    col6?: string;// e.g. Subtotal
  }>;
  columnHeaders: string[];
  summaryNotes?: string;
  totalAmountText?: string;
}

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrintDocumentData | null;
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const settings = inventoryService.getSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Controls Bar (Hidden during printing) */}
        <div className="no-print flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Document Print Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="flex-1 overflow-y-auto p-8 font-sans text-xs bg-white text-slate-900">
          {/* Institution Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Hospital Logo"
                  className="w-14 h-14 object-contain rounded border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-teal-700 text-white flex items-center justify-center font-bold text-xl">
                  +
                </div>
              )}
              <div>
                <h1 className="text-base font-bold uppercase tracking-wider text-slate-900">
                  {settings.hospitalName}
                </h1>
                <p className="text-[11px] text-slate-600">{settings.subtitle}</p>
                <p className="text-[10px] text-slate-500">
                  {settings.address} · License: {settings.licenseNumber}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold uppercase tracking-wide text-teal-800">
                {data.title}
              </div>
              <div className="font-mono text-xs font-semibold text-slate-800">
                Doc Ref: {data.docNumber}
              </div>
              <div className="text-[10px] text-slate-500">Date: {data.date}</div>
            </div>
          </div>

          {/* Department Metadata */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded border border-slate-200 mb-6 text-xs">
            <div>
              <span className="font-semibold text-slate-600">Department / Ward: </span>
              <span className="font-bold text-slate-800">{data.departmentOrWard}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-600">Authorized Officer: </span>
              <span className="font-bold text-slate-800">{data.preparedBy}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                {data.columnHeaders.map((header, idx) => (
                  <th key={idx} className="p-2 border border-slate-300 uppercase text-[10px]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-300 font-medium">{row.col1}</td>
                  <td className="p-2 border border-slate-300 font-mono">{row.col2}</td>
                  <td className="p-2 border border-slate-300">{row.col3}</td>
                  <td className="p-2 border border-slate-300 font-semibold text-right">{row.col4}</td>
                  {row.col5 !== undefined && (
                    <td className="p-2 border border-slate-300 text-right">{row.col5}</td>
                  )}
                  {row.col6 !== undefined && (
                    <td className="p-2 border border-slate-300 text-right font-semibold">{row.col6}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary / Total */}
          {data.totalAmountText && (
            <div className="flex justify-end mb-6">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-right min-w-[200px]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Valuation / Charge</div>
                <div className="text-base font-bold text-teal-800">{data.totalAmountText}</div>
              </div>
            </div>
          )}

          {data.summaryNotes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded mb-8 text-[11px] text-slate-700">
              <span className="font-semibold">Clinical & Pharmacy Notes: </span>
              {data.summaryNotes}
            </div>
          )}

          {/* Institutional Signature Blocks */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center">
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <div className="pt-1.5 font-bold text-slate-800">{data.preparedBy}</div>
              <div className="text-[10px] text-slate-500">Prepared / Dispensed By</div>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <div className="pt-1.5 font-bold text-slate-800">{data.verifiedBy || 'Teresa Mendoza, RPh'}</div>
              <div className="text-[10px] text-slate-500">Chief Pharmacist / Supervisor</div>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <div className="pt-1.5 font-bold text-slate-800">Dr. Arthur Vance, MD</div>
              <div className="text-[10px] text-slate-500">Medical Director</div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-200">
            MedFlow Hospital FEFO System · Generated on {new Date().toLocaleString()} · Official Hospital Record
          </div>
        </div>

      </div>
    </div>
  );
};
