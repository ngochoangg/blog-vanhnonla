import express from 'express';
import * as postController from '../controllers/postController.js';
import * as authController from '../controllers/authController.js';
import startUpload from '../utils/storage.js';

const router = express.Router();

//Get Stats router
router.route('/avg-stat').get(postController.getPostStats);

//ALIAS middleware get Newest post
router
  .route('/newest')
  .get(postController.aliasNewest, postController.getAllPost);

//CRUD routes
router
  .route('/')
  .get(authController.protect, postController.getAllPost)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    postController.createPost,
  );

router
  .route('/:id')
  .get(postController.getPostById)
  .patch(authController.protect, postController.updatePostById)
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    postController.deletePost,
  );

router.post(
  '/upload',
  authController.protect,
  startUpload('VNL_Post'),
  postController.uploadImage,
);

router.post('/summarize', postController.summarizeContent);

export default router;
