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
  AuditLog,
  HospitalMasterSettings,
  PermissionKey
} from '../types/inventory';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'view_dashboard',
  'view_inventory',
  'manage_inventory',
  'bulk_stock_management',
  'stock_in',
  'create_request',
  'approve_request',
  'release_stock',
  'patient_usage',
  'stock_adjustment',
  'billing_finance',
  'view_reports',
  'manage_users',
  'manage_settings',
  'audit_logs',
  'backup_restore'
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-001',
    username: 'admin.director',
    password: 'admin123',
    fullName: 'Dr. Arthur Vance, MD',
    email: 'a.vance@stjudemed.org',
    role: 'Medical Director',
    department: 'Hospital Administration',
    isFullAccess: true,
    permissions: [...ALL_PERMISSIONS],
    createdAt: '2026-01-10T08:00:00Z',
    lastLogin: '2026-10-29T19:30:00Z'
  },
  {
    id: 'usr-002',
    username: 'admin.pharmacist',
    password: 'pharma123',
    fullName: 'Teresa Mendoza, RPh',
    email: 't.mendoza@stjudemed.org',
    role: 'Chief Pharmacist',
    department: 'Central Clinical Pharmacy',
    isFullAccess: true,
    permissions: [...ALL_PERMISSIONS],
    createdAt: '2026-01-12T09:00:00Z',
    lastLogin: '2026-10-29T21:45:00Z'
  },
  {
    id: 'usr-003',
    username: 'nurse.elena',
    password: 'nurse123',
    fullName: 'Elena Santos, RN',
    email: 'e.santos@stjudemed.org',
    role: 'Head Nurse',
    department: 'Inpatient Ward 3B',
    isFullAccess: false,
    permissions: [
      'view_dashboard',
      'view_inventory',
      'create_request',
      'patient_usage',
      'view_reports'
    ],
    createdAt: '2026-02-01T10:15:00Z',
    lastLogin: '2026-10-29T18:10:00Z'
  },
  {
    id: 'usr-004',
    username: 'pharma.mark',
    password: 'mark123',
    fullName: 'Mark Rivera, RPhT',
    email: 'm.rivera@stjudemed.org',
    role: 'Pharmacy Dispenser',
    department: 'Central Clinical Pharmacy',
    isFullAccess: false,
    permissions: [
      'view_dashboard',
      'view_inventory',
      'stock_in',
      'release_stock',
      'patient_usage',
      'stock_adjustment',
      'bulk_stock_management'
    ],
    createdAt: '2026-02-15T11:20:00Z',
    lastLogin: '2026-10-29T20:00:00Z'
  }
];

export const INITIAL_SETTINGS: HospitalMasterSettings = {
  hospitalName: 'ST. JUDE MEDICAL CENTER & CLINICAL PHARMACY',
  subtitle: 'Tertiary Care & Inpatient FEFO Pharmacy Division',
  systemTitle: 'MedFlow Hospital Inventory',
  address: '1240 E. Rodriguez Sr. Ave, Medical District, QC',
  licenseNumber: 'DOH-HOSP-LIC-2026-9041B',
  contactNumber: '(02) 8876-4300 / Loc. 402 Pharmacy',
  email: 'pharmacy.central@stjudemed.org',
  themeMode: 'light',
  logoUrl: '', // Will default to institutional SVG seal if empty
  requestingWards: [
    'Emergency Department (ED / ER)',
    'Inpatient Ward 3B (Medical-Surgical)',
    'Intensive Care Unit (ICU)',
    'Neonatal Intensive Care Unit (NICU)',
    'Operating Room / Post-Anesthesia Care (OR / PACU)',
    'Pediatrics Ward 2A',
    'Hemodialysis & Renal Care Unit',
    'Outpatient Pharmacy Dispensing'
  ],
  patientLocations: [
    'Ward 3B - Bed 301',
    'Ward 3B - Bed 305',
    'Ward 3B - Bed 308',
    'ICU - Bed 02',
    'ICU - Bed 04',
    'ER - Trauma Bay 1',
    'ER - Observation Bay 4',
    'OR - Suite 3'
  ],
  storageShelves: [
    'Central Pharmacy - Shelf A1 (Antibiotics)',
    'Central Pharmacy - Shelf A2 (Injectables & Vials)',
    'Central Pharmacy - Shelf B1 (Analgesics & Pain)',
    'Central Pharmacy - Shelf C1 (Cardiovascular & STAT)',
    'Cold Room Refrigerator R1 (2°C-8°C Vaccines & Biologicals)',
    'Quarantine Cage Q-101 (Locked Expired/Damaged Stock)',
    'Surgical Supply Bay S-04'
  ],
  accreditedSuppliers: [
    'Unilab Biomedis Healthcare Inc.',
    'Zuellig Pharma Corp.',
    'Metro Drug Distribution Services',
    'GlaxoSmithKline Philippines',
    'Pfizer Bio-Therapeutics Inc.',
    'Fresenius Kabi Phils.'
  ]
};

