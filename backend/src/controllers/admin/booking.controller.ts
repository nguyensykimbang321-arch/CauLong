import type { Request, Response, NextFunction } from "express";
import { BookingService } from "../../services/booking.service.js";
import AppResponse from "../../utils/AppResponse.js";
import type { CreateBookingByHotlineInput, UpdateBookingStatusInput } from "../../validations/booking.validation.js";
import { UserService } from "../../services/user.service.js";
import ApiError from "../../utils/ErrorClass.js";

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
            
            const { customer_phone, ...bookingData } = body;

            // 1. Tìm user qua SĐT
            let user = await UserService.getUserByPhone(customer_phone);
            if (!user) {
                user = await UserService.createGuestUser(customer_phone);
            }

            const result = await BookingService.createBooking(user.id, bookingData);

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
}