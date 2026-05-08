const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  // === PURCHASE SECTION (matches Excel columns A-K) ===
  segment:          { type: String, default: 'OTHER' },
  itemName:         { type: String, required: true, trim: true },
  dateOfPurchase:   { type: Date },
  company:          { type: String, trim: true },
  billNo:           { type: String, trim: true },
  uom:              { type: String, default: 'Nos' },
  quantityPurchased:{ type: Number, default: 0 },
  unitPrice:        { type: Number, default: 0 },
  totalCost:        { type: Number, default: 0 },
  shopName:         { type: String, trim: true },
  particulars:      { type: String, trim: true },

  // === ESTATE MANAGER EXTENSIONS ===
  assetType:           { type: String, enum: ['Fixed Asset', 'Consumable'], default: 'Consumable' },
  qrCodeId:            { type: String, sparse: true, unique: true }, // unique string from QR
  location:            { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }, // physical location
  warrantyExpiryDate:  { type: Date },
  nextMaintenanceDate: { type: Date },
  documentUrl:         { type: String }, // link to pdf manual or warranty uploaded via multer


  // === META ===
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ── Indexes for fast queries
itemSchema.index({ segment: 1 });
itemSchema.index({ dateOfPurchase: -1 });
itemSchema.index({ totalCost: -1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ assetType: 1 });
itemSchema.index({ qrCodeId: 1 });
itemSchema.index({ itemName: 'text', company: 'text', shopName: 'text', particulars: 'text' });

// Auto-calculate totalCost
itemSchema.pre('save', function (next) {
  if (this.quantityPurchased && this.unitPrice) {
    this.totalCost = parseFloat((this.quantityPurchased * this.unitPrice).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);
