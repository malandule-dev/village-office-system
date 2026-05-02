const router = require('express').Router();
const Stand = require('../models/Stand');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/stands — list all with search/filter
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, section, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (section) query.section = new RegExp(section, 'i');
    if (search) {
      query.$or = [
        { standNumber: new RegExp(search, 'i') },
        { 'owner.name': new RegExp(search, 'i') },
        { section: new RegExp(search, 'i') },
      ];
    }
    const total = await Stand.countDocuments(query);
    const stands = await Stand.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ standNumber: 1 });

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), stands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stands/map — all geocoded stands for map view
router.get('/map', auth, async (req, res) => {
  try {
    const stands = await Stand.find({ 'location.lat': { $exists: true }, 'location.lng': { $exists: true } })
      .select('standNumber section status owner.name location financials.isInArrears');
    res.json({ success: true, stands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stands/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const stand = await Stand.findById(req.params.id);
    if (!stand) return res.status(404).json({ success: false, message: 'Stand not found' });
    res.json({ success: true, stand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/stands — create stand
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const stand = await Stand.create(req.body);
    res.status(201).json({ success: true, stand });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/stands/:id — update stand
router.patch('/:id', auth, adminOnly, async (req, res) => {
  try {
    const stand = await Stand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!stand) return res.status(404).json({ success: false, message: 'Stand not found' });
    res.json({ success: true, stand });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/stands/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Stand.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Stand deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/stands/:id/geocode — update GPS coordinates
router.post('/:id/geocode', auth, adminOnly, async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const stand = await Stand.findByIdAndUpdate(
      req.params.id,
      { 'location.lat': lat, 'location.lng': lng, 'location.address': address },
      { new: true }
    );
    res.json({ success: true, stand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
