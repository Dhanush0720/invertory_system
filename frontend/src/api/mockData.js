// 🏛️ College Estate Manager & Nirvahana AI — Premium Inventory System
// Client-side Mock Database layer for Demo Mode

const MOCK_ITEMS_KEY = 'demo_items';
const MOCK_DISTS_KEY = 'demo_distributions';
const MOCK_ALERTS_KEY = 'demo_alerts';
const MOCK_AUDIT_KEY = 'demo_audit';
const MOCK_VENDORS_KEY = 'demo_vendors';
const MOCK_DEPTS_KEY = 'demo_departments';
const MOCK_PARTICULARS_KEY = 'demo_particulars';

const INITIAL_ITEMS = [
  { _id: 'item-1', segment: 'STATIONERY', itemName: 'A4 Paper Reams (Double A)', dateOfPurchase: '2026-05-10', company: 'Double A', billNo: 'INV-1090', uom: 'Nos', quantityPurchased: 100, unitPrice: 250, totalCost: 25000, shopName: 'Stationery Hub', particulars: 'General Exam Cell usage', quantityDistributed: 40, quantityRemaining: 60 },
  { _id: 'item-2', segment: 'ELECTRONICS', itemName: 'Logitech C920 HD Pro Webcam', dateOfPurchase: '2026-06-01', company: 'Logitech', billNo: 'INV-9020', uom: 'Nos', quantityPurchased: 20, unitPrice: 6500, totalCost: 130000, shopName: 'Tech Solutions Ltd', particulars: 'CSE Lab Upgrade project', quantityDistributed: 18, quantityRemaining: 2 },
  { _id: 'item-3', segment: 'FURNITURE', itemName: 'Ergonomic Mesh Office Chairs', dateOfPurchase: '2026-04-15', company: 'Featherlite', billNo: 'INV-3482', uom: 'Nos', quantityPurchased: 15, unitPrice: 4200, totalCost: 63000, shopName: 'Supreme Furniture', particulars: 'Faculty room renovation', quantityDistributed: 15, quantityRemaining: 0 },
  { _id: 'item-4', segment: 'SPORTS', itemName: 'Cricket Bats (Kashmir Willow)', dateOfPurchase: '2026-03-22', company: 'SG Sports', billNo: 'INV-5501', uom: 'Nos', quantityPurchased: 8, unitPrice: 1800, totalCost: 14400, shopName: 'Sports Kingdom', particulars: 'Annual Sports Room Stock', quantityDistributed: 3, quantityRemaining: 5 },
  { _id: 'item-5', segment: 'LAB EQUIPMENT', itemName: 'Digital Multimeters', dateOfPurchase: '2026-05-25', company: 'Mastech', billNo: 'INV-7711', uom: 'Nos', quantityPurchased: 30, unitPrice: 1200, totalCost: 36000, shopName: 'Electro Equipments', particulars: 'ECE Circuits Lab batch B', quantityDistributed: 28, quantityRemaining: 2 },
  { _id: 'item-6', segment: 'STATIONERY', itemName: 'Whiteboard Markers (Chisel Tip)', dateOfPurchase: '2026-06-10', company: 'Camlin', billNo: 'INV-1102', uom: 'Nos', quantityPurchased: 200, unitPrice: 25, totalCost: 5000, shopName: 'Stationery Hub', particulars: 'Daily classroom supply', quantityDistributed: 196, quantityRemaining: 4 },
  { _id: 'item-7', segment: 'ELECTRICAL', itemName: 'Philips 20W LED Tube Lights', dateOfPurchase: '2026-06-15', company: 'Philips', billNo: 'INV-2900', uom: 'Nos', quantityPurchased: 50, unitPrice: 180, totalCost: 9000, shopName: 'Bright Lights Co', particulars: 'Main block lighting maintenance', quantityDistributed: 12, quantityRemaining: 38 },
  { _id: 'item-8', segment: 'STATIONERY', itemName: 'HP Laserjet 88A Toner Cartridge', dateOfPurchase: '2026-06-05', company: 'HP', billNo: 'INV-5412', uom: 'Nos', quantityPurchased: 10, unitPrice: 3200, totalCost: 32000, shopName: 'Print Masters', particulars: 'Exam and principal office printers', quantityDistributed: 9, quantityRemaining: 1 },
  { _id: 'item-9', segment: 'LAB EQUIPMENT', itemName: 'Vernier Calipers 150mm', dateOfPurchase: '2026-04-10', company: 'Mitutoyo', billNo: 'INV-8910', uom: 'Nos', quantityPurchased: 25, unitPrice: 950, totalCost: 23750, shopName: 'Scientific Supplies', particulars: 'Mechanical engineering workshop', quantityDistributed: 20, quantityRemaining: 5 },
  { _id: 'item-10', segment: 'COMPUTER ACCESSORIES', itemName: 'Dell Keyboard & Mouse Wireless Combo', dateOfPurchase: '2026-05-18', company: 'Dell', billNo: 'INV-6009', uom: 'Nos', quantityPurchased: 40, unitPrice: 800, totalCost: 32000, shopName: 'Tech Solutions Ltd', particulars: 'IT center replacements', quantityDistributed: 32, quantityRemaining: 8 },
];

