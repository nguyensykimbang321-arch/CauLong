import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import { testConnection } from '../config/database.js';

const runSeeder = async () => {
    try {
        // 1. Kết nối Database
        await testConnection();
        console.log('🌱 Bắt đầu chạy Seeder bơm dữ liệu mẫu...');

        // ==========================================
        // 2. TẠO TÀI KHOẢN ADMIN VÀ CUSTOMER
        // ==========================================
        const adminEmail = 'admin@thethaovip.com';
        let admin = await models.User.findOne({ where: { email: adminEmail } });

        if (!admin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt); // Pass mặc định: 123456

            await models.User.bulkCreate([
                {
                    email: adminEmail,
                    password_hash: hashedPassword,
                    phone: '0999999999',
                    role: 'admin',
                    is_active: true
                },
                {
                    email: 'khachhang@gmail.com',
                    password_hash: hashedPassword,
                    phone: '0988888888',
                    role: 'customer',
                    is_active: true
                }
            ]);
            console.log('✅ Đã tạo tài khoản Admin (admin@thethaovip.com) và Customer (khachhang@gmail.com). Pass chung: 123456');
        } else {
            console.log('⚠️ Tài khoản Admin đã tồn tại, bỏ qua bước tạo User.');
        }

        // ==========================================
        // 3. TẠO CƠ SỞ (FACILITY) VÀ SÂN (COURTS)
        // ==========================================
        const facilityName = 'Chi nhánh Quận 1';
        let facility = await models.Facility.findOne({ where: { name: facilityName } });

        if (!facility) {
            // Tạo Cơ sở
            facility = await models.Facility.create({
                name: facilityName,
                address: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
                is_active: true
            });
            console.log(`✅ Đã tạo Cơ sở: ${facilityName}`);

            // Tạo danh sách các Sân thuộc Cơ sở này
            await models.Court.bulkCreate([
                { facility_id: facility.id, name: 'Sân Cầu Lông 1', court_type: 'badminton', is_active: true },
                { facility_id: facility.id, name: 'Sân Cầu Lông 2', court_type: 'badminton', is_active: true },
                { facility_id: facility.id, name: 'Sân Cầu Lông 3 (VIP)', court_type: 'badminton', is_active: true },
                { facility_id: facility.id, name: 'Sân Tennis 1', court_type: 'tennis', is_active: true },
                { facility_id: facility.id, name: 'Sân Bóng Đá Mini', court_type: 'football', is_active: true },
            ]);
            console.log('✅ Đã tạo 5 Sân (Cầu lông, Tennis, Bóng đá) cho Chi nhánh Quận 1.');
        } else {
            console.log(`⚠️ Cơ sở "${facilityName}" đã tồn tại, bỏ qua bước tạo Facility & Court.`);
        }

        console.log('🎉 Seeder chạy hoàn tất thành công!');
        process.exit(0); // Thoát tiến trình Node.js an toàn
    } catch (error) {
        console.error('❌ Lỗi khi chạy Seeder:', error);
        process.exit(1); // Thoát tiến trình kèm mã báo lỗi
    }
};

// Chạy hàm
runSeeder();