const mongoose = require('mongoose');

const mealDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ingredients: [{
    itemName: { type: String, required: true, trim: true }, // e.g. "Rice", "Tomato", "Potato" (names matching MessItem for autocomplete/fuzzy comparison)
    perStudentQtyGrams: { type: Number, required: true } // grams needed per student (e.g. 150g for rice, 20g for tomato)
  }]
}, { _id: false });

const messMenuSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
    unique: true
  },
  meals: {
    breakfast: mealDetailsSchema,
    lunch:     mealDetailsSchema,
    snacks:    mealDetailsSchema,
    dinner:    mealDetailsSchema
  }
}, { timestamps: true });

module.exports = mongoose.model('MessMenu', messMenuSchema);
