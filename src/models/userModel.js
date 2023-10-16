import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Provide your name'],
      unique: false,
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Email required!'],
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: 'Email invalid!',
      },
    },
    photo: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moder'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password required!'],
      minlength: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Confirm your password!'],
      validate: {
        //This validate only works when using CREATE or SAVE not UPDATE...
        validator: function (el) {
          return el === this.password;
        },
        message: "Password doesn't match!",
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },

  // { timestamps: true, validateBeforeSave: true },
);

//QUERY MIDDLEWARE IN MONGOOSE

//Only get users active
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Encrypted password before save
userSchema.pre('save', async function (next) {
  //If modified password will go throught next()
  if (!this.isModified('password')) return next();

  //Hash password cost 10
  this.password = await bcrypt.hash(this.password, 10);

  //Delete password confirm
  this.passwordConfirm = undefined;
  next();
});

//Check if password recently changed or not
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//INSTANT METHODS
//Is password correct
userSchema.methods.correctPassword = async function (
  rawPassword,
  hashedPassword,
) {
  return await bcrypt.compare(rawPassword, hashedPassword);
};

//Check password changed when
userSchema.methods.passwordChangedAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

//Create Random reset password Token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

export const User = mongoose.model('User', userSchema);