const INITIAL_DISTRIBUTIONS = [
  { _id: 'dist-1', item: { _id: 'item-1', itemName: 'A4 Paper Reams (Double A)', segment: 'STATIONERY', uom: 'Nos' }, quantityDistributed: 40, dateOfDistribution: '2026-05-12', distributedToDepartment: 'EXAM CELL', authorisedBy: 'COE', distributedTo: 'Suresh Kumar', remarks: 'Mid-term exams printing' },
  { _id: 'dist-2', item: { _id: 'item-2', itemName: 'Logitech C920 HD Pro Webcam', segment: 'ELECTRONICS', uom: 'Nos' }, quantityDistributed: 18, dateOfDistribution: '2026-06-03', distributedToDepartment: 'CSE', authorisedBy: 'HOD CSE', distributedTo: 'Dr. Vikram Prasad', remarks: 'Smart classroom installation' },
  { _id: 'dist-3', item: { _id: 'item-3', itemName: 'Ergonomic Mesh Office Chairs', segment: 'FURNITURE', uom: 'Nos' }, quantityDistributed: 15, dateOfDistribution: '2026-04-18', distributedToDepartment: 'ADMIN', authorisedBy: 'REGISTRAR', distributedTo: 'Rajesh Sharma', remarks: 'Registrar and VC office re-allocation' },
  { _id: 'dist-4', item: { _id: 'item-4', itemName: 'Cricket Bats (Kashmir Willow)', segment: 'SPORTS', uom: 'Nos' }, quantityDistributed: 3, dateOfDistribution: '2026-03-25', distributedToDepartment: 'SPORTS', authorisedBy: 'PHYSICAL DIRECTOR', distributedTo: 'Kiran Patel', remarks: 'Inter-college tourney kit' },
  { _id: 'dist-5', item: { _id: 'item-5', itemName: 'Digital Multimeters', segment: 'LAB EQUIPMENT', uom: 'Nos' }, quantityDistributed: 28, dateOfDistribution: '2026-05-27', distributedToDepartment: 'ECE', authorisedBy: 'HOD ECE', distributedTo: 'Mrs. Priya Nair', remarks: 'Replacing faulty multimeters in lab 2' },
  { _id: 'dist-6', item: { _id: 'item-6', itemName: 'Whiteboard Markers (Chisel Tip)', segment: 'STATIONERY', uom: 'Nos' }, quantityDistributed: 100, dateOfDistribution: '2026-06-11', distributedToDepartment: 'EXAM CELL', authorisedBy: 'COE', distributedTo: 'Suresh Kumar', remarks: 'Term exams logistics' },
  { _id: 'dist-7', item: { _id: 'item-6', itemName: 'Whiteboard Markers (Chisel Tip)', segment: 'STATIONERY', uom: 'Nos' }, quantityDistributed: 96, dateOfDistribution: '2026-06-12', distributedToDepartment: 'MECH', authorisedBy: 'HOD MECH', distributedTo: 'Ravi Teja', remarks: 'Classroom marker quota' },
  { _id: 'dist-8', item: { _id: 'item-7', itemName: 'Philips 20W LED Tube Lights', segment: 'ELECTRICAL', uom: 'Nos' }, quantityDistributed: 12, dateOfDistribution: '2026-06-16', distributedToDepartment: 'MAINTENANCE', authorisedBy: 'ESTATE OFFICER', distributedTo: 'Gopal Reddy', remarks: 'Auditorium corridor lighting' },
  { _id: 'dist-9', item: { _id: 'item-8', itemName: 'HP Laserjet 88A Toner Cartridge', segment: 'STATIONERY', uom: 'Nos' }, quantityDistributed: 5, dateOfDistribution: '2026-06-06', distributedToDepartment: 'EXAM CELL', authorisedBy: 'COE', distributedTo: 'Suresh Kumar', remarks: 'Urgent QP printing' },
  { _id: 'dist-10', item: { _id: 'item-8', itemName: 'HP Laserjet 88A Toner Cartridge', segment: 'STATIONERY', uom: 'Nos' }, quantityDistributed: 4, dateOfDistribution: '2026-06-08', distributedToDepartment: 'ADMIN', authorisedBy: 'REGISTRAR', distributedTo: 'Mrs. Lalitha S.', remarks: 'Principal office printer refill' },
  { _id: 'dist-11', item: { _id: 'item-9', itemName: 'Vernier Calipers 150mm', segment: 'LAB EQUIPMENT', uom: 'Nos' }, quantityDistributed: 20, dateOfDistribution: '2026-04-12', distributedToDepartment: 'MECH', authorisedBy: 'HOD MECH', distributedTo: 'Dr. Srinivas Rao', remarks: 'For first-year workshop batch' },
  { _id: 'dist-12', item: { _id: 'item-10', itemName: 'Dell Keyboard & Mouse Wireless Combo', segment: 'COMPUTER ACCESSORIES', uom: 'Nos' }, quantityDistributed: 32, dateOfDistribution: '2026-05-20', distributedToDepartment: 'IT', authorisedBy: 'HOD IT', distributedTo: 'Amit Verma', remarks: 'IT Lab computer peripherals' }
];

