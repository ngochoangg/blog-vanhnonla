import multer from 'multer';
import cloudinary from './cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const startUpload = (folderName) => {
  const upload = multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: folderName,
        allowedFormats: ['jpg', 'jpeg', 'png'],
      },
    }),
  });
  return upload.single('image');
};

export default startUpload;