export const INITIAL_ITEMS: MedicalItem[] = [
  {
    id: 'item-001',
    itemCode: 'MED-CTX-1G',
    name: 'Ceftriaxone Sodium 1g Powder for Injection',
    genericName: 'Ceftriaxone Sodium',
    category: 'Antibiotics & Anti-Infectives',
    form: 'Vial',
    primaryUnit: 'Vial',
    secondaryUnit: 'Box',
    conversionFactor: 10, // 1 Box = 10 Vials
    totalStock: 340,
    minimumStock: 80,
    reorderLevel: 120,
    unitCost: 145.00,
    unitPrice: 285.00,
    locationShelf: 'Central Pharmacy - Shelf A1 (Antibiotics)',
    status: 'Active',
    lastUpdated: '2026-10-29'
  },
  {
    id: 'item-002',
    itemCode: 'MED-PCM-100',
    name: 'Paracetamol 10mg/mL (100mL) IV Infusion Bag',
    genericName: 'Paracetamol IV',
    category: 'Analgesics & Antipyretics',
    form: 'Infusion Bag',
    primaryUnit: 'Bag',
    secondaryUnit: 'Carton',
    conversionFactor: 24, // 1 Carton = 24 Bags
    totalStock: 210,
    minimumStock: 60,
    reorderLevel: 100,
    unitCost: 85.50,
    unitPrice: 190.00,
    locationShelf: 'Central Pharmacy - Shelf B1 (Analgesics & Pain)',
    status: 'Active',
    lastUpdated: '2026-10-29'
  },
  {
    id: 'item-003',
    itemCode: 'MED-EPI-1MG',
    name: 'Epinephrine 1mg/mL Ampoule (Adrenaline STAT)',
    genericName: 'Epinephrine',
    category: 'Emergency & Critical Care',
    form: 'Ampoule',
    primaryUnit: 'Ampoule',
    secondaryUnit: 'Box',
    conversionFactor: 10,
    totalStock: 180,
    minimumStock: 50,
    reorderLevel: 80,
    unitCost: 55.00,
    unitPrice: 140.00,
    locationShelf: 'Central Pharmacy - Shelf C1 (Cardiovascular & STAT)',
    status: 'Active',
    lastUpdated: '2026-10-29'
  },
  {
    id: 'item-004',
    itemCode: 'MED-MER-1G',
    name: 'Meropenem 1g Powder for Injection',
    genericName: 'Meropenem Trihydrate',
    category: 'Antibiotics & Anti-Infectives',
    form: 'Vial',
    primaryUnit: 'Vial',
    secondaryUnit: 'Box',
    conversionFactor: 10,
    totalStock: 190,
    minimumStock: 40,
    reorderLevel: 70,
    unitCost: 680.00,
    unitPrice: 1150.00,
    locationShelf: 'Central Pharmacy - Shelf A1 (Antibiotics)',
    status: 'Active',
    lastUpdated: '2026-10-29'
  },
  {
    id: 'item-005',
    itemCode: 'MED-NS-1L',
    name: '0.9% Sodium Chloride (Normal Saline) 1000mL',
    genericName: 'Normal Saline Solution (0.9% NaCl)',
    category: 'Intravenous Fluids & Electrolytes',
    form: 'Infusion Bag',
    primaryUnit: 'Bottle',
    secondaryUnit: 'Case',
    conversionFactor: 12,
    totalStock: 280,
    minimumStock: 90,
    reorderLevel: 150,
    unitCost: 42.00,
    unitPrice: 95.00,
    locationShelf: 'Central Pharmacy - Shelf A2 (Injectables & Vials)',
    status: 'Active',
    lastUpdated: '2026-10-29'
  },
  {
    id: 'item-006',
    itemCode: 'MED-INS-REG',
    name: 'Regular Human Insulin 100 IU/mL 10mL Vial',
    genericName: 'Regular Insulin (Recombinant DNA)',
    category: 'Endocrine & Metabolic Care',
    form: 'Vial',
    primaryUnit: 'Vial',
    secondaryUnit: 'Box',
    conversionFactor: 5,
    totalStock: 120,
    minimumStock: 30,
    reorderLevel: 50,
    unitCost: 380.00,
    unitPrice: 650.00,
    locationShelf: 'Cold Room Refrigerator R1 (2°C-8°C Vaccines & Biologicals)',
    status: 'Active',
    lastUpdated: '2026-10-29'
  }
];

