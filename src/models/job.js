const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  
  // Job Details
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [1000, 'Job description cannot exceed 1000 characters']
  },
  
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['plumber', 'electrician', 'carpenter', 'painter', 'cleaner', 'gardener', 'mechanic', 'other']
  },
  
  category: {
    type: String,
    enum: ['repair', 'installation', 'maintenance', 'emergency', 'consultation', 'other'],
    default: 'repair'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Location
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    accessInstructions: String
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  
  scheduledTime: {
    start: {
      type: String,
      required: [true, 'Start time is required']
    },
    end: String
  },
  
  estimatedDuration: {
    type: Number, // in hours
    default: 1
  },
  
  // Pricing
  budget: {
    min: Number,
    max: Number,
    preferred: Number
  },
  
  pricing: {
    type: {
      type: String,
      enum: ['hourly', 'fixed'],
      default: 'hourly'
    },
    rate: Number,
    estimatedTotal: Number,
    finalAmount: Number
  },
  
  // Status and Progress
  status: {
    type: String,
    enum: [
      'pending',      // Job posted, waiting for provider acceptance
      'accepted',     // Provider accepted the job
      'confirmed',    // Customer confirmed the acceptance
      'in_progress',  // Work is being done
      'completed',    // Work finished by provider
      'cancelled',    // Job cancelled
      'disputed'      // There's a dispute
    ],
    default: 'pending'
  },
  
  // Images and Attachments
  images: [{
    url: String,
    description: String,
    uploadedBy: {
      type: String,
      enum: ['customer', 'provider']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Communication
  messages: [{
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
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Reviews and Ratings
  customerReview: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: Date
  },
  
  providerReview: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: Date
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'digital_wallet'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  
  // Completion Details
  workDetails: {
    startTime: Date,
    endTime: Date,
    actualDuration: Number, // in hours
    workSummary: String,
    materialsUsed: [{
      item: String,
      quantity: Number,
      cost: Number
    }],
    beforeImages: [String],
    afterImages: [String]
  },
  
  // Cancellation Details
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'provider', 'admin']
    },
    reason: String,
    date: Date,
    refundAmount: Number
  },
  
  // Additional Information
  specialRequirements: String,
  emergencyJob: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  acceptedAt: Date,
  confirmedAt: Date,
  startedAt: Date,
  completedAt: Date,
  
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ customerId: 1, status: 1 });
jobSchema.index({ providerId: 1, status: 1 });
jobSchema.index({ serviceType: 1, 'location.city': 1 });
jobSchema.index({ scheduledDate: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

// Methods
jobSchema.methods.addMessage = function(senderId, senderType, message) {
  this.messages.push({
    senderId,
    senderType,
    message
  });
  return this.save();
};

jobSchema.methods.updateStatus = function(newStatus) {
  const now = new Date();
  this.status = newStatus;
  
  switch (newStatus) {
    case 'accepted':
      this.acceptedAt = now;
      break;
    case 'confirmed':
      this.confirmedAt = now;
      break;
    case 'in_progress':
      this.startedAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      break;
  }
  
  return this.save();
};

jobSchema.methods.calculateFinalAmount = function() {
  if (this.pricing.type === 'hourly' && this.workDetails.actualDuration) {
    this.pricing.finalAmount = this.pricing.rate * this.workDetails.actualDuration;
  } else if (this.pricing.type === 'fixed') {
    this.pricing.finalAmount = this.pricing.estimatedTotal;
  }
  
  // Add material costs
  if (this.workDetails.materialsUsed && this.workDetails.materialsUsed.length > 0) {
    const materialCost = this.workDetails.materialsUsed.reduce((total, material) => {
      return total + (material.cost || 0);
    }, 0);
    this.pricing.finalAmount += materialCost;
  }
  
  return this.pricing.finalAmount;
};

module.exports = mongoose.model('Job', jobSchema);