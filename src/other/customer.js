import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Customer',
  },
  phone_number: String,
  address: String,
});

export default mongoose.model('Customer', customerSchema);