export const INITIAL_BATCHES: BatchLot[] = [
  // Ceftriaxone (Total stock = 340)
  // Batch 1: Expired (Blocked by FEFO quarantine)
  {
    id: 'batch-001',
    itemId: 'item-001',
    itemCode: 'MED-CTX-1G',
    itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
    batchNumber: 'LOT-2025-08X',
    quantity: 40,
    originalQuantity: 100,
    manufacturingDate: '2024-08-15',
    expiryDate: '2026-08-15', // EXPIRED! Must be blocked
    supplierName: 'Zuellig Pharma Corp.',
    deliveryReceiptNumber: 'DR-88902',
    purchaseOrderNumber: 'PO-2024-110',
    unitCost: 140.00,
    unitPrice: 285.00,
    locationShelf: 'Quarantine Cage Q-101 (Locked Expired/Damaged Stock)',
    status: 'expired'
  },
  // Batch 2: Near Expiry (First out in FEFO!)
  {
    id: 'batch-002',
    itemId: 'item-001',
    itemCode: 'MED-CTX-1G',
    itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
    batchNumber: 'LOT-2026-11A',
    quantity: 80,
    originalQuantity: 120,
    manufacturingDate: '2024-11-15',
    expiryDate: '2026-11-15', // Near expiry (FEFO Priority 1)
    supplierName: 'Zuellig Pharma Corp.',
    deliveryReceiptNumber: 'DR-90214',
    purchaseOrderNumber: 'PO-2025-004',
    unitCost: 145.00,
    unitPrice: 285.00,
    locationShelf: 'Central Pharmacy - Shelf A1 (Antibiotics)',
    status: 'expiring'
  },
  // Batch 3: Next in FEFO line
  {
    id: 'batch-003',
    itemId: 'item-001',
    itemCode: 'MED-CTX-1G',
    itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
    batchNumber: 'LOT-2027-04B',
    quantity: 120,
    originalQuantity: 150,
    manufacturingDate: '2025-04-10',
    expiryDate: '2027-04-10',
    supplierName: 'Unilab Biomedis Healthcare Inc.',
    deliveryReceiptNumber: 'DR-94301',
    purchaseOrderNumber: 'PO-2025-089',
    unitCost: 145.00,
    unitPrice: 285.00,
    locationShelf: 'Central Pharmacy - Shelf A1 (Antibiotics)',
    status: 'active'
  },
  // Batch 4: Long-term
  {
    id: 'batch-004',
    itemId: 'item-001',
    itemCode: 'MED-CTX-1G',
    itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
    batchNumber: 'LOT-2027-10C',
    quantity: 100,
    originalQuantity: 100,
    manufacturingDate: '2025-10-01',
    expiryDate: '2027-10-01',
    supplierName: 'Unilab Biomedis Healthcare Inc.',
    deliveryReceiptNumber: 'DR-99201',
    purchaseOrderNumber: 'PO-2026-033',
    unitCost: 145.00,
    unitPrice: 285.00,
    locationShelf: 'Central Pharmacy - Shelf A1 (Antibiotics)',
    status: 'active'
  },

  // Paracetamol IV (Total stock = 210)
  {
    id: 'batch-005',
    itemId: 'item-002',
    itemCode: 'MED-PCM-100',
    itemName: 'Paracetamol 10mg/mL (100mL) IV Infusion Bag',
    batchNumber: 'LOT-PCM-2612',
    quantity: 90,
    originalQuantity: 120,
    manufacturingDate: '2024-12-01',
    expiryDate: '2026-12-20', // Near expiry
    supplierName: 'Metro Drug Distribution Services',
    deliveryReceiptNumber: 'DR-91040',
    purchaseOrderNumber: 'PO-2025-012',
    unitCost: 85.50,
    unitPrice: 190.00,
    locationShelf: 'Central Pharmacy - Shelf B1 (Analgesics & Pain)',
    status: 'expiring'
  },
  {
    id: 'batch-006',
    itemId: 'item-002',
    itemCode: 'MED-PCM-100',
    itemName: 'Paracetamol 10mg/mL (100mL) IV Infusion Bag',
    batchNumber: 'LOT-PCM-2708',
    quantity: 120,
    originalQuantity: 150,
    manufacturingDate: '2025-08-10',
    expiryDate: '2027-08-10',
    supplierName: 'Metro Drug Distribution Services',
    deliveryReceiptNumber: 'DR-98122',
    purchaseOrderNumber: 'PO-2026-015',
    unitCost: 85.50,
    unitPrice: 190.00,
    locationShelf: 'Central Pharmacy - Shelf B1 (Analgesics & Pain)',
    status: 'active'
  },

  // Epinephrine (Total stock = 180)
  {
    id: 'batch-007',
    itemId: 'item-003',
    itemCode: 'MED-EPI-1MG',
    itemName: 'Epinephrine 1mg/mL Ampoule (Adrenaline STAT)',
    batchNumber: 'LOT-EPI-2703',
    quantity: 80,
    originalQuantity: 100,
    manufacturingDate: '2025-03-01',
    expiryDate: '2027-03-01',
    supplierName: 'Pfizer Bio-Therapeutics Inc.',
    deliveryReceiptNumber: 'DR-95410',
    purchaseOrderNumber: 'PO-2025-067',
    unitCost: 55.00,
    unitPrice: 140.00,
    locationShelf: 'Central Pharmacy - Shelf C1 (Cardiovascular & STAT)',
    status: 'active'
  },
  {
    id: 'batch-008',
    itemId: 'item-003',
    itemCode: 'MED-EPI-1MG',
    itemName: 'Epinephrine 1mg/mL Ampoule (Adrenaline STAT)',
    batchNumber: 'LOT-EPI-2711',
    quantity: 100,
    originalQuantity: 100,
    manufacturingDate: '2025-11-01',
    expiryDate: '2027-11-01',
    supplierName: 'Pfizer Bio-Therapeutics Inc.',
    deliveryReceiptNumber: 'DR-99820',
    purchaseOrderNumber: 'PO-2026-041',
    unitCost: 55.00,
    unitPrice: 140.00,
    locationShelf: 'Central Pharmacy - Shelf C1 (Cardiovascular & STAT)',
    status: 'active'
  },

  // Meropenem 1g (Total stock = 190)
  {
    id: 'batch-009',
    itemId: 'item-004',
    itemCode: 'MED-MER-1G',
    itemName: 'Meropenem 1g Powder for Injection',
    batchNumber: 'LOT-MER-2706',
    quantity: 190,
    originalQuantity: 200,
    manufacturingDate: '2025-06-15',
    expiryDate: '2027-06-15',
    supplierName: 'Zuellig Pharma Corp.',
    deliveryReceiptNumber: 'DR-97400',
    purchaseOrderNumber: 'PO-2026-002',
    unitCost: 680.00,
    unitPrice: 1150.00,
    locationShelf: 'Central Pharmacy - Shelf A1 (Antibiotics)',
    status: 'active'
  },

  // Normal Saline 1000mL (Total stock = 280)
  {
    id: 'batch-010',
    itemId: 'item-005',
    itemCode: 'MED-NS-1L',
    itemName: '0.9% Sodium Chloride (Normal Saline) 1000mL',
    batchNumber: 'LOT-NS-2705',
    quantity: 280,
    originalQuantity: 300,
    manufacturingDate: '2025-05-12',
    expiryDate: '2027-05-12',
    supplierName: 'Fresenius Kabi Phils.',
    deliveryReceiptNumber: 'DR-96800',
    purchaseOrderNumber: 'PO-2025-095',
    unitCost: 42.00,
    unitPrice: 95.00,
    locationShelf: 'Central Pharmacy - Shelf A2 (Injectables & Vials)',
    status: 'active'
  },

  // Insulin Regular (Total stock = 120)
  {
    id: 'batch-011',
    itemId: 'item-006',
    itemCode: 'MED-INS-REG',
    itemName: 'Regular Human Insulin 100 IU/mL 10mL Vial',
    batchNumber: 'LOT-INS-2701',
    quantity: 120,
    originalQuantity: 150,
    manufacturingDate: '2025-01-20',
    expiryDate: '2027-01-20',
    supplierName: 'GlaxoSmithKline Philippines',
    deliveryReceiptNumber: 'DR-94110',
    purchaseOrderNumber: 'PO-2025-045',
    unitCost: 380.00,
    unitPrice: 650.00,
    locationShelf: 'Cold Room Refrigerator R1 (2°C-8°C Vaccines & Biologicals)',
    status: 'active'
  }
];

