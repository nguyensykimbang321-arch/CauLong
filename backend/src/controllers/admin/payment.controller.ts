import { PaymentService } from '../../services/payment.service.js';
import type { Request, Response, NextFunction } from "express";


export class PaymentController {

    // API Hứng Webhook từ VNPay
    static async vnpayIpn(req: Request, res: Response, next: NextFunction) {
        try {
            const vnpayQuery = req.query; 

            const result = await PaymentService.processVNPayIPN(vnpayQuery);

            return res.status(200).json(result);

        } catch (error) {
            // Nếu lỗi nội bộ server, báo lỗi 99 cho VNPay
            return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
        }
    }
}