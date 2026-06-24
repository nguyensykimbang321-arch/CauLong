import User from './user.model.js';
import Facility from './facility.model.js';
import Court from './court.model.js';
import CourtType from './court_type.model.js';
import Booking from './booking.model.js';
import BookingSlot from './booking_slot.model.js';
import Product from './product.model.js';
import ProductVariant from './product_variant.model.js';
import Order from './order.model.js';
import OrderItem from './order_item.model.js';

import InventoryLevel from './inventory_level.model.js';
import PriceConfig from './price_config.model.js';

import StaffProfile from './staff_profile.model.js';
import CartItem from './cart_item.model.js';
import InventoryMovement from './inventory_movement.model.js';

import Payment from './payment.model.js';
import Notification from './notification.model.js';
import AuditLog from './audit_log.model.js';
import RefreshToken from './refresh_token.model.js';

// ==========================================
// THIẾT LẬP MỐI QUAN HỆ (ASSOCIATIONS)
// ==========================================

// --- 1. Người dùng, Mở rộng & Phân quyền ---
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(StaffProfile, { foreignKey: 'user_id', as: 'staff_profile' });
StaffProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(StaffProfile, { foreignKey: 'facility_id', as: 'staffs' });
StaffProfile.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// --- 2. Cơ sở, Sân & Kho ---
Facility.hasMany(Court, { foreignKey: 'facility_id', as: 'courts' });
Court.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

CourtType.hasMany(Court, { foreignKey: 'court_type', as: 'courts' });
Court.belongsTo(CourtType, { foreignKey: 'court_type', as: 'type_info' });



Facility.hasMany(PriceConfig, { foreignKey: 'facility_id', as: 'price_configs' });
PriceConfig.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// --- 3. Đặt Sân (Bookings) ---
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(Booking, { foreignKey: 'facility_id', as: 'bookings' });
Booking.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

Booking.hasMany(BookingSlot, { foreignKey: 'booking_id', as: 'slots' });
BookingSlot.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Court.hasMany(BookingSlot, { foreignKey: 'court_id', as: 'slots' });
BookingSlot.belongsTo(Court, { foreignKey: 'court_id', as: 'court' });



// --- 4. Sản phẩm & Giỏ hàng (Products & Cart) ---
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cart_items' });
CartItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ProductVariant.hasMany(CartItem, { foreignKey: 'variant_id', as: 'cart_items' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- 5. Đơn hàng Bán lẻ (Orders & Order Items) ---
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(Order, { foreignKey: 'facility_id', as: 'orders' });
Order.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

ProductVariant.hasMany(OrderItem, { foreignKey: 'variant_id', as: 'order_items' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- 6. Thanh toán ---
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// --- 7. Tồn Kho ---
ProductVariant.hasMany(InventoryLevel, { foreignKey: 'variant_id', as: 'inventory_levels' });
InventoryLevel.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

Facility.hasMany(InventoryLevel, { foreignKey: 'facility_id', as: 'inventory_levels' });
InventoryLevel.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

ProductVariant.hasMany(InventoryMovement, { foreignKey: 'variant_id', as: 'movements' });
InventoryMovement.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

Facility.hasMany(InventoryMovement, { foreignKey: 'facility_id', as: 'movements' });
InventoryMovement.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });



// 🔴 1. HOOK XÓA MỀM (CASCADE SOFT DELETE)
// Thêm ": Facility" vào đây 👇
Facility.addHook('afterDestroy', async (facility: Facility, options) => {
    const currentTransaction = options.transaction || null;

    try {
        await Promise.all([
            Court.destroy({ where: { facility_id: facility.id }, transaction: currentTransaction }),

            PriceConfig.destroy({ where: { facility_id: facility.id }, transaction: currentTransaction }),
            InventoryLevel.destroy({ where: { facility_id: facility.id }, transaction: currentTransaction })
        ]);
    } catch (error) {
        console.error(`[Hook Error] Lỗi khi Cascade Delete cho Facility ${facility.id}:`, error);
        throw error; 
    }
});

// 🟢 2. HOOK KHÔI PHỤC (CASCADE RESTORE)
// Thêm ": Facility" vào đây 👇
Facility.addHook('afterRestore', async (facility: Facility, options) => {
    const currentTransaction = options.transaction || null;

    try {
        await Promise.all([
            Court.restore({ where: { facility_id: facility.id }, transaction: currentTransaction }),

            PriceConfig.restore({ where: { facility_id: facility.id }, transaction: currentTransaction }),
            InventoryLevel.restore({ where: { facility_id: facility.id }, transaction: currentTransaction })
        ]);
    } catch (error) {
        console.error(`[Hook Error] Lỗi khi Cascade Restore cho Facility ${facility.id}:`, error);
        throw error;
    }
});

// ==========================================
// XUẤT MÔ HÌNH (EXPORT)
// ==========================================
const models = {
    User,
    Facility,
    Court,
    CourtType,
    Booking,
    BookingSlot,
    Product,
    ProductVariant,
    Order,          
    OrderItem,

    InventoryLevel,
    PriceConfig,
    StaffProfile,
    RefreshToken,
    CartItem,
    InventoryMovement,

    Payment,
    Notification,
    AuditLog
};

export default models;