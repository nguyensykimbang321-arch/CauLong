import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo instance của Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST || 'mysql-84d8816-tung93456-2ff1.k.aivencloud.com',
    port: parseInt(process.env.DB_PORT || '28675'),
    dialect: 'mysql',
    logging: false, // Tắt log SQL cho đỡ rối terminal
    dialectOptions: {
      ssl: {
        require: true, 
        // Bỏ qua xác thực chứng chỉ tự ký (an toàn ở mức MVP, đỡ phải tải file CA cert về máy)
        rejectUnauthorized: false 
      }
    }
  }
);

// Bọc logic vào hàm testConnection và export ra cho server.ts dùng
export const testConnection = async () => {
  try {
    // 1. Thử kết nối
    await sequelize.authenticate();
    console.log('🎉 Kết nối CSDL Aiven Cloud thành công chuẩn SQA!');
    
    // 2. Đồng bộ bảng (Tạo bảng tự động trên Cloud)
    // Lưu ý: Chỉ dùng sync() bình thường, không dùng { alter: true } để tránh lỗi khóa bảng
    await sequelize.sync(); 
    console.log('✅ Đã đồng bộ (Sync) cấu trúc bảng lên Cloud!');

  } catch (error) {
    console.error('❌ Lỗi kết nối CSDL Cloud:', error);
    process.exit(1); // Nếu không kết nối được DB thì bắt buộc dừng hẳn Server
  }
};

export default sequelize;