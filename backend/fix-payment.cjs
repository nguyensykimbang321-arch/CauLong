const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'defaultdb',
  'avnadmin',
  'AVNS_gUHbm4YFs2FsD3wQ0Ck',
  {
    host: 'mysql-84d8816-tung93456-2ff1.k.aivencloud.com',
    port: 28675,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

async function fixOrderSchema() {
  try {
    console.log('🔍 Đang kiểm tra cấu trúc bảng orders...');
    
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
