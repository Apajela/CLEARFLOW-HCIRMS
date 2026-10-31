import {
  UserAccount,
  MedicalItem,
  BatchLot,
  StockInRecord,
  RequisitionRequest,
  StockRelease,
  PatientUsageRecord,
  StockAdjustmentRecord,
  BillingRecord,
  ExpenseRecord,
  AuditLog,
  HospitalMasterSettings,
  PermissionKey,
  ItemStatus,
  BatchAllocation
} from '../types/inventory';

import {
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_ITEMS,
  INITIAL_BATCHES,
  INITIAL_STOCK_IN_RECORDS,
  INITIAL_REQUESTS,
  INITIAL_RELEASES,
  INITIAL_PATIENT_USAGE,
  INITIAL_ADJUSTMENTS,
  INITIAL_BILLING_RECORDS,
  INITIAL_AUDIT_LOGS
} from '../data/seedData';

const CURRENT_SIMULATED_DATE = '2026-10-29';

const API_BASE_URL = 'https://clearflow-api-v2.paguyoddon.workers.dev';

// Storage Keys
const KEYS = {
  USERS: 'medflow_users_v2',
  CURRENT_USER: 'medflow_current_user_v2',
  SETTINGS: 'medflow_settings_v2',
  ITEMS: 'medflow_items_v2',
  BATCHES: 'medflow_batches_v2',
  STOCK_IN: 'medflow_stock_in_v2',
  REQUESTS: 'medflow_requests_v2',
  RELEASES: 'medflow_releases_v2',
  PATIENT_USAGE: 'medflow_patient_usage_v2',
  ADJUSTMENTS: 'medflow_adjustments_v2',
  BILLING: 'medflow_billing_v2',
  EXPENSES: 'medflow_expenses_v1',
  AUDIT: 'medflow_audit_logs_v2'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
}

class InventoryService {
  private users: UserAccount[];
  private currentUser: UserAccount | null;
  private settings: HospitalMasterSettings;
  private items: MedicalItem[];
  private batches: BatchLot[];
  private stockIns: StockInRecord[];
  private requests: RequisitionRequest[];
  private releases: StockRelease[];
  private patientUsages: PatientUsageRecord[];
  private adjustments: StockAdjustmentRecord[];
  private billings: BillingRecord[];
  private expenses: ExpenseRecord[];
  private audits: AuditLog[];

  constructor() {
    this.users = safeGet(KEYS.USERS, INITIAL_USERS);
    this.currentUser = safeGet(KEYS.CURRENT_USER, null);
    this.settings = safeGet(KEYS.SETTINGS, INITIAL_SETTINGS);
    this.items = safeGet(KEYS.ITEMS, INITIAL_ITEMS);
    this.batches = safeGet(KEYS.BATCHES, INITIAL_BATCHES);
    this.stockIns = safeGet(KEYS.STOCK_IN, INITIAL_STOCK_IN_RECORDS);
    this.requests = safeGet(KEYS.REQUESTS, INITIAL_REQUESTS);
    this.releases = safeGet(KEYS.RELEASES, INITIAL_RELEASES);
    this.patientUsages = safeGet(KEYS.PATIENT_USAGE, INITIAL_PATIENT_USAGE);
    this.adjustments = safeGet(KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS);
    this.billings = safeGet(KEYS.BILLING, INITIAL_BILLING_RECORDS);
    this.expenses = safeGet(KEYS.EXPENSES, []);
    this.audits = safeGet(KEYS.AUDIT, INITIAL_AUDIT_LOGS);

    // Apply theme on initial load
    this.applyTheme(this.settings.themeMode || 'light');
  }

    // --- CLOUD API: READ DATABASE DATA ---

  public async fetchApiItems(): Promise<MedicalItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
  throw new Error(result.message || 'Failed to load items');
}

