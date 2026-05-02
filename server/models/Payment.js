const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  stand:         { type: mongoose.Schema.Types.ObjectId, ref: 'Stand', required: true },
  amount:        { type: Number, required: true, min: 0 },
  type:          { type: String, enum: ['title_deed', 'levy', 'deposit', 'arrears', 'other'], required: true },
  method:        { type: String, enum: ['cash', 'eft', 'card', 'mobile_money'], default: 'eft' },
  referenceNumber:{ type: String, trim: true },
  notes:         { type: String, trim: true },
  recordedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentDate:   { type: Date, default: Date.now },
  receiptUrl:    { type: String },
}, { timestamps: true });

// After saving a payment, update stand's totalPaid
paymentSchema.post('save', async function() {
  const Stand = mongoose.model('Stand');
  const result = await mongoose.model('Payment').aggregate([
    { $match: { stand: this.stand } },
    { $group: { _id: '$stand', total: { $sum: '$amount' } } }
  ]);
  const totalPaid = result[0]?.total || 0;
  await Stand.findByIdAndUpdate(this.stand, { 'financials.totalPaid': totalPaid });
});

module.exports = mongoose.model('Payment', paymentSchema);
