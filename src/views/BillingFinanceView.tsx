import React, { useState } from 'react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownLeft, CheckCircle2, Search, Filter } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { BillingRecord } from '../types/inventory';

export const BillingFinanceView: React.FC = () => {
  const [billings, setBillings] = useState<BillingRecord[]>(() => inventoryService.getBillingRecords());
  const [filterType, setFilterType] = useState<'ALL' | 'Patient Billing' | 'Supplier Payable'>('ALL');
  const valuation = inventoryService.getStockValuation();

  const refreshList = () => {
    setBillings(inventoryService.getBillingRecords());
  };

  const filteredBills = billings.filter(b => filterType === 'ALL' || b.type === filterType);

  const handleUpdateStatus = (id: string, status: BillingRecord['status']) => {
    try {
      inventoryService.updateBillingStatus(id, status);
      refreshList();
    } catch (err: any) {
      alert(err.message || 'Failed to update billing status');
    }
  };

  const totalPatientReceivables = billings
    .filter(b => b.type === 'Patient Billing' && b.status !== 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalSupplierPayables = billings
    .filter(b => b.type === 'Supplier Payable' && b.status !== 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Billing & Hospital Finance Workflows
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Patient medication charges, supplier accounts payable ledgers, and real-time inventory valuations.
          </p>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Patient Receivables (Unpaid)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₱{totalPatientReceivables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Inpatient medication administration</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Supplier Payables (Outstanding)</span>
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            ₱{totalSupplierPayables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Net 30 drug distributor invoices</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Formulary Asset Value</span>
            <DollarSign className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            ₱{valuation.totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Retail Value: ₱{valuation.totalRetailValuation.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md text-xs">
        {(['ALL', 'Patient Billing', 'Supplier Payable'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors ${
              filterType === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab === 'ALL' ? 'All Transactions' : tab}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Type</th>
                <th className="p-3">Entity (Patient / Supplier)</th>
                <th className="p-3">Reference</th>
                <th className="p-3 text-right">Amount (₱)</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBills.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {bill.invoiceNumber}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                      bill.type === 'Patient Billing'
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      {bill.type}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white">
                    {bill.entityName}
                  </td>
                  <td className="p-3 font-mono text-slate-500">{bill.referenceNumber}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₱{bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 font-mono text-slate-500">{bill.dueDate}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                      bill.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : bill.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <select
                      value={bill.status}
                      onChange={(e) => handleUpdateStatus(bill.id, e.target.value as BillingRecord['status'])}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Billed">Billed</option>
                      <option value="Paid">Mark Paid</option>
                      <option value="HMO Pending">HMO Pending</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
