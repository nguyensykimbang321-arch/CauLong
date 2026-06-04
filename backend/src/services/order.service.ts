import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import sequelize from '../config/database.js';
import { InventoryService } from './inventory.service.js';

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
                payment_method,
                subtotal_cents: subtotalCents,
                total_cents: totalCents,
                note: `Khách: ${customer_name || 'N/A'} - ${customer_phone || 'N/A'}. [${pickup_type === 'pickup_store' ? 'Đặt trước - Lấy tại quầy' : 'Mua ngay tại quầy'}]. ${note || ''}`,
                pickup_type: pickup_type || 'immediate',
                pickup_time: pickup_time ? new Date(pickup_time) : null,
                reservation_expires_at: reservation_expires_at ? new Date(reservation_expires_at) : null
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

    static async getAll() {
        return models.Order.findAll({
        include: [
            {
            model: models.OrderItem,
            as: "items",
            include: [
                {
                model: models.ProductVariant,
                as: "variant",
                include: [
                    {
                    model: models.Product,
                    as: "product"
                    }
                ]
                }
            ]
            }
        ],
        order: [["created_at", "DESC"]]
        });
    }

    static async getById(orderId: number) {
        const order = await models.Order.findByPk(orderId, {
            include: [
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
            ]
        });

        if (!order) {
            throw new ApiError(
                'Không tìm thấy đơn hàng',
                404
            );
        }
    return order;
    }

    static async completeOrder(orderId: number) {
        const t = await sequelize.transaction();
        try {
            const order = await models.Order.findByPk(
                orderId,
                {
                    include: [
                        {
                            model: models.OrderItem,
                            as: 'items'
                        }
                    ],
                    transaction: t
                }
            );

            if (!order) {
                throw new ApiError('Không tìm thấy đơn hàng', 404);
            }

            const payment =
                await models.Payment.findOne({
                    where: {
                        order_id: order.id,
                        status: 'paid'
                    },
                    transaction: t
                });

            if (!payment) {
                throw new ApiError(
                    'Đơn hàng chưa thanh toán',
                    400
                );
            }

            if (order.status === 'completed') {
                throw new ApiError('Đơn hàng đã hoàn tất', 400);
            }

            const items = (order as any).items;
            for (const item of items) {
                await InventoryService.adjustInventory(
                    {
                        variant_id: item.variant_id,
                        facility_id: order.facility_id,
                        qty_delta: -item.quantity,
                        reason: 'sale',
                        ref_order_id: order.id,
                        note: `Hoàn tất đơn hàng #${order.id}`
                    },
                    {
                        transaction: t
                    }
                );
            }

            order.status = 'completed';
            await order.save({transaction: t});
            await t.commit();
            return order;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async confirmOrder(orderId: number) {
        const order = await models.Order.findByPk(orderId);
        if (!order) {
            throw new ApiError('Không tìm thấy đơn hàng', 404);
        }

        if (
            order.status !== 'pending_payment'
        ) {
            throw new ApiError(
                'Trạng thái đơn không hợp lệ',
                400
            );
        }

        order.status = 'pending_pickup';
        await order.save();
        return order;
    }

    static async payCash(orderId: number) {
        const t = await sequelize.transaction();

        try {
            const order = await models.Order.findByPk(
                orderId,
                { transaction: t }
            );

            if (!order) {
                throw new ApiError(
                    'Không tìm thấy đơn hàng',
                    404
                );
            }

            const existedPayment =
                await models.Payment.findOne({
                    where: {
                        order_id: order.id,
                        status: 'paid'
                    },
                    transaction: t
                });

            if (existedPayment) {
                throw new ApiError(
                    'Đơn hàng đã thanh toán',
                    400
                );
            }

            await models.Payment.create(
                {
                    order_id: order.id,
                    provider: 'sandbox',
                    status: 'paid',
                    amount_cents: order.total_cents,
                    paid_at: new Date()
                },
                {
                    transaction: t
                }
            );

            await t.commit();

            return {
                message:
                    'Thanh toán tiền mặt thành công'
            };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getPendingPickupOrders() {
        return models.Order.findAll({
            where: {
                status: 'pending_pickup'
            },

            include: [
                {
                    model: models.OrderItem,
                    as: 'items'
                }
            ],

            order: [
                ['pickup_time', 'ASC']
            ]
        });
    }

    static async getPendingPaymentOrders() {
        return models.Order.findAll({
            where: {
                status: 'pending_payment'
            },

            include: [
                {
                    model: models.OrderItem,
                    as: 'items'
                }
            ],

            order: [
                ['created_at', 'DESC']
            ]
        });
    }
}