return result.data.map((item: any): MedicalItem => ({
  ...item,
  conversionFactor: Number(item.conversionFactor),
  totalStock: Number(item.totalStock),
  minimumStock: Number(item.minimumStock),
  reorderLevel: Number(item.reorderLevel),
  unitCost: Number(item.unitCost),
  unitPrice: Number(item.unitPrice),
  lastUpdated: item.lastUpdated,
}));
    } catch (error) {
      console.error('Failed to fetch items from API:', error);
      return [];
    }
  }

  public async fetchApiBatches(): Promise<BatchLot[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/batches`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to load batches');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to fetch batches from API:', error);
      return [];
    }
  }

  public async fetchApiTransactions(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to load transactions');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to fetch transactions from API:', error);
      return [];
    }
  }
  
  // --- THEME ---
  public getTheme(): 'light' | 'dark' {
    return this.settings.themeMode || 'light';
  }

  public setTheme(mode: 'light' | 'dark'): void {
    this.settings.themeMode = mode;
    safeSet(KEYS.SETTINGS, this.settings);
    this.applyTheme(mode);
  }

  private applyTheme(mode: 'light' | 'dark'): void {
    if (typeof document !== 'undefined') {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  // --- AUDIT TRAIL ---
  public getAuditLogs(): AuditLog[] {
    return [...this.audits].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(
    actionType: AuditLog['actionType'],
    entityAffected: string,
    details: string,
    userOverride?: UserAccount
  ): void {
    const actor = userOverride || this.currentUser;
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: actor?.id || 'sys-anon',
      userName: actor?.fullName || 'Anonymous / Unknown',
      userRole: actor?.role || 'System',
      actionType,
      entityAffected,
      details,
      terminal: 'MEDFLOW-CLINICAL-WS',
      ipAddress: '192.168.10.25'
    };
    this.audits.unshift(newLog);
    if (this.audits.length > 500) this.audits = this.audits.slice(0, 500);
    safeSet(KEYS.AUDIT, this.audits);
  }

  // --- AUTHENTICATION & SECURITY ---
  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public login(username: string, password: string): { success: boolean; user?: UserAccount; error?: string } {
    const found = this.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) {
      this.addAuditLog('SECURITY_BLOCKED', 'Login Failure', `Invalid username attempted: '${username}'`);
      return { success: false, error: 'User account not found. Please verify your username.' };
    }
    if (found.password !== password) {
      this.addAuditLog('SECURITY_BLOCKED', 'Login Failure', `Incorrect password attempted for '${username}'`);
      return { success: false, error: 'Incorrect password. Access denied.' };
    }

    found.lastLogin = new Date().toISOString();
    safeSet(KEYS.USERS, this.users);

    this.currentUser = found;
    safeSet(KEYS.CURRENT_USER, found);
    this.addAuditLog('LOGIN', 'User Session', `User logged in successfully: ${found.fullName} (${found.role})`, found);
    return { success: true, user: found };
  }

  public logout(): void {
    if (this.currentUser) {
      this.addAuditLog('LOGOUT', 'User Session', `User logged out: ${this.currentUser.fullName}`);
    }
    this.currentUser = null;
    safeSet(KEYS.CURRENT_USER, null);
  }

  public hasPermission(permission: PermissionKey): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.isFullAccess) return true;
    return this.currentUser.permissions.includes(permission);
  }

  public assertPermission(permission: PermissionKey, actionDescription: string): void {
    if (!this.hasPermission(permission)) {
      this.addAuditLog(
        'SECURITY_BLOCKED',
        'Unauthorized Access Blocked',
        `User ${this.currentUser?.fullName || 'Unknown'} attempted unauthorized action: ${actionDescription} requiring '${permission}'`
      );
      throw new Error(`Unauthorized: You lack the '${permission}' permission required for ${actionDescription}.`);
    }
  }

  /**
   * Required Security Behavior:
   * Password verification prompt for sensitive, bulk, or release operations
   */
  public verifyCurrentPassword(password: string, transactionContext: string): { verified: boolean; error?: string } {
    if (!this.currentUser) {
      return { verified: false, error: 'No active session. Please log in.' };
    }

    if (this.currentUser.password !== password) {
      this.addAuditLog(
        'PASSWORD_VERIFY_FAILED',
        'Authorization Check',
        `Failed password verification for transaction: '${transactionContext}' by ${this.currentUser.fullName}`
      );
      return { verified: false, error: 'Incorrect password. Security verification failed.' };
    }

    this.addAuditLog(
      'PASSWORD_VERIFY_SUCCESS',
      'Authorization Check',
      `Authorized action: '${transactionContext}' confirmed by ${this.currentUser.fullName}`
    );
    return { verified: true };
  }

  // --- USER MANAGEMENT ---
  public getUsers(): UserAccount[] {
    return [...this.users];
  }

  public createUser(userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    this.assertPermission('manage_users', 'create user account');
    const existing = this.users.find(u => u.username.toLowerCase() === userData.username.trim().toLowerCase());
    if (existing) {
      throw new Error(`Username '${userData.username}' is already in use.`);
    }

    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    safeSet(KEYS.USERS, this.users);
    this.addAuditLog('USER_MANAGEMENT', `User: ${newUser.username}`, `Created new account for ${newUser.fullName} (${newUser.role})`);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount {
    this.assertPermission('manage_users', 'update user account');
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    // Prevent changing the username to a duplicate
    if (updates.username) {
      const dup = this.users.find(u => u.id !== id && u.username.toLowerCase() === updates.username?.trim().toLowerCase());
      if (dup) throw new Error(`Username '${updates.username}' is already taken.`);
    }

    const updated = { ...this.users[idx], ...updates };
    this.users[idx] = updated;
    safeSet(KEYS.USERS, this.users);

    // If current user was updated, refresh session
    if (this.currentUser?.id === id) {
      this.currentUser = updated;
      safeSet(KEYS.CURRENT_USER, updated);
    }

    this.addAuditLog('USER_MANAGEMENT', `User: ${updated.username}`, `Updated profile details for ${updated.fullName}`);
    return updated;
  }

  public deleteUser(id: string): void {
    this.assertPermission('manage_users', 'delete user account');
    const target = this.users.find(u => u.id === id);
    if (!target) throw new Error('User not found');

    if (target.isFullAccess) {
      const fullAccessCount = this.users.filter(u => u.isFullAccess).length;
      if (fullAccessCount <= 1) {
        throw new Error('Security safeguard: Cannot delete the last remaining Full Access administrator.');
      }
    }

    if (this.currentUser?.id === id) {
      throw new Error('Cannot delete your own currently logged in account.');
    }

    this.users = this.users.filter(u => u.id !== id);
    safeSet(KEYS.USERS, this.users);
    this.addAuditLog('USER_MANAGEMENT', `User: ${target.username}`, `Deleted user account: ${target.fullName} (${target.role})`);
  }

  public updateUserPermissions(userId: string, permissions: PermissionKey[]): void {
    this.assertPermission('manage_users', 'assign permissions');
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    user.permissions = permissions;
    safeSet(KEYS.USERS, this.users);

    if (this.currentUser?.id === userId) {
      this.currentUser.permissions = permissions;
      safeSet(KEYS.CURRENT_USER, this.currentUser);
    }

    this.addAuditLog('PERMISSION_CHANGE', `User: ${user.username}`, `Updated permissions matrix for ${user.fullName}`);
  }

  // --- MEDICAL ITEMS CATALOG ---
  public getItems(): MedicalItem[] {
    return [...this.items];
  }

  public getItemById(id: string): MedicalItem | undefined {
    return this.items.find(i => i.id === id);
  }

  public addItem(item: Omit<MedicalItem, 'id' | 'lastUpdated'>): MedicalItem {
    this.assertPermission('manage_inventory', 'add medical item');
    const existing = this.items.find(i => i.itemCode.toLowerCase() === item.itemCode.trim().toLowerCase());
    if (existing) throw new Error(`Item code '${item.itemCode}' already exists.`);

    const newItem: MedicalItem = {
      ...item,
      id: `item-${Date.now()}`,
      lastUpdated: CURRENT_SIMULATED_DATE
    };
    this.items.push(newItem);
    safeSet(KEYS.ITEMS, this.items);
    this.addAuditLog('ITEM_MUTATION', `Item: ${newItem.itemCode}`, `Created new medical formulary entry: ${newItem.name}`);
    return newItem;
  }

  public updateItem(id: string, updates: Partial<MedicalItem>): MedicalItem {
    this.assertPermission('manage_inventory', 'update medical item');
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Medical item not found');

    const updated = { ...this.items[idx], ...updates, lastUpdated: CURRENT_SIMULATED_DATE };
    this.items[idx] = updated;
    safeSet(KEYS.ITEMS, this.items);
    this.addAuditLog('ITEM_MUTATION', `Item: ${updated.itemCode}`, `Updated medical item: ${updated.name}`);
    return updated;
  }

  public deleteItem(id: string): void {
    this.assertPermission('manage_inventory', 'delete medical item');
    const item = this.items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');

    const hasBatches = this.batches.some(b => b.itemId === id && b.quantity > 0);
    if (hasBatches) {
      throw new Error(`Cannot delete '${item.name}' while it has active batch inventory with stock balance.`);
    }

    this.items = this.items.filter(i => i.id !== id);
    this.batches = this.batches.filter(b => b.itemId !== id);
    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    this.addAuditLog('ITEM_MUTATION', `Item: ${item.itemCode}`, `Deleted medical item: ${item.name}`);
  }

  // --- BATCH LOTS & FEFO ENGINE ---
  public getBatches(): BatchLot[] {
    return [...this.batches];
  }

  public getBatchesByItem(itemId: string): BatchLot[] {
    return this.batches.filter(b => b.itemId === itemId);
  }

  public isExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date(CURRENT_SIMULATED_DATE);
  }

  public isNearExpiry(expiryDate: string, days = 90): boolean {
    const exp = new Date(expiryDate).getTime();
    const now = new Date(CURRENT_SIMULATED_DATE).getTime();
    const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  }

  public getDaysToExpiry(expiryDate: string): number {
    const exp = new Date(expiryDate).getTime();
    const now = new Date(CURRENT_SIMULATED_DATE).getTime();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * FEFO (First Expired, First Out) Automatic Allocation Engine
   * Rule: "Pinakamalapit na expiry ang unang ilalabas."
   * Rule: "Hindi puwedeng ma-release ang expired items."
   */
  public calculateFEFOAllocations(itemId: string, quantityNeeded: number): {
    allocations: BatchAllocation[];
    shortfall: number;
    expiredBatchesFound: BatchLot[];
    canFulfill: boolean;
    error?: string;
  } {
    const itemBatches = this.batches.filter(b => b.itemId === itemId && b.quantity > 0);
    
    // Check expired batches
    const expiredBatches = itemBatches.filter(b => this.isExpired(b.expiryDate) || b.status === 'expired' || b.status === 'quarantine');
    const validBatches = itemBatches.filter(b => !this.isExpired(b.expiryDate) && b.status !== 'expired' && b.status !== 'quarantine');

    // FEFO Sort: Ascending by expiry date (earliest expiry first)
    validBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    const allocations: BatchAllocation[] = [];
    let remaining = quantityNeeded;

    for (const batch of validBatches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      allocations.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantityAllocated: take
      });
      remaining -= take;
    }

    const canFulfill = remaining === 0;
    return {
      allocations,
      shortfall: remaining,
      expiredBatchesFound: expiredBatches,
      canFulfill,
      error: remaining > 0 
        ? `Insufficient non-expired stock. Shortfall of ${remaining} units. (Expired stock in quarantine is blocked from release).`
        : undefined
    };
  }

  // --- STOCK IN / RECEIVING ---
  public getStockInRecords(): StockInRecord[] {
    return [...this.stockIns];
  }

  public receiveStock(recordData: Omit<StockInRecord, 'id'>): StockInRecord {
    this.assertPermission('stock_in', 'process stock receiving');
    
    const newRecord: StockInRecord = {
      ...recordData,
      id: `stin-${Date.now()}`
    };

    // Update item stock balances and create/update batch lots
    for (const inItem of newRecord.items) {
      const item = this.items.find(i => i.id === inItem.itemId);
      if (item) {
        item.totalStock += inItem.quantity;
        item.lastUpdated = CURRENT_SIMULATED_DATE;
      }

      const isExp = this.isExpired(inItem.expiryDate);
      const isNear = this.isNearExpiry(inItem.expiryDate);

      const newBatch: BatchLot = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: inItem.itemId,
        itemCode: inItem.itemCode,
        itemName: inItem.itemName,
        batchNumber: inItem.batchNumber,
        quantity: inItem.quantity,
        originalQuantity: inItem.quantity,
        manufacturingDate: inItem.manufacturingDate,
        expiryDate: inItem.expiryDate,
        supplierName: newRecord.supplierName,
        deliveryReceiptNumber: newRecord.drNumber,
        purchaseOrderNumber: newRecord.poNumber,
        unitCost: inItem.unitCost,
        unitPrice: (item?.unitPrice || inItem.unitCost * 1.5),
        locationShelf: inItem.shelf || item?.locationShelf || 'Central Pharmacy',
        status: isExp ? 'expired' : isNear ? 'expiring' : 'active'
      };
      this.batches.push(newBatch);
    }

    this.stockIns.unshift(newRecord);
    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.STOCK_IN, this.stockIns);

    // Record the actual stock purchase as an expense; no billing/payable balance is created.
    this.expenses.unshift({
      id: `exp-${newRecord.id}`,
      expenseNumber: `EXP-${newRecord.drNumber}`,
      category: 'Medical Supplies',
      description: `Inventory purchase (${newRecord.items.length} item lines)`,
      payee: newRecord.supplierName,
      amount: newRecord.totalCost,
      expenseDate: newRecord.receivedDate.slice(0, 10),
      referenceNumber: newRecord.drNumber,
      notes: `Stock received under PO #${newRecord.poNumber}`,
      recordedBy: newRecord.receivedBy,
      createdAt: new Date().toISOString()
    });
    safeSet(KEYS.EXPENSES, this.expenses);

    this.addAuditLog('STOCK_IN', `DR: ${newRecord.drNumber}`, `Received ${newRecord.items.length} items from ${newRecord.supplierName} (Total ₱${newRecord.totalCost.toLocaleString()})`);
    return newRecord;
  }

  // --- REQUISITION REQUESTS ---
  public getRequests(): RequisitionRequest[] {
    return [...this.requests];
  }

  public createRequest(data: Omit<RequisitionRequest, 'id' | 'requestNumber' | 'status' | 'requestDate'>): RequisitionRequest {
    this.assertPermission('create_request', 'submit ward requisition');
    const newReq: RequisitionRequest = {
      ...data,
      id: `req-${Date.now()}`,
      requestNumber: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      requestDate: new Date().toISOString(),
      status: 'Pending'
    };
    this.requests.unshift(newReq);
    safeSet(KEYS.REQUESTS, this.requests);
    this.addAuditLog('ITEM_MUTATION', `Req: ${newReq.requestNumber}`, `Ward ${newReq.requestingWard} submitted requisition for ${newReq.items.length} items (${newReq.urgency})`);
    return newReq;
  }

  public approveRequest(requestId: string, itemsApproved: { itemId: string; approvedQty: number }[]): void {
    this.assertPermission('approve_request', 'approve ward requisition');
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    for (const app of itemsApproved) {
      const itm = req.items.find(i => i.itemId === app.itemId);
      if (itm) itm.approvedQty = app.approvedQty;
    }

    req.status = 'Approved';
    req.approvedBy = this.currentUser?.fullName || 'Pharmacy Supervisor';
    req.approvedDate = new Date().toISOString();
    safeSet(KEYS.REQUESTS, this.requests);
    this.addAuditLog('ITEM_MUTATION', `Req: ${req.requestNumber}`, `Approved requisition for ${req.requestingWard}`);
  }

  public rejectRequest(requestId: string, reason: string): void {
    this.assertPermission('approve_request', 'reject ward requisition');
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = 'Rejected';
    req.rejectionReason = reason;
    safeSet(KEYS.REQUESTS, this.requests);
    this.addAuditLog('ITEM_MUTATION', `Req: ${req.requestNumber}`, `Rejected requisition: ${reason}`);
  }

  // --- FEFO RELEASE & AUTOMATIC DEDUCTION ---
  public getReleases(): StockRelease[] {
    return [...this.releases];
  }

  public dispatchRelease(releaseData: Omit<StockRelease, 'id' | 'releaseNumber' | 'status' | 'releaseDate'>): StockRelease {
    this.assertPermission('release_stock', 'dispatch stock under FEFO');

    // Strict validation: Verify no expired batch is in the allocation
    for (const itm of releaseData.items) {
      for (const alloc of itm.allocatedBatches) {
        const batch = this.batches.find(b => b.id === alloc.batchId);
        if (!batch) throw new Error(`Batch ID ${alloc.batchId} not found in inventory.`);
        if (this.isExpired(batch.expiryDate) || batch.status === 'expired' || batch.status === 'quarantine') {
          this.addAuditLog('SECURITY_BLOCKED', `Batch ${batch.batchNumber}`, `BLOCKED attempt to dispatch EXPIRED stock (Expiry: ${batch.expiryDate})`);
          throw new Error(`CRITICAL CLINICAL BLOCK: Batch ${batch.batchNumber} is expired (${batch.expiryDate}) and strictly forbidden from dispensing.`);
        }
        if (batch.quantity < alloc.quantityAllocated) {
          throw new Error(`Batch ${batch.batchNumber} has only ${batch.quantity} units, cannot release ${alloc.quantityAllocated}.`);
        }
      }
    }

    // Execute automatic stock deductions
    for (const itm of releaseData.items) {
      const medItem = this.items.find(i => i.id === itm.itemId);
      let itemTotalDeducted = 0;

      for (const alloc of itm.allocatedBatches) {
        const batch = this.batches.find(b => b.id === alloc.batchId)!;
        batch.quantity -= alloc.quantityAllocated;
        itemTotalDeducted += alloc.quantityAllocated;
      }

      if (medItem) {
        medItem.totalStock = Math.max(0, medItem.totalStock - itemTotalDeducted);
        medItem.lastUpdated = CURRENT_SIMULATED_DATE;
      }
    }

    const newRelease: StockRelease = {
      ...releaseData,
      id: `rel-${Date.now()}`,
      releaseNumber: `REL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      releaseDate: new Date().toISOString(),
      status: 'Completed'
    };

    // If linked to a requisition, mark as fulfilled
    if (releaseData.requestId) {
      const req = this.requests.find(r => r.id === releaseData.requestId);
      if (req) {
        req.status = 'Fulfilled';
        safeSet(KEYS.REQUESTS, this.requests);
      }
    }

    this.releases.unshift(newRelease);
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.RELEASES, this.releases);

    this.addAuditLog(
      'FEFO_RELEASE',
      `Release: ${newRelease.releaseNumber}`,
      `Dispatched stock to ${newRelease.requestingWard} received by ${newRelease.receivingStaff}. Batches deducted under FEFO order.`
    );

    return newRelease;
  }

  // --- PATIENT USAGE & BILLING GENERATION ---
  public getPatientUsages(): PatientUsageRecord[] {
    return [...this.patientUsages];
  }

  public recordPatientUsage(data: Omit<PatientUsageRecord, 'id' | 'recordNumber' | 'administeredDate'>): PatientUsageRecord {
    this.assertPermission('patient_usage', 'record patient medication usage');

    // Deduct stock for each medication administered
    for (const itm of data.items) {
      const batch = this.batches.find(b => b.itemId === itm.itemId && b.batchNumber === itm.batchNumber);
      if (batch) {
        batch.quantity = Math.max(0, batch.quantity - itm.quantity);
      }
      const item = this.items.find(i => i.id === itm.itemId);
      if (item) {
        item.totalStock = Math.max(0, item.totalStock - itm.quantity);
        item.lastUpdated = CURRENT_SIMULATED_DATE;
      }
    }

    const newRecord: PatientUsageRecord = {
      ...data,
      id: `pu-${Date.now()}`,
      recordNumber: `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      administeredDate: new Date().toISOString()
    };

    this.patientUsages.unshift(newRecord);
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.PATIENT_USAGE, this.patientUsages);

    // Patient consumption is tracked clinically; no patient billing charge is generated.

    this.addAuditLog('PATIENT_USAGE', `Patient: ${newRecord.patientName}`, `Recorded medication consumption for ${newRecord.patientName} (${newRecord.wardLocation}); no billing charge created.`);
    return newRecord;
  }

  // --- STOCK ADJUSTMENT ---
  public getAdjustments(): StockAdjustmentRecord[] {
    return [...this.adjustments];
  }

  public recordStockAdjustment(data: Omit<StockAdjustmentRecord, 'id' | 'adjustmentNumber' | 'adjustedDate' | 'previousStock' | 'newStock'>): StockAdjustmentRecord {
    this.assertPermission('stock_adjustment', 'record stock adjustment');
    const item = this.items.find(i => i.id === data.itemId);
    if (!item) throw new Error('Item not found');

    const previousStock = item.totalStock;
    const newStock = Math.max(0, previousStock + data.quantity);
    item.totalStock = newStock;
    item.lastUpdated = CURRENT_SIMULATED_DATE;

    if (data.batchNumber) {
      const batch = this.batches.find(b => b.itemId === data.itemId && b.batchNumber === data.batchNumber);
      if (batch) {
        batch.quantity = Math.max(0, batch.quantity + data.quantity);
        if (data.type === 'Expired Quarantine') {
          batch.status = 'quarantine';
          batch.locationShelf = 'Quarantine Cage Q-101 (Locked Expired/Damaged Stock)';
        }
      }
    }

    const newAdj: StockAdjustmentRecord = {
      ...data,
      id: `adj-${Date.now()}`,
      adjustmentNumber: `ADJ-2026-${Math.floor(100 + Math.random() * 900)}`,
      previousStock,
      newStock,
      adjustedDate: new Date().toISOString()
    };

    this.adjustments.unshift(newAdj);
    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.ADJUSTMENTS, this.adjustments);

    this.addAuditLog('STOCK_ADJUSTMENT', `Adj: ${newAdj.adjustmentNumber}`, `Stock adjustment (${newAdj.type}) for ${newAdj.itemName}: Qty ${newAdj.quantity > 0 ? '+' : ''}${newAdj.quantity}. Reason: ${newAdj.reason}`);
    return newAdj;
  }

  // --- BULK STOCK MANAGEMENT & UPDATES (10 FUNCTIONS) ---
  
  // 1. Bulk Stock In (multi-item delivery)
  public executeBulkStockIn(
    itemsToReceive: Array<{
      itemId: string;
      batchNumber: string;
      quantity: number;
      expiryDate: string;
      unitCost: number;
      shelf: string;
      supplier: string;
    }>
  ): void {
    this.assertPermission('bulk_stock_management', 'perform bulk stock in');
    
    let totalReceived = 0;
    for (const row of itemsToReceive) {
      if (row.quantity <= 0) continue;
      const item = this.items.find(i => i.id === row.itemId);
      if (!item) continue;

      item.totalStock += row.quantity;
      item.lastUpdated = CURRENT_SIMULATED_DATE;

      const isExp = this.isExpired(row.expiryDate);
      const isNear = this.isNearExpiry(row.expiryDate);

      const batch: BatchLot = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        batchNumber: row.batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
        quantity: row.quantity,
        originalQuantity: row.quantity,
        manufacturingDate: '2025-01-01',
        expiryDate: row.expiryDate,
        supplierName: row.supplier || 'Accredited Supplier',
        deliveryReceiptNumber: `DR-BULK-${Date.now().toString().slice(-4)}`,
        purchaseOrderNumber: 'PO-BULK-2026',
        unitCost: row.unitCost || item.unitCost,
        unitPrice: item.unitPrice,
        locationShelf: row.shelf || item.locationShelf,
        status: isExp ? 'expired' : isNear ? 'expiring' : 'active'
      };
      this.batches.push(batch);
      totalReceived += row.quantity;
    }

    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    this.addAuditLog('BULK_STOCK_IN', 'Bulk Stock In', `Processed bulk stock-in for ${itemsToReceive.length} items (Total ${totalReceived} units)`);
  }

  // 2. Bulk Stock Adjustment (increase/decrease across multiple items)
  public executeBulkAdjustment(
    adjustments: Array<{
      itemId: string;
      batchId?: string;
      changeQty: number;
      reason: string;
      type: StockAdjustmentRecord['type'];
    }>
  ): void {
    this.assertPermission('bulk_stock_management', 'perform bulk stock adjustment');

    for (const adj of adjustments) {
      const item = this.items.find(i => i.id === adj.itemId);
      if (!item) continue;

      const prev = item.totalStock;
      item.totalStock = Math.max(0, item.totalStock + adj.changeQty);
      item.lastUpdated = CURRENT_SIMULATED_DATE;

      if (adj.batchId) {
        const batch = this.batches.find(b => b.id === adj.batchId);
        if (batch) {
          batch.quantity = Math.max(0, batch.quantity + adj.changeQty);
          if (adj.type === 'Expired Quarantine') {
            batch.status = 'quarantine';
          }
        }
      }

      this.adjustments.unshift({
        id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        adjustmentNumber: `ADJ-BULK-${Math.floor(1000 + Math.random() * 9000)}`,
        type: adj.type,
        itemId: item.id,
        itemName: item.name,
        batchNumber: adj.batchId ? (this.batches.find(b => b.id === adj.batchId)?.batchNumber || '') : 'ALL BATCHES',
        quantity: adj.changeQty,
        previousStock: prev,
        newStock: item.totalStock,
        reason: adj.reason,
        adjustedBy: this.currentUser?.fullName || 'Bulk System',
        adjustedDate: new Date().toISOString()
      });
    }

    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.ADJUSTMENTS, this.adjustments);
    this.addAuditLog('BULK_ADJUSTMENT', 'Bulk Adjustment', `Executed bulk stock adjustment across ${adjustments.length} lines`);
  }

  // 3. Bulk Stock Transfer (between warehouses/locations)
  public executeBulkTransfer(
    transfers: Array<{
      batchId: string;
      toShelf: string;
    }>
  ): void {
    this.assertPermission('bulk_stock_management', 'perform bulk stock transfer');
    for (const t of transfers) {
      const batch = this.batches.find(b => b.id === t.batchId);
      if (batch) {
        const fromShelf = batch.locationShelf;
        batch.locationShelf = t.toShelf;
        this.addAuditLog('BULK_TRANSFER', `Batch: ${batch.batchNumber}`, `Transferred from [${fromShelf}] to [${t.toShelf}]`);
      }
    }
    safeSet(KEYS.BATCHES, this.batches);
  }

  // 4. Bulk Price Update (cost & selling price)
  public executeBulkPriceUpdate(
    updates: Array<{
      itemId: string;
      newCost?: number;
      newPrice?: number;
    }>
  ): void {
    this.assertPermission('bulk_stock_management', 'perform bulk price update');
    for (const u of updates) {
      const item = this.items.find(i => i.id === u.itemId);
      if (item) {
        if (u.newCost !== undefined) item.unitCost = u.newCost;
        if (u.newPrice !== undefined) item.unitPrice = u.newPrice;
        item.lastUpdated = CURRENT_SIMULATED_DATE;
      }
    }
    safeSet(KEYS.ITEMS, this.items);
    this.addAuditLog('BULK_PRICE_UPDATE', 'Pricing Matrix', `Bulk updated acquisition cost & retail price for ${updates.length} items`);
  }

  // 5. Bulk Batch Update (batch numbers, expiry dates, lot details)
  public executeBulkBatchUpdate(
    updates: Array<{
      batchId: string;
      newBatchNumber?: string;
      newExpiryDate?: string;
      newQuantity?: number;
      newShelf?: string;
    }>
  ): void {
    this.assertPermission('bulk_stock_management', 'perform bulk batch update');
    for (const u of updates) {
      const batch = this.batches.find(b => b.id === u.batchId);
      if (!batch) continue;

      if (u.newBatchNumber) batch.batchNumber = u.newBatchNumber;
      if (u.newShelf) batch.locationShelf = u.newShelf;
      if (u.newQuantity !== undefined) {
        const diff = u.newQuantity - batch.quantity;
        batch.quantity = Math.max(0, u.newQuantity);
        const item = this.items.find(i => i.id === batch.itemId);
        if (item) {
          item.totalStock = Math.max(0, item.totalStock + diff);
          item.lastUpdated = CURRENT_SIMULATED_DATE;
        }
      }
      if (u.newExpiryDate) {
        batch.expiryDate = u.newExpiryDate;
        batch.status = this.isExpired(u.newExpiryDate)
          ? 'expired'
          : this.isNearExpiry(u.newExpiryDate)
          ? 'expiring'
          : 'active';
      }
    }
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.ITEMS, this.items);
    this.addAuditLog('BULK_BATCH_UPDATE', 'Batch Management', `Modified batch details and expiry dates for ${updates.length} lots`);
  }

  // 6. Bulk Status Update (Active, Inactive, Hold)
  public executeBulkStatusUpdate(itemIds: string[], status: ItemStatus): void {
    this.assertPermission('bulk_stock_management', 'perform bulk status update');
    for (const id of itemIds) {
      const itm = this.items.find(i => i.id === id);
      if (itm) {
        itm.status = status;
        itm.lastUpdated = CURRENT_SIMULATED_DATE;
      }
    }
    safeSet(KEYS.ITEMS, this.items);
    this.addAuditLog('BULK_STATUS_UPDATE', 'Item Status', `Changed status to '${status}' for ${itemIds.length} items`);
  }

  // 7. Bulk Expiry Quarantine (identify & update near-expiry or expired batches)
  public executeBulkQuarantineExpired(): number {
    this.assertPermission('bulk_stock_management', 'execute bulk expiry quarantine');
    let count = 0;
    for (const batch of this.batches) {
      if (this.isExpired(batch.expiryDate) && batch.status !== 'quarantine') {
        batch.status = 'quarantine';
        batch.locationShelf = 'Quarantine Cage Q-101 (Locked Expired/Damaged Stock)';
        count++;
      }
    }
    safeSet(KEYS.BATCHES, this.batches);
    this.addAuditLog('BULK_BATCH_UPDATE', 'Quarantine Cage', `Locked and quarantined ${count} expired batches`);
    return count;
  }

  // 8. Bulk Import (CSV / Excel text parsing & insertion)
  public executeBulkImport(
    parsedRows: Array<{
      itemCode: string;
      name: string;
      genericName: string;
      category: string;
      form: string;
      primaryUnit: string;
      secondaryUnit?: string;
      conversionFactor?: number;
      batchNumber: string;
      quantity: number;
      expiryDate: string;
      unitCost: number;
      unitPrice: number;
      shelf: string;
    }>
  ): { itemsCreated: number; batchesCreated: number } {
    this.assertPermission('bulk_stock_management', 'perform bulk CSV import');
    let itemsCreated = 0;
    let batchesCreated = 0;

    for (const row of parsedRows) {
      let item = this.items.find(i => i.itemCode.toLowerCase() === row.itemCode.trim().toLowerCase());
      if (!item) {
        item = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          itemCode: row.itemCode.trim().toUpperCase(),
          name: row.name.trim(),
          genericName: row.genericName || row.name,
          category: row.category || 'General Medical',
          form: row.form || 'Unit',
          primaryUnit: row.primaryUnit || 'Piece',
          secondaryUnit: row.secondaryUnit || '',
          conversionFactor: row.conversionFactor || 1,
          totalStock: 0,
          minimumStock: 50,
          reorderLevel: 80,
          unitCost: Number(row.unitCost) || 0,
          unitPrice: Number(row.unitPrice) || Number(row.unitCost) * 1.5 || 0,
          locationShelf: row.shelf || 'Central Pharmacy',
          status: 'Active',
          lastUpdated: CURRENT_SIMULATED_DATE
        };
        this.items.push(item);
        itemsCreated++;
      }

      const qty = Number(row.quantity) || 0;
      item.totalStock += qty;

      const isExp = this.isExpired(row.expiryDate);
      const isNear = this.isNearExpiry(row.expiryDate);

      const batch: BatchLot = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        batchNumber: row.batchNumber || `LOT-IMP-${Date.now().toString().slice(-5)}`,
        quantity: qty,
        originalQuantity: qty,
        manufacturingDate: '2025-01-01',
        expiryDate: row.expiryDate,
        supplierName: 'Bulk CSV Importer',
        deliveryReceiptNumber: 'DR-IMPORT-CSV',
        purchaseOrderNumber: 'PO-IMPORT',
        unitCost: Number(row.unitCost) || item.unitCost,
        unitPrice: Number(row.unitPrice) || item.unitPrice,
        locationShelf: row.shelf || item.locationShelf,
        status: isExp ? 'expired' : isNear ? 'expiring' : 'active'
      };
      this.batches.push(batch);
      batchesCreated++;
    }

    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    this.addAuditLog('BULK_IMPORT', 'CSV Import', `Imported ${itemsCreated} new catalog items and ${batchesCreated} batch lots via spreadsheet grid`);
    return { itemsCreated, batchesCreated };
  }

  // 9. Bulk Delete / Archive
  public executeBulkDelete(itemIds: string[]): { deletedCount: number; blockedCount: number } {
    this.assertPermission('bulk_stock_management', 'perform bulk delete / archive');
    let deletedCount = 0;
    let blockedCount = 0;

    const toDeleteIds: string[] = [];

    for (const id of itemIds) {
      const hasActiveStock = this.batches.some(b => b.itemId === id && b.quantity > 0);
      if (hasActiveStock) {
        blockedCount++;
      } else {
        toDeleteIds.push(id);
        deletedCount++;
      }
    }

    if (toDeleteIds.length > 0) {
      this.items = this.items.filter(i => !toDeleteIds.includes(i.id));
      this.batches = this.batches.filter(b => !toDeleteIds.includes(b.itemId));
      safeSet(KEYS.ITEMS, this.items);
      safeSet(KEYS.BATCHES, this.batches);
      this.addAuditLog('BULK_DELETE', 'Catalog Archive', `Deleted/archived ${deletedCount} items. (${blockedCount} items preserved due to active batch stock)`);
    }

    return { deletedCount, blockedCount };
  }

  // --- FINANCE: EXPENSE MONITORING ---
  public getExpenseRecords(): ExpenseRecord[] {
    return [...this.expenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  }

  public addExpense(data: Omit<ExpenseRecord, 'id' | 'expenseNumber' | 'recordedBy' | 'createdAt'>): ExpenseRecord {
    this.assertPermission('billing_finance', 'record an expense');
    if (!data.description.trim()) throw new Error('Please enter an expense description.');
    if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('Expense amount must be greater than zero.');
    const record: ExpenseRecord = {
      ...data,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      expenseNumber: `EXP-${Date.now()}`,
      recordedBy: this.currentUser?.fullName || 'System',
      createdAt: new Date().toISOString()
    };
    this.expenses.unshift(record);
    safeSet(KEYS.EXPENSES, this.expenses);
    this.addAuditLog('ITEM_MUTATION', record.expenseNumber, `Recorded ${record.category} expense: ₱${record.amount.toLocaleString()}`);
    return record;
  }

  public getStockValuation(): {
    totalCostValuation: number;
    totalRetailValuation: number;
    byCategory: Record<string, { count: number; totalQty: number; costValue: number; retailValue: number }>;
  } {
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    const byCategory: Record<string, { count: number; totalQty: number; costValue: number; retailValue: number }> = {};

    for (const item of this.items) {
      const costVal = item.totalStock * item.unitCost;
      const retailVal = item.totalStock * item.unitPrice;

      totalCostValuation += costVal;
      totalRetailValuation += retailVal;

      if (!byCategory[item.category]) {
        byCategory[item.category] = { count: 0, totalQty: 0, costValue: 0, retailValue: 0 };
      }
      byCategory[item.category].count += 1;
      byCategory[item.category].totalQty += item.totalStock;
      byCategory[item.category].costValue += costVal;
      byCategory[item.category].retailValue += retailVal;
    }

    return { totalCostValuation, totalRetailValuation, byCategory };
  }

  // --- MASTER SETTINGS & LOGO ---
  public getSettings(): HospitalMasterSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<HospitalMasterSettings>): HospitalMasterSettings {
    this.assertPermission('manage_settings', 'modify facility settings');
    this.settings = { ...this.settings, ...updates };
    safeSet(KEYS.SETTINGS, this.settings);
    if (updates.themeMode) {
      this.applyTheme(updates.themeMode);
    }
    this.addAuditLog('SETTINGS_UPDATE', 'Hospital Settings', 'Updated system branding, locations, and facility master settings');
    return this.settings;
  }

  public uploadLogo(dataUrl: string): void {
    this.assertPermission('manage_settings', 'upload institution logo');
    this.settings.logoUrl = dataUrl;
    safeSet(KEYS.SETTINGS, this.settings);
    this.addAuditLog('SETTINGS_UPDATE', 'Hospital Logo', 'Uploaded custom institutional logo file');
  }

  public resetLogo(): void {
    this.assertPermission('manage_settings', 'reset logo');
    this.settings.logoUrl = '';
    safeSet(KEYS.SETTINGS, this.settings);
    this.addAuditLog('SETTINGS_UPDATE', 'Hospital Logo', 'Reset logo to default institutional seal');
  }

  // Locations / Options helpers
  public addRequestingWard(ward: string): void {
    if (!this.settings.requestingWards.includes(ward.trim())) {
      this.settings.requestingWards.push(ward.trim());
      this.updateSettings({ requestingWards: this.settings.requestingWards });
    }
  }

  public renameRequestingWard(oldName: string, newName: string): void {
    const idx = this.settings.requestingWards.indexOf(oldName);
    if (idx !== -1 && newName.trim()) {
      this.settings.requestingWards[idx] = newName.trim();
      // Propagate rename to requests and releases
      this.requests.forEach(r => {
        if (r.requestingWard === oldName) r.requestingWard = newName.trim();
      });
      this.releases.forEach(r => {
        if (r.requestingWard === oldName) r.requestingWard = newName.trim();
      });
      safeSet(KEYS.REQUESTS, this.requests);
      safeSet(KEYS.RELEASES, this.releases);
      this.updateSettings({ requestingWards: this.settings.requestingWards });
    }
  }

  public deleteRequestingWard(ward: string): void {
    this.settings.requestingWards = this.settings.requestingWards.filter(w => w !== ward);
    this.updateSettings({ requestingWards: this.settings.requestingWards });
  }

  public addPatientLocation(loc: string): void {
    if (!this.settings.patientLocations.includes(loc.trim())) {
      this.settings.patientLocations.push(loc.trim());
      this.updateSettings({ patientLocations: this.settings.patientLocations });
    }
  }

  public renamePatientLocation(oldLoc: string, newLoc: string): void {
    const idx = this.settings.patientLocations.indexOf(oldLoc);
    if (idx !== -1 && newLoc.trim()) {
      this.settings.patientLocations[idx] = newLoc.trim();
      this.patientUsages.forEach(p => {
        if (p.roomBed === oldLoc) p.roomBed = newLoc.trim();
      });
      safeSet(KEYS.PATIENT_USAGE, this.patientUsages);
      this.updateSettings({ patientLocations: this.settings.patientLocations });
    }
  }

  public deletePatientLocation(loc: string): void {
    this.settings.patientLocations = this.settings.patientLocations.filter(l => l !== loc);
    this.updateSettings({ patientLocations: this.settings.patientLocations });
  }

  public addStorageShelf(shelf: string): void {
    if (!this.settings.storageShelves.includes(shelf.trim())) {
      this.settings.storageShelves.push(shelf.trim());
      this.updateSettings({ storageShelves: this.settings.storageShelves });
    }
  }

  public renameStorageShelf(oldShelf: string, newShelf: string): void {
    const idx = this.settings.storageShelves.indexOf(oldShelf);
    if (idx !== -1 && newShelf.trim()) {
      this.settings.storageShelves[idx] = newShelf.trim();
      this.items.forEach(i => {
        if (i.locationShelf === oldShelf) i.locationShelf = newShelf.trim();
      });
      this.batches.forEach(b => {
        if (b.locationShelf === oldShelf) b.locationShelf = newShelf.trim();
      });
      safeSet(KEYS.ITEMS, this.items);
      safeSet(KEYS.BATCHES, this.batches);
      this.updateSettings({ storageShelves: this.settings.storageShelves });
    }
  }

  public deleteStorageShelf(shelf: string): void {
    this.settings.storageShelves = this.settings.storageShelves.filter(s => s !== shelf);
    this.updateSettings({ storageShelves: this.settings.storageShelves });
  }

  public addSupplier(supplier: string): void {
    if (!this.settings.accreditedSuppliers.includes(supplier.trim())) {
      this.settings.accreditedSuppliers.push(supplier.trim());
      this.updateSettings({ accreditedSuppliers: this.settings.accreditedSuppliers });
    }
  }

  public renameSupplier(oldSupp: string, newSupp: string): void {
    const idx = this.settings.accreditedSuppliers.indexOf(oldSupp);
    if (idx !== -1 && newSupp.trim()) {
      this.settings.accreditedSuppliers[idx] = newSupp.trim();
      this.updateSettings({ accreditedSuppliers: this.settings.accreditedSuppliers });
    }
  }

  public deleteSupplier(supplier: string): void {
    this.settings.accreditedSuppliers = this.settings.accreditedSuppliers.filter(s => s !== supplier);
    this.updateSettings({ accreditedSuppliers: this.settings.accreditedSuppliers });
  }

  // --- BACKUP & RESTORE ---
  public exportBackup(): string {
    this.assertPermission('backup_restore', 'export database backup');
    const backupObj = {
      system: 'MedFlow Hospital Inventory & FEFO Engine',
      exportedAt: new Date().toISOString(),
      exportedBy: this.currentUser?.fullName,
      data: {
        users: this.users,
        settings: this.settings,
        items: this.items,
        batches: this.batches,
        stockIns: this.stockIns,
        requests: this.requests,
        releases: this.releases,
        patientUsages: this.patientUsages,
        adjustments: this.adjustments,
        billings: this.billings,
        expenses: this.expenses,
        audits: this.audits
      }
    };
    this.addAuditLog('BACKUP_RESTORE', 'Database Snapshot', 'Exported complete database JSON archive');
    return JSON.stringify(backupObj, null, 2);
  }

  public importBackup(jsonString: string): void {
    this.assertPermission('backup_restore', 'restore database backup');
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !parsed.data.items || !parsed.data.batches) {
      throw new Error('Invalid backup schema. Required collections are missing.');
    }

    this.users = parsed.data.users || this.users;
    this.settings = parsed.data.settings || this.settings;
    this.items = parsed.data.items || [];
    this.batches = parsed.data.batches || [];
    this.stockIns = parsed.data.stockIns || [];
    this.requests = parsed.data.requests || [];
    this.releases = parsed.data.releases || [];
    this.patientUsages = parsed.data.patientUsages || [];
    this.adjustments = parsed.data.adjustments || [];
    this.billings = parsed.data.billings || this.billings;
    this.expenses = parsed.data.expenses || this.expenses;
    this.audits = parsed.data.audits || [];

    safeSet(KEYS.USERS, this.users);
    safeSet(KEYS.SETTINGS, this.settings);
    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.STOCK_IN, this.stockIns);
    safeSet(KEYS.REQUESTS, this.requests);
    safeSet(KEYS.RELEASES, this.releases);
    safeSet(KEYS.PATIENT_USAGE, this.patientUsages);
    safeSet(KEYS.ADJUSTMENTS, this.adjustments);
    safeSet(KEYS.BILLING, this.billings);
    safeSet(KEYS.EXPENSES, this.expenses);
    safeSet(KEYS.AUDIT, this.audits);

    this.addAuditLog('BACKUP_RESTORE', 'Database Restore', 'Successfully restored database snapshot from file');
  }

  public resetToDefaultData(): void {
    this.assertPermission('backup_restore', 'reset database to factory demo');
    this.users = [...INITIAL_USERS];
    this.settings = { ...INITIAL_SETTINGS };
    this.items = [...INITIAL_ITEMS];
    this.batches = [...INITIAL_BATCHES];
    this.stockIns = [...INITIAL_STOCK_IN_RECORDS];
    this.requests = [...INITIAL_REQUESTS];
    this.releases = [...INITIAL_RELEASES];
    this.patientUsages = [...INITIAL_PATIENT_USAGE];
    this.adjustments = [...INITIAL_ADJUSTMENTS];
    this.billings = [...INITIAL_BILLING_RECORDS];
    this.expenses = [];
    this.audits = [...INITIAL_AUDIT_LOGS];

    safeSet(KEYS.USERS, this.users);
    safeSet(KEYS.SETTINGS, this.settings);
    safeSet(KEYS.ITEMS, this.items);
    safeSet(KEYS.BATCHES, this.batches);
    safeSet(KEYS.STOCK_IN, this.stockIns);
    safeSet(KEYS.REQUESTS, this.requests);
    safeSet(KEYS.RELEASES, this.releases);
    safeSet(KEYS.PATIENT_USAGE, this.patientUsages);
    safeSet(KEYS.ADJUSTMENTS, this.adjustments);
    safeSet(KEYS.BILLING, this.billings);
    safeSet(KEYS.EXPENSES, this.expenses);
    safeSet(KEYS.AUDIT, this.audits);

    this.addAuditLog('BACKUP_RESTORE', 'System Reset', 'Reset database to October 2026 baseline demonstration data');
  }
}

export const inventoryService = new InventoryService();
