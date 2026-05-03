import sequelize from './src/config/database.js';

async function fixOrderSchema() {
  try {
    console.log('🔍 Đang kiểm tra cấu trúc bảng orders...');
    
    // 1. Chuyển payment_method sang VARCHAR(50) để hỗ trợ vnpay
    await sequelize.query("ALTER TABLE orders MODIFY COLUMN payment_method VARCHAR(50) NOT NULL;");
    console.log('✅ Đã cập nhật cột payment_method sang VARCHAR(50)');

    console.log('🚀 Sửa lỗi hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi sửa schema:', error);
    process.exit(1);
  }
}

fixOrderSchema();
