import User from './user.model.js';
import Facility from './facility.model.js';
import Court from './court.model.js';
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
import PromoCode from './promo_code.model.js';
import Payment from './payment.model.js';
import Notification from './notification.model.js';
import AuditLog from './audit_log.model.js';
import RefreshToken from './refresh_token.model.js';

// ==========================================
// THIẾT LẬP MỐI QUAN HỆ (ASSOCIATIONS)
// ==========================================

// --- 1. Cơ sở & Sân (Facilities & Courts) ---
Facility.hasMany(Court, { foreignKey: 'facility_id', as: 'courts' });
Court.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

Facility.hasMany(PriceConfig, { foreignKey: 'facility_id', as: 'price_configs' });
PriceConfig.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// --- 2. Đặt Sân (Bookings) ---
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(Booking, { foreignKey: 'facility_id', as: 'bookings' });
Booking.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

Booking.hasMany(BookingSlot, { foreignKey: 'booking_id', as: 'slots' });
BookingSlot.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Court.hasMany(BookingSlot, { foreignKey: 'court_id', as: 'booking_slots' });
BookingSlot.belongsTo(Court, { foreignKey: 'court_id', as: 'court' });

// Bổ sung: Booking & PromoCode
Booking.belongsTo(PromoCode, { foreignKey: 'promo_code_id', as: 'promo_code' });
PromoCode.hasMany(Booking, { foreignKey: 'promo_code_id', as: 'bookings' });

// --- 3. Sản phẩm & Giỏ hàng (Products & Cart) ---
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Bổ sung: CartItem
User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cart_items' });
CartItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ProductVariant.hasMany(CartItem, { foreignKey: 'variant_id', as: 'cart_items' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- 4. Đơn hàng Bán lẻ (Orders & Order Items) ---
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(Order, { foreignKey: 'facility_id', as: 'orders' });
Order.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

ProductVariant.hasMany(OrderItem, { foreignKey: 'variant_id', as: 'order_items' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- 5. Tồn Kho (Inventory) ---
ProductVariant.hasMany(InventoryLevel, { foreignKey: 'variant_id', as: 'inventory_levels' });
InventoryLevel.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

Facility.hasMany(InventoryLevel, { foreignKey: 'facility_id', as: 'inventory_levels' });
InventoryLevel.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// Bổ sung: Lịch sử nhập xuất kho (InventoryMovement)
ProductVariant.hasMany(InventoryMovement, { foreignKey: 'variant_id', as: 'movements' });
InventoryMovement.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

Facility.hasMany(InventoryMovement, { foreignKey: 'facility_id', as: 'movements' });
InventoryMovement.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// --- 6. Mở rộng User (Tokens, Staff, Notifications) ---
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(StaffProfile, { foreignKey: 'user_id', as: 'staff_profile' });
StaffProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(StaffProfile, { foreignKey: 'facility_id', as: 'staffs' });
StaffProfile.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// --- 7. Thanh toán (Payments) ---
Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// ==========================================
// XUẤT MÔ HÌNH (EXPORT)
// ==========================================
const models = {
    User,
    Facility,
    Court,
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
    PromoCode,
    Payment,
    Notification,
    AuditLog
};

export default models;