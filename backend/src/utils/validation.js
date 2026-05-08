const mongoose = require('mongoose');

const USER_ROLES = ['admin', 'staff', 'viewer'];
const ASSET_TYPES = ['Fixed Asset', 'Consumable'];
const ALLOWED_UPLOAD_MIME_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function sanitizeText(value, { max = 250, allowEmpty = true } = {}) {
  if (value === undefined || value === null) return allowEmpty ? '' : null;
  const normalized = String(value).trim().replace(/\s+/g, ' ');
  if (!normalized) return allowEmpty ? '' : null;
  return normalized.slice(0, max);
}

function parseNonNegativeNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parsePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  if (typeof password !== 'string') return false;
  return password.length >= 10
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sanitizeItemPayload(body = {}) {
  const quantityPurchased = parseNonNegativeNumber(body.quantityPurchased);
  const unitPrice = parseNonNegativeNumber(body.unitPrice, 0);
  const totalCost = parseNonNegativeNumber(body.totalCost, 0);
  const dateOfPurchase = parseOptionalDate(body.dateOfPurchase);
  const warrantyExpiryDate = parseOptionalDate(body.warrantyExpiryDate);
  const nextMaintenanceDate = parseOptionalDate(body.nextMaintenanceDate);

  if (!sanitizeText(body.itemName, { allowEmpty: false, max: 150 })) {
    return { error: 'Item name is required' };
  }
  if (quantityPurchased === null || unitPrice === null || totalCost === null) {
    return { error: 'Quantity and price values must be valid non-negative numbers' };
  }
  if (dateOfPurchase === null || warrantyExpiryDate === null || nextMaintenanceDate === null) {
    return { error: 'One or more dates are invalid' };
  }
  if (body.assetType && !ASSET_TYPES.includes(body.assetType)) {
    return { error: 'Invalid asset type' };
  }
  if (body.location && !isValidObjectId(body.location)) {
    return { error: 'Invalid location' };
  }

  const payload = {
    segment: sanitizeText(body.segment, { max: 80 }) || 'OTHER',
    itemName: sanitizeText(body.itemName, { allowEmpty: false, max: 150 }),
    company: sanitizeText(body.company, { max: 120 }) || undefined,
    billNo: sanitizeText(body.billNo, { max: 80 }) || undefined,
    uom: sanitizeText(body.uom, { max: 30 }) || 'Nos',
    quantityPurchased,
    unitPrice,
    totalCost,
    shopName: sanitizeText(body.shopName, { max: 150 }) || undefined,
    particulars: sanitizeText(body.particulars, { max: 250 }) || undefined,
    assetType: body.assetType || undefined,
    location: body.location || undefined,
    qrCodeId: sanitizeText(body.qrCodeId, { max: 120 }) || undefined,
    dateOfPurchase,
    warrantyExpiryDate,
    nextMaintenanceDate
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return { payload };
}

function sanitizeDistributionPayload(body = {}) {
  const quantityDistributed = parsePositiveNumber(body.quantityDistributed);
  const dateOfDistribution = parseOptionalDate(body.dateOfDistribution);
  const distributedToDepartment = sanitizeText(body.distributedToDepartment, { allowEmpty: false, max: 120 });
  const authorisedBy = sanitizeText(body.authorisedBy, { allowEmpty: false, max: 120 });

  if (!body.item || !isValidObjectId(body.item)) return { error: 'Invalid item id' };
  if (quantityDistributed === null) return { error: 'Quantity distributed must be greater than 0' };
  if (dateOfDistribution === null || !dateOfDistribution) return { error: 'Valid distribution date is required' };
  if (!distributedToDepartment) return { error: 'Department is required' };
  if (!authorisedBy) return { error: 'Authorised by is required' };

  return {
    payload: {
      item: body.item,
      uom: sanitizeText(body.uom, { max: 30 }) || 'Nos',
      quantityDistributed,
      dateOfDistribution,
      distributedToDepartment,
      distributedTo: sanitizeText(body.distributedTo, { max: 120 }) || undefined,
      authorisedBy,
      remarks: sanitizeText(body.remarks, { max: 500 }) || undefined
    }
  };
}

function sanitizeLocationPayload(body = {}) {
  const building = sanitizeText(body.building, { allowEmpty: false, max: 120 });
  const floor = sanitizeText(body.floor, { allowEmpty: false, max: 60 });
  const room = sanitizeText(body.room, { allowEmpty: false, max: 60 });

  if (!building || !floor || !room) return { error: 'Building, floor, and room are required' };
  if (body.manager && !isValidObjectId(body.manager)) return { error: 'Invalid manager id' };

  return {
    payload: {
      building,
      floor,
      room,
      notes: sanitizeText(body.notes, { max: 300 }) || undefined,
      manager: body.manager || undefined
    }
  };
}

function sanitizeMasterPayload(type, body = {}) {
  const name = sanitizeText(body.name, { allowEmpty: false, max: 120 });
  if (!name) return { error: 'Name is required' };

  const payload = { name };
  if (type === 'departments') {
    const budget = parseNonNegativeNumber(body.budget, 0);
    if (budget === null) return { error: 'Budget must be a valid non-negative number' };
    payload.budget = budget;
  }
  return { payload };
}

module.exports = {
  USER_ROLES,
  ALLOWED_UPLOAD_MIME_TYPES,
  escapeRegex,
  isStrongPassword,
  isValidEmail,
  isValidObjectId,
  normalizeEmail,
  parsePositiveNumber,
  sanitizeDistributionPayload,
  sanitizeItemPayload,
  sanitizeLocationPayload,
  sanitizeMasterPayload,
  sanitizeText
};
