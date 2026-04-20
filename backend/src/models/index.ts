import User from './user.model.js';
import Facility from './facility.model.js';
import Court from './court.model.js';
import Booking from './booking.model.js';
import BookingSlot from './booking_slot.model.js';
import Product from './product.model.js';
import ProductVariant from './product_variant.model.js';

// ---- IMPORT CÁC MODEL MỚI THÊM ----
import Order from './order.model.js';
import OrderItem from './order_item.model.js';
import InventoryLevel from './inventory_level.model.js';

// ==========================================
// THIẾT LẬP MỐI QUAN HỆ (ASSOCIATIONS)
// ==========================================

// --- 1. Cơ sở & Sân (Facilities & Courts) ---
Facility.hasMany(Court, { foreignKey: 'facility_id', as: 'courts' });
Court.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

// --- 2. Đặt Sân (Bookings) ---
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Facility.hasMany(Booking, { foreignKey: 'facility_id', as: 'bookings' });
Booking.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });

Booking.hasMany(BookingSlot, { foreignKey: 'booking_id', as: 'slots' });
BookingSlot.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Court.hasMany(BookingSlot, { foreignKey: 'court_id', as: 'booking_slots' });
BookingSlot.belongsTo(Court, { foreignKey: 'court_id', as: 'court' });

// --- 3. Sản phẩm (Products) ---
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

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
    Order,          // Đã bổ sung
    OrderItem,      // Đã bổ sung
    InventoryLevel  // Đã bổ sung
};

export default models;