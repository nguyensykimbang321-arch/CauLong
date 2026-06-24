import { Op } from 'sequelize';
import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import { getCache, setCache, deleteCache } from '../utils/cache.js';
import Holiday, { type HolidayAttributes } from '../models/holiday.model.js';
import type { CreateHolidayInput, UpdateHolidayInput } from '../validations/holiday.validation.js';

const HOLIDAYS_ALL_KEY = 'caulong:w1:holidays:all';
const HOLIDAY_DATE_PREFIX = 'caulong:w1:holiday:date:';
const HOLIDAY_TTL = 1800; // 30 minutes (1800 seconds)

export class HolidayService {
    // 1. Lấy danh sách ngày lễ (Sắp xếp theo ngày tăng dần)
    static async getAllHolidays(): Promise<Holiday[]> {
        const cached = await getCache<HolidayAttributes[]>(HOLIDAYS_ALL_KEY);
        if (cached) {
            return cached.map(item => models.Holiday.build(item));
        }

        const holidays = await models.Holiday.findAll({
            order: [['holiday_date', 'ASC']]
        });

        await setCache(HOLIDAYS_ALL_KEY, holidays.map(h => h.toJSON()), HOLIDAY_TTL);
        return holidays;
    }

    // 2. Lấy chi tiết ngày lễ
    static async getHolidayById(id: number): Promise<Holiday> {
        const holiday = await models.Holiday.findByPk(id);
        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ này', 404);
        }
        return holiday;
    }

    // 2.5 Lấy ngày lễ theo ngày (holiday_date) - Hỗ trợ Pricing Strategy sau này
    static async getHolidayByDate(holidayDate: string): Promise<Holiday | null> {
        const cacheKey = `${HOLIDAY_DATE_PREFIX}${holidayDate}`;
        const cached = await getCache<HolidayAttributes>(cacheKey);
        if (cached) {
            return models.Holiday.build(cached);
        }

        const holiday = await models.Holiday.findOne({
            where: { holiday_date: holidayDate }
        });

        if (holiday) {
            await setCache(cacheKey, holiday.toJSON(), HOLIDAY_TTL);
        }
        return holiday;
    }

    // 3. Thêm ngày lễ mới
    static async createHoliday(data: CreateHolidayInput): Promise<Holiday> {
        // Kiểm tra xem ngày này đã có ai cấu hình chưa
        const existingHoliday = await models.Holiday.findOne({
            where: { holiday_date: data.holiday_date }
        });

        if (existingHoliday) {
            throw new ApiError(`Ngày ${data.holiday_date} đã được cấu hình trước đó!`, 400);
        }

        const newHoliday = await models.Holiday.create(data);

        // Invalidate Cache
        await deleteCache(HOLIDAYS_ALL_KEY);
        await deleteCache(`${HOLIDAY_DATE_PREFIX}${data.holiday_date}`);

        return newHoliday;
    }

    // 4. Sửa ngày lễ (Ví dụ: Đổi từ phụ thu 20% lên 30%)
    static async updateHoliday(id: number, data: UpdateHolidayInput): Promise<Holiday> {
        const holiday = await models.Holiday.findByPk(id);
        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ này', 404);
        }

        const oldDate = holiday.holiday_date;

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

        // Invalidate Cache
        await deleteCache(HOLIDAYS_ALL_KEY);
        await deleteCache(`${HOLIDAY_DATE_PREFIX}${oldDate}`);
        if (data.holiday_date) {
            await deleteCache(`${HOLIDAY_DATE_PREFIX}${data.holiday_date}`);
        }

        return holiday;
    }

    // 5. Xóa cấu hình ngày lễ
    static async deleteHoliday(id: number): Promise<{ message: string }> {
        const holiday = await models.Holiday.findByPk(id);
        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ này', 404);
        }

        const oldDate = holiday.holiday_date;
        await holiday.destroy();

        // Invalidate Cache
        await deleteCache(HOLIDAYS_ALL_KEY);
        await deleteCache(`${HOLIDAY_DATE_PREFIX}${oldDate}`);

        return { message: 'Đã xóa (mềm) cấu hình ngày lễ thành công' };
    }

    // 6. Khôi phục ngày lễ từ thùng rác
    static async restoreHoliday(id: number): Promise<{ message: string }> {
        const holiday = await models.Holiday.findOne({
            where: { id },
            paranoid: false
        });

        if (!holiday) {
            throw new ApiError('Không tìm thấy cấu hình ngày lễ trong thùng rác', 404);
        }

        await holiday.restore();

        // Invalidate Cache
        await deleteCache(HOLIDAYS_ALL_KEY);
        await deleteCache(`${HOLIDAY_DATE_PREFIX}${holiday.holiday_date}`);

        return { message: 'Khôi phục cấu hình ngày lễ thành công' };
    }
}
