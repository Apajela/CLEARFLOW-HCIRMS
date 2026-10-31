/**
 * MedFlow Hospital Inventory & FEFO Pharmacy Management System
 * Core TypeScript Definitions
 */

export type RoleType = 
  | 'Medical Director' 
  | 'Chief Pharmacist' 
  | 'Head Nurse' 
  | 'Pharmacy Dispenser' 
  | 'Clinical Staff' 
  | 'Finance Officer';

export type PermissionKey =
  | 'view_dashboard'
  | 'view_inventory'
  | 'manage_inventory'
  | 'bulk_stock_management'
  | 'stock_in'
  | 'create_request'
  | 'approve_request'
  | 'release_stock'
  | 'patient_usage'
  | 'stock_adjustment'
  | 'billing_finance'
  | 'view_reports'
  | 'manage_users'
  | 'manage_settings'
  | 'audit_logs'
  | 'backup_restore';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Hashed/stored for verification
  fullName: string;
  email: string;
  role: RoleType;
  department: string;
  isFullAccess: boolean;
  permissions: PermissionKey[];
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export type ItemStatus = 'Active' | 'Inactive' | 'Hold';

export interface UnitConversion {
  packagingUnit: string;   // e.g., 'Box'
  baseUnit: string;        // e.g., 'Vials'
  multiplier: number;      // e.g., 1 Box = 10 Vials
}

export interface MedicalItem {
  id: string;
  itemCode: string;
  name: string;
  genericName: string;
  category: string;
  form: string;            // Vial, Tablet, Ampoule, Bottle, Infusion Bag, Strip, Box
  primaryUnit: string;     // Base dispensing unit: Vial, Tablet, Ampoule, etc.
  secondaryUnit?: string;  // Packaging unit: Box, Tray, Carton
  conversionFactor: number;// e.g., 10 (1 Box = 10 Vials)
  totalStock: number;      // In primary units
  minimumStock: number;    // Threshold for low-stock alert
  reorderLevel: number;
  unitCost: number;        // Purchase acquisition cost
  unitPrice: number;       // Patient billing price
  locationShelf: string;   // Shelf/bin location
  status: ItemStatus;
  lastUpdated: string;
}

export type BatchStatus = 'active' | 'expiring' | 'expired' | 'quarantine';

export interface BatchLot {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  originalQuantity: number;
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string;        // YYYY-MM-DD
  supplierName: string;
  deliveryReceiptNumber: string;
  purchaseOrderNumber: string;
  unitCost: number;
  unitPrice: number;
  locationShelf: string;
  status: BatchStatus;
}

export interface StockInItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  unitCost: number;
  subtotal: number;
  shelf: string;
}

export interface StockInRecord {
  id: string;
  drNumber: string;
  poNumber: string;
  supplierName: string;
  receivedBy: string;
  receivedDate: string;
  items: StockInItem[];
  totalCost: number;
  remarks: string;
}

export type RequestUrgency = 'Routine' | 'Urgent' | 'STAT Emergency';
export type RequestStatus = 'Pending' | 'Approved' | 'Partially Fulfilled' | 'Fulfilled' | 'Rejected';

export interface RequisitionItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  requestedQty: number;
  approvedQty?: number;
  dispensedQty?: number;
  unit: string;
  notes?: string;
}

export interface RequisitionRequest {
  id: string;
  requestNumber: string;
  requestingWard: string;
  requestedBy: string;
  requestDate: string;
  urgency: RequestUrgency;
  status: RequestStatus;
  items: RequisitionItem[];
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantityAllocated: number;
}

export interface ReleaseItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  allocatedBatches: BatchAllocation[];
  totalQty: number;
  unit: string;
}

export interface StockRelease {
  id: string;
  releaseNumber: string;
  requestId?: string;
  requestingWard: string;
  releasedBy: string;
  receivingStaff: string;
  releaseDate: string;
  items: ReleaseItem[];
  status: 'Completed';
  remarks?: string;
}

export interface PatientUsageItem {
  itemId: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface PatientUsageRecord {
  id: string;
  recordNumber: string;
  patientName: string;
  patientId: string;
  wardLocation: string;
  roomBed: string;
  attendingPhysician: string;
  diagnosis: string;
  administeredBy: string;
  administeredDate: string;
  items: PatientUsageItem[];
  totalBillAmount: number;
  billingStatus: 'Pending' | 'Billed' | 'Paid' | 'HMO Cleared';
}

export type AdjustmentType = 
  | 'Damage' 
  | 'Expired Quarantine' 
  | 'Return to Supplier' 
  | 'Ward Return' 
  | 'Discrepancy / Lost' 
  | 'Correction';

export interface StockAdjustmentRecord {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  itemId: string;
  itemName: string;
  batchNumber: string;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  adjustedBy: string;
  adjustedDate: string;
}

export interface BillingRecord {
  id: string;
  invoiceNumber: string;
  type: 'Patient Billing' | 'Supplier Payable';
  referenceNumber: string;
  entityName: string; // Patient Name or Supplier Name
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Billed' | 'Paid' | 'HMO Pending' | 'Overdue';
  createdDate: string;
  notes?: string;
}


export type ExpenseCategory =
  | 'Medical Supplies'
  | 'Medicines'
  | 'Utilities'
  | 'Equipment'
  | 'Maintenance'
  | 'Staff / Operations'
  | 'Other';

export interface ExpenseRecord {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  description: string;
  payee: string;
  amount: number;
  expenseDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'STOCK_IN'
  | 'FEFO_RELEASE'
  | 'STOCK_ADJUSTMENT'
  | 'PATIENT_USAGE'
  | 'ITEM_MUTATION'
  | 'BULK_STOCK_UPDATE'
  | 'BULK_STOCK_IN'
  | 'BULK_ADJUSTMENT'
  | 'BULK_TRANSFER'
  | 'BULK_PRICE_UPDATE'
  | 'BULK_BATCH_UPDATE'
  | 'BULK_STATUS_UPDATE'
  | 'BULK_DELETE'
  | 'BULK_IMPORT'
  | 'PERMISSION_CHANGE'
  | 'SECURITY_BLOCKED'
  | 'SETTINGS_UPDATE'
  | 'BACKUP_RESTORE'
  | 'USER_MANAGEMENT'
  | 'PASSWORD_VERIFY_SUCCESS'
  | 'PASSWORD_VERIFY_FAILED';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: AuditActionType;
  entityAffected: string;
  details: string;
  terminal: string;
  ipAddress: string;
}

export interface HospitalMasterSettings {
  hospitalName: string;
  subtitle: string;
  systemTitle: string;
  address: string;
  licenseNumber: string;
  contactNumber: string;
  email: string;
  logoUrl?: string;
  themeMode: 'light' | 'dark';
  requestingWards: string[];
  patientLocations: string[];
  storageShelves: string[];
  accreditedSuppliers: string[];
  pageTitles?: Record<string, string>;
  pageSubtitles?: Record<string, string>;
}

export interface MonthlyOverviewData {
  month: string;           // 'October 2026'
  beginningStock: number;  // 1,250
  stockReceived: number;   // 350
  stockReleased: number;   // 280
  endingStock: number;     // 1,320
  totalValuation: number;  // ₱ amount
}
