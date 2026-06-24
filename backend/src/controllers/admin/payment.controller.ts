import { PaymentService } from '../../services/payment.service.js';
import type { Request, Response, NextFunction } from "express";


export class PaymentController {

    // API Hứng Webhook từ VNPay
    static async vnpayIpn(
        req: Request,
        res: Response
    ) {
        const txnRef =
            String(
                req.query.vnp_TxnRef || ''
            );

        if (
            txnRef.startsWith(
                'ORDER_'
            )
        ) {
            const result =
                await PaymentService.processPosOrderVNPayIPN(
                    req.query
                );

            return res
                .status(200)
                .json(result);
        }

        const result =
            await PaymentService.processVNPayIPN(
                req.query
            );

        return res
            .status(200)
            .json(result);
    }

    static async vnpayReturn(req: Request, res: Response, next: NextFunction) {
        try {
            // Cũng xử lý cập nhật DB ở Return URL luôn (để dự phòng IPN chậm hoặc lỗi ngrok)
            const txnRef = String(req.query.vnp_TxnRef || '');
            if (txnRef.startsWith('ORDER_')) {
                await PaymentService.processPosOrderVNPayIPN(req.query);
            } else {
                await PaymentService.processVNPayIPN(req.query);
            }

            // Gọi Service để lấy chuỗi HTML
            const htmlContent = PaymentService.getVNPayReturnHtml(req.query);
            return res.send(htmlContent);
        } catch (error) {
            next(error);
        }
    }

    static async posOrderVNPayIpn(
        req: Request,
        res: Response
    ) {
        const result =
            await PaymentService.processPosOrderVNPayIPN(
                req.query
            );

        return res.status(200).json(
            result
        );
    }
}