import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import sendMail from '../utils/email.js';
import crypto from 'crypto';

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createAndSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check email and password
  if (!email || !password) {
    return next(new AppError('Email or password not match!', 400));
  }

  //Check user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Email or Password incorrect!`, 401));
  }

  //Create token and send back
  createAndSendToken(user, 200, res);
});

//Log out
export const logout = (req, res) => {
  res.cookie('access_token', undefined, {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  return res.status(200).json({
    status: 'success',
    message: 'user has been logged out',
  });
};

//Protect resources only logged in users can access
export const protect = catchAsync(async (req, res, next) => {
  let token = null;
  //Get then check token if exists
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  if (!token)
    return next(
      new AppError('Please login or register new account to get access!', 401),
    );
  //Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //Check user exists
  const loggedinUser = await User.findById(decoded.id);
  if (!loggedinUser) {
    return next(new AppError('Token no longer exists for this user', 401));
  }

  //Check if user changed password after token created
  if (loggedinUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('Password has been changed, please login again!', 401),
    );
  }

  //Grant access
  req.user = loggedinUser;
  next();
});

//Only for rendered page, no error
export const isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.access_token) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.access_token,
        process.env.JWT_SECRET,
      );

      const currentUser = await User.findById(decoded.id);
      console.log('This user has been logged in: ', currentUser);

      if (!currentUser) {
        return next();
      }

      //Check if user changed password after token created
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next();
      }
      res.locals.user = currentUser;
      return next();
    }
    return next();
  } catch {
    return next();
  }
};

//Restrict to ROLE
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Permission denied!', 403));
    }

    next();
  };
};

//Forget password: Generate TOKEN to reset password
export const forgotPassword = catchAsync(async (req, res, next) => {
  //Get user based on email request
  const currentUser = await User.findOne({ email: req.body.email });
  if (!currentUser) {
    return next(new AppError('No user found with email provided', 404));
  }

  //Generate new ResetPasswordToken
  const resetToken = currentUser.createPasswordResetToken();
  await currentUser.save({ validateBeforeSave: false });

  //Send reset password token to user via Email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/pwreset/${resetToken}`;

  const message = `Submit new password and passwordConfirm to: ${resetURL}`;

  try {
    await sendMail({
      email: req.body.email,
      subject: 'Reset your password < Valid in 10 minutes >',
      message,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Reset password Token has been sent to your email',
    });
  } catch (error) {
    currentUser.passwordResetToken = undefined;
    currentUser.passwordResetTokenExpires = undefined;
    await currentUser.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'Something went wrong, please try again in a few minutes',
        500,
      ),
    );
  }
});

//RESET Password
export const resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user base on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const currentUser = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gte: Date.now() },
  });

  //2. Token and user valid, set new password
  if (!currentUser) {
    return next(new AppError('Token invalid or has expired', 400));
  }

  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  currentUser.passwordResetToken = undefined;
  currentUser.passwordResetTokenExpires = undefined;

  await currentUser.save();

  //3. Update passwordChangedAt property - In Schema
  //4. Login then send new JWT
  createAndSendToken(currentUser, 200, res);
});

//Update Password
export const updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  const currentUser = await User.findById(req.user.id).select('+password');
  console.log({ currentUser });
  //2. Check posted password is correct
  if (
    !(await currentUser.correctPassword(
      req.body.passwordCurrent,
      currentUser.password,
    ))
  ) {
    return next(
      new AppError(
        'Password incorrect, check your password or select reset password',
        401,
      ),
    );
  }
  //3. Update password
  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;

  await currentUser.save();
  //4. Log user in, send new JWT
  createAndSendToken(currentUser, 200, res);
});

//Sign ID with JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP_IN,
  });
};

//Send back to client Signed token and cookie
const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXP_IN * 24 * 60 * 60 * 1000,
    ),
    //secure: true, //only send when connection is secured (https)
    httpOnly: true,
    sameSite: true,
  };
  res.cookie('access_token', token, cookieOptions);
  return res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
