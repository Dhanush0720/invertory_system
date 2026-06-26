const mongoose = require('mongoose');

const messPurchaseSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'MessItem', required: true },
  purchaseDate: { type: Date, default: Date.now },
  billNo: { type: String, trim: true },
  company: { type: String, trim: true },
  uom: { type: String, required: true },
  quantityPurchased: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  shopName: { type: String, trim: true },
  particulars: { type: String, trim: true }, // e.g. "PARTICULERS FOR COKING / USING ON"
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-calculate totalCost
messPurchaseSchema.pre('save', function (next) {
  if (this.quantityPurchased && this.unitPrice) {
    this.totalCost = parseFloat((this.quantityPurchased * this.unitPrice).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('MessPurchase', messPurchaseSchema);
