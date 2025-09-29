const Provider = require('../models/provider');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// @desc    Register new provider
// @route   POST /api/providers/register
// @access  Public
const registerProvider = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      password,
      serviceType,
      location,
      hourlyRate,
      experience,
      skills,
      phone,
      availability
    } = req.body;

    // Check if provider already exists
    const existingProvider = await Provider.findOne({ email });
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Provider with this email already exists'
      });
    }

    // Create new provider
    const provider = await Provider.create({
      name,
      email,
      password,
      serviceType,
      location,
      hourlyRate,
      experience,
      skills: skills || [],
      phone,
      availability
    });

    // Generate token
    const token = generateToken(provider._id);

    // Remove password from response
    const providerResponse = provider.toObject();
    delete providerResponse.password;

    res.status(201).json({
      success: true,
      message: 'Provider registered successfully',
      data: {
        provider: providerResponse,
        token
      }
    });

  } catch (error) {
    console.error('Provider registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login provider
// @route   POST /api/providers/login
// @access  Public
const loginProvider = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find provider and include password for comparison
    const provider = await Provider.findOne({ email }).select('+password');
    
    if (!provider || !(await provider.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if provider is active
    if (!provider.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    provider.lastLogin = new Date();
    await provider.save();

    // Generate token
    const token = generateToken(provider._id);

    // Remove password from response
    const providerResponse = provider.toObject();
    delete providerResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        provider: providerResponse,
        token
      }
    });

  } catch (error) {
    console.error('Provider login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get provider profile
// @route   GET /api/providers/profile
// @access  Private
const getProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findById(req.provider.id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { provider }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update provider profile
// @route   PUT /api/providers/profile
// @access  Private
const updateProviderProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'serviceType', 'location', 'hourlyRate', 
      'experience', 'skills', 'phone', 'availability', 'profileImage'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const provider = await Provider.findByIdAndUpdate(
      req.provider.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { provider }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all providers (for customers)
// @route   GET /api/providers
// @access  Public
const getAllProviders = async (req, res) => {
  try {
    const { serviceType, city, minRate, maxRate, minRating, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (serviceType) {
      filter.serviceType = serviceType;
    }
    
    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }
    
    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = parseFloat(minRate);
      if (maxRate) filter.hourlyRate.$lte = parseFloat(maxRate);
    }
    
    if (minRating) {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get providers with pagination
    const providers = await Provider.find(filter)
      .select('-password')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Provider.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        providers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get provider by ID
// @route   GET /api/providers/:id
// @access  Public
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select('-password');
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    if (!provider.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Provider is not available'
      });
    }

    res.status(200).json({
      success: true,
      data: { provider }
    });

  } catch (error) {
    console.error('Get provider by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Search providers by location and service
// @route   POST /api/providers/search
// @access  Public
const searchProviders = async (req, res) => {
  try {
    const { serviceType, location, radius = 10 } = req.body;

    if (!serviceType || !location) {
      return res.status(400).json({
        success: false,
        message: 'Service type and location are required'
      });
    }

    // Basic search (you can enhance this with geospatial queries)
    const providers = await Provider.find({
      serviceType,
      'location.city': new RegExp(location, 'i'),
      isActive: true
    })
    .select('-password')
    .sort({ 'rating.average': -1 });

    res.status(200).json({
      success: true,
      data: { providers }
    });

  } catch (error) {
    console.error('Search providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registerProvider,
  loginProvider,
  getProviderProfile,
  updateProviderProfile,
  getAllProviders,
  getProviderById,
  searchProviders
};