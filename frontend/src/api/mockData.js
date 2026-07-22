// 🏛️ College Estate Manager & Nirvahana AI — Premium Inventory System
// Client-side Mock Database layer for Demo Mode

const MOCK_ITEMS_KEY = 'demo_items';
const MOCK_DISTS_KEY = 'demo_distributions';
const MOCK_ALERTS_KEY = 'demo_alerts';
const MOCK_AUDIT_KEY = 'demo_audit';
const MOCK_VENDORS_KEY = 'demo_vendors';
const MOCK_DEPTS_KEY = 'demo_departments';
const MOCK_PARTICULARS_KEY = 'demo_particulars';
const MOCK_MESS_ITEMS_KEY = 'demo_mess_items';
const MOCK_MESS_LOGS_KEY = 'demo_mess_logs';
const MOCK_MESS_MENU_KEY = 'demo_mess_menu';
const MOCK_MESS_PURCHASES_KEY = 'demo_mess_purchases';
const MOCK_MESS_SERVED_LOGS_KEY = 'demo_mess_served_logs';
const MOCK_MESS_GROCERIES_SUPPLIES_KEY = 'demo_groceries_supplies';
const MOCK_USERS_KEY = 'demo_users';

const INITIAL_USERS = [
  { _id: 'u-1', name: 'Dr. Dhanush K (Admin)', email: 'admin@mail.com', role: 'admin', lastActive: 'Active now', isActive: true },
  { _id: 'u-2', name: 'Mrs. Lalitha S. (Staff)', email: 'lalitha@mail.com', role: 'staff', lastActive: '2 hours ago', isActive: true },
  { _id: 'u-3', name: 'Guest Explorer (Demo)', email: 'guest@demo.com', role: 'admin', lastActive: 'Active now', isActive: true },
  { _id: 'u-4', name: 'Raju Mess Manager (Mess)', email: 'raju@mail.com', role: 'mess', lastActive: '1 day ago', isActive: true }
];

function normalizeUOM(uom) {
  if (!uom) return 'Kg';
  const norm = uom.toString().trim().toLowerCase();
  if (norm === 'kg' || norm === 'kgs' || norm === 'kilogram' || norm === 'kilograms') return 'Kg';
  if (norm === 'litre' || norm === 'litres' || norm === 'liter' || norm === 'liters' || norm === 'l') return 'Litre';
  if (norm === 'pack' || norm === 'packet' || norm === 'packets' || norm === 'packs') return 'Pack';
  if (norm === 'bag' || norm === 'bags') return 'Bag';
  if (norm === 'nos' || norm === 'no' || norm === 'number' || norm === 'numbers' || norm === 'pcs' || norm === 'pieces') return 'Nos';
  
  const matched = ['Kg', 'Litre', 'Pack', 'Bag', 'Nos'].find(val => val.toLowerCase() === norm);
  if (matched) return matched;
  return 'Kg';
}

function normalizeCategory(cat) {
  if (!cat) return 'OTHER';
  const norm = cat.toString().trim().toUpperCase();
  const valid = ['GROCERY', 'VEGETABLE', 'DAIRY', 'MEAT', 'SPICE', 'FRUIT', 'OTHER'];
  if (valid.includes(norm)) return norm;
  if (norm === 'FRUITS') return 'FRUIT';
  return 'OTHER';
}

const INITIAL_MESS_ITEMS = [
  { _id: 'mi-1', name: 'Basmati Rice', category: 'GROCERY', quantity: 220, uom: 'Kg', threshold: 50, costPerUnit: 75 },
  { _id: 'mi-2', name: 'Fresh Potatoes', category: 'VEGETABLE', quantity: 65, uom: 'Kg', threshold: 20, costPerUnit: 30 },
  { _id: 'mi-3', name: 'Fresh Tomatoes', category: 'VEGETABLE', quantity: 15, uom: 'Kg', threshold: 10, costPerUnit: 40 },
  { _id: 'mi-4', name: 'Fresh Onions', category: 'VEGETABLE', quantity: 60, uom: 'Kg', threshold: 15, costPerUnit: 35 },
  { _id: 'mi-5', name: 'Fresh Milk', category: 'DAIRY', quantity: 4, uom: 'Litre', threshold: 10, costPerUnit: 60 },
  { _id: 'mi-6', name: 'Refined Sunflower Oil', category: 'GROCERY', quantity: 50, uom: 'Litre', threshold: 15, costPerUnit: 120 },
  { _id: 'mi-7', name: 'Toor Dal (Lentils)', category: 'GROCERY', quantity: 100, uom: 'Kg', threshold: 20, costPerUnit: 140 }
];

const INITIAL_GROCERIES_SUPPLIES = [
  {
    _id: 'mgs-1',
    itemName: 'Basmati Rice',
    item: { _id: 'mi-1', name: 'Basmati Rice', category: 'GROCERY', uom: 'Kg' },
    dateIssued: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    uom: 'Kg',
    quantityIssued: 30,
    purposeOfUsed: 'SAMBAR RICE',
    purposeOfUsing: 'Lunch cooking for students',
    issuedTo: 'MAREYAMMA-MASTER',
    issuedBy: 'Murali krishna',
    particularsExtraCooking: 'Regular hostel lunch',
    recordedBy: { name: 'Guest Explorer', email: 'guest@demo.com' }
  },
  {
    _id: 'mgs-2',
    itemName: 'Fresh Potatoes',
    item: { _id: 'mi-2', name: 'Fresh Potatoes', category: 'VEGETABLE', uom: 'Kg' },
    dateIssued: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    uom: 'Kg',
    quantityIssued: 15,
    purposeOfUsed: 'POTATO CURRY',
    purposeOfUsing: 'Dinner curry preparation',
    issuedTo: 'MAREYAMMA-MASTER',
    issuedBy: 'Murali krishna',
    particularsExtraCooking: 'Regular hostel dinner',
    recordedBy: { name: 'Guest Explorer', email: 'guest@demo.com' }
  }
];

