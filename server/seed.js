/**
 * Village Office System — Database Seed Script
 * Run: node server/seed.js
 * Creates a default admin account and sample stands/data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Stand = require('./models/Stand');
const Announcement = require('./models/Announcement');

async function seed() {
  console.log('🌱 Seeding Village Office database…\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── Admin user ──────────────────────────────────────────
  const existing = await User.findOne({ email: 'admin@villageoffice.gov.za' });
  let admin;
  if (existing) {
    console.log('ℹ️  Admin user already exists, skipping.');
    admin = existing;
  } else {
    admin = await User.create({
      name: 'Village Admin',
      email: 'admin@villageoffice.gov.za',
      password: 'Admin@2024',
      role: 'admin',
      phone: '0800000000',
    });
    console.log('✅ Admin user created');
    console.log('   Email:    admin@villageoffice.gov.za');
    console.log('   Password: Admin@2024');
    console.log('   ⚠️  Change this password after first login!\n');
  }

  // ── Sample stands ───────────────────────────────────────
  const standCount = await Stand.countDocuments();
  if (standCount === 0) {
    const sampleStands = [
      {
        standNumber: '001', section: 'Section A', size: 300, status: 'sold',
        owner: { name: 'Thabo Nkosi', idNumber: '8501015026086', phone: '0711234567', email: 'thabo@email.com' },
        location: { lat: -23.8844, lng: 29.4681, address: 'Section A, Village Main Road' },
        financials: { purchasePrice: 25000, totalPaid: 25000, monthlyLevy: 150, titleDeedIssued: true, titleDeedDate: new Date() },
      },
      {
        standNumber: '002', section: 'Section A', size: 280, status: 'allocated',
        owner: { name: 'Nomsa Dlamini', idNumber: '9203125028082', phone: '0829876543' },
        location: { lat: -23.8848, lng: 29.4685, address: 'Section A, Plot 2' },
        financials: { purchasePrice: 25000, totalPaid: 12500, monthlyLevy: 150 },
      },
      {
        standNumber: '003', section: 'Section A', size: 320, status: 'available',
        location: { lat: -23.8852, lng: 29.4689, address: 'Section A, Plot 3' },
        financials: { purchasePrice: 28000, monthlyLevy: 150 },
      },
      {
        standNumber: '047', section: 'Section B', size: 400, status: 'available',
        location: { lat: -23.8900, lng: 29.4720, address: 'Section B, Northern Zone' },
        financials: { purchasePrice: 32000, monthlyLevy: 200 },
      },
      {
        standNumber: '048', section: 'Section B', size: 380, status: 'reserved',
        owner: { name: 'Peter Mahlangu', idNumber: '8812245020083', phone: '0734567890' },
        location: { lat: -23.8904, lng: 29.4724, address: 'Section B, Plot 48' },
        financials: { purchasePrice: 32000, totalPaid: 5000, monthlyLevy: 200 },
      },
      {
        standNumber: '099', section: 'Section C', size: 500, status: 'available',
        location: { lat: -23.8960, lng: 29.4780, address: 'Section C, Southern Extension' },
        financials: { purchasePrice: 40000, monthlyLevy: 250 },
      },
    ];
    await Stand.insertMany(sampleStands);
    console.log(`✅ ${sampleStands.length} sample stands created`);
  } else {
    console.log(`ℹ️  ${standCount} stands already exist, skipping.`);
  }

  // ── Sample announcements ─────────────────────────────────
  const announcementCount = await Announcement.countDocuments();
  if (announcementCount === 0) {
    await Announcement.insertMany([
      {
        title: 'Community Meeting — Q1 Planning Session',
        body: 'All registered stand holders are invited to the quarterly community planning meeting. We will discuss the water reticulation project, road maintenance, and the new development in Section C. Refreshments will be served.\n\nDate: Last Saturday of the month\nTime: 10:00 AM\nVenue: Community Hall',
        category: 'meeting',
        postedBy: admin._id,
        authorRole: 'admin',
        status: 'published',
        pinned: true,
      },
      {
        title: 'Trustee Report — Annual Dividend Distribution',
        body: 'The Trustees are pleased to announce that the annual community benefit dividend has been approved. Qualifying stand holders will receive their allocation at the village office. Please bring your original ID and proof of payment up to date.',
        category: 'financial',
        postedBy: admin._id,
        authorRole: 'admin',
        status: 'published',
      },
      {
        title: 'New Water Connection Bylaw — Effective Jan 2025',
        body: 'Following the resolution passed at the November community meeting, all new stands must connect to the municipal water supply within 6 months of allocation. Failure to comply will result in a monthly penalty levy.',
        category: 'bylaw',
        postedBy: admin._id,
        authorRole: 'admin',
        status: 'published',
      },
    ]);
    console.log('✅ Sample announcements created');
  }

  console.log('\n🎉 Seed complete! Start the system with: npm run dev\n');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
