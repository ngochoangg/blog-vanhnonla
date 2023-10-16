import mongoose from 'mongoose';
import slugify from 'slugify';

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      required: [true, 'Title cannot be empty'],
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
    },
    content: {
      type: String,
      required: [true, 'This post must included content'],
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    isAccept: {
      type: Boolean,
      default: false,
    },
    secretPost: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: [true, 'Post must be in a category'],
      enum: {
        values: ['general', 'checkin', 'discover', 'tips', 'food'],
        message: 'Only accept: general, checkin, discover, tips, food',
      },
      default: 'general',
    },
    location: {
      type: String,
      default: 'N/A',
    },
    slug: String,
  },
  {
    timestamps: true,
    validateBeforeSave: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

//Virtual | Only show result, not actually stored in DB
PostSchema.virtual('minuteRead').get(function () {
  let minRead = 'Less than 1 minute';
  const words = this.content.trim().split(' ').length;
  const minutes = words / 200;
  if (Number.isInteger(minutes)) {
    minRead = `About ${minutes} minutes`;
  } else if (minutes > 1) {
    minRead = `About ${minutes.toFixed(0)} minutes`;
  }

  return minRead;
});

//QUERY MIDDLEWARE

PostSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});
PostSchema.pre(/^find/, function (next) {
  this.find({
    secretPost: { $ne: true },
    isAccept: { $eq: true },
  });
  this.populate({ path: 'author', select: ['_id', 'name'] });
  next();
});

export const Post = mongoose.model('Post', PostSchema);