const INITIAL_ALERTS = [
  { _id: 'alert-1', severity: 'High', issue_type: 'Stockout Alert', message: 'Whiteboard Markers (Chisel Tip) stock is critical: only 4 units remaining out of 200 purchased.', recommended_action: 'Order 200 additional units from "Stationery Hub" immediately.', action_code: 'AUTO_ORDER', item_id: 'item-6', vendor_email: 'sales@stationeryhub.com' },
  { _id: 'alert-2', severity: 'High', issue_type: 'Stockout Alert', message: 'HP Laserjet 88A Toner Cartridge stock is critically low: only 1 unit remaining.', recommended_action: 'Re-order 8 toners from "Print Masters" for principal & exam cell.', action_code: 'AUTO_ORDER', item_id: 'item-8', vendor_email: 'support@printmasters.com' },
  { _id: 'alert-3', severity: 'Medium', issue_type: 'Anomaly Detection', message: 'Unusual velocity detected: Ergonomic Mesh Office Chairs distributed 100% of stock (15 units) in a single week to ADMIN.', recommended_action: 'Review and verify if the re-allocation is permanent and log transfer receipt.', action_code: 'AUDIT', item_id: 'item-3' }
];

const INITIAL_VENDORS = [
  { _id: 'v-1', name: 'Stationery Hub', contact: 'sales@stationeryhub.com', phone: '+919988776655' },
  { _id: 'v-2', name: 'Tech Solutions Ltd', contact: 'business@techsolutions.com', phone: '+918877665544' },
  { _id: 'v-3', name: 'Supreme Furniture', contact: 'orders@supremefurniture.com', phone: '+917766554433' },
  { _id: 'v-4', name: 'Sports Kingdom', contact: 'sports@kingdom.com', phone: '+916655443322' },
  { _id: 'v-5', name: 'Electro Equipments', contact: 'info@electroequip.com', phone: '+915544332211' }
];

const INITIAL_DEPTS = [
  { _id: 'd-1', name: 'EXAM CELL', budget: 150000 },
  { _id: 'd-2', name: 'CSE', budget: 500000 },
  { _id: 'd-3', name: 'ECE', budget: 350000 },
  { _id: 'd-4', name: 'MECH', budget: 250000 },
  { _id: 'd-5', name: 'ADMIN', budget: 200000 },
  { _id: 'd-6', name: 'SPORTS', budget: 100000 },
  { _id: 'd-7', name: 'LIBRARY', budget: 150000 },
];

const INITIAL_PARTICULARS = [
  { _id: 'p-1', name: 'COLLEGE PURPOSE' },
  { _id: 'p-2', name: 'LAB UPGRADE' },
  { _id: 'p-3', name: 'OFFICE SUPPLIES' },
  { _id: 'p-4', name: 'MAINTENANCE WORK' },
];

const INITIAL_AUDITS = [
  { _id: 'a-1', action: 'LOGIN', details: 'Guest Explorer logged in from Demo Entry point', timestamp: new Date().toISOString() },
  { _id: 'a-2', action: 'INIT', details: 'Demo database seeded with default mock records', timestamp: new Date().toISOString() }
];

