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
    await sequelize.authenticate();
    console.log('🎉 Kết nối CSDL Aiven Cloud thành công chuẩn SQA!');
    
    // BẢO VỆ DATABASE: Chỉ Sync khi file .env có biến SYNC_DB=true
    if (process.env.SYNC_DB === 'true') {
        await sequelize.sync(); 
        console.log('✅ Đã đồng bộ (Sync) cấu trúc bảng lên Cloud!');
    } else {
        console.log('🛡️ Chế độ an toàn: Đã bỏ qua bước đồng bộ cấu trúc bảng.');
    }

  } catch (error) {
    console.error('❌ Lỗi kết nối CSDL Cloud:', error);
    process.exit(1); 
  }
};

export default sequelize;