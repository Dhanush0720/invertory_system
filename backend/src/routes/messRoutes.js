const express = require('express');
const router = express.Router();
const MessItem = require('../models/MessItem');
const MessConsumption = require('../models/MessConsumption');
const MessMenu = require('../models/MessMenu');
const MessPurchase = require('../models/MessPurchase');
const MessServedLog = require('../models/MessServedLog');
const { protect } = require('../middleware/auth');

// ── CATALOG ITEMS ROUTES ──

// GET /api/mess/items - Fetch all mess inventory catalog items
router.get('/items', protect, async (req, res) => {
  try {
    const items = await MessItem.find().populate('vendor', 'name contact phone');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mess items' });
  }
});

// POST /api/mess/items - Add a new catalog item
router.post('/items', protect, async (req, res) => {
  try {
    const newItem = await MessItem.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add mess item' });
  }
});

// PUT /api/mess/items/:id - Update item details/quantity
router.put('/items/:id', protect, async (req, res) => {
  try {
    const existingItem = await MessItem.findById(req.params.id);
    if (!existingItem) return res.status(404).json({ message: 'Item not found' });

    const qtyChanged = Number(existingItem.quantity) !== Number(req.body.quantity);
    if (qtyChanged) {
      const varianceReason = req.body.varianceReason;
      if (!varianceReason || typeof varianceReason !== 'string' || !varianceReason.trim()) {
        return res.status(400).json({ message: 'Variance reason is mandatory when adjusting stock quantity.' });
      }
    }

    const item = await MessItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update item' });
  }
});

