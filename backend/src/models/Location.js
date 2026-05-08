const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  building: { type: String, required: true, trim: true },
  floor: { type: String, required: true, trim: true },
  room: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // optional owner of this space
}, { timestamps: true });

// Ensure unique locations
locationSchema.index({ building: 1, floor: 1, room: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
