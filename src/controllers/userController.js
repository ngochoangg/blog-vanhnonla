import { User } from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getAllUsers = async (req, res) => {
  try {
    //Paging
    const pageSize = +req.query?.s || 10;
    const pageNum = +req.query?.p || 1;

    let querySearch = {};
    if (req.query.email) {
      const email = req.query?.email;
      querySearch = { email: email };
    }
    const totalDocs = await User.countDocuments({ active: true });
    const totalPages = Math.ceil(totalDocs / pageSize);

    const users = await User.find(querySearch)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .exec();
    console.log(users);
    return res.status(200).json({
      status: 'success',
      totalPages,
      pageSize,
      totalDocs,
      currentPage: pageNum,
      data: users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'Check log for details!',
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const uid = req.params.id;
    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }
    const { password, ...result } = user._doc;
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'Check log for details!',
    });
  }
};

//Update Current User
export const updateUser = catchAsync(async (req, res, next) => {
  //DO NOT ACCEPT update password or passwordConfirm
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('Cannot update password, using /changepass instead!', 400),
    );
  }
  //Filter out unwanted fields
  const filterBody = filterObject(req.body, 'name', 'email', 'photo');

  //Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

//Delete current user
export const deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  return res.status(204).json();
});

//Filter Allowed fields of POST method Body.
const filterObject = (object, ...allowedFields) => {
  const result = {};
  Object.keys(object).forEach((el) => {
    if (allowedFields.includes(el)) {
      result[el] = object[el];
    }
  });

  return result;
};

export const uploadPhoto = (req, res, next) => {
  const image = req.file;
  if (!image) {
    return next(new AppError('Invalid input file', 400));
  }
  return res.status(200).json({
    message: 'success',
    data: image,
  });
};
