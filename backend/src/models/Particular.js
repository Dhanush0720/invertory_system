const mongoose = require('mongoose');

const particularSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Particular', particularSchema);
