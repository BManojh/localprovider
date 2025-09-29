import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['customer', 'provider']
  },
  profile: {
    // Customer-specific fields
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    
    // Provider-specific fields
    serviceType: {
      type: String,
      trim: true,
      enum: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting', 'Gardening', 'AC Repair', 'Appliance Repair', 'Home Maintenance', 'Other']
    },
    location: {
      type: String,
      trim: true
    },
    hourlyRate: {
      type: Number,
      min: 0
    },
    experience: {
      type: Number,
      min: 0,
      default: 0
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.serviceType': 1 });
userSchema.index({ 'profile.location': 1 });

const User = mongoose.model('User', userSchema);

export default User;