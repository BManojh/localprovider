import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true  // Keep just this index definition
  },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  pincode: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Remove any separate index definitions like:
// customerSchema.index({ email: 1 }, { unique: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;