// Helper database initializer
export const initDemoDb = (force = false) => {
  if (force || !localStorage.getItem(MOCK_ITEMS_KEY)) {
    localStorage.setItem(MOCK_ITEMS_KEY, JSON.stringify(INITIAL_ITEMS));
    localStorage.setItem(MOCK_DISTS_KEY, JSON.stringify(INITIAL_DISTRIBUTIONS));
    localStorage.setItem(MOCK_ALERTS_KEY, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(INITIAL_AUDITS));
    localStorage.setItem(MOCK_VENDORS_KEY, JSON.stringify(INITIAL_VENDORS));
    localStorage.setItem(MOCK_DEPTS_KEY, JSON.stringify(INITIAL_DEPTS));
    localStorage.setItem(MOCK_PARTICULARS_KEY, JSON.stringify(INITIAL_PARTICULARS));
  }
};

// Getter/Setter utility wrappers
const getCollection = (key, defaultVal = []) => {
  initDemoDb();
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setCollection = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

const addAuditLog = (action, details) => {
  const logs = getCollection(MOCK_AUDIT_KEY);
  logs.unshift({
    _id: `audit-${Date.now()}`,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  setCollection(MOCK_AUDIT_KEY, logs.slice(0, 100)); // cap at 100
};

const simulateLatency = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data }), 350);
  });
};

// ────────── MOCK API IMPLEMENTATIONS ──────────

export const mockAuthAPI = {
  login: (data) => {
    const user = { id: 'demo-user-id', name: 'Guest Explorer', email: 'guest@demo.com', role: 'admin' };
    localStorage.setItem('isDemo', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'mock-demo-token');
    initDemoDb(true); // reset on login to ensure clean initial experience
    addAuditLog('LOGIN', 'Guest logged into demo session');
    return simulateLatency({ token: 'mock-demo-token', user });
  },
  me: () => {
    const user = JSON.parse(localStorage.getItem('user')) || { id: 'demo-user-id', name: 'Guest Explorer', email: 'guest@demo.com', role: 'admin' };
    return simulateLatency(user);
  }
};

export const mockItemsAPI = {
  getAll: (params = {}) => {
    let list = getCollection(MOCK_ITEMS_KEY);
    const dists = getCollection(MOCK_DISTS_KEY);

    // Compute distribution sums dynamically to ensure 100% data integrity
    list = list.map(item => {
      const itemDists = dists.filter(d => d.item?._id === item._id || d.item === item._id);
      const totalDist = itemDists.reduce((acc, curr) => acc + (curr.quantityDistributed || 0), 0);
      return {
        ...item,
        quantityDistributed: totalDist,
        quantityRemaining: Math.max(0, (item.quantityPurchased || 0) - totalDist)
      };
    });

    // Apply filter
    if (params.segment) {
      list = list.filter(i => i.segment === params.segment);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(i => 
        i.itemName.toLowerCase().includes(q) || 
        (i.company || '').toLowerCase().includes(q) ||
        (i.particulars || '').toLowerCase().includes(q)
      );
    }

    // Pagination
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const total = list.length;
    const pages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginatedItems = list.slice(startIdx, startIdx + limit);

    return simulateLatency({
      items: paginatedItems,
      total,
      page,
      pages
    });
  },
  getOne: (id) => {
    const list = getCollection(MOCK_ITEMS_KEY);
    const item = list.find(i => i._id === id);
    return simulateLatency(item || null);
  },
  create: (data) => {
    const list = getCollection(MOCK_ITEMS_KEY);
    const newItem = {
      ...data,
      _id: `item-${Date.now()}`,
      quantityPurchased: Number(data.quantityPurchased),
      unitPrice: Number(data.unitPrice || 0),
      totalCost: Number(data.totalCost || 0),
      quantityDistributed: 0,
      quantityRemaining: Number(data.quantityPurchased)
    };
    list.unshift(newItem);
    setCollection(MOCK_ITEMS_KEY, list);
    addAuditLog('ITEM_CREATE', `Added new item: ${newItem.itemName} (Purchased Qty: ${newItem.quantityPurchased})`);
    return simulateLatency(newItem);
  },
  update: (id, data) => {
    const list = getCollection(MOCK_ITEMS_KEY);
    const idx = list.findIndex(i => i._id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...data,
        quantityPurchased: Number(data.quantityPurchased),
        unitPrice: Number(data.unitPrice || 0),
        totalCost: Number(data.totalCost || 0)
      };
      setCollection(MOCK_ITEMS_KEY, list);
      addAuditLog('ITEM_UPDATE', `Updated item details: ${list[idx].itemName}`);
      return simulateLatency(list[idx]);
    }
    return Promise.reject({ response: { data: { message: 'Item not found' } } });
  },
  delete: (id) => {
    let list = getCollection(MOCK_ITEMS_KEY);
    const itemToDelete = list.find(i => i._id === id);
    list = list.filter(i => i._id !== id);
    setCollection(MOCK_ITEMS_KEY, list);

    // Also clean up distributions matching this item
    let dists = getCollection(MOCK_DISTS_KEY);
    dists = dists.filter(d => (d.item?._id || d.item) !== id);
    setCollection(MOCK_DISTS_KEY, dists);

    if (itemToDelete) {
      addAuditLog('ITEM_DELETE', `Deleted item and its logs: ${itemToDelete.itemName}`);
    }
    return simulateLatency({ message: 'Item deleted' });
  },
  bulkImport: (items) => {
    const list = getCollection(MOCK_ITEMS_KEY);
    const newItems = items.map(item => ({
      ...item,
      _id: `item-${Math.random().toString(36).substr(2, 9)}`,
      quantityPurchased: Number(item.quantityPurchased),
      unitPrice: Number(item.unitPrice || 0),
      totalCost: Number(item.totalCost || (item.quantityPurchased * item.unitPrice) || 0),
      quantityDistributed: 0,
      quantityRemaining: Number(item.quantityPurchased)
    }));
    setCollection(MOCK_ITEMS_KEY, [...newItems, ...list]);
    addAuditLog('ITEM_BULK_IMPORT', `Bulk imported ${newItems.length} items from Excel`);
    return simulateLatency({ count: newItems.length });
  }
};

