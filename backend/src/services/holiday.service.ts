import { Op } from 'sequelize';
import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import type { CreateHolidayInput, UpdateHolidayInput } from '../validations/holiday.validation.js';

export class HolidayService {
    // 1. Lấy danh sách ngày lễ (Sắp xếp theo ngày tăng dần)
    static async getAllHolidays() {
        return await models.Holiday.findAll({
            order: [['holiday_date', 'ASC']]
        });
    }

    // 2. Lấy chi tiết ngày lễ
    static async getHolidayById(id: number) {
        const holiday = await models.Holiday.findByPk(id);
        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ này', 404);
        }
        return holiday;
    }

    // 3. Thêm ngày lễ mới
    static async createHoliday(data: CreateHolidayInput) {
        // Kiểm tra xem ngày này đã có ai cấu hình chưa
        const existingHoliday = await models.Holiday.findOne({
            where: { holiday_date: data.holiday_date }
        });

        if (existingHoliday) {
            throw new ApiError(`Ngày ${data.holiday_date} đã được cấu hình trước đó!`, 400);
        }

        return await models.Holiday.create(data);
    }

    // 4. Sửa ngày lễ (Ví dụ: Đổi từ phụ thu 20% lên 30%)
    static async updateHoliday(id: number, data: UpdateHolidayInput) {
        const holiday = await models.Holiday.findByPk(id);
        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ này', 404);
        }

        // Nếu có update ngày, phải check xem ngày mới có bị trùng không
        if (data.holiday_date && data.holiday_date !== holiday.holiday_date) {
            const existing = await models.Holiday.findOne({
                where: { holiday_date: data.holiday_date }
            });
            if (existing) {
                throw new ApiError('Ngày lễ mới đã bị trùng lặp!', 400);
            }
        }

        const updateData: { name?: string; holiday_date?: string; surcharge_percent?: number } = {};

        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.holiday_date !== undefined) {
            updateData.holiday_date = data.holiday_date;
        }
        if (data.surcharge_percent !== undefined) {
            updateData.surcharge_percent = data.surcharge_percent;
        }

        await holiday.update(updateData);
        return holiday;
    }

    // 5. Xóa cấu hình ngày lễ
    static async deleteHoliday(id: number) {
        const holiday = await models.Holiday.findByPk(id);
        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ này', 404);
        }
        await holiday.destroy();
        return { message: 'Đã xóa (mềm) cấu hình ngày lễ thành công' };
    }

    // 6. Khôi phục ngày lễ từ thùng rác
    static async restoreHoliday(id: number) {
        const holiday = await models.Holiday.findOne({
            where: { id },
            paranoid: false
        });

        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ trong thùng rác', 404);
        }

        await holiday.restore();
        return { message: 'Khôi phục cấu hình ngày lễ thành công' };
    }
}
