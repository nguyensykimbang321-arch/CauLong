import type { Request, Response, NextFunction } from 'express';
import AppResponse from '../../utils/AppResponse.js';
import { HolidayService } from '../../services/holiday.service.js';

export class HolidayController {
    static async getAllHolidays(req: Request, res: Response, next: NextFunction) {
        try {
            const holidays = await HolidayService.getAllHolidays();
            return AppResponse.success(res, holidays, 'Lấy danh sách ngày lễ thành công');
        } catch (error) {
            next(error);
        }
    }

    static async getHolidayById(req: Request, res: Response, next: NextFunction) {
        try {
            const holiday = await HolidayService.getHolidayById(Number(req.params.id));
            return AppResponse.success(res, holiday, 'Lấy chi tiết ngày lễ thành công');
        } catch (error) {
            next(error);
        }
    }

    static async createHoliday(req: Request, res: Response, next: NextFunction) {
        try {
            const newHoliday = await HolidayService.createHoliday(req.body);
            return AppResponse.success(res, newHoliday, 'Tạo cấu hình lễ thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    static async updateHoliday(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await HolidayService.updateHoliday(Number(req.params.id), req.body);
            return AppResponse.success(res, result, 'Cập nhật cấu hình lễ thành công');
        } catch (error) {
            next(error);
        }
    }

    static async deleteHoliday(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await HolidayService.deleteHoliday(Number(req.params.id));
            return AppResponse.success(res, result, 'Xóa cấu hình thành công');
        } catch (error) {
            next(error);
        }
    }

    static async restoreHoliday(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await HolidayService.restoreHoliday(Number(req.params.id));
            return AppResponse.success(res, result, 'Khôi phục ngày lễ thành công');
        } catch (error) {
            next(error);
        }
    }
}