export const mockDistributionsAPI = {
  getAll: (params = {}) => {
    let list = getCollection(MOCK_DISTS_KEY);

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(d => 
        (d.item?.itemName || '').toLowerCase().includes(q) ||
        (d.distributedToDepartment || '').toLowerCase().includes(q) ||
        (d.distributedTo || '').toLowerCase().includes(q)
      );
    }

    return simulateLatency(list);
  },
  create: (data) => {
    const items = getCollection(MOCK_ITEMS_KEY);
    const item = items.find(i => i._id === data.item);
    if (!item) {
      return Promise.reject({ response: { data: { message: 'Item to distribute not found' } } });
    }

    // Dynamic stock check
    const dists = getCollection(MOCK_DISTS_KEY);
    const itemDists = dists.filter(d => d.item?._id === item._id || d.item === item._id);
    const totalDist = itemDists.reduce((acc, curr) => acc + (curr.quantityDistributed || 0), 0);
    const currentRemaining = item.quantityPurchased - totalDist;

    if (data.quantityDistributed > currentRemaining) {
      return Promise.reject({ response: { data: { message: `Insufficient stock! Only ${currentRemaining} remaining, requested ${data.quantityDistributed}` } } });
    }

    const newDist = {
      _id: `dist-${Date.now()}`,
      item: {
        _id: item._id,
        itemName: item.itemName,
        segment: item.segment,
        uom: item.uom
      },
      quantityDistributed: Number(data.quantityDistributed),
      dateOfDistribution: data.dateOfDistribution,
      distributedToDepartment: data.distributedToDepartment.toUpperCase(),
      authorisedBy: data.authorisedBy,
      distributedTo: data.distributedTo,
      remarks: data.remarks
    };

    dists.unshift(newDist);
    setCollection(MOCK_DISTS_KEY, dists);
    addAuditLog('DIST_RECORD', `Distributed ${newDist.quantityDistributed} ${item.uom} of ${item.itemName} to ${newDist.distributedToDepartment}`);
    return simulateLatency(newDist);
  },
  delete: (id) => {
    let dists = getCollection(MOCK_DISTS_KEY);
    const distToDelete = dists.find(d => d._id === id);
    dists = dists.filter(d => d._id !== id);
    setCollection(MOCK_DISTS_KEY, dists);

    if (distToDelete) {
      addAuditLog('DIST_DELETE', `Revoked distribution of ${distToDelete.quantityDistributed} units of ${distToDelete.item?.itemName || 'deleted item'}`);
    }
    return simulateLatency({ message: 'Distribution deleted' });
  },
  returnItem: (id, quantityReturned) => {
    // Basic support for returnItem, does a simple mock audit log and doesn't crash
    addAuditLog('DIST_RETURN', `Returned ${quantityReturned} units for distribution ID: ${id}`);
    return simulateLatency({ message: 'Success' });
  }
};

