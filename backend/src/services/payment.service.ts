import models from '../models/index.js';
import { VNPayUtils } from '../utils/vnpay.js'; 

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
}