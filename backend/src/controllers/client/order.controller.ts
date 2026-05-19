import type { Request, Response, NextFunction } from "express";
import models from "../../models/index.js";
import AppResponse from "../../utils/AppResponse.js";
import ApiError from "../../utils/ErrorClass.js";
import { VNPayUtils } from "../../utils/vnpay.js";

import { OrderService } from "../../services/order.service.js";

export class ClientOrderController {
  static async createOrder(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || null;
      const body = req.body;
      
      const order = await OrderService.createOrder(userId, body);

      // 3. Xử lý VNPAY nếu cần
      let paymentUrl = null;
      if (body.payment_method === 'vnpay') {
        paymentUrl = VNPayUtils.createPaymentUrl({
          amount: order.total_cents,
          orderId: `ORDER_${order.id}_${Date.now().toString().slice(-6)}`,
          orderInfo: `Thanh toan don hang #${order.id}`,
          ipAddr: req.ip || '127.0.0.1'
        });
      }

      return AppResponse.success(res, { order, payment_url: paymentUrl }, "Tạo đơn hàng thành công", 201);
    } catch (error) {
      next(error);
    }
  }
}
