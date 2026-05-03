import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import { testConnection } from '../config/database.js';

const runSeeder = async () => {
  try {
    await testConnection();
    console.log('🌱 Bắt đầu chạy Seeder bơm dữ liệu mẫu lớn...');

    // ==========================================
    // 1. TẠO TÀI KHOẢN ADMIN VÀ CUSTOMER
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
          loyalty_points: 1500,
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
      console.log('✅ Đã tạo tài khoản Admin, Staff và Customer.');
    }

    // ==========================================
    // 2. TẠO CƠ SỞ (FACILITIES) VÀ KHO HÀNG (WAREHOUSES)
    // ==========================================
    let facility1 = await models.Facility.findOne({ where: { name: 'Chi nhánh Quận 1' } });
    if (!facility1) {
      facility1 = await (models.Facility as any).create({
        name: 'Chi nhánh Quận 1',
        address: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
        timezone: 'Asia/Ho_Chi_Minh',
        open_time: '05:00:00',
        close_time: '23:00:00',
        avatar_url: 'https://images.unsplash.com/photo-1541315801931-18451c86326c?q=80&w=600&auto=format&fit=crop',
        cancel_policy: { type: 'flexible', refund_percent: 100 },
        is_active: true,
      });
      console.log('✅ Đã tạo Facility Quận 1');
    }

    let facility2 = await models.Facility.findOne({ where: { name: 'Chi nhánh Cầu Giấy' } });
    if (!facility2) {
      facility2 = await (models.Facility as any).create({
        name: 'Chi nhánh Cầu Giấy',
        address: '45 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
        timezone: 'Asia/Ho_Chi_Minh',
        open_time: '06:00:00',
        close_time: '22:00:00',
        avatar_url: 'https://images.unsplash.com/photo-1510006766468-b7c126e84c98?q=80&w=600&auto=format&fit=crop',
        cancel_policy: { type: 'strict', refund_percent: 50 },
        is_active: true,
      });
      console.log('✅ Đã tạo Facility Cầu Giấy');
    }

    // Tạo Warehouse cho các cơ sở
    let wh1 = await models.Warehouse.findOne({ where: { facility_id: facility1.id } });
    if (!wh1) {
      wh1 = await models.Warehouse.create({ facility_id: facility1.id, name: 'Kho Quận 1 Chính' });
    }
    let wh2 = await models.Warehouse.findOne({ where: { facility_id: facility2.id } });
    if (!wh2) {
      wh2 = await models.Warehouse.create({ facility_id: facility2.id, name: 'Kho Hà Nội' });
    }

    // ==========================================
    // 3. TẠO LOẠI SÂN & SÂN (COURTS) & GIÁ
    // ==========================================
    let badmintonType = await models.CourtType.findOne({ where: { name: 'badminton' } });
    if (!badmintonType) {
      badmintonType = await models.CourtType.create({ name: 'badminton', description: 'Sân cầu lông tiêu chuẩn' });
      await models.CourtType.create({ name: 'tennis', description: 'Sân tennis tiêu chuẩn' });
    }

    const courtsCount = await models.Court.count();
    if (courtsCount < 5) {
      const courts = await models.Court.bulkCreate([
        { facility_id: facility1.id, court_type_id: badmintonType.id, name: 'Sân 1', code: 'Q1-S1', status: 'active' },
        { facility_id: facility1.id, court_type_id: badmintonType.id, name: 'Sân 2 (VIP)', code: 'Q1-VIP1', status: 'active' },
        { facility_id: facility1.id, court_type_id: badmintonType.id, name: 'Sân 3', code: 'Q1-S3', status: 'active' },
        { facility_id: facility2.id, court_type_id: badmintonType.id, name: 'Sân HN 1', code: 'HN-S1', status: 'active' },
        { facility_id: facility2.id, court_type_id: badmintonType.id, name: 'Sân HN 2', code: 'HN-S2', status: 'maintenance' },
      ]);
      console.log('✅ Đã tạo thêm Sân');

      // Tạo bảng giá (Price Rules) cho sân VIP Q1
      await models.PriceRule.bulkCreate([
        { court_id: courts[1].id, start_hour: 5, end_hour: 17, price_cents: 80000, active: true }, // Ngày
        { court_id: courts[1].id, start_hour: 17, end_hour: 23, price_cents: 120000, active: true }, // Tối
      ]);
      console.log('✅ Đã cấu hình giá cho Sân VIP Q1');
    }

    // ==========================================
    // 4. SẢN PHẨM & BIẾN THỂ & TỒN KHO
    // ==========================================
    const prodCount = await models.Product.count();
    if (prodCount === 0) {
      const p1 = await (models.Product as any).create({
        name: 'Vợt Cầu Lông Yonex Astrox 99',
        slug: 'vot-cau-long-yonex-astrox-99',
        category: 'racket',
        description: 'Vợt tấn công chuyên nghiệp',
        thumbnail_url: 'https://images.unsplash.com/photo-1628287515053-294b46c6ea9b?q=80&w=400&auto=format&fit=crop',
        rating: 4.8,
        review_count: 56,
        is_active: true
      });

      const p2 = await (models.Product as any).create({
        name: 'Ống Cầu Lông Yonex Aerosensa 20 (AS20)',
        slug: 'ong-cau-long-yonex-as20',
        category: 'shuttlecock',
        description: 'Cầu lông tiêu chuẩn thi đấu',
        thumbnail_url: 'https://images.unsplash.com/photo-1579624536780-369eeceb18cf?q=80&w=400&auto=format&fit=crop',
        rating: 4.9,
        review_count: 120,
        is_active: true
      });

      const p3 = await (models.Product as any).create({
        name: 'Giày Cầu Lông Lining',
        slug: 'giay-cau-long-lining',
        category: 'shoes',
        description: 'Giày cầu lông bám sân tốt',
        thumbnail_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=400&auto=format&fit=crop',
        rating: 4.5,
        review_count: 32,
        is_active: true
      });

      // Tạo Variant cho P1
      const p1v1 = await (models.ProductVariant as any).create({ product_id: p1.id, sku: 'YON-AX99-3U', attributes: { weight: '3U' }, price_cents: 3500000, barcode: '888800001111', is_active: true });
      const p1v2 = await (models.ProductVariant as any).create({ product_id: p1.id, sku: 'YON-AX99-4U', attributes: { weight: '4U' }, price_cents: 3400000, barcode: '888800002222', is_active: true });
      
      // Tạo Variant cho P2
      const p2v1 = await (models.ProductVariant as any).create({ product_id: p2.id, sku: 'YON-AS20', attributes: { pack: '12 quấn' }, price_cents: 550000, is_active: true });

      // Cập nhật tồn kho (Inventory Level)
      await models.InventoryLevel.bulkCreate([
        { variant_id: p1v1.id, warehouse_id: wh1.id, quantity_on_hand: 10 },
        { variant_id: p1v2.id, warehouse_id: wh1.id, quantity_on_hand: 5 },
        { variant_id: p2v1.id, warehouse_id: wh1.id, quantity_on_hand: 50 },
        { variant_id: p2v1.id, warehouse_id: wh2.id, quantity_on_hand: 20 },
      ]);
      console.log('✅ Đã tạo danh sách Sản phẩm và thiết lập Tồn kho.');
    }

    // ==========================================
    // 5. MÃ KHUYẾN MÃI (PROMO CODES)
    // ==========================================
    const promoCount = await models.PromoCode.count();
    if (promoCount === 0) {
      await models.PromoCode.bulkCreate([
        { code: 'GIAM10', type: 'percent', value: 10, min_order_cents: 100000, max_uses: 100, active: true },
        { code: 'SALE50K', type: 'fixed', value: 50000, min_order_cents: 200000, max_uses: null, active: true },
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