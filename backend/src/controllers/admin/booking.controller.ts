import type { Request, Response, NextFunction } from "express";
import { BookingService } from "../../services/booking.service.js";
import AppResponse from "../../utils/AppResponse.js";
import type { CreateBookingByHotlineInput, UpdateBookingStatusInput } from "../../validations/booking.validation.js";
import { UserService } from "../../services/user.service.js";

export class AdminBookingController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const facilityId = req.query.facility_id ? Number(req.query.facility_id) : undefined;
            const result = await BookingService.getAllBookings(facilityId);
            return AppResponse.success(res, result, 'Lấy danh sách lịch đặt thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const bookingId = req.params.booking_id;
            const result = await BookingService.getByBookingId(Number(bookingId));
            return AppResponse.success(res, result, "Lấy chi tiết thông tin Booking thành công!", 200);
        } catch (error) {
            next(error);
        }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const body = req.body as UpdateBookingStatusInput;
            
            const result = await BookingService.updateBookingStatus(id, body);
            return AppResponse.success(res, result, 'Cập nhật trạng thái thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async createByHotline(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as CreateBookingByHotlineInput;
            
            const result = await BookingService.createBookingByHotline(body);

            return AppResponse.success(
                res, 
                result.booking, 
                result.message, 
                201
            );
        } catch (error) {
            next(error);
        }
    }

    static async getVNPayUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const bookingId = Number(req.params.booking_id);
            const ipAddr = req.ip || req.connection.remoteAddress || '127.0.0.1';
            
            const result = await BookingService.generateVNPayUrl(bookingId, ipAddr);
            
            return AppResponse.success(res, result, "Tạo link VNPay thành công!", 200);
        } catch (error) {
            next(error);
        }
    }

    static async getDailyBooked(req: Request, res: Response, next: NextFunction) {
        try {
            const facilityId = Number(req.query.facility_id);
            const date = String(req.query.date);
            const courtType = String(req.query.court_type);

            const result = await BookingService.getDailyBookedSlots(facilityId, date, courtType);
            return AppResponse.success(res, result, "Lấy lịch đặt sân trong ngày thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}