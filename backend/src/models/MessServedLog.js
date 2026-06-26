const mongoose = require('mongoose');

const messServedLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  mealType: {
    type: String,
    enum: ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'],
    required: true
  },
  itemsNames: { type: String, required: true, trim: true }, // e.g. "IDLEY", "MANGO PAPPU"
  foodLeftOver: { type: String, trim: true }, // e.g. "50 items", "1 Kg", "None"
  feedback: { type: String, trim: true }, // e.g. "GOOD", "AVERAGE"
  boysHostel: { type: Number, default: 0 },
  girlsHostel: { type: Number, default: 0 },
  externals: { type: Number, default: 0 },
  trainers: { type: Number, default: 0 },
  guestsFaculty: { type: Number, default: 0 },
  staffWardens: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-calculate total headcount
messServedLogSchema.pre('save', function (next) {
  this.total = (this.boysHostel || 0) +
               (this.girlsHostel || 0) +
               (this.externals || 0) +
               (this.trainers || 0) +
               (this.guestsFaculty || 0) +
               (this.staffWardens || 0) +
               (this.others || 0);
  next();
});

module.exports = mongoose.model('MessServedLog', messServedLogSchema);
