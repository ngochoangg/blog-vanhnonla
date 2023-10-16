import express from 'express';
import * as viewController from '../controllers/viewsController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.isLoggedIn);
router.get('/', viewController.getOverview);
router.get('/posts', viewController.getPosts);
router.get('/posts/:slug', viewController.getSinglePosts);
router.get(
  '/write',
  authController.protect,
  authController.restrictTo('admin'),
  viewController.getWritePage,
);

router.get('/login', viewController.getLoginForm);
router.get('/faq', viewController.getFAQ);
router.get('/profile',authController.protect, viewController.getUserProfile);

export default router;
