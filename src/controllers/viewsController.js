import { Post } from '../models/postModel.js';
import PostAPIFeatures from '../utils/apiFeatures.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getOverview = catchAsync(async (req, res, next) => {
  const posts = await Post.find().limit(6).sort({ createdAt: -1 });
  return res.status(200).render('overview', {
    title: 'Home',
    posts,
  });
});

/*Return posts with filtered and paginate
 * By default, return 20 posts per page if query string has no `page`||`limit`
 * Only get `category` in query string
 */
export const getPosts = catchAsync(async (req, res, next) => {
  const features = new PostAPIFeatures(Post.find(), req.query)
    .filter()
    .paginate();

  const posts = await features.query;
  const docCount = await Post.countDocuments({ isAccept: true });
  const limit = req.query.limit || 20;
  let page = parseInt(req.query.page) || 1;
  let totalPage = Math.ceil(docCount / limit);
  // if (page > totalPage) {
  //   page = totalPage;
  // }
  return res.status(200).render('allPosts', {
    title: `Posts - ${req.query.category || ' All'}`,
    posts,
    currentPage: page,
    total: totalPage,
  });
});

export const getSinglePosts = catchAsync(async (req, res, next) => {
  const post = await Post.findOne({ slug: req.params.slug });
  if (post?.slug !== req.params?.slug) {
    return next(new AppError('Post not found!', 404));
  }
  //Get random post in same category
  const similarPosts = await Post.aggregate([
    {
      $match: {
        category: post?.category,
      },
    },
    {
      $sample: {
        size: 4,
      },
    },
  ]);
  return res.status(200).render('singlePost', {
    title: post.slug,
    post,
    similarPosts,
  });
});

export const getWritePage = (req, res) => {
  return res.status(200).render('write', {
    title: 'Start Writing',
  });
};

export const getLoginForm = (req, res) => {
  return res.status(200).render('login', {
    title: 'Login to your account',
  });
};

export const getFAQ = (req, res) => {
  return res.status(200).render('faq', {
    title: 'FAQs',
  });
};

export const getUserProfile = (req, res) => {
  return res.status(200).render('profile', {
    title: 'User Profile',
    user: req.user,
  });
};
