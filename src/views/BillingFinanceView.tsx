import React, { useMemo, useState } from 'react';
import { Wallet, Plus, ReceiptText, TrendingDown } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { ExpenseCategory, ExpenseRecord } from '../types/inventory';

const CATEGORIES: ExpenseCategory[] = [
  'Medical Supplies', 'Medicines', 'Utilities', 'Equipment',
  'Maintenance', 'Staff / Operations', 'Other'
];

const money = (value: number) => `₱${value.toLocaleString('en-PH', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})}`;

export const BillingFinanceView: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => inventoryService.getExpenseRecords());
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [description, setDescription] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const refresh = () => setExpenses(inventoryService.getExpenseRecords());
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyTotal = expenses
    .filter(item => item.expenseDate.startsWith(thisMonth))
    .reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = useMemo(() => CATEGORIES.map(name => ({
    name,
    total: expenses.filter(item => item.category === name).reduce((sum, item) => sum + item.amount, 0)
  })).filter(item => item.total > 0), [expenses]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      inventoryService.addExpense({
        category,
        description: description.trim(),
        payee: payee.trim() || 'Not specified',
        amount: Number(amount),
        expenseDate,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim()
      });
      refresh();
      setDescription('');
      setPayee('');
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      setShowForm(false);
    } catch (error: any) {
      alert(error.message || 'Unable to save expense.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            Finance – Expense Monitoring
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record and monitor the center's actual expenses. No patient billing or outstanding billing balances.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
          <Plus className="w-4 h-4" /> {showForm ? 'Close Form' : 'Add Expense'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500">Total Recorded Expenses</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white">{money(total)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{expenses.length} expense records</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500">Expenses This Month</div>
          <div className="mt-1 text-2xl font-bold font-mono text-teal-600">{money(monthlyTotal)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Based on expense date</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500"><TrendingDown className="w-4 h-4" /> Average Expense</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white">{money(expenses.length ? total / expenses.length : 0)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Per recorded transaction</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-xl border border-teal-200 dark:border-teal-900 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Record Actual Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-slate-600 dark:text-slate-300">Category
              <select required value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2">
                {CATEGORIES.map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">Amount (₱) *
              <input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">Description *
              <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly electricity bill" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">Payee / Supplier
              <input value={payee} onChange={e => setPayee(e.target.value)} placeholder="Name of supplier or payee" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">Expense Date *
              <input required type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">OR / Reference Number
              <input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Optional reference" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300 sm:col-span-2">Notes
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional details (optional)" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 text-xs font-semibold">Save Expense</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 font-semibold text-sm"><ReceiptText className="w-4 h-4 text-teal-600" /> Expense History</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <tr><th className="p-3">Date / Ref</th><th className="p-3">Description</th><th className="p-3">Category / Payee</th><th className="p-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map(item => <tr key={item.id}>
                  <td className="p-3 whitespace-nowrap"><div>{item.expenseDate}</div><div className="text-[10px] text-slate-400">{item.referenceNumber || item.expenseNumber}</div></td>
                  <td className="p-3 min-w-40"><div className="font-semibold text-slate-800 dark:text-slate-200">{item.description}</div><div className="text-[10px] text-slate-400">{item.notes}</div></td>
                  <td className="p-3"><div>{item.category}</div><div className="text-[10px] text-slate-400">{item.payee}</div></td>
                  <td className="p-3 text-right font-mono font-bold whitespace-nowrap">{money(item.amount)}</td>
                </tr>)}
                {expenses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No expenses recorded yet. Add an expense to start monitoring actual spending.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold text-sm mb-3">Expenses by Category</h3>
          {categoryTotals.length ? <div className="space-y-3">{categoryTotals.map(item => <div key={item.name}>
            <div className="flex justify-between gap-2 text-xs mb-1"><span>{item.name}</span><strong>{money(item.total)}</strong></div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-teal-500 rounded-full" style={{ width: `${total ? item.total / total * 100 : 0}%` }} /></div>
          </div>)}</div> : <p className="text-xs text-slate-400">Category totals will appear after expenses are recorded.</p>}
        </section>
      </div>
    </div>
  );
};
