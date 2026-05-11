import { Router } from 'express';
import { uploadCloud } from '../config/cloudinary.config.js';

const router = Router();

// API Upload 1 ảnh
router.post('/image', uploadCloud.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không tìm thấy file upload' });
    }
    
    // Cloudinary trả về cục data trong req.file, ta lấy cái path (chính là link ảnh)
    return res.status(200).json({
        message: 'Upload thành công',
        data: {
            url: req.file.path 
        }
    });
});

export default router;