export const INITIAL_STOCK_IN_RECORDS: StockInRecord[] = [
  {
    id: 'stin-2026-10-01',
    drNumber: 'DR-2026-99201',
    poNumber: 'PO-2026-033',
    supplierName: 'Unilab Biomedis Healthcare Inc.',
    receivedBy: 'Mark Rivera, RPhT',
    receivedDate: '2026-10-08T09:15:00Z',
    items: [
      {
        itemId: 'item-001',
        itemCode: 'MED-CTX-1G',
        itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
        batchNumber: 'LOT-2027-10C',
        manufacturingDate: '2025-10-01',
        expiryDate: '2027-10-01',
        quantity: 100,
        unit: 'Vial',
        unitCost: 145.00,
        subtotal: 14500.00,
        shelf: 'Central Pharmacy - Shelf A1 (Antibiotics)'
      }
    ],
    totalCost: 14500.00,
    remarks: 'Routine restocking delivery received in good condition with cold-chain verified.'
  },
  {
    id: 'stin-2026-10-02',
    drNumber: 'DR-2026-99820',
    poNumber: 'PO-2026-041',
    supplierName: 'Pfizer Bio-Therapeutics Inc.',
    receivedBy: 'Teresa Mendoza, RPh',
    receivedDate: '2026-10-15T14:30:00Z',
    items: [
      {
        itemId: 'item-003',
        itemCode: 'MED-EPI-1MG',
        itemName: 'Epinephrine 1mg/mL Ampoule (Adrenaline STAT)',
        batchNumber: 'LOT-EPI-2711',
        manufacturingDate: '2025-11-01',
        expiryDate: '2027-11-01',
        quantity: 100,
        unit: 'Ampoule',
        unitCost: 55.00,
        subtotal: 5500.00,
        shelf: 'Central Pharmacy - Shelf C1 (Cardiovascular & STAT)'
      },
      {
        itemId: 'item-002',
        itemCode: 'MED-PCM-100',
        itemName: 'Paracetamol 10mg/mL (100mL) IV Infusion Bag',
        batchNumber: 'LOT-PCM-2708',
        manufacturingDate: '2025-08-10',
        expiryDate: '2027-08-10',
        quantity: 150,
        unit: 'Bag',
        unitCost: 85.50,
        subtotal: 12825.00,
        shelf: 'Central Pharmacy - Shelf B1 (Analgesics & Pain)'
      }
    ],
    totalCost: 18325.00,
    remarks: 'Emergency reserve stock replenishment; certificates of analysis attached.'
  }
];

