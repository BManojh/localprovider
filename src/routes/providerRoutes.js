// src/routes/providerRoutes.js - ES Module version
import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// Middleware to authenticate JWT token (copied from authRoutes for consistency)
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// GET /api/workers - Get all workers/service providers
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching workers with query:', req.query);
    
    const { service, location, page = 1, limit = 20, sort = 'rating' } = req.query;
    
    // Build query object
    const query = {
      role: 'worker',
      isActive: true
    };
    
    // Add service filter
    if (service && service !== 'all' && service !== '') {
      query.service = service;
    }
    
    // Add location filter (case-insensitive partial match)
    if (location && location.trim() !== '') {
      query.location = new RegExp(location.trim(), 'i');
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort order
    let sortOrder = {};
    switch (sort) {
      case 'rating':
        sortOrder = { rating: -1, createdAt: -1 };
        break;
      case 'price-low':
        sortOrder = { hourlyRate: 1 };
        break;
      case 'price-high':
        sortOrder = { hourlyRate: -1 };
        break;
      case 'newest':
        sortOrder = { createdAt: -1 };
        break;
      default:
        sortOrder = { rating: -1, createdAt: -1 };
    }
    
    // Execute query
    const workers = await User.find(query)
      .select('-password -__v') // Exclude sensitive fields
      .sort(sortOrder)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalWorkers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalWorkers / parseInt(limit));
    
    console.log(`✅ Found ${workers.length} workers (${totalWorkers} total)`);
    
    res.json({
      success: true,
      data: workers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalWorkers,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        service: service || 'all',
        location: location || '',
        sort
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service providers',
      error: error.message
    });
  }
});

// GET /api/workers/:id - Get specific worker details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Fetching worker details for ID:', id);
    
    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID format'
      });
    }
    
    const worker = await User.findOne({
      _id: id,
      role: 'worker',
      isActive: true
    }).select('-password -__v');
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    console.log('✅ Worker details fetched successfully');
    
    res.json({
      success: true,
      data: worker
    });
    
  } catch (error) {
    console.error('❌ Error fetching worker details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worker details',
      error: error.message
    });
  }
});

// POST /api/workers/:id/reviews - Add a review for a worker (Protected route)
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const customerId = req.user.userId;
    
    console.log('📝 Adding review for worker:', id);
    
    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID format'
      });
    }
    
    // Find the worker
    const worker = await User.findOne({
      _id: id,
      role: 'worker',
      isActive: true
    });
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Check if customer already reviewed this worker
    const existingReview = worker.reviews.find(
      review => review.customer.toString() === customerId
    );
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this worker'
      });
    }
    
    // Add the review
    await worker.addReview(customerId, parseInt(rating), comment || '');
    
    console.log('✅ Review added successfully');
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        rating: worker.rating,
        totalReviews: worker.reviews.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
});

// GET /api/workers/services/list - Get list of available services
router.get('/services/list', async (req, res) => {
  try {
    const services = [
      { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
      { value: 'electrical', label: 'Electrical', icon: '⚡' },
      { value: 'carpentry', label: 'Carpentry', icon: '🔨' },
      { value: 'cleaning', label: 'Cleaning', icon: '🧽' },
      { value: 'gardening', label: 'Gardening', icon: '🌱' },
      { value: 'painting', label: 'Painting', icon: '🎨' },
      { value: 'appliance-repair', label: 'Appliance Repair', icon: '🔩' },
      { value: 'tutoring', label: 'Tutoring', icon: '📚' },
      { value: 'pet-care', label: 'Pet Care', icon: '🐕' },
      { value: 'home-maintenance', label: 'Home Maintenance', icon: '🏠' },
      { value: 'other', label: 'Other', icon: '🛠️' }
    ];
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
});

// PUT /api/workers/profile - Update worker profile (Protected route)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;
    
    console.log('📝 Updating worker profile for:', userId);
    
    // Find the worker
    const worker = await User.findOne({
      _id: userId,
      role: 'worker'
    });
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found'
      });
    }
    
    // Define allowed fields for update
    const allowedUpdates = [
      'name', 'service', 'location', 'hourlyRate', 
      'description', 'phone', 'profileImage'
    ];
    
    // Filter and apply updates
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    // Update the worker
    Object.assign(worker, filteredUpdates);
    const updatedWorker = await worker.save();
    
    console.log('✅ Worker profile updated successfully');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedWorker._id,
        name: updatedWorker.name,
        email: updatedWorker.email,
        role: updatedWorker.role,
        service: updatedWorker.service,
        location: updatedWorker.location,
        hourlyRate: updatedWorker.hourlyRate,
        description: updatedWorker.description,
        rating: updatedWorker.rating,
        reviews: updatedWorker.reviews,
        phone: updatedWorker.phone,
        profileImage: updatedWorker.profileImage
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating worker profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

export default router;