import models from '../models/index.js';
import { VNPayUtils } from '../utils/vnpay.js';
import sequelize from '../config/database.js';
import { InventoryService } from './inventory.service.js';
import { Op } from 'sequelize';

export class PaymentService {
    static async processVNPayIPN(vnpayQuery: any) {
        // 1. Xác thực chữ ký VNPay
        const isValidSignature = VNPayUtils.verifyIpnSignature(vnpayQuery);
        if (!isValidSignature) {
            return { RspCode: '97', Message: 'Checksum failed' };
        }

        const vnp_TxnRef = vnpayQuery.vnp_TxnRef as string;
        const vnp_ResponseCode = vnpayQuery.vnp_ResponseCode;
        const vnp_Amount = Number(vnpayQuery.vnp_Amount) / 100; // VNPay gửi về nhân 100, phải chia ra

        // Phân biệt Order (ORDER_{id}_{timestamp}) vs Booking ({id}_{timestamp})
        const isOrderPayment = vnp_TxnRef.startsWith('ORDER_');

        if (isOrderPayment) {
            return this.processOrderIPN(vnp_TxnRef, vnp_ResponseCode, vnp_Amount, vnpayQuery);
        } else {
            return this.processBookingIPN(vnp_TxnRef, vnp_ResponseCode, vnp_Amount, vnpayQuery);
        }
    }

    /**
     * Xử lý IPN cho đơn hàng (Shop Order)
     */
    private static async processOrderIPN(vnp_TxnRef: string, vnp_ResponseCode: string, vnp_Amount: number, vnpayQuery: any) {
        // Tách: ORDER_{orderId}_{timestamp} → lấy orderId ở vị trí [1]
        const orderId = vnp_TxnRef.split('_')[1];

        const t = await models.Order.sequelize!.transaction();
        try {
            const order = await (models.Order as any).findByPk(orderId, { transaction: t });

            if (!order) {
                await t.rollback();
                return { RspCode: '01', Message: 'Order not found' };
            }
            if (order.status === 'pending_pickup' || order.status === 'completed') {
                await t.rollback();
                return { RspCode: '02', Message: 'Order already confirmed' };
            }
            if (order.total_cents !== vnp_Amount) {
                await t.rollback();
                return { RspCode: '04', Message: 'Invalid amount' };
            }

            if (vnp_ResponseCode === '00') {
                // --- THANH TOÁN THÀNH CÔNG ---
                await order.update({ status: 'pending_pickup' }, { transaction: t });

                await (models.Payment as any).update(
                    { status: 'paid', provider_ref: vnpayQuery.vnp_TransactionNo, paid_at: new Date() },
                    { where: { order_id: order.id, provider: 'vnpay', status: 'pending' }, transaction: t }
                );
            } else {
                // --- THANH TOÁN THẤT BẠI ---
                await order.update({ status: 'cancelled' }, { transaction: t });

                await (models.Payment as any).update(
                    { status: 'failed', provider_ref: vnpayQuery.vnp_TransactionNo || null },
                    { where: { order_id: order.id, provider: 'vnpay', status: 'pending' }, transaction: t }
                );
            }

            await t.commit();
            return { RspCode: '00', Message: 'Confirm Success' };
        } catch (error) {
            await t.rollback();
            console.error("Lỗi xử lý IPN Order:", error);
            return { RspCode: '99', Message: 'Unknown error' };
        }
    }

