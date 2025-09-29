const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['customer', 'provider'],
    required: true
  },
  message: {
    type: String,
    required: function() {
      return !this.attachments || this.attachments.length === 0;
    }
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
chatMessageSchema.index({ bookingId: 1, timestamp: 1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ read: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);