export const mockUsersAPI = {
  getAll: () => {
    return simulateLatency([
      { _id: 'u-1', name: 'Dr. Dhanush K (Admin)', email: 'admin@mail.com', role: 'admin', lastActive: 'Active now' },
      { _id: 'u-2', name: 'Mrs. Lalitha S. (Staff)', email: 'lalitha@mail.com', role: 'staff', lastActive: '2 hours ago' },
      { _id: 'u-3', name: 'Guest Explorer (Demo)', email: 'guest@demo.com', role: 'admin', lastActive: 'Active now' }
    ]);
  },
  create: (data) => simulateLatency({ _id: `u-${Date.now()}`, ...data }),
  update: (id, data) => simulateLatency({ _id: id, ...data }),
  delete: (id) => simulateLatency({ message: 'User deleted' })
};

export const mockDashboardAPI = {
  getStats: () => {
    const items = getCollection(MOCK_ITEMS_KEY);
    const dists = getCollection(MOCK_DISTS_KEY);
    const depts = getCollection(MOCK_DEPTS_KEY);

    // Compute dynamic dashboard stats
    let totalItems = items.length;
    let totalValue = 0;
    let totalPurchasedCount = 0;
    let totalDistributedCount = 0;
    let outOfStockItems = 0;
    let lowStockItems = 0;

    const categorySummary = {};

    items.forEach(item => {
      // Find distributions for this item
      const itemDists = dists.filter(d => d.item?._id === item._id || d.item === item._id);
      const distSum = itemDists.reduce((acc, curr) => acc + (curr.quantityDistributed || 0), 0);
      const remaining = Math.max(0, item.quantityPurchased - distSum);

      totalValue += item.totalCost || 0;
      totalPurchasedCount += item.quantityPurchased || 0;
      totalDistributedCount += distSum;

      if (remaining <= 0) outOfStockItems++;
      else if (remaining <= 5) lowStockItems++;

      const seg = item.segment || 'OTHER';
      if (!categorySummary[seg]) {
        categorySummary[seg] = { category: seg, totalCost: 0, purchased: 0, itemCount: 0 };
      }
      categorySummary[seg].totalCost += item.totalCost || 0;
      categorySummary[seg].purchased += item.quantityPurchased || 0;
      categorySummary[seg].itemCount += 1;
    });

    const categoryBreakdown = Object.values(categorySummary);

    // Compute Department breakdown
    const deptSummary = {};
    depts.forEach(d => {
      deptSummary[d.name] = {
        department: d.name,
        quantityDistributed: 0,
        itemsCount: 0,
        estimatedValue: 0,
        budget: d.budget || 0,
        topItems: {}
      };
    });

    dists.forEach(dist => {
      const deptName = dist.distributedToDepartment || 'OTHER';
      if (!deptSummary[deptName]) {
        deptSummary[deptName] = {
          department: deptName,
          quantityDistributed: 0,
          itemsCount: 0,
          estimatedValue: 0,
          budget: 0,
          topItems: {}
        };
      }

      // Calculate unit cost from matching item to get estimated value distributed
      const originalItem = items.find(i => i._id === (dist.item?._id || dist.item));
      const unitPrice = originalItem ? (originalItem.unitPrice || 0) : 0;
      const estimatedValue = unitPrice * dist.quantityDistributed;

      deptSummary[deptName].quantityDistributed += dist.quantityDistributed;
      deptSummary[deptName].itemsCount += 1;
      deptSummary[deptName].estimatedValue += estimatedValue;

      const itemName = dist.item?.itemName || 'Deleted Item';
      if (!deptSummary[deptName].topItems[itemName]) {
        deptSummary[deptName].topItems[itemName] = { name: itemName, qty: 0, cost: 0 };
      }
      deptSummary[deptName].topItems[itemName].qty += dist.quantityDistributed;
      deptSummary[deptName].topItems[itemName].cost += estimatedValue;
    });

    const departmentBreakdown = Object.values(deptSummary).map(dept => ({
      ...dept,
      topItems: Object.values(dept.topItems).sort((a,b) => b.qty - a.qty)
    })).sort((a, b) => b.quantityDistributed - a.quantityDistributed);

    // Monthly Trend (mock)
    const monthlyTrend = [
      { month: '2026-01', totalCost: totalValue * 0.15, count: Math.ceil(totalItems * 0.15) },
      { month: '2026-02', totalCost: totalValue * 0.12, count: Math.ceil(totalItems * 0.12) },
      { month: '2026-03', totalCost: totalValue * 0.20, count: Math.ceil(totalItems * 0.2) },
      { month: '2026-04', totalCost: totalValue * 0.18, count: Math.ceil(totalItems * 0.18) },
      { month: '2026-05', totalCost: totalValue * 0.25, count: Math.ceil(totalItems * 0.25) },
      { month: '2026-06', totalCost: totalValue * 0.10, count: Math.ceil(totalItems * 0.10) },
    ];

    // Top items by cost
    const topItemsByCost = items
      .map(i => ({ itemName: i.itemName, totalCost: i.totalCost, segment: i.segment, qty: i.quantityPurchased }))
      .sort((a,b) => b.totalCost - a.totalCost)
      .slice(0, 15);

    // Recent distributions
    const recentDistributions = dists.slice(0, 5);

    return simulateLatency({
      totalItems,
      totalValue,
      totalPurchased: totalPurchasedCount,
      totalDistributed: totalDistributedCount,
      outOfStockItems,
      lowStockItems,
      categoryBreakdown,
      departmentBreakdown,
      monthlyTrend,
      topItemsByCost,
      recentDistributions
    });
  }
};