    /**
     * Xử lý IPN cho đặt sân (Booking)
     */
    private static async processBookingIPN(vnp_TxnRef: string, vnp_ResponseCode: string, vnp_Amount: number, vnpayQuery: any) {
        // Tách: {bookingId}_{timestamp}
        const bookingId = vnp_TxnRef.split('_')[0];

        const t = await models.Booking.sequelize!.transaction();
        try {
            const booking = await (models.Booking as any).findByPk(bookingId, { transaction: t });

            if (!booking) {
                await t.rollback();
                return { RspCode: '01', Message: 'Order not found' };
            }
            if (booking.payment_status === 'paid') {
                await t.rollback();
                return { RspCode: '02', Message: 'Order already confirmed' };
            }

            // Chống trùng lặp giao dịch trên bảng payments (Idempotency)
            const existingVNPayPayment = await models.Payment.findOne({
                where: {
                    booking_id: booking.id,
                    provider: 'vnpay',
                    status: 'paid'
                },
                transaction: t
            });
            if (existingVNPayPayment) {
                await t.rollback();
                return { RspCode: '02', Message: 'Order already confirmed' };
            }

            if (booking.total_cents !== vnp_Amount) {
                await t.rollback();
                return { RspCode: '04', Message: 'Invalid amount' };
            }

            if (vnp_ResponseCode === '00') {
                // --- THÀNH CÔNG ---
                await booking.update({
                    payment_status: 'paid',
                    payment_method: 'vnpay',
                    status: 'confirmed'
                }, { transaction: t });

                await (models.Payment as any).create({
                    booking_id: booking.id,
                    provider: 'vnpay',
                    status: 'paid',
                    amount_cents: booking.total_cents,
                    provider_ref: vnpayQuery.vnp_TransactionNo,
                    paid_at: new Date()
                }, { transaction: t });
            } else {
                // --- THẤT BẠI ---
                await booking.update({
                    status: 'cancelled',
                    cancel_reason: 'Thanh toán VNPay thất bại hoặc bị hủy'
                }, { transaction: t });

                await (models.Payment as any).create({
                    booking_id: booking.id,
                    provider: 'vnpay',
                    status: 'failed',
                    amount_cents: booking.total_cents,
                    provider_ref: vnpayQuery.vnp_TransactionNo || null
                }, { transaction: t });
            }

            await t.commit();
            return { RspCode: '00', Message: 'Confirm Success' };
        } catch (error) {
            await t.rollback();
            console.error("Lỗi xử lý IPN Booking:", error);
            return { RspCode: '99', Message: 'Unknown error' };
        }
    }

    static getVNPayReturnHtml(vnpayQuery: any): string {
        const vnp_ResponseCode = vnpayQuery.vnp_ResponseCode;

        if (vnp_ResponseCode === '00') {
            return `
                <html lang="vi">
                    <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <h1 style="color:#16a34a; margin-top: 20px;">Thanh toán thành công!</h1>
                        <p style="color:#4b5563;">Bạn có thể đóng cửa sổ này và nhìn lên màn hình của Lễ tân.</p>
                        <script>
                            setTimeout(() => window.close(), 3000);
                        </script>
                    </body>
                </html>
            `;
        } else {
            return `
                <html lang="vi">
                    <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        <h1 style="color:#dc2626; margin-top: 20px;">Thanh toán thất bại hoặc đã hủy!</h1>
                        <p style="color:#4b5563;">Vui lòng thử lại hoặc liên hệ Lễ tân để đổi phương thức thanh toán.</p>
                    </body>
                </html>
            `;
        }
    }

    /**
     * Tự động quét và hủy các đặt sân/đơn hàng VNPay quá hạn 30 phút chưa thanh toán
     */
    static async checkExpiredPayments() {
        const timeLimit = new Date(Date.now() - 30 * 60 * 1000); // 30 phút trước

        try {
            // Tìm tất cả Payment vnpay đang pending và quá 30 phút
            const pendingPayments = await (models.Payment as any).findAll({
                where: {
                    provider: 'vnpay',
                    status: 'pending',
                    created_at: {
                        [Op.lte]: timeLimit
                    }
                }
            });

            if (pendingPayments.length === 0) return;

            console.log(`[Cron Payment] Tìm thấy ${pendingPayments.length} giao dịch VNPay quá hạn 30 phút.`);

            for (const payment of pendingPayments) {
                const t = await models.Payment.sequelize!.transaction();
                try {
                    if (payment.booking_id) {
                        const booking = await (models.Booking as any).findByPk(payment.booking_id, { transaction: t });
                        if (booking && booking.status === 'pending' && booking.payment_status === 'unpaid') {
                            await booking.update({
                                status: 'cancelled',
                                cancel_reason: 'Hết hạn thanh toán VNPay (30 phút)',
                                cancelled_at: new Date()
                            }, { transaction: t });
                            console.log(`[Cron Payment] Đã hủy Booking #${booking.id} do hết hạn thanh toán.`);
                        }
                    } else if (payment.order_id) {
                        const order = await (models.Order as any).findByPk(payment.order_id, { transaction: t });
                        if (order && order.status === 'pending_payment') {
                            await order.update({
                                status: 'expired'
                            }, { transaction: t });
                            console.log(`[Cron Payment] Đã chuyển Order #${order.id} sang expired do hết hạn thanh toán.`);
                        }
                    }

                    // Cập nhật payment sang failed
                    await payment.update({ status: 'failed' }, { transaction: t });
                    await t.commit();
                } catch (err) {
                    await t.rollback();
                    console.error(`[Cron Payment] Lỗi xử lý giao dịch quá hạn ID ${payment.id}:`, err);
                }
            }
        } catch (error) {
            console.error("[Cron Payment] Lỗi quét giao dịch VNPay hết hạn:", error);
        }
    }

