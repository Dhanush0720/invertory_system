const express = require('express');
const router  = express.Router();
const Item    = require('../models/Item');
const Distribution = require('../models/Distribution');
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');

// ── Simple in-memory cache (60 seconds TTL) — invalidated on demand
let _statsCache = null;
let _statsCacheExpiry = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

function invalidateStatsCache() { _statsCache = null; _statsCacheExpiry = 0; }

router.get('/stats', protect, async (req, res) => {
  if (_statsCache && Date.now() < _statsCacheExpiry) {
    return res.json(_statsCache);
  }
  try {
    const [items, distributions, departments] = await Promise.all([
      Item.find(),
      Distribution.find().populate('item', 'itemName segment unitPrice'),
      Department.find()
    ]);

    // ── Per-item stock ─────────────────────────────────────────────
    const distMap = {};
    distributions.forEach(d => {
      const id = d.item?._id?.toString();
      if (id) distMap[id] = (distMap[id] || 0) + d.quantityDistributed;
    });

    const itemsWithStock = items.map(item => {
      const distributed = distMap[item._id.toString()] || 0;
      const remaining   = item.quantityPurchased - distributed;
      return { ...item.toObject(), distributed, remaining };
    });

    // ── Summary counts ─────────────────────────────────────────────
    const totalItems       = items.length;
    const totalPurchased   = items.reduce((s, i) => s + (i.quantityPurchased || 0), 0);
    const totalDistributed = distributions.reduce((s, d) => s + d.quantityDistributed, 0);
    const totalValue       = items.reduce((s, i) => s + (i.totalCost || 0), 0);
    const outOfStockItems  = itemsWithStock.filter(i => i.remaining <= 0 && i.quantityPurchased > 0).length;
    const lowStockItems    = itemsWithStock.filter(i => i.remaining > 0 && i.remaining <= 5).length;

    // ── Category / Segment breakdown ───────────────────────────────
    const segMap = {};
    itemsWithStock.forEach(item => {
      const seg = item.segment || 'OTHER';
      if (!segMap[seg]) segMap[seg] = { category: seg, purchased: 0, distributed: 0, remaining: 0, totalCost: 0, itemCount: 0 };
      segMap[seg].purchased   += item.quantityPurchased || 0;
      segMap[seg].distributed += item.distributed       || 0;
      segMap[seg].remaining   += item.remaining         || 0;
      segMap[seg].totalCost   += item.totalCost         || 0;
      segMap[seg].itemCount   += 1;
    });
    const categoryBreakdown = Object.values(segMap).sort((a, b) => b.totalCost - a.totalCost);

    // ── Purchase amount per item (top 20 by cost) ──────────────────
    const itemCostMap = {};
    items.forEach(item => {
      const key = `${item.segment}||${item.itemName}`;
      if (!itemCostMap[key]) itemCostMap[key] = { itemName: item.itemName, segment: item.segment || 'OTHER', totalCost: 0, qty: 0 };
      itemCostMap[key].totalCost += item.totalCost || 0;
      itemCostMap[key].qty       += item.quantityPurchased || 0;
    });
    const topItemsByCost = Object.values(itemCostMap)
      .filter(i => i.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 25);

    // ── Monthly purchase trend (last 12 months) ────────────────────
    const monthlyMap = {};
    items.forEach(item => {
      if (!item.dateOfPurchase) return;
      const d = new Date(item.dateOfPurchase);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, totalCost: 0, qty: 0, count: 0 };
      monthlyMap[key].totalCost += item.totalCost || 0;
      monthlyMap[key].qty       += item.quantityPurchased || 0;
      monthlyMap[key].count     += 1;
    });
    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

    // ── Department breakdown ───────────────────────────────────────
    const deptMap = {};
    departments.forEach(dep => {
      deptMap[dep.name] = { 
        department: dep.name, 
        quantityDistributed: 0, 
        itemsCount: 0, 
        estimatedValue: 0, 
        budget: dep.budget || 0,
        itemsConsumed: {} 
      };
    });

    distributions.forEach(d => {
      const dept = d.distributedToDepartment || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { department: dept, quantityDistributed: 0, itemsCount: 0, estimatedValue: 0, budget: 0, itemsConsumed: {} };
      deptMap[dept].quantityDistributed += d.quantityDistributed || 0;
      deptMap[dept].itemsCount += 1;
      
      const itemUnitPrice = (d.item && d.item.unitPrice) ? d.item.unitPrice : 0;
      deptMap[dept].estimatedValue += ((d.quantityDistributed || 0) * itemUnitPrice);

      if (d.item && d.item.itemName) {
        const itemName = d.item.itemName;
        if (!deptMap[dept].itemsConsumed[itemName]) {
           deptMap[dept].itemsConsumed[itemName] = { name: itemName, qty: 0, cost: 0 };
        }
        deptMap[dept].itemsConsumed[itemName].qty += d.quantityDistributed || 0;
        deptMap[dept].itemsConsumed[itemName].cost += ((d.quantityDistributed || 0) * itemUnitPrice);
      }
    });

    const departmentBreakdown = Object.values(deptMap).map(dept => {
      dept.topItems = Object.values(dept.itemsConsumed).sort((a,b) => b.qty - a.qty);
      delete dept.itemsConsumed;
      return dept;
    }).sort((a, b) => b.quantityDistributed - a.quantityDistributed);

    // ── Recent distributions ───────────────────────────────────────
    const recentDistributions = await Distribution.find()
      .populate('item', 'itemName segment')
      .sort('-createdAt').limit(8);

    const payload = {
      totalItems, totalPurchased, totalDistributed,
      totalValue, outOfStockItems, lowStockItems,
      categoryBreakdown, topItemsByCost, monthlyTrend,
      departmentBreakdown,
      recentDistributions
    };
    // Cache the result
    _statsCache = payload;
    _statsCacheExpiry = Date.now() + CACHE_TTL_MS;
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = { router, invalidateStatsCache };
