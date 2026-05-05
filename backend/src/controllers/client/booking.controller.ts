
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import AppResponse from '../../utils/AppResponse.js';
import ApiError from '../../utils/ErrorClass.js';
import type { Request, Response, NextFunction } from 'express';
import type { CheckAvailabilityQuery, CreateBookingInput } from '../../validations/booking.validation.js';
import { BookingService } from '../../services/booking.service.js';

dayjs.extend(customParseFormat);

export class ClientBookingController {
    static async checkAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            
            const query = req.query as CheckAvailabilityQuery;
            
            
            const startDateTime = dayjs(`${query.date} ${query.start_time}`, 'YYYY-MM-DD HH:mm');
            const endDateTime = dayjs(`${query.date} ${query.end_time}`, 'YYYY-MM-DD HH:mm');

            const courtType = query.court_type;

            if (!startDateTime.isValid() || !endDateTime.isValid()) {
                throw new ApiError('Thời gian không hợp lệ', 400);
            }
            if (startDateTime.isBefore(dayjs())) {
                throw new ApiError('Không thể đặt sân ở thời điểm trong quá khứ', 400);
            }
            if (endDateTime.isBefore(startDateTime) || endDateTime.isSame(startDateTime)) {
                throw new ApiError('Giờ kết thúc phải sau giờ bắt đầu', 400);
            }

            const availableCourts = await BookingService.getAvailableCourts(
                startDateTime.toDate(), 
                endDateTime.toDate(),
                courtType
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

    static async createBooking(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as CreateBookingInput;

            const userId = req.user?.id;
            if(!userId) throw new ApiError('Không tìm thấy thông tin người dùng', 401);
            
            const result = await BookingService.createBooking(userId, body);

            return AppResponse.success(res, result, 'Giữ chỗ thành công! Vui lòng thanh toán.', 201);

        } catch (error) {
            next(error);
        }
    }
}