export const mockAuditAPI = {
  getAll: (params = {}) => {
    const list = getCollection(MOCK_AUDIT_KEY);
    return simulateLatency({
      logs: list,
      page: 1,
      pages: 1,
      total: list.length
    });
  }
};

export const mockAlertsAPI = {
  getActive: () => {
    const alerts = getCollection(MOCK_ALERTS_KEY);
    return simulateLatency(alerts);
  },
  resolve: (id) => {
    let alerts = getCollection(MOCK_ALERTS_KEY);
    const resolved = alerts.find(a => a._id === id);
    alerts = alerts.filter(a => a._id !== id);
    setCollection(MOCK_ALERTS_KEY, alerts);

    if (resolved) {
      addAuditLog('ALERT_RESOLVE', `Approved Nirvahana action for: ${resolved.message}`);
      
      // Auto restock demo items on order alerts
      if (resolved.action_code === 'AUTO_ORDER' && resolved.item_id) {
        const items = getCollection(MOCK_ITEMS_KEY);
        const idx = items.findIndex(i => i._id === resolved.item_id);
        if (idx !== -1) {
          items[idx].quantityPurchased += 50; // Add standard restock amount
          items[idx].totalCost += (items[idx].unitPrice * 50);
          setCollection(MOCK_ITEMS_KEY, items);
          addAuditLog('AUTO_RESTOCK', `Demo Restock: Added 50 units to ${items[idx].itemName}`);
        }
      }
    }
    return simulateLatency({ success: true });
  },
  ask: (question) => {
    const q = question.toLowerCase();
    const items = getCollection(MOCK_ITEMS_KEY);
    const dists = getCollection(MOCK_DISTS_KEY);

    let answer = '';

    if (q.includes('low') || q.includes('stockout') || q.includes('out of stock')) {
      const lowItems = items.filter(i => {
        const itemDists = dists.filter(d => d.item?._id === i._id || d.item === i._id);
        const distSum = itemDists.reduce((acc, curr) => acc + (curr.quantityDistributed || 0), 0);
        const remaining = i.quantityPurchased - distSum;
        return remaining <= 5;
      });

      if (lowItems.length > 0) {
        answer = `🔍 Based on live inventory audits, I found ${lowItems.length} items with critical/low stock levels:\n\n` +
          lowItems.map(i => {
            const itemDists = dists.filter(d => d.item?._id === i._id || d.item === i._id);
            const distSum = itemDists.reduce((acc, curr) => acc + (curr.quantityDistributed || 0), 0);
            const remaining = i.quantityPurchased - distSum;
            return `• *${i.itemName}* (${i.segment}): ${remaining} remaining (Total purchased: ${i.quantityPurchased})`;
          }).join('\n') + `\n\nI suggest placing a restock order via vendor email drafts in the Alert Panel.`;
      } else {
        answer = `✅ All inventory items are currently in healthy stock. No stockouts detected!`;
      }
    } else if (q.includes('department') || q.includes('department uses the most') || q.includes('most items')) {
      const deptCounts = {};
      dists.forEach(d => {
        const dept = d.distributedToDepartment || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + (d.quantityDistributed || 0);
      });

      const sortedDepts = Object.entries(deptCounts).sort((a,b) => b[1] - a[1]);
      if (sortedDepts.length > 0) {
        answer = `🏢 Department Material Distribution Audit:\n\n` +
          `The department with the highest consumption volume is *${sortedDepts[0][0]}*, having consumed *${sortedDepts[0][1]}* units of material.\n\n` +
          `Full Department Breakdown:\n` +
          sortedDepts.map(([dept, qty], idx) => `${idx+1}. *${dept}*: ${qty.toLocaleString()} units`).join('\n');
      } else {
        answer = `🏢 No department distributions recorded in the system yet.`;
      }
    } else if (q.includes('value') || q.includes('cost') || q.includes('total spend') || q.includes('worth')) {
      const totalValue = items.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
      answer = `💰 Inventory Valuation Audit:\n\n` +
        `The total cumulative asset valuation of all items registered in the college inventory system is *₹${totalValue.toLocaleString('en-IN')}*.\n\n` +
        `Top 3 Segments by Investment:\n` +
        items.reduce((acc, item) => {
          const seg = item.segment || 'OTHER';
          const match = acc.find(a => a.seg === seg);
          if (match) match.cost += item.totalCost;
          else acc.push({ seg, cost: item.totalCost });
          return acc;
        }, []).sort((a,b) => b.cost - a.cost).slice(0, 3).map((item, idx) => `• *${item.seg}*: ₹${item.cost.toLocaleString('en-IN')}`).join('\n');
    } else {
      // General NLP reply
      answer = `👋 Hello! I am Nirvahana AI. I've audited the local college database and everything looks healthy.\n\n` +
        `Currently tracking *${items.length} items* across *${dists.length} distributions*. Total valuation stands at *₹${items.reduce((acc, c)=>acc+(c.totalCost||0), 0).toLocaleString('en-IN')}*.\n\n` +
        `Try asking me something like:\n` +
        `• "Which items are low on stock?"\n` +
        `• "Which department uses the most items?"\n` +
        `• "What is the total inventory value?"`;
    }

    return simulateLatency({ answer });
  }
};

