const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { auth, adminOnly } = require('../middleware/auth');
const { sendSMS, sendWhatsApp } = require('../utils/messaging');
const Stand = require('../models/Stand');

// GET /api/announcements — public feed of published announcements
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = { status: 'published' };
    if (category) query.category = category;

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('postedBy', 'name role')
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/announcements/admin — all announcements including drafts (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const announcements = await Announcement.find(query)
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/announcements/:id
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('postedBy', 'name role');
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/announcements — create
router.post('/', auth, async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      postedBy: req.user._id,
      authorRole: req.user.role,
      status: ['chief', 'admin'].includes(req.user.role) ? 'published' : 'pending_approval'
    });
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/announcements/:id — update
router.patch('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/announcements/:id/publish — approve & publish
router.post('/:id/publish', auth, adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishAt: new Date() },
      { new: true }
    );
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/announcements/:id/blast — send SMS/WhatsApp to all stands with phone numbers
router.post('/:id/blast', auth, adminOnly, async (req, res) => {
  try {
    const { channel } = req.body; // 'sms' | 'whatsapp' | 'both'
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });

    // Collect all owner phone numbers
    const stands = await Stand.find({ 'owner.phone': { $exists: true, $ne: '' } }).select('owner.phone');
    const phones = [...new Set(stands.map(s => s.owner.phone).filter(Boolean))];

    const message = `${announcement.title}\n\n${announcement.body}\n\n- Village Office`;
    let smsSent = 0, whatsappSent = 0;

    for (const phone of phones) {
      if (channel === 'sms' || channel === 'both') {
        const ok = await sendSMS(phone, message);
        if (ok) smsSent++;
      }
      if (channel === 'whatsapp' || channel === 'both') {
        const ok = await sendWhatsApp(phone, message);
        if (ok) whatsappSent++;
      }
    }

    // Update blast record
    if (channel === 'sms' || channel === 'both') {
      announcement.smsBlast = { enabled: true, sent: true, sentAt: new Date(), recipients: smsSent };
    }
    if (channel === 'whatsapp' || channel === 'both') {
      announcement.whatsappBlast = { enabled: true, sent: true, sentAt: new Date(), recipients: whatsappSent };
    }
    await announcement.save();

    res.json({ success: true, smsSent, whatsappSent, totalPhones: phones.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/announcements/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
