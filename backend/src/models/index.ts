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
import Payment from './payment.model.js';
import RefreshToken from './refresh_token.model.js';
import CourtType from './court_type.model.js';
import PriceRule from './price_rule.model.js';
import StaffProfile from './staff_profile.model.js';
import CartItem from './cart_item.model.js';
import Warehouse from './warehouse.model.js';
import InventoryMovement from './inventory_movement.model.js';
import PromoCode from './promo_code.model.js';
import Notification from './notification.model.js';
import AuditLog from './audit_log.model.js';

// ==========================================
// THIẾT LẬP MỐI QUAN HỆ (ASSOCIATIONS)
// ==========================================

// --- 1. Người dùng & Phân quyền ---
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(StaffProfile, { foreignKey: 'user_id', as: 'staff_profile' });
StaffProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(StaffProfile, { foreignKey: 'facility_id', as: 'staff' });
StaffProfile.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// --- 2. Cơ sở, Sân & Giá ---
Facility.hasMany(Court, { foreignKey: 'facility_id', as: 'courts' });
Court.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

CourtType.hasMany(Court, { foreignKey: 'court_type_id', as: 'courts' });
Court.belongsTo(CourtType, { foreignKey: 'court_type_id', as: 'type' });

Court.hasMany(PriceRule, { foreignKey: 'court_id', as: 'price_rules' });
PriceRule.belongsTo(Court, { foreignKey: 'court_id', as: 'court' });

Facility.hasMany(Warehouse, { foreignKey: 'facility_id', as: 'warehouses' });
Warehouse.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// --- 3. Đặt Sân ---
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(Booking, { foreignKey: 'facility_id', as: 'bookings' });
Booking.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

Booking.hasMany(BookingSlot, { foreignKey: 'booking_id', as: 'slots' });
BookingSlot.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Court.hasMany(BookingSlot, { foreignKey: 'court_id', as: 'slots' });
BookingSlot.belongsTo(Court, { foreignKey: 'court_id', as: 'court' });

// --- 4. Sản phẩm & Giỏ hàng ---
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cart_items' });
CartItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ProductVariant.hasMany(CartItem, { foreignKey: 'variant_id', as: 'cart_items' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- 5. Đơn hàng ---
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

Warehouse.hasMany(InventoryLevel, { foreignKey: 'warehouse_id', as: 'inventory_levels' });
InventoryLevel.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

ProductVariant.hasMany(InventoryMovement, { foreignKey: 'variant_id', as: 'movements' });
InventoryMovement.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

Warehouse.hasMany(InventoryMovement, { foreignKey: 'warehouse_id', as: 'movements' });
InventoryMovement.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// --- 8. Thông báo ---
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ==========================================
// XUẤT MÔ HÌNH (EXPORT)
// ==========================================
const models = {
  User,
  RefreshToken,
  StaffProfile,
  Facility,
  CourtType,
  Court,
  PriceRule,
  Booking,
  BookingSlot,
  Product,
  ProductVariant,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Warehouse,
  InventoryLevel,
  InventoryMovement,
  PromoCode,
  Notification,
  AuditLog,
};

export default models;
