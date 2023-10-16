import express from 'express';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';
import startUpload from '../utils/storage.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/pwforget', authController.forgotPassword);
router.patch('/pwreset/:resetToken', authController.resetPassword);

router.post(
  '/photo',
  authController.protect,
  startUpload('VNL_Avatar'),
  userController.uploadPhoto,
);

router.patch(
  '/changepass',
  authController.protect,
  authController.updatePassword,
);

router.patch('/updateme', authController.protect, userController.updateUser);
router.delete('/deleteme', authController.protect, userController.deleteUser);

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'moder'),
    userController.getAllUsers,
  );
router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'moder'),
    userController.getUserById,
  );

export default router;