export const INITIAL_REQUESTS: RequisitionRequest[] = [
  {
    id: 'req-001',
    requestNumber: 'REQ-2026-1048',
    requestingWard: 'Emergency Department (ED / ER)',
    requestedBy: 'Dr. Roberto Cruz, MD',
    requestDate: '2026-10-29T19:00:00Z',
    urgency: 'STAT Emergency',
    status: 'Approved',
    items: [
      {
        itemId: 'item-003',
        itemCode: 'MED-EPI-1MG',
        itemName: 'Epinephrine 1mg/mL Ampoule (Adrenaline STAT)',
        requestedQty: 15,
        approvedQty: 15,
        unit: 'Ampoule',
        notes: 'Crash cart replenishment following resuscitations'
      },
      {
        itemId: 'item-001',
        itemCode: 'MED-CTX-1G',
        itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
        requestedQty: 20,
        approvedQty: 20,
        unit: 'Vial',
        notes: 'Severe sepsis protocol in Observation'
      }
    ],
    approvedBy: 'Teresa Mendoza, RPh',
    approvedDate: '2026-10-29T19:15:00Z',
    notes: 'Urgent priority dispatch authorized for ER crash carts'
  },
  {
    id: 'req-002',
    requestNumber: 'REQ-2026-1049',
    requestingWard: 'Inpatient Ward 3B (Medical-Surgical)',
    requestedBy: 'Elena Santos, RN',
    requestDate: '2026-10-29T20:20:00Z',
    urgency: 'Routine',
    status: 'Pending',
    items: [
      {
        itemId: 'item-002',
        itemCode: 'MED-PCM-100',
        itemName: 'Paracetamol 10mg/mL (100mL) IV Infusion Bag',
        requestedQty: 30,
        unit: 'Bag',
        notes: 'Post-op analgesia rounds night shift'
      },
      {
        itemId: 'item-005',
        itemCode: 'MED-NS-1L',
        itemName: '0.9% Sodium Chloride (Normal Saline) 1000mL',
        requestedQty: 25,
        unit: 'Bottle',
        notes: 'Standard hydration replacement'
      }
    ],
    notes: 'Shift morning replenishment'
  }
];

