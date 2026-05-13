import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import sequelize from '../config/database.js';

export class OrderService {
    static async createOrder(userId: number | null, data: any) {
        const { customer_name, customer_phone, shipping_address, payment_method, items, note, facility_id } = data;

        if (!items || items.length === 0) {
            throw new ApiError("Giỏ hàng trống", 400);
        }

        const t = await sequelize.transaction();

        try {
            // Tính toán tổng tiền
            const subtotalCents = items.reduce((sum: number, it: any) => sum + (it.price_cents * it.quantity), 0);
            const totalCents = subtotalCents; // Tạm thời chưa có discount

            // Xác định facility_id hợp lệ
            let targetFacilityId = facility_id;
            if (!targetFacilityId) {
                const firstFacility = await models.Facility.findOne({ attributes: ['id'] });
                if (!firstFacility) {
                    throw new ApiError("Hệ thống chưa cấu hình Cơ sở (Facility). Vui lòng liên hệ Admin.", 500);
                }
                targetFacilityId = firstFacility.id;
            }

            // 1. Tạo Đơn hàng
            const order = await models.Order.create({
                user_id: userId,
                facility_id: targetFacilityId,
                status: 'pending',
                payment_method,
                subtotal_cents: subtotalCents,
                total_cents: totalCents,
                note: `Khách: ${customer_name || 'N/A'} - ${customer_phone || 'N/A'}. Đ/c: ${shipping_address || 'N/A'}. ${note || ''}`
            }, { transaction: t });

            // 2. Tạo Chi tiết đơn hàng
            const orderItems = items.map((it: any) => ({
                order_id: order.id,
                variant_id: it.product_variant_id,
                quantity: it.quantity,
                unit_price_cents: it.price_cents,
                discount_cents: 0
            }));
            
            await models.OrderItem.bulkCreate(orderItems, { transaction: t });

            await t.commit();
            return order;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}
