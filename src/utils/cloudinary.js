import { v2 as cloudinary } from 'cloudinary';
import * as env from 'dotenv';
env.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_404_NAME,
  api_key: process.env.CLOUDINARY_404_API,
  api_secret: process.env.CLOUDINARY_404_SECRET,
});

export default cloudinary;
