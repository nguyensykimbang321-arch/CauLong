import type { Request, Response, NextFunction } from "express";
import models from "../../models/index.js";
import AppResponse from "../../utils/AppResponse.js";
import ApiError from "../../utils/ErrorClass.js";
import { VNPayUtils } from "../../utils/vnpay.js";

export class ClientBookingController {
    static async getMyBookings(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user.id;
            const bookings = await (models.Booking as any).findAll({
                where: { user_id: userId },
                include: [
                    { model: models.Facility, as: 'facility' },
                    { 
                        model: models.BookingSlot, 
                        as: 'slots',
                        include: [
                            { 
                                model: models.Court, 
                                as: 'court',
                                include: [{ model: models.CourtType, as: 'type' }]
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return AppResponse.success(res, bookings, "Lấy danh sách đơn đặt sân thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async createBooking(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user.id;
            const { facility_id, slots, total_cents, note, payment_method } = req.body;

            const booking = await (models.Booking as any).create({
                user_id: userId,
                facility_id,
                status: 'confirmed',
                payment_status: 'unpaid',
                total_cents,
                note
            });

            if (slots && slots.length > 0) {
                const bookingSlots = slots.map((s: any) => ({
                    booking_id: booking.id,
                    court_id: s.court_id,
                    start_at: s.start_at,
                    end_at: s.end_at,
                    price_cents: s.price_cents
                }));
                await (models.BookingSlot as any).bulkCreate(bookingSlots);
            }

            let paymentUrl = null;
            if (payment_method === 'vnpay') {
                paymentUrl = VNPayUtils.createPaymentUrl({
                    amount: total_cents,
                    orderId: booking.id.toString() + '_' + Date.now().toString().slice(-6),
                    orderInfo: `Thanh toan don hang ${booking.id}`,
                    ipAddr: req.ip || '127.0.0.1'
                });
            }

            return AppResponse.success(res, { booking, paymentUrl }, "Đặt sân thành công", 201);
        } catch (error) {
            next(error);
        }
    }
}