export const INITIAL_RELEASES: StockRelease[] = [
  {
    id: 'rel-2026-001',
    releaseNumber: 'REL-2026-1022',
    requestId: 'req-000',
    requestingWard: 'Intensive Care Unit (ICU)',
    releasedBy: 'Mark Rivera, RPhT',
    receivingStaff: 'Carla Gomez, RN',
    releaseDate: '2026-10-24T10:30:00Z',
    items: [
      {
        itemId: 'item-001',
        itemCode: 'MED-CTX-1G',
        itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
        allocatedBatches: [
          {
            batchId: 'batch-002',
            batchNumber: 'LOT-2026-11A',
            expiryDate: '2026-11-15',
            quantityAllocated: 20
          }
        ],
        totalQty: 20,
        unit: 'Vial'
      }
    ],
    status: 'Completed',
    remarks: 'Dispatched under FEFO principle - earliest expiring batch allocated'
  }
];

export const INITIAL_PATIENT_USAGE: PatientUsageRecord[] = [
  {
    id: 'pu-001',
    recordNumber: 'PUR-2026-0914',
    patientName: 'Vicente Dela Cruz',
    patientId: 'PAT-2026-8841',
    wardLocation: 'Inpatient Ward 3B (Medical-Surgical)',
    roomBed: 'Ward 3B - Bed 305',
    attendingPhysician: 'Dr. Arthur Vance, MD',
    diagnosis: 'Community-Acquired Pneumonia (Moderate)',
    administeredBy: 'Elena Santos, RN',
    administeredDate: '2026-10-29T16:00:00Z',
    items: [
      {
        itemId: 'item-001',
        itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
        batchNumber: 'LOT-2026-11A',
        quantity: 2,
        unit: 'Vial',
        unitPrice: 285.00,
        totalAmount: 570.00
      },
      {
        itemId: 'item-005',
        itemName: '0.9% Sodium Chloride (Normal Saline) 1000mL',
        batchNumber: 'LOT-NS-2705',
        quantity: 1,
        unit: 'Bottle',
        unitPrice: 95.00,
        totalAmount: 95.00
      }
    ],
    totalBillAmount: 665.00,
    billingStatus: 'Billed'
  },
  {
    id: 'pu-002',
    recordNumber: 'PUR-2026-0915',
    patientName: 'Maria Clara Ramos',
    patientId: 'PAT-2026-8849',
    wardLocation: 'Inpatient Ward 3B (Medical-Surgical)',
    roomBed: 'Ward 3B - Bed 301',
    attendingPhysician: 'Dr. Arthur Vance, MD',
    diagnosis: 'Acute Appendicitis Post-Laparotomy',
    administeredBy: 'Elena Santos, RN',
    administeredDate: '2026-10-29T18:30:00Z',
    items: [
      {
        itemId: 'item-002',
        itemName: 'Paracetamol 10mg/mL (100mL) IV Infusion Bag',
        batchNumber: 'LOT-PCM-2612',
        quantity: 1,
        unit: 'Bag',
        unitPrice: 190.00,
        totalAmount: 190.00
      }
    ],
    totalBillAmount: 190.00,
    billingStatus: 'Pending'
  }
];

