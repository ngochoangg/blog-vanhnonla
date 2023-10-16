import { Post } from '../models/postModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import PostAPIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';

//FEATURES...

//Get newest post
export const aliasNewest = (req, _res, next) => {
  req.query.limit = 5;
  req.query.sort = '-createdAt';

  next();
};

//Get post stats / Aggregate and Group
export const getPostStats = catchAsync(async (req, res, next) => {
  const stats = await Post.aggregate([
    {
      $match: {},
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: 'rating' },
        minRating: { $min: 'rating' },
        maxRating: { $max: 'rating' },
        numRatings: { $sum: 'rating' },
        numPosts: { $sum: 1 }, //Trick to get total posts add: 1 to count
      },
    },
    {
      $sort: {
        createdDate: 1,
      },
    },
  ]);

  return res.status(200).json({
    status: 'success',
    data: stats,
  });
});

//CRUD function

export const createPost = catchAsync(async (req, res, next) => {
  const newPost = await Post.create(req.body);
  console.log('Post Created: ', newPost);
  return res.status(201).json({
    status: 'success',
    data: newPost,
  });
});

export const getAllPost = catchAsync(async (req, res, next) => {
  //Execute query
  const features = new PostAPIFeatures(Post.find(), req.query)
    .filter()
    .sort()
    .limitField()
    .paginate();
  const result = await features.query;
  const totalDocs = await Post.countDocuments({ secretPost: false });

  return res.status(200).json({
    status: 'success',
    documentCount: result.length,
    data: result,
  });
});

export const getPostById = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const result = await Post.findById(postId);
  if (!result) {
    return next(new AppError('Document not found', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const updatePostById = catchAsync(async (req, res, next) => {
  console.log(req.user);
  const { secretPost, isAccept, ...thisPost } = req.body;
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    req.user?.role === 'admin' ? req.body : thisPost,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    status: 'success',
    data: post,
  });
});

export const deletePost = catchAsync(async (req, res, next) => {
  await Post.findByIdAndDelete(req.params.id);
  return res.status(204).json();
});

export const uploadImage = (req, res, next) => {
  const image = req.file;
  if (!image) {
    return next(new AppError('Invalid input file', 400));
  }
  return res.status(200).json({
    message: 'success',
    data: image,
  });
};

export const summarizeContent = async (req, res, next) => {
  // console.log(fields);
  const { text } = req.body;
  const newForm = new FormData();
  newForm.append('txt', text);
  newForm.append('key', process.env.MEANING_CLOUD_KEY);
  newForm.append('sentences', 1);

  try {
    fetch('https://api.meaningcloud.com/summarization-1.0', {
      method: 'POST',
      body: newForm,
      redirect: 'follow',
    })
      .then((data) => data.json())
      .then((result) => {
        return res.status(200).json({
          status: 'success',
          data: result,
        });
      });
  } catch (error) {
    console.log(error);
    return next(
      new AppError(
        'Something went wrong, please try again in a few minutes',
        500,
      ),
    );
  }
};
