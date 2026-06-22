const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    required: true,
    enum: [
      'CREATED',
      'UPDATED',
      'MOVED', 
      'MAINTENANCE_PERFORMED', 
      'AUDIT_VERIFIED', 
      'DOCUMENT_UPLOADED',
      'DELETED',
      'DISTRIBUTED',
      'RETURNED'
    ] 
  },
  previousState: { type: mongoose.Schema.Types.Mixed }, // e.g. old location or old quantity
  newState: { type: mongoose.Schema.Types.Mixed },      // e.g. new location or new quantity
  notes: { type: String }
}, { timestamps: true });

// Optimize lookups for an item's history
auditLogSchema.index({ item: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