// DELETE /api/mess/items/:id - Remove catalog item
router.delete('/items/:id', protect, async (req, res) => {
  try {
    const varianceReason = req.body.varianceReason || req.query.varianceReason;
    if (!varianceReason || typeof varianceReason !== 'string' || !varianceReason.trim()) {
      return res.status(400).json({ message: 'Reason for deletion is mandatory.' });
    }

    const item = await MessItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// ── DAILY CONSUMPTION & WASTAGE ROUTES ──

// POST /api/mess/consumption - Log daily usage and spoilage (updates inventory quantities)
router.post('/consumption', protect, async (req, res) => {
  try {
    const { mealType, itemsUsed = [], spoilage = [], date, issuedBy, issuedTo, purposeOfUsed, particulars } = req.body;
    
    // 1. Validate stocks before proceeding
    for (const u of itemsUsed) {
      const item = await MessItem.findById(u.item);
      if (!item) return res.status(404).json({ message: `Ingredient ${u.item} not found` });
      if (item.quantity < u.qtyUsed) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}! Available: ${item.quantity}${item.uom}, Requested: ${u.qtyUsed}${item.uom}` });
      }
    }
    for (const s of spoilage) {
      const item = await MessItem.findById(s.item);
      if (!item) return res.status(404).json({ message: `Ingredient ${s.item} not found` });
      if (item.quantity < s.qtySpoiled) {
        return res.status(400).json({ message: `Insufficient stock to write off for ${item.name}! Available: ${item.quantity}${item.uom}, Requested waste: ${s.qtySpoiled}${item.uom}` });
      }
    }

    // 2. Perform stock reductions
    for (const u of itemsUsed) {
      await MessItem.findByIdAndUpdate(u.item, { $inc: { quantity: -Number(u.qtyUsed) } });
    }
    for (const s of spoilage) {
      await MessItem.findByIdAndUpdate(s.item, { $inc: { quantity: -Number(s.qtySpoiled) } });
    }

    // 3. Save the log
    const logEntry = await MessConsumption.create({
      mealType,
      itemsUsed,
      spoilage,
      date: date || undefined,
      issuedBy,
      issuedTo,
      purposeOfUsed,
      particulars,
      recordedBy: req.user._id
    });

    res.status(201).json(logEntry);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to log consumption' });
  }
});

// GET /api/mess/consumption - Get consumption log history
router.get('/consumption', protect, async (req, res) => {
  try {
    const logs = await MessConsumption.find()
      .populate('itemsUsed.item', 'name category uom')
      .populate('spoilage.item', 'name category uom')
      .populate('recordedBy', 'name email')
      .sort({ date: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve logs' });
  }
});

// ── WEEKLY MENU CONFIGURATION ROUTES ──

// GET /api/mess/menu - Fetch weekly menu recipes
router.get('/menu', protect, async (req, res) => {
  try {
    const menu = await MessMenu.find().sort({ createdAt: 1 });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch weekly menu' });
  }
});

// PUT /api/mess/menu/:day - Edit menu for a specific day
router.put('/menu/:day', protect, async (req, res) => {
  try {
    const menuDay = await MessMenu.findOneAndUpdate(
      { dayOfWeek: req.params.day },
      { meals: req.body.meals },
      { new: true, upsert: true }
    );
    res.json(menuDay);
  } catch (err) {
    res.status(400).json({ message: 'Failed to save menu configurations' });
  }
});

// ── DEMAND FORECAST CALCULATOR ROUTE ──

// GET /api/mess/forecast - Predict grocery demand and supplier orders
router.get('/forecast', protect, async (req, res) => {
  try {
    const students = Number(req.query.students) || 100;
    const menu = await MessMenu.find();
    const items = await MessItem.find().populate('vendor');

    // Aggregate required quantities in grams per ingredient name
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

    // Match demand with inventory items
    const forecastResults = [];
    for (const [ingNameLower, totalGrams] of Object.entries(demandGrams)) {
      const requiredKg = totalGrams / 1000;
      
      // Find matching item in catalog
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
        vendor: match?.vendor ? {
          name: match.vendor.name,
          email: match.vendor.contact,
          phone: match.vendor.phone
        } : null
      });
    }

    res.json(forecastResults);
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate demand forecast' });
  }
});

// ── MESS PURCHASES ROUTES ──

// GET /api/mess/purchases - Fetch all mess purchases
router.get('/purchases', protect, async (req, res) => {
  try {
    const purchases = await MessPurchase.find()
      .populate('item', 'name category uom')
      .populate('recordedBy', 'name email')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

// POST /api/mess/purchases - Record a purchase (increments stock)
router.post('/purchases', protect, async (req, res) => {
  try {
    const { item, purchaseDate, billNo, company, uom, quantityPurchased, unitPrice, shopName, particulars } = req.body;
    
    const messItem = await MessItem.findById(item);
    if (!messItem) return res.status(404).json({ message: 'Item not found in catalog' });

    // Increment stock
    await MessItem.findByIdAndUpdate(item, { $inc: { quantity: Number(quantityPurchased) } });

    const newPurchase = await MessPurchase.create({
      item,
      purchaseDate,
      billNo,
      company,
      uom,
      quantityPurchased: Number(quantityPurchased),
      unitPrice: Number(unitPrice),
      shopName,
      particulars,
      recordedBy: req.user._id
    });

    res.status(201).json(newPurchase);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to record purchase' });
  }
});

// DELETE /api/mess/purchases/:id - Remove a purchase (decrements stock)
router.delete('/purchases/:id', protect, async (req, res) => {
  try {
    const purchase = await MessPurchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase record not found' });

    // Decrement stock
    await MessItem.findByIdAndUpdate(purchase.item, { $inc: { quantity: -Number(purchase.quantityPurchased) } });
    await MessPurchase.findByIdAndDelete(req.params.id);

    res.json({ message: 'Purchase deleted and stock reverted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete purchase' });
  }
});

// ── DAILY SERVED MEALS & ATTENDANCE ROUTES ──

// GET /api/mess/served-logs - Fetch all served meals logs
router.get('/served-logs', protect, async (req, res) => {
  try {
    const logs = await MessServedLog.find()
      .populate('recordedBy', 'name email')
      .sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch served meal logs' });
  }
});

// POST /api/mess/served-logs - Log a served meal
router.post('/served-logs', protect, async (req, res) => {
  try {
    const newLog = await MessServedLog.create({
      ...req.body,
      recordedBy: req.user._id
    });
    res.status(201).json(newLog);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to log served meal' });
  }
});

// DELETE /api/mess/served-logs/:id - Delete a served meal log
router.delete('/served-logs/:id', protect, async (req, res) => {
  try {
    const log = await MessServedLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Served log not found' });
    res.json({ message: 'Served meal log deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete served log' });
  }
});

// ── BULK IMPORTS ──

// Helper to parse date
function parseExcelDate(raw) {
  if (!raw) return new Date();
  if (typeof raw === 'number') {
    return new Date((raw - 25569) * 86400000);
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

// POST /api/mess/bulk-import-items
router.post('/bulk-import-items', protect, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ message: 'No items provided' });

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        const name = (row.name || '').toString().trim();
        if (!name) throw new Error('Item name is required');

        const category = (row.category || 'OTHER').toString().toUpperCase().trim();
        const quantity = parseFloat(row.quantity) || 0;
        const uom = (row.uom || 'Kg').toString().trim();
        const threshold = parseFloat(row.threshold) || 5;
        const costPerUnit = parseFloat(row.costPerUnit) || 0;
        const nameTelugu = (row.nameTelugu || '').toString().trim() || undefined;
        const packingQuantity = parseFloat(row.packingQuantity) || 0;
        const dateOfVerified = row.dateOfVerified ? parseExcelDate(row.dateOfVerified) : undefined;
        const expiryDate = row.expiryDate ? parseExcelDate(row.expiryDate) : undefined;

        // Check if exists
        let itemDoc = await MessItem.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (itemDoc) {
          // Merge / update quantity
          itemDoc.quantity += quantity;
          if (nameTelugu) itemDoc.nameTelugu = nameTelugu;
          if (packingQuantity) itemDoc.packingQuantity = packingQuantity;
          if (dateOfVerified) itemDoc.dateOfVerified = dateOfVerified;
          if (expiryDate) itemDoc.expiryDate = expiryDate;
          if (costPerUnit) itemDoc.costPerUnit = costPerUnit;
          await itemDoc.save();
        } else {
          // Create new
          await MessItem.create({
            name,
            nameTelugu,
            category,
            quantity,
            uom,
            threshold,
            costPerUnit,
            packingQuantity,
            dateOfVerified,
            expiryDate
          });
        }
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.name || '—', reason: err.message });
      }
    }

    res.json({ imported, failed, errors });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Bulk import items failed' });
  }
});

// POST /api/mess/bulk-import-purchases
router.post('/bulk-import-purchases', protect, async (req, res) => {
  try {
    const { purchases } = req.body;
    if (!Array.isArray(purchases) || !purchases.length)
      return res.status(400).json({ message: 'No purchases provided' });

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < purchases.length; i++) {
      const row = purchases[i];
      try {
        const itemName = (row.itemName || '').toString().trim();
        if (!itemName) throw new Error('Item Name is required');

        const quantityPurchased = parseFloat(row.quantityPurchased) || 0;
        if (quantityPurchased <= 0) throw new Error('Quantity purchased must be greater than 0');

        const uom = (row.uom || 'Kg').toString().trim();
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const purchaseDate = parseExcelDate(row.purchaseDate);
        const billNo = (row.billNo || '').toString().trim() || undefined;
        const company = (row.company || '').toString().trim() || undefined;
        const shopName = (row.shopName || '').toString().trim() || undefined;
        const particulars = (row.particulars || '').toString().trim() || undefined;

        // Resolve MessItem
        let itemDoc = await MessItem.findOne({ name: { $regex: new RegExp(`^${itemName}$`, 'i') } });
        if (!itemDoc) {
          // Create a placeholder item in the catalog
          itemDoc = await MessItem.create({
            name: itemName,
            category: 'OTHER',
            quantity: 0,
            uom,
            threshold: 5
          });
        }

        // Increment stock
        itemDoc.quantity += quantityPurchased;
        await itemDoc.save();

        // Create purchase record
        await MessPurchase.create({
          item: itemDoc._id,
          purchaseDate,
          billNo,
          company,
          uom,
          quantityPurchased,
          unitPrice,
          totalCost: quantityPurchased * unitPrice,
          shopName,
          particulars,
          recordedBy: req.user._id
        });

        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.itemName || '—', reason: err.message });
      }
    }

    res.json({ imported, failed, errors });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Bulk import purchases failed' });
  }
});

// POST /api/mess/bulk-import-consumption
router.post('/bulk-import-consumption', protect, async (req, res) => {
  try {
    const { logs } = req.body;
    if (!Array.isArray(logs) || !logs.length)
      return res.status(400).json({ message: 'No logs provided' });

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < logs.length; i++) {
      const row = logs[i];
      try {
        const itemName = (row.itemName || '').toString().trim();
        if (!itemName) throw new Error('Item Name is required');

        const qtyUsed = parseFloat(row.qtyUsed) || 0;
        const qtySpoiled = parseFloat(row.qtySpoiled) || 0;
        if (qtyUsed <= 0 && qtySpoiled <= 0) throw new Error('Quantity used or spoiled must be greater than 0');

        const date = parseExcelDate(row.date);
        const mealType = (row.mealType || 'GENERAL').toString().toUpperCase().trim();
        const reason = (row.reason || '').toString().trim() || undefined;
        const issuedBy = (row.issuedBy || '').toString().trim() || undefined;
        const issuedTo = (row.issuedTo || '').toString().trim() || undefined;
        const purposeOfUsed = (row.purposeOfUsed || '').toString().trim() || undefined;
        const particulars = (row.particulars || '').toString().trim() || undefined;

        const uom = (row.uom || 'Kg').toString().trim();
        // Resolve MessItem
        let itemDoc = await MessItem.findOne({ name: { $regex: new RegExp(`^${itemName}$`, 'i') } });
        if (!itemDoc) {
          // Create placeholder
          itemDoc = await MessItem.create({
            name: itemName,
            category: 'OTHER',
            quantity: 0,
            uom: uom,
            threshold: 5
          });
        }

        // Deduct stock
        itemDoc.quantity -= (qtyUsed + qtySpoiled);
        await itemDoc.save();

        const itemsUsed = qtyUsed > 0 ? [{ item: itemDoc._id, qtyUsed }] : [];
        const spoilage = qtySpoiled > 0 ? [{ item: itemDoc._id, qtySpoiled, reason }] : [];

        await MessConsumption.create({
          date,
          mealType,
          itemsUsed,
          spoilage,
          issuedBy,
          issuedTo,
          purposeOfUsed,
          particulars,
          recordedBy: req.user._id
        });

        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.itemName || '—', reason: err.message });
      }
    }

    res.json({ imported, failed, errors });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Bulk import consumption failed' });
  }
});

// POST /api/mess/bulk-import-served-logs
router.post('/bulk-import-served-logs', protect, async (req, res) => {
  try {
    const { logs } = req.body;
    if (!Array.isArray(logs) || !logs.length)
      return res.status(400).json({ message: 'No logs provided' });

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < logs.length; i++) {
      const row = logs[i];
      try {
        const itemsNames = (row.itemsNames || '').toString().trim();
        if (!itemsNames) throw new Error('Items served names are required');

        const date = parseExcelDate(row.date);
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

        await MessServedLog.create({
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
          recordedBy: req.user._id
        });

        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, itemName: row.itemsNames || '—', reason: err.message });
      }
    }

    res.json({ imported, failed, errors });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Bulk import served logs failed' });
  }
});

module.exports = router;
