const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  referenceNumber: { type: String, unique: true },

  applicant: {
    name:      { type: String, required: true, trim: true },
    idNumber:  { type: String, required: true, trim: true },
    phone:     { type: String, required: true, trim: true },
    email:     { type: String, trim: true, lowercase: true },
    address:   { type: String, trim: true },
  },

  preferredSection: { type: String, trim: true },
  preferredStand:   { type: String, trim: true },
  needStatement:    { type: String, trim: true },

  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'allocated', 'rejected'],
    default: 'pending'
  },

  allocatedStand: { type: mongoose.Schema.Types.ObjectId, ref: 'Stand' },

  adminNotes: [{
    note:      { type: String },
    addedBy:   { type: String },
    addedAt:   { type: Date, default: Date.now }
  }],

  notificationsSent: [{
    type:    { type: String },
    sentAt:  { type: Date },
    status:  { type: String }
  }],

}, { timestamps: true });

// Auto-generate reference number
bookingSchema.pre('save', async function(next) {
  if (!this.referenceNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.referenceNumber = `VOS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
