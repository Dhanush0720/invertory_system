const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    severity: { type: String, required: true }, // 'High', 'Medium', 'Low'
    issue_type: { type: String, required: true }, // 'Stockout Risk', 'Anomaly Detection'
    message: { type: String, required: true },
    recommended_action: { type: String, required: true },
    action_code: { type: String, required: true },
    status: { type: String, default: 'active' } // 'active' or 'resolved'
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);