export const INITIAL_ADJUSTMENTS: StockAdjustmentRecord[] = [
  {
    id: 'adj-001',
    adjustmentNumber: 'ADJ-2026-088',
    type: 'Expired Quarantine',
    itemId: 'item-001',
    itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
    batchNumber: 'LOT-2025-08X',
    quantity: -40,
    previousStock: 380,
    newStock: 340,
    reason: 'Routine quarterly expiry audit - transferred to locked quarantine cage Q-101 pending destruction.',
    adjustedBy: 'Teresa Mendoza, RPh',
    adjustedDate: '2026-10-18T11:00:00Z'
  },
  {
    id: 'adj-002',
    adjustmentNumber: 'ADJ-2026-089',
    type: 'Damage',
    itemId: 'item-005',
    itemName: '0.9% Sodium Chloride (Normal Saline) 1000mL',
    batchNumber: 'LOT-NS-2705',
    quantity: -2,
    previousStock: 282,
    newStock: 280,
    reason: 'Bottle seal puncture during trolley transit in Ward 3B hallway.',
    adjustedBy: 'Mark Rivera, RPhT',
    adjustedDate: '2026-10-22T14:40:00Z'
  }
];

export const INITIAL_BILLING_RECORDS: BillingRecord[] = [
  {
    id: 'bill-001',
    invoiceNumber: 'INV-PAT-2026-101',
    type: 'Patient Billing',
    referenceNumber: 'PUR-2026-0914',
    entityName: 'Vicente Dela Cruz (Inpatient)',
    amount: 665.00,
    dueDate: '2026-11-05',
    status: 'Billed',
    createdDate: '2026-10-29',
    notes: 'Charges posted to hospital folio #FOL-8841'
  },
  {
    id: 'bill-002',
    invoiceNumber: 'AP-SUP-2026-440',
    type: 'Supplier Payable',
    referenceNumber: 'DR-2026-99201',
    entityName: 'Unilab Biomedis Healthcare Inc.',
    amount: 14500.00,
    dueDate: '2026-11-20',
    status: 'Pending',
    createdDate: '2026-10-08',
    notes: 'Net 30 payment terms for batch LOT-2027-10C'
  },
  {
    id: 'bill-003',
    invoiceNumber: 'AP-SUP-2026-441',
    type: 'Supplier Payable',
    referenceNumber: 'DR-2026-99820',
    entityName: 'Pfizer Bio-Therapeutics Inc.',
    amount: 18325.00,
    dueDate: '2026-11-15',
    status: 'Paid',
    createdDate: '2026-10-15',
    notes: 'Paid via Hospital Treasury Bank Transfer #TRF-9024'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-29T19:30:00Z',
    userId: 'usr-001',
    userName: 'Dr. Arthur Vance, MD',
    userRole: 'Medical Director',
    actionType: 'LOGIN',
    entityAffected: 'Session Auth',
    details: 'Administrator logged in from Terminal DIR-CON-01',
    terminal: 'DIR-CON-01',
    ipAddress: '192.168.10.42'
  },
  {
    id: 'log-002',
    timestamp: '2026-10-29T19:15:00Z',
    userId: 'usr-002',
    userName: 'Teresa Mendoza, RPh',
    userRole: 'Chief Pharmacist',
    actionType: 'PERMISSION_CHANGE',
    entityAffected: 'Staff Permissions',
    details: 'Configured permissions for Pharmacy Dispenser Mark Rivera',
    terminal: 'PHARM-SRV-02',
    ipAddress: '192.168.20.15'
  },
  {
    id: 'log-003',
    timestamp: '2026-10-29T16:05:00Z',
    userId: 'usr-003',
    userName: 'Elena Santos, RN',
    userRole: 'Head Nurse',
    actionType: 'PATIENT_USAGE',
    entityAffected: 'Patient Record PUR-2026-0914',
    details: 'Administered Ceftriaxone & Normal Saline to Patient Vicente Dela Cruz',
    terminal: 'WARD-3B-MOB',
    ipAddress: '192.168.30.88'
  },
  {
    id: 'log-004',
    timestamp: '2026-10-24T10:30:00Z',
    userId: 'usr-004',
    userName: 'Mark Rivera, RPhT',
    userRole: 'Pharmacy Dispenser',
    actionType: 'FEFO_RELEASE',
    entityAffected: 'REL-2026-1022',
    details: 'Dispatched 20 vials Ceftriaxone Batch LOT-2026-11A (FEFO earliest unexpired lot)',
    terminal: 'PHARM-DISP-01',
    ipAddress: '192.168.20.11'
  }
];
