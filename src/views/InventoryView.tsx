import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Calendar,
  X,
  CheckCircle,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { MedicalItem, BatchLot, ItemStatus } from '../types/inventory';
import { inventoryService } from '../services/inventoryService';

interface InventoryViewProps {
  onOpenBulkModal: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onOpenBulkModal }) => {
  const pageTitle = usePageTitle('inventory', 'Medical Inventory & Unit Conversions');
  const pageSubtitle = usePageSubtitle('inventory', 'View stock levels, item details, batch availability, and inventory valuation.')
  const [items, setItems] = useState<MedicalItem[]>(() => inventoryService.getItems());
  const [batches, setBatches] = useState<BatchLot[]>(() => inventoryService.getBatches());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicalItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    genericName: '',
    category: 'Antibiotics & Anti-Infectives',
    form: 'Vial',
    primaryUnit: 'Vial',
    secondaryUnit: 'Box',
    conversionFactor: 10,
    totalStock: 0,
    minimumStock: 50,
    reorderLevel: 80,
    unitCost: 100,
    unitPrice: 180,
    locationShelf: 'Central Pharmacy - Shelf A1 (Antibiotics)',
    status: 'Active' as ItemStatus
  });

  const [formError, setFormError] = useState<string | null>(null);
  const settings = inventoryService.getSettings();

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const refreshData = () => {
    setItems(inventoryService.getItems());
    setBatches(inventoryService.getBatches());
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = search.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.locationShelf.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, search]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      itemCode: `MED-NEW-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      genericName: '',
      category: 'Antibiotics & Anti-Infectives',
      form: 'Vial',
      primaryUnit: 'Vial',
      secondaryUnit: 'Box',
      conversionFactor: 10,
      totalStock: 0,
      minimumStock: 50,
      reorderLevel: 80,
      unitCost: 100,
      unitPrice: 180,
      locationShelf: settings.storageShelves[0] || 'Central Pharmacy - Shelf A1',
      status: 'Active'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MedicalItem) => {
    setEditingItem(item);
    setFormData({
      itemCode: item.itemCode,
      name: item.name,
      genericName: item.genericName,
      category: item.category,
      form: item.form,
      primaryUnit: item.primaryUnit,
      secondaryUnit: item.secondaryUnit || 'Box',
      conversionFactor: item.conversionFactor || 1,
      totalStock: item.totalStock,
      minimumStock: item.minimumStock,
      reorderLevel: item.reorderLevel,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      locationShelf: item.locationShelf,
      status: item.status
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.itemCode.trim()) {
      setFormError('Item Code and Name are mandatory.');
      return;
    }

    try {
      if (editingItem) {
        inventoryService.updateItem(editingItem.id, formData);
      } else {
        inventoryService.addItem(formData);
      }
      refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleDeleteItem = (item: MedicalItem) => {
    if (!window.confirm(`Are you sure you want to delete '${item.name}'?`)) return;
    try {
      inventoryService.deleteItem(item.id);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Cannot delete item');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            {pageTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pageSubtitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formulary drug catalog, packaging ratios, batch expiration schedules, and bulk operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {inventoryService.hasPermission('bulk_stock_management') && (
            <button
              onClick={onOpenBulkModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-teal-300 hover:bg-teal-200 rounded-lg shadow-xs transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Bulk Stock Management & Updates</span>
            </button>
          )}

          {inventoryService.hasPermission('manage_inventory') && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Formulary Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search medication, code, or shelf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Medical Items Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-8"></th>
                <th className="p-3">Item Code</th>
                <th className="p-3">Medication Name & Generic</th>
                <th className="p-3">Category & Form</th>
                <th className="p-3">Unit Conversion</th>
                <th className="p-3 text-right">Total Stock</th>
                <th className="p-3 text-right">Cost / Retail</th>
                <th className="p-3">Shelf Location</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map(item => {
                const itemBatches = batches.filter(b => b.itemId === item.id);
                const isExpanded = expandedItemId === item.id;
                const isLowStock = item.totalStock <= item.minimumStock;
                const hasExpiredBatches = itemBatches.some(b => inventoryService.isExpired(b.expiryDate));

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isExpanded ? 'bg-teal-50/20 dark:bg-teal-950/10' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                        {item.itemCode}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-500 italic">{item.genericName}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-200">{item.category}</div>
                        <div className="text-[11px] text-slate-400">{item.form}</div>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {item.secondaryUnit ? (
                          <span className="font-mono text-[11px]">
                            1 {item.secondaryUnit} = {item.conversionFactor} {item.primaryUnit}s
                          </span>
                        ) : (
                          <span>1 {item.primaryUnit}</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className={`font-mono font-bold text-sm ${
                          isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.totalStock} {item.primaryUnit}s
                        </div>
                        {isLowStock && (
                          <div className="text-[10px] text-amber-600 font-semibold">Low Stock Alert</div>
                        )}
                        {hasExpiredBatches && (
                          <div className="text-[10px] text-rose-600 font-semibold">Quarantine Lots</div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-mono text-slate-700 dark:text-slate-300">
                          Cost: ₱{item.unitCost.toFixed(2)}
                        </div>
                        <div className="font-mono text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                          Price: ₱{item.unitPrice.toFixed(2)}
                        </div>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {item.locationShelf}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                          item.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'Hold'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inventoryService.hasPermission('manage_inventory') && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                title="Edit Item Details"
                                className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                title="Delete Item"
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED BATCH BREAKDOWN ROW */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 dark:bg-slate-850/80">
                        <td colSpan={10} className="p-4 border-y border-slate-200/80 dark:border-slate-800">
                          <div className="space-y-3 pl-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-teal-600" />
                                Batch Lots & FEFO Expiration Schedule ({itemBatches.length} active lots)
                              </h4>
                              <span className="text-[11px] text-slate-500">
                                FEFO Rule: Earliest unexpired lot is automatically prioritized for dispensing
                              </span>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-700/80 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                                  <tr>
                                    <th className="p-2">Batch / Lot #</th>
                                    <th className="p-2">Expiry Date</th>
                                    <th className="p-2">Days to Expiry</th>
                                    <th className="p-2">Batch Balance</th>
                                    <th className="p-2">Supplier & DR #</th>
                                    <th className="p-2">Shelf Location</th>
                                    <th className="p-2">FEFO Dispense Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {itemBatches.map(b => {
                                    const isExp = inventoryService.isExpired(b.expiryDate);
                                    const isNear = inventoryService.isNearExpiry(b.expiryDate);
                                    const days = inventoryService.getDaysToExpiry(b.expiryDate);

                                    return (
                                      <tr
                                        key={b.id}
                                        className={
                                          isExp
                                            ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                            : isNear
                                            ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                            : ''
                                        }
                                      >
                                        <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">
                                          {b.batchNumber}
                                        </td>
                                        <td className="p-2 font-mono">{b.expiryDate}</td>
                                        <td className="p-2">
                                          {isExp ? (
                                            <span className="text-rose-600 font-bold">EXPIRED</span>
                                          ) : (
                                            <span>{days} days</span>
                                          )}
                                        </td>
                                        <td className="p-2 font-semibold">
                                          {b.quantity} / {b.originalQuantity} {item.primaryUnit}s
                                        </td>
                                        <td className="p-2 text-slate-600 dark:text-slate-400 text-[11px]">
                                          {b.supplierName} ({b.deliveryReceiptNumber})
                                        </td>
                                        <td className="p-2 text-[11px]">{b.locationShelf}</td>
                                        <td className="p-2">
                                          {isExp ? (
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                              BLOCKED (Quarantine)
                                            </span>
                                          ) : isNear ? (
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                              FEFO Priority 1 (Earliest Out)
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                              Eligible FEFO
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {itemBatches.length === 0 && (
                                    <tr>
                                      <td colSpan={7} className="p-4 text-center text-slate-500 text-xs">
                                        No active batches registered. Process Stock-In to add inventory lots.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                    No medical formulary items matched the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medical Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Formulary Medical Item' : 'Add New Medical Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Formulary Brand / Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Generic Name (INN)
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Units & Packaging Conversion */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Packaging Unit Conversion
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Base Dispensing Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. Vial, Tablet"
                      value={formData.primaryUnit}
                      onChange={(e) => setFormData({ ...formData, primaryUnit: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Packaging Box/Carton</label>
                    <input
                      type="text"
                      placeholder="e.g. Box, Carton"
                      value={formData.secondaryUnit}
                      onChange={(e) => setFormData({ ...formData, secondaryUnit: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Units per Package</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.conversionFactor}
                      onChange={(e) => setFormData({ ...formData, conversionFactor: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400">
                  Formula: 1 {formData.secondaryUnit || 'Box'} = {formData.conversionFactor}{' '}
                  {formData.primaryUnit}s
                </div>
              </div>

              {/* Pricing & Thresholds */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono font-semibold text-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Safety Min Stock
                  </label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reorder Trigger
                  </label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Storage Shelf / Bin
                  </label>
                  <select
                    value={formData.locationShelf}
                    onChange={(e) => setFormData({ ...formData, locationShelf: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {settings.storageShelves.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Formulary Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ItemStatus })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active (Available for Dispensing)</option>
                    <option value="Hold">Hold (Under Review)</option>
                    <option value="Inactive">Inactive (Decommissioned)</option>
                  </select>
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
                  {editingItem ? 'Save Modifications' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
