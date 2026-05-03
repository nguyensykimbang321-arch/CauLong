import type { Request, Response, NextFunction } from "express";
import models from "../../models/index.js";
import AppResponse from "../../utils/AppResponse.js";
import ApiError from "../../utils/ErrorClass.js";
import { VNPayUtils } from "../../utils/vnpay.js";

export class ClientOrderController {
  static async createOrder(req: any, res: Response, next: NextFunction) {
    try {
      // Tạm thời lấy userId từ req.user nếu có, hoặc null
      const userId = req.user?.id || null;
      const { customer_name, customer_phone, shipping_address, payment_method, items, note } = req.body;

      if (!items || items.length === 0) {
        throw new ApiError("Giỏ hàng trống", 400);
      }

      // Tính toán tổng tiền
      const subtotalCents = items.reduce((sum: number, it: any) => sum + (it.price_cents * it.quantity), 0);
      const totalCents = subtotalCents; // Tạm thời chưa có discount

      // 1. Tạo Đơn hàng
      const order = await (models.Order as any).create({
        user_id: userId,
        facility_id: 1, // Mặc định cơ sở 1
        status: 'pending',
        payment_method,
        subtotal_cents: subtotalCents,
        total_cents: totalCents,
        note: `Khách: ${customer_name} - ${customer_phone}. Đ/c: ${shipping_address}. ${note || ''}`
      });

      // 2. Tạo Chi tiết đơn hàng
      const orderItems = items.map((it: any) => ({
        order_id: order.id,
        variant_id: it.product_variant_id,
        quantity: it.quantity,
        unit_price_cents: it.price_cents,
        discount_cents: 0
      }));
      await (models.OrderItem as any).bulkCreate(orderItems);

      // 3. Xử lý VNPAY nếu cần
      let paymentUrl = null;
      if (payment_method === 'vnpay') {
        paymentUrl = VNPayUtils.createPaymentUrl({
          amount: totalCents,
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
