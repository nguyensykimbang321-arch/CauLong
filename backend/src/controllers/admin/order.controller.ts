import type { Request, Response, NextFunction } from 'express';
import { OrderService } from '../../services/order.service.js';
import AppResponse from '../../utils/AppResponse.js';

export class AdminOrderController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await OrderService.getAll();

            return AppResponse.success(res, data);
        }catch (err) {
            next(err);
        }
    }

    static async getById(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
        const orderId =
            Number(req.params.id);

        const data =
            await OrderService.getById(
            orderId
            );

        return AppResponse.success(
            res,
            data,
            'Lấy chi tiết đơn hàng thành công'
        );

        } catch (err) {
        next(err);
        }
    }

    static async completeOrder(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
        const orderId =
            Number(req.params.id);

        const data =
            await OrderService.completeOrder(
            orderId
            );

        return AppResponse.success(
            res,
            data,
            'Hoàn tất đơn hàng thành công'
        );

        } catch (err) {
        next(err);
        }
    }

    static async confirmOrder(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
        const orderId =
            Number(req.params.id);

        const data =
            await OrderService.confirmOrder(
            orderId
            );

        return AppResponse.success(
            res,
            data,
            'Xác nhận đơn hàng thành công'
        );

        } catch (err) {
        next(err);
        }
    }

    static async getPendingPickupOrders(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
        const data =
            await OrderService.getPendingPickupOrders();

        return AppResponse.success(
            res,
            data,
            'Lấy danh sách đơn chờ nhận thành công'
        );

        } catch (err) {
        next(err);
        }
    }

    static async getPendingPaymentOrders( req: Request, res: Response, next: NextFunction ) {
        try {
            const data = await OrderService.getPendingPaymentOrders();
            return AppResponse.success(res, data, 'Lấy danh sách đơn chờ thanh toán thành công');
        } catch (err) {
            next(err);
        }
    }

    static async payCash( req: Request, res: Response, next: NextFunction ) {
        try {
            const orderId = Number(req.params.id);
            const data = await OrderService.payCash(orderId);
            return AppResponse.success(res, data, 'Thanh toán tiền mặt thành công');
        } catch (err) {
            next(err);
        }
    }

    static async getVNPayUrl( req: Request, res: Response, next: NextFunction ) {
        try {
            const orderId = Number(req.params.id);
            const ipAddr = '127.0.0.1'; // TODO: Get from request in production
            const data = await OrderService.getVNPayUrl(orderId, ipAddr);
            return AppResponse.success(res, data, 'Lấy link VNPay thành công');
        } catch (err) {
            next(err);
        }
    }

    static async createPosOrder(
        req: any,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result =
                await OrderService.createPosOrder(
                    req.user.id,
                    req.body
                );

            return AppResponse.success(
                res,
                result,
                'Tạo đơn hàng thành công',
                201
            );
        } catch (err) {
            next(err);
        }
    }

    static async refundOrder(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const orderId = Number(req.params.id);
            const reason = req.body.reason;
            const data = await OrderService.refundOrder(orderId, reason);
            return AppResponse.success(
                res,
                data,
                'Hoàn tiền thành công'
            );
        } catch (err) {
            next(err);
        }
    }
}