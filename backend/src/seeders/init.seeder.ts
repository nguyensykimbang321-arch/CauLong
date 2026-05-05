import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import { testConnection } from '../config/database.js';

const runSeeder = async () => {
    try {
        await testConnection();
        console.log('🌱 Bắt đầu chạy Seeder bơm dữ liệu mẫu lớn...');

        // ==========================================
        // 1. TẠO TÀI KHOẢN ADMIN, STAFF VÀ CUSTOMER
        // ==========================================
        const adminEmail = 'admin@thethaovip.com';
        let admin = await models.User.findOne({ where: { email: adminEmail } });

        if (!admin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            await models.User.bulkCreate([
                {
                    full_name: 'Quản trị viên',
                    email: adminEmail,
                    password_hash: hashedPassword,
                    phone: '0999999999',
                    role: 'admin',
                    is_active: true,
                },
                {
                    full_name: 'Khách Hàng VIP',
                    email: 'khachhang@gmail.com',
                    password_hash: hashedPassword,
                    phone: '0988888888',
                    role: 'customer',
                    is_active: true,
                },
                {
                    full_name: 'Nhân viên bán hàng',
                    email: 'nhanvien@thethaovip.com',
                    password_hash: hashedPassword,
                    phone: '0977777777',
                    role: 'staff',
                    is_active: true,
                }
            ]);
            console.log('✅ Đã tạo tài khoản Admin, Staff và Customer. Pass chung: 123456');
        } else {
            console.log('⚠️ Tài khoản Admin đã tồn tại, bỏ qua.');
        }

        // ==========================================
        // 2. TẠO CƠ SỞ (FACILITY) VÀ SÂN (COURTS)
        // ==========================================
        const facilityName = 'Chi nhánh Quận 1';
        let facility = await models.Facility.findOne({ where: { name: facilityName } });

        if (!facility) {
            // Tạo Cơ sở
            facility = await (models.Facility as any).create({
                name: facilityName,
                address: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
                is_active: true
            });
            console.log(`✅ Đã tạo Cơ sở: ${facilityName}`);

            // Thêm dấu ! để dập tắt lỗi TypeScript (Tao thề facility không null)
            await models.Court.bulkCreate([
                { facility_id: facility!.id, name: 'Sân Cầu Lông 1', court_type: 'badminton', is_active: true },
                { facility_id: facility!.id, name: 'Sân Cầu Lông 2', court_type: 'badminton', is_active: true },
                { facility_id: facility!.id, name: 'Sân Cầu Lông 3 (VIP)', court_type: 'badminton', is_active: true },
                { facility_id: facility!.id, name: 'Sân Tennis 1', court_type: 'tennis', is_active: true },
                { facility_id: facility!.id, name: 'Sân Bóng Đá Mini', court_type: 'football', is_active: true },
            ]);
            console.log('✅ Đã tạo 5 Sân cho Chi nhánh Quận 1.');
        }

        // ==========================================
        // 3. TẠO CẤU HÌNH GIÁ (PRICE CONFIG)
        // ==========================================
        // Thêm dấu ! vào facility!.id
        const priceConfigCount = await models.PriceConfig.count({ where: { facility_id: facility!.id } });

        if (priceConfigCount === 0) {
            await models.PriceConfig.bulkCreate([
                // Thêm dấu ! vào toàn bộ facility!.id
                { facility_id: facility!.id, court_type: 'badminton', start_time: '05:00:00', end_time: '17:00:00', price_per_hour: 50000 },
                { facility_id: facility!.id, court_type: 'badminton', start_time: '17:00:00', end_time: '22:00:00', price_per_hour: 80000 },
                { facility_id: facility!.id, court_type: 'tennis', start_time: '05:00:00', end_time: '17:00:00', price_per_hour: 100000 },
                { facility_id: facility!.id, court_type: 'tennis', start_time: '17:00:00', end_time: '22:00:00', price_per_hour: 150000 },
                { facility_id: facility!.id, court_type: 'football', start_time: '05:00:00', end_time: '17:00:00', price_per_hour: 150000 },
                { facility_id: facility!.id, court_type: 'football', start_time: '17:00:00', end_time: '22:00:00', price_per_hour: 200000 }
            ]);
            console.log('✅ Đã bơm dữ liệu Bảng Giá phân loại theo Cầu lông, Tennis và Bóng đá.');
        }

        // ==========================================
        // 4. SẢN PHẨM & BIẾN THỂ & TỒN KHO (TỪ BẠN EM)
        // ==========================================
        const prodCount = await models.Product.count();
        if (prodCount === 0) {
            const p1 = await (models.Product as any).create({
                name: 'Vợt Cầu Lông Yonex Astrox 99', slug: 'vot-cau-long-yonex-astrox-99', category: 'racket', is_active: true
            });
            const p2 = await (models.Product as any).create({
                name: 'Ống Cầu Lông Yonex Aerosensa 20', slug: 'ong-cau-long-yonex-as20', category: 'shuttlecock', is_active: true
            });

            // Tạo Variant
            const p1v1 = await (models.ProductVariant as any).create({ product_id: p1.id, sku: 'YON-AX99-3U', price_cents: 3500000, is_active: true });
            const p1v2 = await (models.ProductVariant as any).create({ product_id: p1.id, sku: 'YON-AX99-4U', price_cents: 3400000, is_active: true });
            const p2v1 = await (models.ProductVariant as any).create({ product_id: p2.id, sku: 'YON-AS20', price_cents: 550000, is_active: true });

            // Cập nhật tồn kho (Thêm dấu ! vào facility!.id)
            await (models.InventoryLevel as any).bulkCreate([
                { variant_id: p1v1.id, facility_id: facility!.id, quantity_on_hand: 10 },
                { variant_id: p1v2.id, facility_id: facility!.id, quantity_on_hand: 5 },
                { variant_id: p2v1.id, facility_id: facility!.id, quantity_on_hand: 50 },
            ]);
            console.log('✅ Đã tạo Sản phẩm và thiết lập Tồn kho.');
        }

        // ==========================================
        // 5. MÃ KHUYẾN MÃI (PROMO CODES - TỪ BẠN EM)
        // ==========================================
        const promoCount = await models.PromoCode.count();
        if (promoCount === 0) {
            await (models.PromoCode as any).bulkCreate([
                { code: 'GIAM10', type: 'percent', value: 10, min_order_cents: 100000, max_uses: 100, is_active: true }, // Đổi active thành is_active
                { code: 'SALE50K', type: 'fixed', value: 50000, min_order_cents: 200000, max_uses: null, is_active: true },
            ]);
            console.log('✅ Đã tạo Mã khuyến mãi Demo.');
        }

        console.log('🎉 Seeder chạy hoàn tất thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi chạy Seeder:', error);
        process.exit(1);
    }
};

runSeeder();