    static async processPosOrderVNPayIPN(
        vnpayQuery: any
    ) {
        const isValidSignature =
            VNPayUtils.verifyIpnSignature(
                vnpayQuery
            );

        if (!isValidSignature) {
            return {
                RspCode: '97',
                Message: 'Checksum failed'
            };
        }

        const vnp_TxnRef =
            vnpayQuery.vnp_TxnRef;

        const vnp_ResponseCode =
            vnpayQuery.vnp_ResponseCode;

        const paidAmount =
            Number(
                vnpayQuery.vnp_Amount
            ) / 100;

        const t =
            await sequelize.transaction();

        try {
            /**
             * ORDER_15
             * => 15
             */
            const orderId =
                Number(
                    vnp_TxnRef.replace(
                        'ORDER_',
                        ''
                    )
                );

            const order =
                await models.Order.findByPk(
                    orderId,
                    {
                        transaction: t
                    }
                );

            if (!order) {
                await t.rollback();

                return {
                    RspCode: '01',
                    Message:
                        'Order not found'
                };
            }

            const payment =
                await models.Payment.findOne({
                    where: {
                        order_id:
                            order.id
                    },
                    transaction: t
                });

            if (!payment) {
                await t.rollback();

                return {
                    RspCode: '01',
                    Message:
                        'Payment not found'
                };
            }

            /**
             * Tránh IPN gửi lại
             */
            if (
                payment.status ===
                'paid'
            ) {
                await t.rollback();

                return {
                    RspCode: '02',
                    Message:
                        'Order already confirmed'
                };
            }

            /**
             * Chỉ xử lý đơn đang chờ thanh toán
             */
            if (
                order.status !==
                'pending_payment'
            ) {
                await t.rollback();

                return {
                    RspCode: '02',
                    Message:
                        'Order already processed'
                };
            }

            /**
             * Validate số tiền
             */
            if (
                payment.amount_cents !==
                paidAmount
            ) {
                await t.rollback();

                return {
                    RspCode: '04',
                    Message:
                        'Invalid amount'
                };
            }

            /**
             * Thanh toán thành công
             */
            if (
                vnp_ResponseCode === '00'
            ) {
                const orderItems =
                    await models.OrderItem.findAll({
                        where: {
                            order_id:
                                order.id
                        },
                        transaction: t
                    });

                /**
                 * Trừ kho
                 */
                const adjustments = orderItems.map(item => ({
                    variant_id: item.variant_id,
                    facility_id: order.facility_id,
                    qty_delta: -item.quantity,
                    reason: 'sale' as const,
                    ref_order_id: order.id
                }));
                await InventoryService.bulkAdjustInventory(adjustments, { transaction: t });

                /**
                 * Cập nhật Payment
                 */
                await payment.update(
                    {
                        status: 'paid',

                        provider_ref:
                            vnpayQuery.vnp_TransactionNo,

                        paid_at:
                            new Date()
                    },
                    {
                        transaction: t
                    }
                );

                const updateData: any = {
                    status: 'pending_pickup'
                };
                if (!order.reservation_expires_at) {
                    updateData.reservation_expires_at = new Date(order.created_at.getTime() + 24 * 60 * 60 * 1000);
                }
                if (!order.pickup_time) {
                    updateData.pickup_time = new Date(order.created_at.getTime() + 4 * 60 * 60 * 1000);
                }

                /**
                 * Chuyển sang chờ giao hàng
                 */
                await order.update(
                    updateData,
                    {
                        transaction: t
                    }
                );
            } else {
                /**
                 * Thanh toán thất bại
                 */
                await payment.update(
                    {
                        status:
                            'failed',

                        provider_ref:
                            vnpayQuery.vnp_TransactionNo ||
                            null
                    },
                    {
                        transaction: t
                    }
                );

                /**
                 * Giữ nguyên pending_payment
                 * để khách có thể thanh toán lại
                 */
            }

            await t.commit();

            return {
                RspCode: '00',
                Message:
                    'Confirm Success'
            };
        } catch (error) {
            await t.rollback();

            console.error(
                'POS VNPay IPN Error:',
                error
            );

            return {
                RspCode: '99',
                Message:
                    'Unknown error'
            };
        }
    }
}