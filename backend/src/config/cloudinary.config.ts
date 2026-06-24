import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("⚠️ [Thông tin] File .env chưa cấu hình Cloudinary. (Chỉ ảnh hưởng đến tính năng tải lên ảnh sản phẩm/sân mới của Admin, app Khách hàng hoạt động bình thường).");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'thethaovip_facilities', 
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], 
      public_id: file.originalname.split('.')[0] + '_' + Date.now(), 
    };
  },
});

export const uploadCloud = multer({ storage });