const INITIAL_MESS_LOGS = [
  {
    _id: 'ml-1',
    date: new Date(Date.now() - 24*60*60*1000).toISOString(),
    mealType: 'LUNCH',
    itemsUsed: [{ item: { _id: 'mi-1', name: 'Basmati Rice', uom: 'Kg' }, qtyUsed: 50 }],
    spoilage: [{ item: { _id: 'mi-3', name: 'Fresh Tomatoes', uom: 'Kg' }, qtySpoiled: 2, reason: 'Rotted due to heat' }],
    recordedBy: { name: 'Guest Explorer' }
  }
];

const INITIAL_MESS_MENU = [
  {
    dayOfWeek: 'Monday',
    meals: {
      breakfast: { name: 'Idli & Sambar', ingredients: [{ itemName: 'Toor Dal (Lentils)', perStudentQtyGrams: 20 }] },
      lunch:     { name: 'Veg Biryani & Curd', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 150 }, { itemName: 'Fresh Potatoes', perStudentQtyGrams: 30 }, { itemName: 'Fresh Tomatoes', perStudentQtyGrams: 20 }] },
      snacks:    { name: 'Tea & Biscuits', ingredients: [{ itemName: 'Fresh Milk', perStudentQtyGrams: 50 }] },
      dinner:    { name: 'Roti & Potato Curry', ingredients: [{ itemName: 'Fresh Potatoes', perStudentQtyGrams: 80 }, { itemName: 'Fresh Onions', perStudentQtyGrams: 25 }] }
    }
  },
  {
    dayOfWeek: 'Tuesday',
    meals: {
      breakfast: { name: 'Puri Masala', ingredients: [{ itemName: 'Fresh Potatoes', perStudentQtyGrams: 100 }] },
      lunch:     { name: 'Rice & Sambar', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 150 }, { itemName: 'Toor Dal (Lentils)', perStudentQtyGrams: 35 }] },
      snacks:    { name: 'Milk & Banana', ingredients: [{ itemName: 'Fresh Milk', perStudentQtyGrams: 100 }] },
      dinner:    { name: 'Rice & Egg Curry', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 120 }, { itemName: 'Fresh Onions', perStudentQtyGrams: 20 }] }
    }
  },
  {
    dayOfWeek: 'Wednesday',
    meals: {
      breakfast: { name: 'Dosa & Chutney', ingredients: [] },
      lunch:     { name: 'Veg Pulao', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 140 }, { itemName: 'Fresh Potatoes', perStudentQtyGrams: 25 }, { itemName: 'Fresh Tomatoes', perStudentQtyGrams: 15 }] },
      snacks:    { name: 'Tea & Pakoda', ingredients: [{ itemName: 'Fresh Milk', perStudentQtyGrams: 50 }] },
      dinner:    { name: 'Roti & Dal Fry', ingredients: [{ itemName: 'Toor Dal (Lentils)', perStudentQtyGrams: 40 }, { itemName: 'Fresh Onions', perStudentQtyGrams: 15 }] }
    }
  },
  {
    dayOfWeek: 'Thursday',
    meals: {
      breakfast: { name: 'Upma', ingredients: [{ itemName: 'Fresh Onions', perStudentQtyGrams: 15 }] },
      lunch:     { name: 'Rice & Rasam', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 150 }] },
      snacks:    { name: 'Fruit Salad', ingredients: [] },
      dinner:    { name: 'Jeera Rice & Dal', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 130 }, { itemName: 'Toor Dal (Lentils)', perStudentQtyGrams: 30 }] }
    }
  },
  {
    dayOfWeek: 'Friday',
    meals: {
      breakfast: { name: 'Pongal', ingredients: [] },
      lunch:     { name: 'Tomato Rice', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 140 }, { itemName: 'Fresh Tomatoes', perStudentQtyGrams: 40 }, { itemName: 'Fresh Onions', perStudentQtyGrams: 20 }] },
      snacks:    { name: 'Tea & Samosa', ingredients: [{ itemName: 'Fresh Milk', perStudentQtyGrams: 50 }] },
      dinner:    { name: 'Roti & Veg Kurma', ingredients: [{ itemName: 'Fresh Potatoes', perStudentQtyGrams: 50 }, { itemName: 'Fresh Tomatoes', perStudentQtyGrams: 15 }] }
    }
  },
  {
    dayOfWeek: 'Saturday',
    meals: {
      breakfast: { name: 'Bread Toast & Milk', ingredients: [{ itemName: 'Fresh Milk', perStudentQtyGrams: 150 }] },
      lunch:     { name: 'Rice & Potato Fry', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 140 }, { itemName: 'Fresh Potatoes', perStudentQtyGrams: 80 }] },
      snacks:    { name: 'Tea & Biscuits', ingredients: [{ itemName: 'Fresh Milk', perStudentQtyGrams: 50 }] },
      dinner:    { name: 'Fried Rice', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 130 }, { itemName: 'Fresh Onions', perStudentQtyGrams: 20 }] }
    }
  },
  {
    dayOfWeek: 'Sunday',
    meals: {
      breakfast: { name: 'Aloo Paratha', ingredients: [{ itemName: 'Fresh Potatoes', perStudentQtyGrams: 120 }] },
      lunch:     { name: 'Special Lunch', ingredients: [{ itemName: 'Basmati Rice', perStudentQtyGrams: 150 }, { itemName: 'Fresh Tomatoes', perStudentQtyGrams: 30 }] },
      snacks:    { name: 'Coffee & Cookies', ingredients: [{ itemName: 'Fresh Milk', perStudentQtyGrams: 50 }] },
      dinner:    { name: 'Roti & Dal Tadka', ingredients: [{ itemName: 'Toor Dal (Lentils)', perStudentQtyGrams: 45 }, { itemName: 'Fresh Onions', perStudentQtyGrams: 15 }] }
    }
  }
];

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
    localStorage.setItem(MOCK_MESS_ITEMS_KEY, JSON.stringify(INITIAL_MESS_ITEMS));
    localStorage.setItem(MOCK_MESS_LOGS_KEY, JSON.stringify(INITIAL_MESS_LOGS));
    localStorage.setItem(MOCK_MESS_MENU_KEY, JSON.stringify(INITIAL_MESS_MENU));
    localStorage.setItem(MOCK_MESS_PURCHASES_KEY, JSON.stringify([]));
    localStorage.setItem(MOCK_MESS_SERVED_LOGS_KEY, JSON.stringify([]));
    localStorage.setItem(MOCK_MESS_GROCERIES_SUPPLIES_KEY, JSON.stringify(INITIAL_GROCERIES_SUPPLIES));
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(INITIAL_USERS));
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
    localStorage.setItem('isDemo', 'true');
    const list = getCollection(MOCK_USERS_KEY);
    const email = data.email ? data.email.toLowerCase() : '';
    const user = list.find(u => u.email.toLowerCase() === email);

    if (user) {
      if (!user.isActive) {
        return Promise.reject({
          response: {
            status: 403,
            data: { message: 'Your account is pending administrator approval. Please contact the administrator.' }
          }
        });
      }
      localStorage.setItem('user', JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role }));
      localStorage.setItem('token', 'mock-demo-token');
      addAuditLog('LOGIN', `${user.name} logged into demo session`);
      return simulateLatency({ token: 'mock-demo-token', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    const role = email === 'raju@mail.com' ? 'mess' : 'admin';
    const name = email === 'raju@mail.com' ? 'Raju Mess Manager' : 'Guest Explorer';
    const fallbackUser = { id: 'demo-user-id', name, email: email || 'guest@demo.com', role };
    localStorage.setItem('user', JSON.stringify(fallbackUser));
    localStorage.setItem('token', 'mock-demo-token');
    addAuditLog('LOGIN', `${name} logged into demo session`);
    return simulateLatency({ token: 'mock-demo-token', user: fallbackUser });
  },
  register: (data) => {
    const list = getCollection(MOCK_USERS_KEY);
    const email = data.email ? data.email.toLowerCase() : '';
    
    if (list.some(u => u.email.toLowerCase() === email)) {
      return Promise.reject({
        response: {
          data: { message: 'Email address already registered' }
        }
      });
    }

    const newUser = {
      _id: `u-${Date.now()}`,
      name: data.name,
      email,
      role: 'viewer',
      isActive: false, // Pending approval
      lastActive: 'Never'
    };

    list.unshift(newUser);
    setCollection(MOCK_USERS_KEY, list);
    addAuditLog('REGISTER', `${data.name} signed up (pending approval)`);

    return simulateLatency({
      message: 'Registration successful! Your account is pending administrator approval.',
      user: newUser
    });
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
      const existing = list[idx];
      const qtyChanged = Number(existing.quantityPurchased) !== Number(data.quantityPurchased);
      if (qtyChanged) {
        if (!data.varianceReason || !data.varianceReason.trim()) {
          return Promise.reject({ response: { data: { message: 'Variance reason is mandatory when adjusting stock quantity.' } } });
        }
      }
      list[idx] = {
        ...list[idx],
        ...data,
        quantityPurchased: Number(data.quantityPurchased),
        unitPrice: Number(data.unitPrice || 0),
        totalCost: Number(data.totalCost || 0)
      };
      setCollection(MOCK_ITEMS_KEY, list);
      addAuditLog('ITEM_UPDATE', qtyChanged
        ? `Updated item: ${list[idx].itemName} (Qty adjusted: ${existing.quantityPurchased} -> ${list[idx].quantityPurchased}. Reason: ${data.varianceReason})`
        : `Updated item details: ${list[idx].itemName}`
      );
      return simulateLatency(list[idx]);
    }
    return Promise.reject({ response: { data: { message: 'Item not found' } } });
  },
  delete: (id, varianceReason) => {
    if (!varianceReason || !varianceReason.trim()) {
      return Promise.reject({ response: { data: { message: 'Reason for deletion is mandatory.' } } });
    }
    let list = getCollection(MOCK_ITEMS_KEY);
    const itemToDelete = list.find(i => i._id === id);
    list = list.filter(i => i._id !== id);
    setCollection(MOCK_ITEMS_KEY, list);

    // Also clean up distributions matching this item
    let dists = getCollection(MOCK_DISTS_KEY);
    dists = dists.filter(d => (d.item?._id || d.item) !== id);
    setCollection(MOCK_DISTS_KEY, dists);

    if (itemToDelete) {
      addAuditLog('ITEM_DELETE', `Deleted item: ${itemToDelete.itemName}. Reason: ${varianceReason}`);
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
    const { search, startDate, endDate } = params;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => 
        (d.item?.itemName || '').toLowerCase().includes(q) ||
        (d.distributedToDepartment || '').toLowerCase().includes(q) ||
        (d.distributedTo || '').toLowerCase().includes(q)
      );
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      list = list.filter(d => new Date(d.dateOfDistribution).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTimestamp = end.getTime();
      list = list.filter(d => new Date(d.dateOfDistribution).getTime() <= endTimestamp);
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
    return simulateLatency(getCollection(MOCK_USERS_KEY));
  },
  create: (data) => {
    const list = getCollection(MOCK_USERS_KEY);
    const newUser = { _id: `u-${Date.now()}`, isActive: true, ...data };
    list.unshift(newUser);
    setCollection(MOCK_USERS_KEY, list);
    return simulateLatency(newUser);
  },
  update: (id, data) => {
    const list = getCollection(MOCK_USERS_KEY);
    const idx = list.findIndex(u => u._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setCollection(MOCK_USERS_KEY, list);
      return simulateLatency(list[idx]);
    }
    return Promise.reject({ response: { data: { message: 'User not found' } } });
  },
  delete: (id) => {
    let list = getCollection(MOCK_USERS_KEY);
    list = list.filter(u => u._id !== id);
    setCollection(MOCK_USERS_KEY, list);
    return simulateLatency({ message: 'User deleted' });
  }
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
      else if (remaining <= (item.lowStockThreshold || 5)) lowStockItems++;

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
    let list = getCollection(MOCK_AUDIT_KEY);
    const { actionType, search } = params;

    if (actionType) {
      list = list.filter(log => log.actionType === actionType);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(log => 
        (log.notes && log.notes.toLowerCase().includes(q)) ||
        (log.item?.itemName && log.item.itemName.toLowerCase().includes(q)) ||
        (log.performedBy?.name && log.performedBy.name.toLowerCase().includes(q))
      );
    }

    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(200, parseInt(params.limit) || 50);
    const startIndex = (page - 1) * limit;
    const paginatedList = list.slice(startIndex, startIndex + limit);

    return simulateLatency({
      logs: paginatedList,
      page,
      pages: Math.ceil(list.length / limit),
      total: list.length
    });
  }
};

