const mongoose = require('mongoose');

const distributionSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  uom: { type: String, trim: true },
  quantityDistributed: { type: Number, required: true, min: 1 },
  dateOfDistribution: { type: Date, required: true },
  distributedToDepartment: { type: String, required: true, trim: true },
  distributedTo: { type: String, trim: true },
  authorisedBy: { type: String, required: true, trim: true },
  remarks: { type: String, trim: true },
  distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ── Indexes for fast aggregations and filtering
distributionSchema.index({ item: 1 });                          // critical for buildDistMap batch aggregation
distributionSchema.index({ distributedToDepartment: 1 });
distributionSchema.index({ dateOfDistribution: -1 });
distributionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Distribution', distributionSchema);
