const mongoose = require('mongoose');

const standSchema = new mongoose.Schema({
  standNumber:  { type: String, required: true, unique: true, trim: true },
  section:      { type: String, required: true, trim: true },
  size:         { type: Number }, // square meters
  status:       { type: String, enum: ['available', 'allocated', 'sold', 'reserved'], default: 'available' },

  owner: {
    name:    { type: String, trim: true },
    idNumber:{ type: String, trim: true },
    phone:   { type: String, trim: true },
    email:   { type: String, trim: true, lowercase: true },
  },

  location: {
    lat:     { type: Number },
    lng:     { type: Number },
    address: { type: String },
  },

  financials: {
    purchasePrice:  { type: Number, default: 0 },
    totalPaid:      { type: Number, default: 0 },
    monthlyLevy:    { type: Number, default: 0 },
    levyDueDay:     { type: Number, default: 30 }, // day of month payment is due
    titleDeedIssued:{ type: Boolean, default: false },
    titleDeedDate:  { type: Date },
    titleDeedUrl:   { type: String },
  },

  notes: { type: String },
}, { timestamps: true });

standSchema.virtual('financials.balance').get(function() {
  return (this.financials.purchasePrice || 0) - (this.financials.totalPaid || 0);
});

standSchema.virtual('financials.isInArrears').get(function() {
  return ((this.financials.purchasePrice || 0) - (this.financials.totalPaid || 0)) > 0;
});

standSchema.set('toJSON', { virtuals: true });
standSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Stand', standSchema);
