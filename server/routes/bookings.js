const router = require('express').Router();
const Booking = require('../models/Booking');
const Stand = require('../models/Stand');
const { auth, adminOnly } = require('../middleware/auth');
const { sendSMS } = require('../utils/messaging');

// GET /api/bookings — list bookings (admin)
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'applicant.name': new RegExp(search, 'i') },
        { 'applicant.idNumber': new RegExp(search, 'i') },
        { referenceNumber: new RegExp(search, 'i') },
      ];
    }
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('allocatedStand', 'standNumber section')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/stats — demand analytics
router.get('/stats', auth, async (req, res) => {
  try {
    const statusCounts = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const monthly = await Booking.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    const inNeed = await Booking.countDocuments({ status: { $in: ['pending', 'under_review'] } });
    const totalAvailableStands = await Stand.countDocuments({ status: 'available' });

    res.json({ success: true, statusCounts, monthly, inNeed, totalAvailableStands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('allocatedStand');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bookings — public application (no auth required)
router.post('/', async (req, res) => {
  try {
    const booking = await Booking.create(req.body);

    // Send SMS confirmation if Twilio is configured
    if (booking.applicant.phone) {
      await sendSMS(
        booking.applicant.phone,
        `Village Office: Your stand application has been received. Reference: ${booking.referenceNumber}. We will contact you shortly.`
      );
    }

    res.status(201).json({
      success: true,
      booking: { referenceNumber: booking.referenceNumber, status: booking.status }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/bookings/:id/status — update status
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = status;
    if (note) booking.adminNotes.push({ note, addedBy: req.user.name, addedAt: new Date() });
    await booking.save();

    // Notify applicant
    const statusMessages = {
      under_review: `Your application ${booking.referenceNumber} is now under review.`,
      approved:     `Great news! Your stand application ${booking.referenceNumber} has been APPROVED.`,
      allocated:    `Your stand has been allocated. Reference: ${booking.referenceNumber}. Please visit the village office.`,
      rejected:     `Your application ${booking.referenceNumber} was not successful. Please contact the village office for more info.`
    };
    if (statusMessages[status] && booking.applicant.phone) {
      await sendSMS(booking.applicant.phone, `Village Office: ${statusMessages[status]}`);
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bookings/:id/note
router.post('/:id/note', auth, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $push: { adminNotes: { note: req.body.note, addedBy: req.user.name, addedAt: new Date() } } },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
