import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import sequelize from '../config/database.js';
import { InventoryService } from './inventory.service.js';
import dayjs from 'dayjs';
import { VNPayUtils } from '../utils/vnpay.js';

export class OrderService {
    static async createOrder(userId: number | null, data: any) {
        const { customer_name, customer_phone, shipping_address, payment_method, items, note, facility_id, pickup_type, pickup_time, reservation_expires_at } = data;

        if (!items || items.length === 0) {
            throw new ApiError("Giỏ hàng trống", 400);
        }

        const t = await sequelize.transaction();

        try {
            // Tính toán tổng tiền
            const totalCents = items.reduce((sum: number, it: any) => sum + (it.price_cents * it.quantity), 0);

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
                unit_price_cents: it.price_cents
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
                    provider: 'cash',
                    status: 'paid',
                    amount_cents: order.total_cents,
                    paid_at: new Date()
                },
                {
                    transaction: t
                }
            );

            const orderItems =
                await models.OrderItem.findAll({
                    where: {
                        order_id: order.id
                    },
                    transaction: t
                });

            for (const item of orderItems) {
                await InventoryService.adjustInventory(
                    {
                        variant_id: item.variant_id,
                        facility_id: order.facility_id,
                        qty_delta: -item.quantity,
                        reason: 'sale',
                        ref_order_id: order.id
                    },
                    {
                        transaction: t
                    }
                );
            }

            await order.update(
            {
                status: 'pending_pickup'
            },
            {
                transaction: t
            });

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

    static async createPosOrder(
        staffId: number,
        data: {
            facility_id: number;
            payment_method: 'cash' | 'vnpay';
            note?: string;
            items: {
                variant_id: number;
                quantity: number;
            }[];
        }
    ) {
        const {
            facility_id,
            payment_method,
            note,
            items
        } = data;

        if (!items?.length) {
            throw new ApiError(
                'Giỏ hàng trống',
                400
            );
        }

        const t =
            await sequelize.transaction();

        try {
            const variants =
                await models.ProductVariant.findAll({
                    where: {
                        id: items.map(
                            i => i.variant_id
                        )
                    }
                });

            const variantMap =
                new Map(
                    variants.map(v => [
                        v.id,
                        v
                    ])
                );

            let totalCents = 0;

            for (const item of items) {
                const variant =
                    variantMap.get(
                        item.variant_id
                    );

                if (!variant) {
                    throw new ApiError(
                        `Variant ${item.variant_id} không tồn tại`,
                        404
                    );
                }

                totalCents +=
                    variant.price_cents *
                    item.quantity;
            }

            const order =
                await models.Order.create(
                    {
                        user_id: null,

                        facility_id,

                        status:
                            payment_method ===
                            'cash'
                                ? 'completed'
                                : 'pending_payment',

                        subtotal_cents:
                            totalCents,

                        discount_cents: 0,

                        total_cents:
                            totalCents,

                        note:
                            note ?? null,

                        pickup_type:
                            'immediate'
                    },
                    {
                        transaction: t
                    }
                );

            await models.OrderItem.bulkCreate(
                items.map(item => ({
                    order_id:
                        order.id,

                    variant_id:
                        item.variant_id,

                    quantity:
                        item.quantity,

                    unit_price_cents:
                        variantMap.get(
                            item.variant_id
                        )!.price_cents,

                    discount_cents: 0
                })),
                {
                    transaction: t
                }
            );

            await models.Payment.create(
                {
                    provider:
                        payment_method,

                    amount_cents:
                        totalCents,

                    order_id:
                        order.id,

                    status:
                        payment_method ===
                        'cash'
                            ? 'paid'
                            : 'pending',

                    paid_at:
                        payment_method ===
                        'cash'
                            ? new Date()
                            : null
                },
                {
                    transaction: t
                }
            );

            let paymentUrl: string | null = null;
            if (
                payment_method ===
                'vnpay'
            ) {
                paymentUrl =
                    VNPayUtils.createPaymentUrl({
                        amount:
                            totalCents,

                        orderId:
                            `ORDER_${order.id}`,

                        orderInfo:
                            `Thanh toan don hang POS #${order.id}`,

                        ipAddr:
                            '127.0.0.1'
                    });
            }

            await t.commit();

            return {
                order,
                payment_url:
                    paymentUrl
            };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}