export const mockMasterAPI = {
  getAll: (type) => {
    const key = type === 'vendors' ? MOCK_VENDORS_KEY : type === 'departments' ? MOCK_DEPTS_KEY : MOCK_PARTICULARS_KEY;
    return simulateLatency(getCollection(key));
  },
  create: (type, data) => {
    const key = type === 'vendors' ? MOCK_VENDORS_KEY : type === 'departments' ? MOCK_DEPTS_KEY : MOCK_PARTICULARS_KEY;
    const list = getCollection(key);
    const newEntry = { _id: `${type}-${Date.now()}`, ...data };
    list.push(newEntry);
    setCollection(key, list);
    addAuditLog('MASTER_CREATE', `Added new ${type} master entry: ${data.name}`);
    return simulateLatency(newEntry);
  },
  update: (type, id, data) => {
    const key = type === 'vendors' ? MOCK_VENDORS_KEY : type === 'departments' ? MOCK_DEPTS_KEY : MOCK_PARTICULARS_KEY;
    const list = getCollection(key);
    const idx = list.findIndex(e => e._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setCollection(key, list);
      return simulateLatency(list[idx]);
    }
    return Promise.reject({ response: { data: { message: 'Not found' } } });
  },
  delete: (type, id) => {
    const key = type === 'vendors' ? MOCK_VENDORS_KEY : type === 'departments' ? MOCK_DEPTS_KEY : MOCK_PARTICULARS_KEY;
    let list = getCollection(key);
    list = list.filter(e => e._id !== id);
    setCollection(key, list);
    return simulateLatency({ message: 'Deleted' });
  },
  getSuggestions: () => {
    const items = getCollection(MOCK_ITEMS_KEY);
    const itemNames = Array.from(new Set(items.map(i => i.itemName)));
    return simulateLatency({ itemNames });
  }
};

export const mockAgentsAPI = {
  vision: (base64Image, mimeType) => {
    // This is simulated in code from InventoryPage, but we keep the endpoint wrapper
    return simulateLatency({
      itemName: 'Dell UltraSharp 24 Monitor U2422H',
      company: 'Dell',
      billNo: 'IN-7781-B',
      quantityPurchased: '5',
      unitPrice: '18500',
      shopName: 'Tech Solutions Ltd'
    });
  },
  getForecast: () => {
    const items = getCollection(MOCK_ITEMS_KEY);
    const totalValue = items.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
    const forecastText = `🔮 **Nirvahana 30-Day Budget Consumption Forecast**\n\n` +
      `• **Historical Velocity**: Averaging ₹${(totalValue * 0.05).toFixed(0)} consumption value per week.\n` +
      `• **Predictive Outlays**: We project *₹${(totalValue * 0.22).toFixed(0)}* in budget consumption over the next 30 days.\n` +
      `• **High Risk Items**: *Logitech C920 Webcams* (Current: 2 remaining) and *Whiteboard Markers* (Current: 4 remaining) are predicted to face total stockouts in *4 days* and *8 days* respectively under active curriculum distributions.\n\n` +
      `• **Recommendation**: Restock markers and toners now to prevent exam printing delay.`;
    return simulateLatency({ forecast: forecastText });
  }
};
