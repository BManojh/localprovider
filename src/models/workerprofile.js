const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  
  // Professional Information
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  
  businessLicense: {
    number: String,
    isValid: { type: Boolean, default: false },
    expiryDate: Date
  },
  
  insurance: {
    provider: String,
    policyNumber: String,
    coverage: String,
    expiryDate: Date,
    isActive: { type: Boolean, default: false }
  },
  
  // Service Details
  servicesOffered: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    basePrice: {
      type: Number,
      min: 0
    },
    estimatedDuration: String, // e.g., "2-3 hours"
    category: String
  }],
  
  serviceAreas: [{
    city: String,
    zipCodes: [String],
    travelFee: { type: Number, default: 0 }
  }],
  
  // Portfolio and Work Samples
  portfolio: [{
    title: String,
    description: String,
    images: [String], // URLs to images
    completedDate: Date,
    clientTestimonial: String
  }],
  
  // Equipment and Tools
  equipment: [{
    name: String,
    description: String,
    owned: { type: Boolean, default: true }
  }],
  
  // Pricing Structure
  pricingStructure: {
    type: String,
    enum: ['hourly', 'fixed', 'both'],
    default: 'hourly'
  },
  
  minimumCharge: {
    type: Number,
    min: 0
  },
  
  emergencyRate: {
    type: Number,
    min: 0
  },
  
  // Work History and Statistics
  jobsCompleted: {
    type: Number,
    default: 0
  },
  
  totalEarnings: {
    type: Number,
    default: 0
  },
  
  averageJobRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Availability and Schedule
  workingHours: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  
  emergencyService: {
    available: { type: Boolean, default: false },
    additionalCharge: { type: Number, default: 0 },
    responseTime: String // e.g., "30 minutes"
  },
  
  // Reviews and Ratings
  reviews: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    },
    response: String // Provider's response to review
  }],
  
  // Verification Status
  verificationStatus: {
    identity: { type: Boolean, default: false },
    address: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    license: { type: Boolean, default: false },
    insurance: { type: Boolean, default: false },
    backgroundCheck: { type: Boolean, default: false }
  },
  
  // Performance Metrics
  responseTime: {
    average: { type: Number, default: 0 }, // in minutes
    lastUpdated: Date
  },
  
  completionRate: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  
  customerSatisfactionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Account Status
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  isProfileActive: {
    type: Boolean,
    default: true
  },
  
  suspensionReason: String,
  suspensionDate: Date,
  
  // Additional Information
  aboutMe: {
    type: String,
    maxlength: [1000, 'About me section cannot exceed 1000 characters']
  },
  
  languages: [String],
  
  badges: [{
    name: String,
    description: String,
    earnedDate: Date,
    icon: String
  }],
  
  socialMedia: {
    website: String,
    facebook: String,
    instagram: String,
    linkedin: String
  }
  
}, {
  timestamps: true
});

// Calculate profile completeness
workerProfileSchema.methods.calculateProfileCompleteness = function() {
  let completeness = 0;
  const maxPoints = 100;
  
  // Basic info (30 points)
  if (this.aboutMe) completeness += 10;
  if (this.servicesOffered && this.servicesOffered.length > 0) completeness += 10;
  if (this.serviceAreas && this.serviceAreas.length > 0) completeness += 10;
  
  // Verification (40 points)
  const verifications = Object.values(this.verificationStatus);
  const verifiedCount = verifications.filter(v => v === true).length;
  completeness += (verifiedCount / verifications.length) * 40;
  
  // Portfolio and reviews (30 points)
  if (this.portfolio && this.portfolio.length > 0) completeness += 15;
  if (this.reviews && this.reviews.length > 0) completeness += 15;
  
  this.profileCompleteness = Math.round(completeness);
  return this.profileCompleteness;
};

// Add review method
workerProfileSchema.methods.addReview = function(customerId, jobId, rating, comment) {
  this.reviews.push({
    customerId,
    jobId,
    rating,
    comment
  });
  
  // Update average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageJobRating = totalRating / this.reviews.length;
  
  return this.save();
};

// Update completion rate
workerProfileSchema.methods.updateCompletionRate = function(completed, total) {
  this.completionRate = total > 0 ? (completed / total) * 100 : 100;
  return this.save();
};

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);