const router = require('express').Router();
const Stand = require('../models/Stand');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Announcement = require('../models/Announcement');
const { auth } = require('../middleware/auth');

// GET /api/dashboard — aggregate stats for main dashboard
router.get('/', auth, async (req, res) => {
  try {
    const [
      totalStands, availableStands, allocatedStands, soldStands,
      totalBookings, pendingBookings,
      totalPayments, recentPayments,
      publishedAnnouncements,
      arrearsStands
    ] = await Promise.all([
      Stand.countDocuments(),
      Stand.countDocuments({ status: 'available' }),
      Stand.countDocuments({ status: 'allocated' }),
      Stand.countDocuments({ status: 'sold' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.find().sort({ paymentDate: -1 }).limit(5).populate('stand', 'standNumber section'),
      Announcement.countDocuments({ status: 'published' }),
      Stand.countDocuments({ $expr: { $gt: ['$financials.purchasePrice', '$financials.totalPaid'] }, 'financials.purchasePrice': { $gt: 0 } }),
    ]);

    // Monthly payment trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const paymentTrend = await Payment.aggregate([
      { $match: { paymentDate: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
        total: { $sum: '$amount' }, count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        stands: { total: totalStands, available: availableStands, allocated: allocatedStands, sold: soldStands, inArrears: arrearsStands },
        bookings: { total: totalBookings, pending: pendingBookings },
        finances: { totalCollected: totalPayments[0]?.total || 0 },
        announcements: { published: publishedAnnouncements },
      },
      recentPayments,
      paymentTrend,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
