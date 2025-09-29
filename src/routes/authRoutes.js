import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // You'll need to create this model

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', { ...req.body, password: '[HIDDEN]' });

    const {
      email,
      password,
      name,
      phoneNumber,
      role,
      // Customer specific fields
      address,
      city,
      pincode,
      // Provider specific fields
      serviceType,
      location,
      hourlyRate,
      experience,
      description
    } = req.body;

    // Validation
    if (!email || !password || !name || !phoneNumber || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, phone number, and role are required'
      });
    }

    if (!['customer', 'provider'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either customer or provider'
      });
    }

    // Provider-specific validation
    if (role === 'provider') {
      if (!serviceType || !location || !hourlyRate) {
        return res.status(400).json({
          success: false,
          message: 'Service type, location, and hourly rate are required for providers'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user object
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phoneNumber,
      role,
      createdAt: new Date()
    };

    // Add role-specific fields
    if (role === 'customer') {
      userData.profile = {
        address: address || '',
        city: city || '',
        pincode: pincode || ''
      };
    } else if (role === 'provider') {
      userData.profile = {
        serviceType,
        location,
        hourlyRate: parseFloat(hourlyRate),
        experience: experience ? parseInt(experience) : 0,
        description: description || '',
        isVerified: false,
        rating: 0,
        reviewCount: 0
      };
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt
    };

    console.log('User registered successfully:', userResponse.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received for:', req.body.email);

    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check role if provided
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `No ${role} account found with this email`
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt
    };

    console.log('User logged in successfully:', userResponse.email);

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Logout endpoint (client-side handles token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;