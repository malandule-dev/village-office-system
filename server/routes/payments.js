const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Stand = require('../models/Stand');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/payments — all payments
router.get('/', auth, async (req, res) => {
  try {
    const { standId, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (standId) query.stand = standId;
    if (type) query.type = type;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('stand', 'standNumber section owner.name')
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments — record a payment
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const payment = await Payment.create({ ...req.body, recordedBy: req.user._id });
    const stand = await Stand.findById(payment.stand);

    // If fully paid → auto-issue Title Deed
    if (stand && stand.financials.totalPaid >= stand.financials.purchasePrice && stand.financials.purchasePrice > 0) {
      if (!stand.financials.titleDeedIssued) {
        stand.financials.titleDeedIssued = true;
        stand.financials.titleDeedDate = new Date();
        await stand.save();
      }
    }

    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/payments/arrears — missed payments report
router.get('/arrears', auth, async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDate();

    const stands = await Stand.find({
      $expr: { $gt: ['$financials.purchasePrice', '$financials.totalPaid'] },
      'financials.purchasePrice': { $gt: 0 }
    }).select('standNumber section owner financials location');

    // Flag as "in arrears" if we are past the levy due day
    const arrears = stands.map(s => ({
      ...s.toJSON(),
      arrearsAmount: (s.financials.purchasePrice || 0) - (s.financials.totalPaid || 0),
      isOverdue: currentDay > (s.financials.levyDueDay || 30),
    }));

    res.json({ success: true, count: arrears.length, arrears });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/stand/:standId — payments for a specific stand
router.get('/stand/:standId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ stand: req.params.standId })
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/:id/receipt — generate PDF receipt
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('stand').populate('recordedBy', 'name');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment._id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#1A5276').text('VILLAGE OFFICE MANAGEMENT SYSTEM', { align: 'center' });
    doc.fontSize(14).fillColor('#555').text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#2980B9').stroke();
    doc.moveDown();

    // Details
    const fields = [
      ['Receipt Date', new Date(payment.paymentDate).toLocaleDateString('en-ZA')],
      ['Stand Number', payment.stand?.standNumber || 'N/A'],
      ['Stand Section', payment.stand?.section || 'N/A'],
      ['Owner Name', payment.stand?.owner?.name || 'N/A'],
      ['Payment Type', payment.type.replace('_', ' ').toUpperCase()],
      ['Payment Method', payment.method.replace('_', ' ').toUpperCase()],
      ['Amount Paid', `R ${payment.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`],
      ['Reference', payment.referenceNumber || payment._id.toString()],
      ['Recorded By', payment.recordedBy?.name || 'System'],
    ];

    fields.forEach(([label, value]) => {
      doc.fontSize(11).fillColor('#333').text(`${label}:`, { continued: true }).fillColor('#000').text(`  ${value}`);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ccc').stroke();
    doc.moveDown();
    doc.fontSize(10).fillColor('#888').text('This is an official receipt from the Village Office. Please retain for your records.', { align: 'center' });
    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/title-deed/:standId — generate Title Deed PDF
router.get('/title-deed/:standId', auth, async (req, res) => {
  try {
    const stand = await Stand.findById(req.params.standId);
    if (!stand) return res.status(404).json({ success: false, message: 'Stand not found' });
    if (!stand.financials.titleDeedIssued) {
      return res.status(400).json({ success: false, message: 'Title deed not yet issued — balance outstanding' });
    }

    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=title-deed-${stand.standNumber}.pdf`);
    doc.pipe(res);

    // Certificate border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).strokeColor('#1A5276').lineWidth(3).stroke();
    doc.rect(38, 38, doc.page.width - 76, doc.page.height - 76).strokeColor('#2980B9').lineWidth(1).stroke();

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#888').text('REPUBLIC OF SOUTH AFRICA', { align: 'center' });
    doc.fontSize(22).fillColor('#1A5276').text('VILLAGE OFFICE MANAGEMENT SYSTEM', { align: 'center' });
    doc.fontSize(16).fillColor('#2980B9').text('CERTIFICATE OF TITLE / PROOF OF OCCUPATION', { align: 'center' });
    doc.moveDown();
    doc.moveTo(80, doc.y).lineTo(doc.page.width - 80, doc.y).strokeColor('#1A5276').lineWidth(2).stroke();
    doc.moveDown();

    doc.fontSize(13).fillColor('#333').text('This is to certify that:', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#000').text(stand.owner?.name || 'OWNER NAME', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#555').text(`ID Number: ${stand.owner?.idNumber || 'N/A'}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(13).fillColor('#333').text('is the registered occupant/owner of:', { align: 'center' });
    doc.moveDown(0.5);

    const details = [
      ['Stand Number',  stand.standNumber],
      ['Section',       stand.section],
      ['Size',          stand.size ? `${stand.size} m²` : 'As surveyed'],
      ['GPS Location',  stand.location?.lat ? `${stand.location.lat}, ${stand.location.lng}` : 'On record'],
      ['Address',       stand.location?.address || 'Village Office Records'],
      ['Issue Date',    new Date(stand.financials.titleDeedDate).toLocaleDateString('en-ZA')],
    ];

    details.forEach(([label, value]) => {
      doc.fontSize(12).fillColor('#1A5276').text(`${label}:  `, { continued: true }).fillColor('#000').text(value);
    });

    doc.moveDown(2);
    doc.moveTo(80, doc.y).lineTo(280, doc.y).strokeColor('#333').lineWidth(1).stroke();
    doc.fontSize(10).fillColor('#555').text('Authorized Signature', { align: 'left', indent: 80 });
    doc.moveDown(0.5);
    doc.moveTo(330, doc.y - 30).lineTo(530, doc.y - 30).strokeColor('#333').lineWidth(1).stroke();
    doc.fontSize(10).fillColor('#555').text('Village Chief / Office Seal', { align: 'right', indent: -60 });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#aaa').text('This document was generated by the Village Office Management System and is subject to verification.', { align: 'center' });
    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
