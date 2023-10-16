import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    custommer: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
      },
    ],
  },
  {
    timestamps: true,
    validateBeforeSave: true,
  },
);

export default mongoose.model('Bill', billSchema);
