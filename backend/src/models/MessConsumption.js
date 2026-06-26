const mongoose = require('mongoose');

const messConsumptionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  mealType: {
    type: String,
    enum: ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER', 'GENERAL'],
    required: true
  },
  itemsUsed: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'MessItem', required: true },
    qtyUsed: { type: Number, required: true }
  }],
  spoilage: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'MessItem', required: true },
    qtySpoiled: { type: Number, required: true },
    reason: { type: String, trim: true } // e.g. "Rotten", "Expired", "Spilled"
  }],
  issuedBy: { type: String, trim: true },
  issuedTo: { type: String, trim: true },
  purposeOfUsed: { type: String, trim: true },
  particulars: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('MessConsumption', messConsumptionSchema);
