import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import AppResponse from '../../utils/AppResponse.js';
import ApiError from '../../utils/ErrorClass.js';
import type { Request, Response, NextFunction } from 'express';
import type { CheckAvailabilityQuery, CreateBookingInput, PreviewPriceInput } from '../../validations/booking.validation.js';
import { BookingService } from '../../services/booking.service.js';
import { VNPayUtils } from '../../utils/vnpay.js';
import models from '../../models/index.js';
import { PricingService } from '../../services/pricing.service.js';

dayjs.extend(customParseFormat);

export class ClientBookingController {
    
    static async checkAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as CheckAvailabilityQuery;
            const { startDateTime, endDateTime } = await BookingService.validateBookingTimes(
                query.date, 
                query.start_time, 
                query.end_time
            );

            const availableCourts = await BookingService.getAvailableCourts(
                query.facility_id,
                startDateTime.toDate(), 
                endDateTime.toDate(),
                query.court_type
            );

            return AppResponse.success(res, availableCourts, 'Lấy danh sách sân trống thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async getDailyBooked(req: Request, res: Response, next: NextFunction) {
        try {
            const facilityId = Number(req.query.facility_id);
            const date = req.query.date as string;
            const courtType = req.query.court_type as string;

            const result = await BookingService.getDailyBookedSlots(facilityId, date, courtType);
            
            return AppResponse.success(res, result, 'Lấy danh sách giờ đã đặt thành công');
        } catch (error) { 
            next(error); 
        }
    }

    static async getMyBookings(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if(!userId) throw new ApiError('Không tìm thấy thông tin người dùng', 401);

            // Gọi sang Service thay vì tự chọc Database
            const bookings = await BookingService.getMyBookings(userId);

            return AppResponse.success(res, bookings, "Lấy danh sách đơn đặt sân thành công", 200);
        } catch (error) {
            next(error);
        }
    }
    static async previewPrice(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as PreviewPriceInput;

            // 1. Kiểm tra logic giờ cơ bản (tránh trường hợp start > end)
            if (body.start_time >= body.end_time) {
                throw new ApiError('Giờ kết thúc phải lớn hơn giờ bắt đầu', 400);
            }

            // 2. Ghép ngày và giờ lại thành Object Date chuẩn
            const startDateTime = dayjs(`${body.date} ${body.start_time}`, 'YYYY-MM-DD HH:mm').toDate();
            const endDateTime = dayjs(`${body.date} ${body.end_time}`, 'YYYY-MM-DD HH:mm').toDate();

            // 3. Gọi Service để tính tiền
            const totalPrice = await PricingService.calculateTotalPrice(
                body.facility_id, 
                body.court_type, 
                startDateTime, 
                endDateTime
            );

            // 4. Trả về kết quả cho Frontend
            return AppResponse.success(
                res, 
                { total_cents: totalPrice }, 
                'Tính toán giá thành công', 
                200
            );

        } catch (error) {
            next(error);
        }
    }
    
    static async createBooking(req: any, res: Response, next: NextFunction) {
        try {
            const body = req.body as CreateBookingInput;
            const userId = req.user?.id;
            if(!userId) throw new ApiError('Không tìm thấy thông tin người dùng', 401);
            
            // Dùng BookingService của em để đảm bảo tính toàn vẹn dữ liệu (Transaction)
            const result = await BookingService.createBooking(userId, body);

            let paymentUrl = null;
            if (req.body.payment_method === 'vnpay' && result?.id) {
                paymentUrl = VNPayUtils.createPaymentUrl({
                    amount: result.total_cents,
                    orderId: result.id.toString() + '_' + Date.now().toString().slice(-6),
                    orderInfo: `Thanh toan don dat san ${result.id}`,
                    ipAddr: req.ip || '127.0.0.1'
                });
            }

            return AppResponse.success(res, { booking: result, paymentUrl }, 'Giữ chỗ thành công!', 201);

        } catch (error) {
            next(error);
        }
    }

    static async cancelBooking(req: any, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if(!userId) throw new ApiError('Không tìm thấy thông tin người dùng', 401);

            const booking = await BookingService.cancelBooking(Number(id), userId);

            return AppResponse.success(res, booking, "Hủy đặt sân thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}