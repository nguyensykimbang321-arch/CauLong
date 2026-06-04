import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import sequelize from '../config/database.js';
import dayjs from 'dayjs';

export class OrderService {
    static async createOrder(userId: number | null, data: any) {
        const { customer_name, customer_phone, shipping_address, payment_method, items, note, facility_id, pickup_type, pickup_time, reservation_expires_at } = data;

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
                status: 'pending_payment',
                subtotal_cents: subtotalCents,
                total_cents: totalCents,
                note: `Khách: ${customer_name || 'N/A'} - ${customer_phone || 'N/A'}. [${pickup_type === 'pickup_store' ? 'Đặt trước - Lấy tại quầy' : 'Mua ngay tại quầy'}]. ${note || ''}`,
                pickup_type: pickup_type || 'immediate',
                pickup_time: pickup_time ? new Date(pickup_time) : null,
                reservation_expires_at: pickup_time ? dayjs(pickup_time).add(24, 'hour').toDate() : (reservation_expires_at ? new Date(reservation_expires_at) : null)
            }, { transaction: t });

            await models.Payment.create({
                provider: payment_method || 'cash',
                amount_cents: totalCents,
                order_id: order.id,
                status: 'pending'
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

    static async cancelOrder(orderId: number, userId: number | null) {
        const order = await models.Order.findOne({
            where: {
                id: orderId,
                ...(userId ? { user_id: userId } : {}) // Nếu có userId thì phải khớp, nếu không (khách vãng lai) thì tạm chấp nhận id
            }
        });

        if (!order) {
            throw new ApiError("Không tìm thấy đơn hàng", 404);
        }

        if (order.status !== 'pending_payment' && order.status !== 'pending_pickup') {
            throw new ApiError("Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý (pending_payment hoặc pending_pickup)", 400);
        }

        order.status = 'cancelled';
        await order.save();

        return order;
    }

    static async getMyOrders(userId: number) {
        return await models.Order.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: models.Payment,
                    as: 'payments',
                    attributes: ['provider', 'status', 'amount_cents']
                },
                {
                    model: models.OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: models.ProductVariant,
                            as: 'variant',
                            include: [
                                {
                                    model: models.Product,
                                    as: 'product'
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }
}
