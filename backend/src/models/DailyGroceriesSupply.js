const mongoose = require('mongoose');

const dailyGroceriesSupplySchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'MessItem', required: true },
  dateIssued: { type: Date, required: true, default: Date.now },
  uom: { type: String, required: true, trim: true },
  quantityIssued: { type: Number, required: true },
  purposeOfUsed: { type: String, trim: true },
  purposeOfUsing: { type: String, trim: true },
  issuedTo: { type: String, required: true, trim: true },
  issuedBy: { type: String, required: true, trim: true },
  particularsExtraCooking: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DailyGroceriesSupply', dailyGroceriesSupplySchema);
