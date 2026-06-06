import models from '../models/index.js';
import { VNPayUtils } from '../utils/vnpay.js';
import sequelize from '../config/database.js';
import { InventoryService } from './inventory.service.js';

export class PaymentService {
    static async processVNPayIPN(vnpayQuery: any) {
        // 1. Xác thực chữ ký VNPay
        const isValidSignature = VNPayUtils.verifyIpnSignature(vnpayQuery); 
        if (!isValidSignature) {
            return { RspCode: '97', Message: 'Checksum failed' };
        }

        const vnp_TxnRef = vnpayQuery.vnp_TxnRef; 
        const vnp_ResponseCode = vnpayQuery.vnp_ResponseCode;
        const vnp_Amount = Number(vnpayQuery.vnp_Amount) / 100; // VNPay gửi về nhân 100, phải chia ra
        
        // Tách lấy bookingId từ orderId (bookingId_timestamp)
        const bookingId = vnp_TxnRef.split('_')[0];

        // 2. Bắt đầu Transaction
        const t = await models.Booking.sequelize!.transaction();

        try {
            const booking = await (models.Booking as any).findByPk(bookingId, { transaction: t });
            
            // Xử lý các ngoại lệ theo chuẩn VNPay
            if (!booking) {
                await t.rollback();
                return { RspCode: '01', Message: 'Order not found' };
            }
            if (booking.payment_status === 'paid') {
                await t.rollback();
                return { RspCode: '02', Message: 'Order already confirmed' };
            }
            // KIỂM TRA BẢO MẬT: Bắt buộc giá tiền VNPay trả về phải khớp với DB
            if (booking.total_cents !== vnp_Amount) {
                await t.rollback();
                return { RspCode: '04', Message: 'Invalid amount' };
            }

            // 3. Cập nhật dữ liệu
            if (vnp_ResponseCode === '00') {
                // --- THÀNH CÔNG ---
                await booking.update({
                    payment_status: 'paid',
                    status: 'confirmed' 
                }, { transaction: t });

                await (models.Payment as any).create({
                    booking_id: booking.id,
                    provider: 'vnpay',
                    status: 'paid',
                    amount_cents: booking.total_cents,
                    provider_ref: vnpayQuery.vnp_TransactionNo,
                    paid_at: new Date() // Lưu thêm ngày giờ thanh toán
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

            // Chốt giao dịch
            await t.commit();
            return { RspCode: '00', Message: 'Confirm Success' };

        } catch (error) {
            await t.rollback();
            console.error("Lỗi xử lý IPN:", error);
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

        const vnp_Amount =
            Number(
                vnpayQuery.vnp_Amount
            ) / 100;

        const t =
            await models.Order.sequelize!.transaction();

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
                await models.Payment.findOne(
                    {
                        where: {
                            order_id:
                                order.id
                        },
                        transaction: t
                    }
                );

            if (!payment) {
                await t.rollback();

                return {
                    RspCode: '01',
                    Message:
                        'Payment not found'
                };
            }

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

            if (
                payment.amount_cents !==
                vnp_Amount
            ) {
                await t.rollback();

                return {
                    RspCode: '04',
                    Message:
                        'Invalid amount'
                };
            }

            if (
                vnp_ResponseCode === '00'
            ) {
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
                        status:
                            'completed'
                    },
                    {
                        transaction: t
                    }
                );

                await payment.update(
                    {
                        status:
                            'paid',

                        provider_ref:
                            vnpayQuery.vnp_TransactionNo,

                        paid_at:
                            new Date()
                    },
                    {
                        transaction: t
                    }
                );

            } else {

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
                 * Có thể giữ nguyên
                 * pending_payment
                 *
                 * hoặc hủy đơn:
                 *
                 * status: 'cancelled'
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