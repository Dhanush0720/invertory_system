const mongoose = require('mongoose');

const messItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameTelugu: { type: String, trim: true },
  category: {
    type: String,
    enum: ['GROCERY', 'VEGETABLE', 'DAIRY', 'MEAT', 'SPICE', 'FRUIT', 'OTHER'],
    required: true
  },
  quantity: { type: Number, required: true, default: 0 }, // Supports decimal stocks (e.g. 12.5 Kg)
  uom: {
    type: String,
    enum: ['Kg', 'Litre', 'Pack', 'Bag', 'Nos'],
    required: true
  },
  threshold: { type: Number, default: 5 },
  costPerUnit: { type: Number, default: 0 },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
}, { timestamps: true });

module.exports = mongoose.model('MessItem', messItemSchema);
