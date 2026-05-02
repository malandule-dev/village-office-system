const router = require('express').Router();
const Stand = require('../models/Stand');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

router.get('/arrears', auth, async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDate();
    const stands = await Stand.find({
      $expr: { $gt: ['$financials.purchasePrice', '$financials.totalPaid'] },
      'financials.purchasePrice': { $gt: 0 }
    });
    const arrears = stands.map(s => ({
      standNumber: s.standNumber,
      section: s.section,
      ownerName: s.owner?.name,
      ownerPhone: s.owner?.phone,
      purchasePrice: s.financials.purchasePrice,
      totalPaid: s.financials.totalPaid,
      outstanding: (s.financials.purchasePrice || 0) - (s.financials.totalPaid || 0),
      isOverdue: currentDay > (s.financials.levyDueDay || 30),
      levyDueDay: s.financials.levyDueDay,
    }));
    res.json({ success: true, count: arrears.length, arrears, generatedAt: new Date() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/payments-summary', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.paymentDate = {};
      if (from) match.paymentDate.$gte = new Date(from);
      if (to) match.paymentDate.$lte = new Date(to);
    }
    const summary = await Payment.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
