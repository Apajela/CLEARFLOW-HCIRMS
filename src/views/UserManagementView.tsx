import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState } from 'react';
import { Users, Plus, Shield, ShieldCheck, Edit2, Trash2, Key, Check, X } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { UserAccount, RoleType, PermissionKey } from '../types/inventory';
import { ALL_PERMISSIONS } from '../data/seedData';

const PERMISSION_LABELS: Record<PermissionKey, { label: string; desc: string }> = {
  view_dashboard: { label: 'View Dashboard', desc: 'Access October 2026 flow overview and safety indicators' },
  view_inventory: { label: 'View Inventory Catalog', desc: 'Browse formulary items, units, and active batch balances' },
  manage_inventory: { label: 'Add/Edit/Delete Formulary Items', desc: 'Create medical items and configure unit conversions' },
  bulk_stock_management: { label: 'Bulk Stock Management & Updates', desc: 'Perform bulk stock-in, transfers, adjustments, CSV imports' },
  stock_in: { label: 'Stock In & Receiving', desc: 'Log supplier deliveries, PO/DR numbers, and batch lots' },
  create_request: { label: 'Create Ward Requisitions', desc: 'Submit medication requisition orders for inpatient wards' },
  approve_request: { label: 'Review & Approve Requisitions', desc: 'Authorize or reject ward requisitions' },
  release_stock: { label: 'FEFO Stock Release', desc: 'Dispense medications according to FEFO algorithm' },
  patient_usage: { label: 'Patient Drug Administration', desc: 'Record bedside medication consumption for clinical documentation' },
  stock_adjustment: { label: 'Stock Level Adjustments', desc: 'Apply damage, discrepancy, or expired quarantine adjustments' },
  billing_finance: { label: 'Finance – Expense Monitoring', desc: 'Record and review actual center expenses' },
  view_reports: { label: 'View Reports & Valuation', desc: 'Generate October 2026 reports, low stock, and expiry logs' },
  manage_users: { label: 'User & Permissions Admin', desc: 'Full access: create, edit, delete users and set permissions' },
  manage_settings: { label: 'Locations & Master Settings', desc: 'Rename wards, shelves, suppliers, and upload hospital logo' },
  audit_logs: { label: 'System Audit Trail', desc: 'Inspect immutable security and authorization logs' },
  backup_restore: { label: 'Database Backup & Restore', desc: 'Export snapshots, restore archives, or reset demo database' }
};

export const UserManagementView: React.FC = () => {
  const pageTitle = usePageTitle('users', 'User & Account Management');
  const pageSubtitle = usePageSubtitle('users', 'Manage staff accounts, access roles, and permissions.')
  const [users, setUsers] = useState<UserAccount[]>(() => inventoryService.getUsers());
  const currentUser = inventoryService.getCurrentUser();

  // Create / Edit User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'Clinical Staff' as RoleType,
    department: 'Inpatient Ward 3B',
    isFullAccess: false
  });

  // Permission Configuration Modal State
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserAccount | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);

  const settings = inventoryService.getSettings();

  const refreshList = () => {
    setUsers(inventoryService.getUsers());
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'Clinical Staff',
      department: settings.requestingWards[0] || 'Central Pharmacy',
      isFullAccess: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      isFullAccess: user.isFullAccess
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        inventoryService.updateUser(editingUser.id, userFormData);
      } else {
        inventoryService.createUser({
          ...userFormData,
          permissions: userFormData.isFullAccess
            ? [...ALL_PERMISSIONS]
            : ['view_dashboard', 'view_inventory', 'create_request']
        });
      }
      refreshList();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (!confirm(`Are you sure you want to delete user account '${user.fullName}' (${user.username})?`)) return;
    try {
      inventoryService.deleteUser(user.id);
      refreshList();
    } catch (err: any) {
      alert(err.message || 'Cannot delete user');
    }
  };

  const handleOpenPermModal = (user: UserAccount) => {
    setTargetUser(user);
    setSelectedPermissions([...user.permissions]);
    setIsPermModalOpen(true);
  };

  const handleTogglePermission = (perm: PermissionKey) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSavePermissions = () => {
    if (!targetUser) return;
    try {
      inventoryService.updateUserPermissions(targetUser.id, selectedPermissions);
      refreshList();
      setIsPermModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update permissions');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            {pageTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pageSubtitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full Access administrators configure staff permissions determining what regular accounts can view and execute.
          </p>
        </div>

        {inventoryService.hasPermission('manage_users') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create User Account</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Staff Name</th>
                <th className="p-3">Username</th>
                <th className="p-3">Role & Department</th>
                <th className="p-3">Access Tier</th>
                <th className="p-3">Granted Permissions</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px]">
                        {u.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <span>{u.fullName}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{u.username}</td>
                  <td className="p-3">
                    <div className="font-medium text-slate-900 dark:text-white">{u.role}</div>
                    <div className="text-[11px] text-slate-500">{u.department}</div>
                  </td>
                  <td className="p-3">
                    {u.isFullAccess ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Shield className="w-3 h-3 text-amber-600" />
                        Full Access Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Regular Staff Account
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.isFullAccess ? (
                      <span className="text-slate-500 italic text-[11px]">All 16 Master Permissions</span>
                    ) : (
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {u.permissions.length} of {ALL_PERMISSIONS.length} Permissions Active
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {!u.isFullAccess && (
                        <button
                          onClick={() => handleOpenPermModal(u)}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-md border border-teal-200 dark:border-teal-800 transition-colors"
                        >
                          Permissions Matrix
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="Edit Account"
                        className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete Account"
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingUser ? `Edit Account: ${editingUser.fullName}` : 'Create Staff Account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name & Credentials *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Arthur Vance, MD"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as RoleType })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Medical Director">Medical Director</option>
                    <option value="Chief Pharmacist">Chief Pharmacist</option>
                    <option value="Head Nurse">Head Nurse</option>
                    <option value="Pharmacy Dispenser">Pharmacy Dispenser</option>
                    <option value="Clinical Staff">Clinical Staff</option>
                    <option value="Finance Officer">Finance Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {settings.requestingWards.map((w, idx) => (
                      <option key={idx} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userFormData.isFullAccess}
                    onChange={(e) => setUserFormData({ ...userFormData, isFullAccess: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Grant Full Access Administrator Privileges
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6">
                  Grants all 16 system permissions including permission matrix delegation and settings.
                </p>
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Granular Permission Assignment Modal */}
      {isPermModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-teal-600" />
                  Configure Permissions: {targetUser.fullName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Role: {targetUser.role} · Department: {targetUser.department}
                </p>
              </div>
              <button
                onClick={() => setIsPermModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="text-xs text-slate-500 pb-1">
                Select the specific capabilities this regular account is permitted to access and execute:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_PERMISSIONS.map(permKey => {
                  const meta = PERMISSION_LABELS[permKey];
                  const isChecked = selectedPermissions.includes(permKey);

                  return (
                    <label
                      key={permKey}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-teal-500/80 bg-teal-50/40 dark:bg-teal-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(permKey)}
                        className="mt-0.5 rounded text-teal-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {meta.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {meta.desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs text-slate-500">
                {selectedPermissions.length} of {ALL_PERMISSIONS.length} permissions granted
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPermModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Apply Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
