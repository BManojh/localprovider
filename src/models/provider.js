import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true  // Keep just this index definition
  },
  // ... rest of your schema
});

const Provider = mongoose.model('Provider', providerSchema);
export default Provider;