export const mockAlertsAPI = {
  getActive: () => {
    const alerts = getCollection(MOCK_ALERTS_KEY);
    // Auto-inject mess-related alerts
    const messItems = getCollection(MOCK_MESS_ITEMS_KEY);
    const messAlerts = [];
    messItems.forEach(item => {
      if (item.quantity <= 0) {
        messAlerts.push({
          _id: `mess-alert-oos-${item._id}`,
          severity: 'High',
          issue_type: 'Mess Stockout',
          message: `🍽️ Mess item "${item.name}" is OUT OF STOCK (0 ${item.uom} remaining).`,
          recommended_action: `Purchase ${item.threshold * 2} ${item.uom} of ${item.name} from the local supplier immediately.`,
          action_code: 'AUTO_ORDER',
          item_id: item._id
        });
      } else if (item.quantity <= item.threshold) {
        messAlerts.push({
          _id: `mess-alert-low-${item._id}`,
          severity: 'Medium',
          issue_type: 'Mess Low Stock',
          message: `🍽️ Mess item "${item.name}" is running low: ${item.quantity} ${item.uom} remaining (threshold: ${item.threshold}).`,
          recommended_action: `Restock ${item.name} before the next weekly menu cycle.`,
          action_code: 'AUDIT',
          item_id: item._id
        });
      }
    });
    return simulateLatency([...alerts, ...messAlerts]);
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
        return remaining <= (i.lowStockThreshold || 5);
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

export const mockMessAPI = {
  getItems: () => {
    return simulateLatency(getCollection(MOCK_MESS_ITEMS_KEY));
  },
  createItem: (data) => {
    const list = getCollection(MOCK_MESS_ITEMS_KEY);
    const newItem = {
      ...data,
      _id: `mi-${Date.now()}`,
      quantity: Number(data.quantity || 0),
      threshold: Number(data.threshold || 5),
      costPerUnit: Number(data.costPerUnit || 0)
    };
    list.unshift(newItem);
    setCollection(MOCK_MESS_ITEMS_KEY, list);
    addAuditLog('MESS_ITEM_CREATE', `Added mess item: ${newItem.name}`);
    return simulateLatency(newItem);
  },
  updateItem: (id, data) => {
    const list = getCollection(MOCK_MESS_ITEMS_KEY);
    const idx = list.findIndex(i => i._id === id);
    if (idx !== -1) {
      const existing = list[idx];
      const qtyChanged = Number(existing.quantity) !== Number(data.quantity);
      if (qtyChanged) {
        if (!data.varianceReason || !data.varianceReason.trim()) {
          return Promise.reject({ response: { data: { message: 'Variance reason is mandatory when adjusting stock quantity.' } } });
        }
      }
      list[idx] = {
        ...list[idx],
        ...data,
        quantity: Number(data.quantity),
        threshold: Number(data.threshold || 5),
        costPerUnit: Number(data.costPerUnit || 0)
      };
      setCollection(MOCK_MESS_ITEMS_KEY, list);
      addAuditLog('MESS_ITEM_UPDATE', qtyChanged
        ? `Updated mess item: ${list[idx].name} (Qty adjusted: ${existing.quantity} -> ${list[idx].quantity}. Reason: ${data.varianceReason})`
        : `Updated mess item: ${list[idx].name}`
      );
      return simulateLatency(list[idx]);
    }
    return Promise.reject({ response: { data: { message: 'Item not found' } } });
  },
  deleteItem: (id, varianceReason) => {
    if (!varianceReason || !varianceReason.trim()) {
      return Promise.reject({ response: { data: { message: 'Reason for deletion is mandatory.' } } });
    }
    let list = getCollection(MOCK_MESS_ITEMS_KEY);
    const itemToDelete = list.find(i => i._id === id);
    list = list.filter(i => i._id !== id);
    setCollection(MOCK_MESS_ITEMS_KEY, list);
    if (itemToDelete) {
      addAuditLog('MESS_ITEM_DELETE', `Deleted mess item: ${itemToDelete.name}. Reason: ${varianceReason}`);
    }
    return simulateLatency({ message: 'Deleted successfully' });
  },
  logConsumption: (data) => {
    const { mealType, itemsUsed = [], spoilage = [], date, issuedBy, issuedTo, purposeOfUsed, particulars } = data;
    const items = getCollection(MOCK_MESS_ITEMS_KEY);

    // Validate stocks
    for (const u of itemsUsed) {
      const match = items.find(i => i._id === u.item);
      if (!match) return Promise.reject({ response: { data: { message: 'Item not found' } } });
      if (match.quantity < u.qtyUsed) {
        return Promise.reject({ response: { data: { message: `Insufficient stock for ${match.name}! Available: ${match.quantity}, Requested: ${u.qtyUsed}` } } });
      }
    }
    for (const s of spoilage) {
      const match = items.find(i => i._id === s.item);
      if (!match) return Promise.reject({ response: { data: { message: 'Item not found' } } });
      if (match.quantity < s.qtySpoiled) {
        return Promise.reject({ response: { data: { message: `Insufficient stock to waste for ${match.name}! Available: ${match.quantity}, Requested: ${s.qtySpoiled}` } } });
      }
    }

    // Deduct stock
    itemsUsed.forEach(u => {
      const idx = items.findIndex(i => i._id === u.item);
      if (idx !== -1) items[idx].quantity -= Number(u.qtyUsed);
    });
    spoilage.forEach(s => {
      const idx = items.findIndex(i => i._id === s.item);
      if (idx !== -1) items[idx].quantity -= Number(s.qtySpoiled);
    });
    setCollection(MOCK_MESS_ITEMS_KEY, items);

    // Save log
    const logs = getCollection(MOCK_MESS_LOGS_KEY);
    const populatedItemsUsed = itemsUsed.map(u => {
      const item = items.find(i => i._id === u.item);
      return { item: { _id: u.item, name: item?.name, uom: item?.uom, category: item?.category }, qtyUsed: u.qtyUsed };
    });
    const populatedSpoilage = spoilage.map(s => {
      const item = items.find(i => i._id === s.item);
      return { item: { _id: s.item, name: item?.name, uom: item?.uom, category: item?.category }, qtySpoiled: s.qtySpoiled, reason: s.reason };
    });

    const newLog = {
      _id: `ml-${Date.now()}`,
      date: date || new Date().toISOString(),
      mealType,
      itemsUsed: populatedItemsUsed,
      spoilage: populatedSpoilage,
      issuedBy,
      issuedTo,
      purposeOfUsed,
      particulars,
      recordedBy: { name: 'Guest Explorer' }
    };
    logs.unshift(newLog);
    setCollection(MOCK_MESS_LOGS_KEY, logs);
    addAuditLog('MESS_CONSUME', `Logged consumption/spoilage for meal: ${mealType}`);
    return simulateLatency(newLog);
  },
  getConsumptionLogs: () => {
    return simulateLatency(getCollection(MOCK_MESS_LOGS_KEY));
  },
  getPurchases: () => {
    return simulateLatency(getCollection(MOCK_MESS_PURCHASES_KEY));
  },
  createPurchase: (data) => {
    const list = getCollection(MOCK_MESS_PURCHASES_KEY);
    const items = getCollection(MOCK_MESS_ITEMS_KEY);
    const { item: itemId, purchaseDate, billNo, company, uom, quantityPurchased, unitPrice, shopName, particulars } = data;

    const matchIdx = items.findIndex(i => i._id === itemId);
    if (matchIdx !== -1) {
      items[matchIdx].quantity += Number(quantityPurchased);
      setCollection(MOCK_MESS_ITEMS_KEY, items);
    }

    const matchedItem = items.find(i => i._id === itemId);

    const newPurchase = {
      _id: `mp-${Date.now()}`,
      item: { _id: itemId, name: matchedItem?.name || 'Unknown Item', category: matchedItem?.category || 'OTHER', uom: matchedItem?.uom || uom },
      purchaseDate: purchaseDate || new Date().toISOString(),
      billNo,
      company,
      uom,
      quantityPurchased: Number(quantityPurchased),
      unitPrice: Number(unitPrice),
      totalCost: Number(quantityPurchased) * Number(unitPrice),
      shopName,
      particulars,
      recordedBy: { name: 'Guest Explorer', email: 'guest@nirvahana.com' }
    };

    list.unshift(newPurchase);
    setCollection(MOCK_MESS_PURCHASES_KEY, list);
    addAuditLog('MESS_PURCHASE', `Purchased ${quantityPurchased} ${uom} of ${matchedItem?.name || itemId}`);
    return simulateLatency(newPurchase);
  },
  deletePurchase: (id) => {
    let list = getCollection(MOCK_MESS_PURCHASES_KEY);
    const purchase = list.find(p => p._id === id);
    if (!purchase) return Promise.reject({ response: { data: { message: 'Purchase not found' } } });

    // Decrement stock
    const items = getCollection(MOCK_MESS_ITEMS_KEY);
    const itemId = purchase.item._id || purchase.item;
    const matchIdx = items.findIndex(i => i._id === itemId);
    if (matchIdx !== -1) {
      items[matchIdx].quantity -= Number(purchase.quantityPurchased);
      setCollection(MOCK_MESS_ITEMS_KEY, items);
    }

    list = list.filter(p => p._id !== id);
    setCollection(MOCK_MESS_PURCHASES_KEY, list);
    addAuditLog('MESS_PURCHASE_DELETE', `Deleted purchase and reverted stock`);
    return simulateLatency({ message: 'Purchase deleted' });
  },
  getServedLogs: () => {
    return simulateLatency(getCollection(MOCK_MESS_SERVED_LOGS_KEY));
  },
  createServedLog: (data) => {
    const list = getCollection(MOCK_MESS_SERVED_LOGS_KEY);
    const total = (Number(data.boysHostel) || 0) +
                  (Number(data.girlsHostel) || 0) +
                  (Number(data.externals) || 0) +
                  (Number(data.trainers) || 0) +
                  (Number(data.guestsFaculty) || 0) +
                  (Number(data.staffWardens) || 0) +
                  (Number(data.others) || 0);

    const newLog = {
      ...data,
      _id: `msl-${Date.now()}`,
      date: data.date || new Date().toISOString(),
      boysHostel: Number(data.boysHostel) || 0,
      girlsHostel: Number(data.girlsHostel) || 0,
      externals: Number(data.externals) || 0,
      trainers: Number(data.trainers) || 0,
      guestsFaculty: Number(data.guestsFaculty) || 0,
      staffWardens: Number(data.staffWardens) || 0,
      others: Number(data.others) || 0,
      total,
      recordedBy: { name: 'Guest Explorer', email: 'guest@nirvahana.com' }
    };

    list.unshift(newLog);
    setCollection(MOCK_MESS_SERVED_LOGS_KEY, list);
    addAuditLog('MESS_SERVED_LOG', `Logged served meal: ${data.itemsNames} (${data.mealType})`);
    return simulateLatency(newLog);
  },
  deleteServedLog: (id) => {
    let list = getCollection(MOCK_MESS_SERVED_LOGS_KEY);
    list = list.filter(l => l._id !== id);
    setCollection(MOCK_MESS_SERVED_LOGS_KEY, list);
    addAuditLog('MESS_SERVED_LOG_DELETE', `Deleted served meal log`);
    return simulateLatency({ message: 'Deleted successfully' });
  },
  getMenu: () => {
    return simulateLatency(getCollection(MOCK_MESS_MENU_KEY));
  },
  updateMenuDay: (day, data) => {
    const list = getCollection(MOCK_MESS_MENU_KEY);
    const idx = list.findIndex(m => m.dayOfWeek === day);
    if (idx !== -1) {
      list[idx].meals = data.meals;
      setCollection(MOCK_MESS_MENU_KEY, list);
      return simulateLatency(list[idx]);
    }
    const newDay = { dayOfWeek: day, meals: data.meals };
    list.push(newDay);
    setCollection(MOCK_MESS_MENU_KEY, list);
    return simulateLatency(newDay);
  },
  getForecast: (students = 100) => {
    const menu = getCollection(MOCK_MESS_MENU_KEY);
    const items = getCollection(MOCK_MESS_ITEMS_KEY);

    const demandGrams = {};
    menu.forEach(day => {
      ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(mealKey => {
        const meal = day.meals?.[mealKey];
        if (meal?.ingredients) {
          meal.ingredients.forEach(ing => {
            const nameLower = ing.itemName.trim().toLowerCase();
            demandGrams[nameLower] = (demandGrams[nameLower] || 0) + (ing.perStudentQtyGrams * students);
          });
        }
      });
    });

    const forecastResults = [];
    for (const [ingNameLower, totalGrams] of Object.entries(demandGrams)) {
      const requiredKg = totalGrams / 1000;
      const match = items.find(it => it.name.trim().toLowerCase() === ingNameLower);
      const currentStock = match ? match.quantity : 0;
      const uom = match ? match.uom : 'Kg';
      const shortage = Math.max(0, requiredKg - currentStock);

      forecastResults.push({
        name: match ? match.name : ingNameLower.toUpperCase(),
        category: match ? match.category : 'OTHER',
        required: requiredKg,
        currentStock,
        uom,
        shortage,
        estimatedCost: shortage * (match ? match.costPerUnit : 50),
        vendor: match ? { name: 'Local Supplier', email: 'supplier@mail.com', phone: '+919998887776' } : null
      });
    }

    return simulateLatency(forecastResults);
  },
  bulkImportItems: (data) => {
    const list = getCollection(MOCK_MESS_ITEMS_KEY);
    let imported = 0;
    let failed = 0;
    const errors = [];

    data.forEach((row, i) => {
      try {
        const name = (row.name || '').toString().trim();
        if (!name) throw new Error('Item name is required');

        const category = normalizeCategory(row.category);
        const quantity = parseFloat(row.quantity) || 0;
        const uom = normalizeUOM(row.uom);
        const threshold = parseFloat(row.threshold) || 5;
        const costPerUnit = parseFloat(row.costPerUnit) || 0;
        const nameTelugu = (row.nameTelugu || '').toString().trim() || undefined;
        const idx = list.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
        if (idx !== -1) {
          list[idx].quantity += quantity;
          if (nameTelugu) list[idx].nameTelugu = nameTelugu;
          if (costPerUnit) list[idx].costPerUnit = costPerUnit;
        } else {
          list.unshift({
            _id: `mi-${Date.now()}-${i}`,
            name,
            nameTelugu,
            category,
            quantity,
            uom,
            threshold,
            costPerUnit
          });
        }
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.name || '—', reason: err.message });
      }
    });

    setCollection(MOCK_MESS_ITEMS_KEY, list);
    addAuditLog('MESS_BULK_ITEMS', `Imported ${imported} items in batch`);
    return simulateLatency({ imported, failed, errors });
  },
  bulkImportPurchases: (data) => {
    const list = getCollection(MOCK_MESS_PURCHASES_KEY);
    const items = getCollection(MOCK_MESS_ITEMS_KEY);
    let imported = 0;
    let failed = 0;
    const errors = [];

    data.forEach((row, i) => {
      try {
        const itemName = (row.itemName || '').toString().trim();
        if (!itemName) throw new Error('Item Name is required');

        const quantityPurchased = parseFloat(row.quantityPurchased) || 0;
        const uom = normalizeUOM(row.uom);
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const purchaseDate = row.purchaseDate || new Date().toISOString();
        const billNo = (row.billNo || '').toString().trim() || undefined;
        const company = (row.company || '').toString().trim() || undefined;
        const shopName = (row.shopName || '').toString().trim() || undefined;
        const particulars = (row.particulars || '').toString().trim() || undefined;

        let itemDoc = items.find(it => it.name.toLowerCase() === itemName.toLowerCase());
        if (!itemDoc) {
          itemDoc = {
            _id: `mi-${Date.now()}-${i}`,
            name: itemName,
            category: 'OTHER',
            quantity: 0,
            uom: uom,
            threshold: 5
          };
          items.unshift(itemDoc);
        }

        itemDoc.quantity += quantityPurchased;

        const newPurchase = {
          _id: `mp-${Date.now()}-${i}`,
          item: { _id: itemDoc._id, name: itemDoc.name, category: itemDoc.category, uom: itemDoc.uom },
          purchaseDate,
          billNo,
          company,
          uom,
          quantityPurchased,
          unitPrice,
          totalCost: quantityPurchased * unitPrice,
          shopName,
          particulars,
          recordedBy: { name: 'Guest Explorer', email: 'guest@nirvahana.com' }
        };

        list.unshift(newPurchase);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.itemName || '—', reason: err.message });
      }
    });

    setCollection(MOCK_MESS_ITEMS_KEY, items);
    setCollection(MOCK_MESS_PURCHASES_KEY, list);
    addAuditLog('MESS_BULK_PURCHASE', `Imported ${imported} purchases in batch`);
    return simulateLatency({ imported, failed, errors });
  },
  bulkImportConsumption: (data) => {
    const list = getCollection(MOCK_MESS_LOGS_KEY);
    const items = getCollection(MOCK_MESS_ITEMS_KEY);
    let imported = 0;
    let failed = 0;
    const errors = [];

    data.forEach((row, i) => {
      try {
        const itemName = (row.itemName || '').toString().trim();
        if (!itemName) throw new Error('Item Name is required');

        const qtyUsed = parseFloat(row.qtyUsed) || 0;
        const qtySpoiled = parseFloat(row.qtySpoiled) || 0;
        const date = row.date || new Date().toISOString();
        const mealType = (row.mealType || 'GENERAL').toString().toUpperCase().trim();
        const reason = (row.reason || '').toString().trim() || undefined;
        const issuedBy = (row.issuedBy || '').toString().trim() || undefined;
        const issuedTo = (row.issuedTo || '').toString().trim() || undefined;
        const purposeOfUsed = (row.purposeOfUsed || '').toString().trim() || undefined;
        const particulars = (row.particulars || '').toString().trim() || undefined;
        const uom = normalizeUOM(row.uom);

        let itemDoc = items.find(it => it.name.toLowerCase() === itemName.toLowerCase());
        if (!itemDoc) {
          itemDoc = {
            _id: `mi-${Date.now()}-${i}`,
            name: itemName,
            category: 'OTHER',
            quantity: 0,
            uom: uom,
            threshold: 5
          };
          items.unshift(itemDoc);
        }

        itemDoc.quantity -= (qtyUsed + qtySpoiled);

        const itemsUsed = qtyUsed > 0 ? [{ item: { _id: itemDoc._id, name: itemDoc.name, uom: itemDoc.uom, category: itemDoc.category }, qtyUsed }] : [];
        const spoilage = qtySpoiled > 0 ? [{ item: { _id: itemDoc._id, name: itemDoc.name, uom: itemDoc.uom, category: itemDoc.category }, qtySpoiled, reason }] : [];

        const newLog = {
          _id: `ml-${Date.now()}-${i}`,
          date,
          mealType,
          itemsUsed,
          spoilage,
          issuedBy,
          issuedTo,
          purposeOfUsed,
          particulars,
          recordedBy: { name: 'Guest Explorer' }
        };
        list.unshift(newLog);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.itemName || '—', reason: err.message });
      }
    });

    setCollection(MOCK_MESS_ITEMS_KEY, items);
    setCollection(MOCK_MESS_LOGS_KEY, list);
    addAuditLog('MESS_BULK_CONSUME', `Imported ${imported} consumption logs in batch`);
    return simulateLatency({ imported, failed, errors });
  },
  bulkImportServedLogs: (data) => {
    const list = getCollection(MOCK_MESS_SERVED_LOGS_KEY);
    let imported = 0;
    let failed = 0;
    const errors = [];

    data.forEach((row, i) => {
      try {
        const itemsNames = (row.itemsNames || '').toString().trim();
        if (!itemsNames) throw new Error('Items served names are required');

        const date = row.date || new Date().toISOString();
        const mealType = (row.mealType || 'LUNCH').toString().toUpperCase().trim();
        const foodLeftOver = (row.foodLeftOver || '').toString().trim() || undefined;
        const feedback = (row.feedback || '').toString().trim() || undefined;

        const boysHostel = parseInt(row.boysHostel) || 0;
        const girlsHostel = parseInt(row.girlsHostel) || 0;
        const externals = parseInt(row.externals) || 0;
        const trainers = parseInt(row.trainers) || 0;
        const guestsFaculty = parseInt(row.guestsFaculty) || 0;
        const staffWardens = parseInt(row.staffWardens) || 0;
        const others = parseInt(row.others) || 0;
        const total = boysHostel + girlsHostel + externals + trainers + guestsFaculty + staffWardens + others;

        const newLog = {
          _id: `msl-${Date.now()}-${i}`,
          date,
          mealType,
          itemsNames,
          foodLeftOver,
          feedback,
          boysHostel,
          girlsHostel,
          externals,
          trainers,
          guestsFaculty,
          staffWardens,
          others,
          total,
          recordedBy: { name: 'Guest Explorer', email: 'guest@nirvahana.com' }
        };
        list.unshift(newLog);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.itemsNames || '—', reason: err.message });
      }
    });

    setCollection(MOCK_MESS_SERVED_LOGS_KEY, list);
    addAuditLog('MESS_BULK_SERVED', `Imported ${imported} served meal logs in batch`);
    return simulateLatency({ imported, failed, errors });
  },
  getGroceriesSupplies: () => {
    return simulateLatency(getCollection(MOCK_MESS_GROCERIES_SUPPLIES_KEY));
  },
  createGroceriesSupply: (data) => {
    const list = getCollection(MOCK_MESS_GROCERIES_SUPPLIES_KEY);
    const items = getCollection(MOCK_MESS_ITEMS_KEY);
    const { item: itemId, dateIssued, quantityIssued, purposeOfUsed, purposeOfUsing, issuedTo, issuedBy, particularsExtraCooking } = data;

    const matchIdx = items.findIndex(i => i._id === itemId);
    if (matchIdx === -1) return Promise.reject({ response: { data: { message: 'Item not found in catalog' } } });

    const matchedItem = items[matchIdx];
    if (matchedItem.quantity < Number(quantityIssued)) {
      return Promise.reject({ response: { data: { message: `Insufficient stock for ${matchedItem.name}! Available: ${matchedItem.quantity}, Requested: ${quantityIssued}` } } });
    }

    // Decrement stock
    items[matchIdx].quantity -= Number(quantityIssued);
    setCollection(MOCK_MESS_ITEMS_KEY, items);

    const newSupply = {
      _id: `mgs-${Date.now()}`,
      itemName: matchedItem.name,
      item: { _id: itemId, name: matchedItem.name, category: matchedItem.category, uom: matchedItem.uom },
      dateIssued: dateIssued || new Date().toISOString(),
      uom: matchedItem.uom,
      quantityIssued: Number(quantityIssued),
      purposeOfUsed,
      purposeOfUsing,
      issuedTo,
      issuedBy,
      particularsExtraCooking,
      recordedBy: { name: 'Guest Explorer', email: 'guest@nirvahana.com' }
    };

    list.unshift(newSupply);
    setCollection(MOCK_MESS_GROCERIES_SUPPLIES_KEY, list);
    addAuditLog('MESS_GROCERIES_SUPPLY', `Issued ${quantityIssued} ${matchedItem.uom} of ${matchedItem.name} to ${issuedTo}`);
    return simulateLatency(newSupply);
  },
  deleteGroceriesSupply: (id) => {
    let list = getCollection(MOCK_MESS_GROCERIES_SUPPLIES_KEY);
    const supply = list.find(s => s._id === id);
    if (!supply) return Promise.reject({ response: { data: { message: 'Groceries supply record not found' } } });

    // Increment stock back
    const items = getCollection(MOCK_MESS_ITEMS_KEY);
    const itemId = supply.item._id || supply.item;
    const matchIdx = items.findIndex(i => i._id === itemId);
    if (matchIdx !== -1) {
      items[matchIdx].quantity += Number(supply.quantityIssued);
      setCollection(MOCK_MESS_ITEMS_KEY, items);
    }

    list = list.filter(s => s._id !== id);
    setCollection(MOCK_MESS_GROCERIES_SUPPLIES_KEY, list);
    addAuditLog('MESS_GROCERIES_SUPPLY_DELETE', `Deleted grocery supply record and reverted stock`);
    return simulateLatency({ message: 'Groceries supply record deleted' });
  },
  bulkImportGroceriesSupplies: (data) => {
    const list = getCollection(MOCK_MESS_GROCERIES_SUPPLIES_KEY);
    const items = getCollection(MOCK_MESS_ITEMS_KEY);
    let imported = 0;
    let failed = 0;
    const errors = [];

    data.forEach((row, i) => {
      try {
        const itemName = (row.itemName || '').toString().trim();
        if (!itemName) throw new Error('Item Name is required');

        const quantityIssued = !isNaN(Number(row.quantityIssued)) && Number(row.quantityIssued) > 0 ? Number(row.quantityIssued) : 1;
        const issuedTo = (row.issuedTo || 'N/A').toString().trim();
        const issuedBy = (row.issuedBy || 'N/A').toString().trim();
        const dateIssued = row.dateIssued || new Date().toISOString();

        const matchIdx = items.findIndex(item => item.name.toLowerCase() === itemName.toLowerCase());
        if (matchIdx === -1) throw new Error(`Item "${itemName}" not found in catalog`);

        const matchedItem = items[matchIdx];
        if (matchedItem.quantity < quantityIssued) {
          throw new Error(`Insufficient stock: available ${matchedItem.quantity} ${matchedItem.uom}, requested ${quantityIssued}`);
        }

        // Decrement stock
        items[matchIdx].quantity -= quantityIssued;

        const newSupply = {
          _id: `mgs-${Date.now()}-${i}`,
          itemName: matchedItem.name,
          item: { _id: matchedItem._id, name: matchedItem.name, category: matchedItem.category, uom: matchedItem.uom },
          dateIssued,
          uom: matchedItem.uom,
          quantityIssued,
          purposeOfUsed: row.purposeOfUsed || '',
          purposeOfUsing: row.purposeOfUsing || '',
          issuedTo,
          issuedBy,
          particularsExtraCooking: row.particularsExtraCooking || '',
          recordedBy: { name: 'Guest Explorer', email: 'guest@demo.com' }
        };

        list.unshift(newSupply);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.itemName || '—', reason: err.message });
      }
    });

    setCollection(MOCK_MESS_ITEMS_KEY, items);
    setCollection(MOCK_MESS_GROCERIES_SUPPLIES_KEY, list);
    addAuditLog('MESS_BULK_GROCERIES_SUPPLIES', `Imported ${imported} groceries supplies in batch`);
    return simulateLatency({ imported, failed, errors });
  }
};
