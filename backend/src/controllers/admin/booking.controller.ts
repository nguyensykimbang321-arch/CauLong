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
            
            const {customer_phone, customer_name, ...bookingData } = body;

            // 1. Tìm user qua SĐT
            let user = await UserService.getUserByPhone(customer_phone);
            if (!user) {
                user = await UserService.createGuestUser(customer_phone, customer_name as string);
            }

            // 2. Chốt cứng trạng thái cho Lễ tân
            const payloadToService = {
                ...bookingData,
                status: 'confirmed' as const,
                payment_method: 'cash' as const,
            };

            // 3. Gọi Core Service
            const result = await BookingService.createBooking(user.id, payloadToService);

            // 4. Trả về thông báo thông minh
            return AppResponse.success(
                res, 
                result, 
                user.created_at.getTime() === user.updated_at.getTime() 
                    ? 'Đã tạo tài khoản mới và đặt sân hộ khách thành công' 
                    : 'Đã đặt sân hộ khách thành công', 
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
}