import mongoose from 'mongoose';
const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      unique: true,
      required: true,
    },
    product_type: {
      type: String,
      required: true,
      default: 'Common',
    },
    packing: [
      {
        pack_type: {
          type: String,
          required: true,
        },
        pack_length: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    price: [
      {
        type: Number,
      },
    ],
    description: String,
  },
  {
    timestamps: true,
    validateBeforeSave: true,
  },
);

export default mongoose.model('Product', productSchema);
