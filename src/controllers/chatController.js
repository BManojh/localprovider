const ChatMessage = require('../models/ChatMessage');
const Booking = require('../models/Booking');

// Get chat messages for a booking
exports.getChatMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.userId && 
        booking.providerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await ChatMessage.find({ bookingId })
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    await ChatMessage.updateMany(
      { 
        bookingId, 
        senderId: { $ne: req.user.userId },
        read: false 
      },
      { read: true }
    );

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(await ChatMessage.countDocuments({ bookingId }) / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { bookingId, message, attachments } = req.body;
    
    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isCustomer = booking.customerId.toString() === req.user.userId;
    const isProvider = booking.providerId.toString() === req.user.userId;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const chatMessage = new ChatMessage({
      bookingId,
      senderId: req.user.userId,
      senderType: isCustomer ? 'customer' : 'provider',
      message,
      attachments: attachments || []
    });

    await chatMessage.save();

    // Populate sender info for response
    await chatMessage.populate('senderId', 'name profilePicture');

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's chat conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role; // 'customer' or 'provider'

    let bookings;
    if (userType === 'customer') {
      bookings = await Booking.find({ customerId: userId })
        .populate('providerId', 'name profilePicture serviceType')
        .sort({ updatedAt: -1 });
    } else {
      bookings = await Booking.find({ providerId: userId })
        .populate('customerId', 'name profilePicture')
        .sort({ updatedAt: -1 });
    }

    // Get last message for each booking
    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        const lastMessage = await ChatMessage.findOne({ bookingId: booking._id })
          .sort({ timestamp: -1 });
        
        const unreadCount = await ChatMessage.countDocuments({
          bookingId: booking._id,
          senderId: { $ne: userId },
          read: false
        });

        const otherUser = userType === 'customer' ? booking.providerId : booking.customerId;

        return {
          bookingId: booking._id,
          otherUser: {
            id: otherUser._id,
            name: otherUser.name,
            profilePicture: otherUser.profilePicture,
            ...(userType === 'customer' && { serviceType: otherUser.serviceType })
          },
          lastMessage: lastMessage ? {
            message: lastMessage.message,
            timestamp: lastMessage.timestamp,
            senderType: lastMessage.senderType
          } : null,
          unreadCount,
          bookingStatus: booking.status
        };
      })
    );

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};