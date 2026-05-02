const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  body:      { type: String, required: true },
  category:  { type: String, enum: ['meeting', 'bylaw', 'event', 'financial', 'development', 'emergency', 'general'], default: 'general' },
  postedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorRole:{ type: String, enum: ['chief', 'trustee', 'admin', 'staff'], required: true },

  status:    { type: String, enum: ['draft', 'pending_approval', 'published', 'archived'], default: 'draft' },
  publishAt: { type: Date },

  smsBlast: {
    enabled:   { type: Boolean, default: false },
    sent:      { type: Boolean, default: false },
    sentAt:    { type: Date },
    recipients:{ type: Number, default: 0 },
  },

  whatsappBlast: {
    enabled:   { type: Boolean, default: false },
    sent:      { type: Boolean, default: false },
    sentAt:    { type: Date },
    recipients:{ type: Number, default: 0 },
  },

  attachments: [{ name: String, url: String }],
  tags: [String],
  pinned: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
