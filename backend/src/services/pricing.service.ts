import dayjs from 'dayjs';
import ApiError from '../utils/ErrorClass.js';
import models from '../models/index.js';
import { HolidayService } from './holiday.service.js';
import { SystemConfigService } from './systemConfig.service.js';
import { PriceConfigService } from './priceConfig.service.js';
import { PricingStrategyFactory } from '../patterns/factories/pricing-strategy.factory.js';
import { PricingContext } from '../patterns/strategies/pricing/pricing.context.js';

type PriceConfigLike = {
    start_time: string;
    end_time: string;
    price_per_hour: number | string;
    court_type?: string;
};

export class PricingService {
    static async calculateTotalPrice(
        facilityId: number,
        courtType: string,
        startDateTime: Date,
        endDateTime: Date,
        userId?: number | null
    ): Promise<number> {
        const diffInMinutes = dayjs(endDateTime).diff(dayjs(startDateTime), 'minute');
        if (diffInMinutes <= 0) {
            throw new ApiError('Thời gian đặt sân không hợp lệ', 400);
        }

        // Tận dụng cache từ PriceConfigService
        const facilityConfigs = await PriceConfigService.getAllConfigs(facilityId);
        const configs = facilityConfigs.filter((config) => config.court_type === courtType);

        if (!configs || configs.length === 0) {
            throw new ApiError('Không tìm thấy cấu hình giá cho sân này. Vui lòng liên hệ Admin.', 400);
        }

        const { totalPrice: basePrice, totalCalculatedMinutes } = this.calculateFromConfigs(
            configs,
            startDateTime,
            endDateTime
        );

        if (totalCalculatedMinutes < diffInMinutes) {
            throw new ApiError(
                'Khung giờ bạn đặt chứa khoảng thời gian chưa được thiết lập giá (Lỗi hệ thống). Vui lòng đổi giờ khác.',
                400
            );
        }

        // 1. Kiểm tra ngày lễ
        const bookingDate = dayjs(startDateTime).format('YYYY-MM-DD');
        const holiday = await HolidayService.getHolidayByDate(bookingDate);
        const isHoliday = !!holiday;
        const holidaySurchargePercent = holiday ? holiday.surcharge_percent : 0;

        // 2. Kiểm tra cuối tuần (Thứ 7 hoặc Chủ nhật)
        const dayOfWeek = dayjs(startDateTime).day();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // 3. Lấy cấu hình hệ thống qua SystemConfigService
        let weekendSurchargePercent = 0;
        let studentDiscountPercent = 0;
        let vipDiscountPercent = 0;

        try {
            const config = await SystemConfigService.getSystemConfigByKey('WEEKEND_SURCHARGE_PERCENT');
            weekendSurchargePercent = Number(config.value);
        } catch {
            weekendSurchargePercent = 0;
        }

        try {
            const config = await SystemConfigService.getSystemConfigByKey('STUDENT_DISCOUNT_PERCENT');
            studentDiscountPercent = Number(config.value);
        } catch {
            studentDiscountPercent = 0;
        }

        try {
            const config = await SystemConfigService.getSystemConfigByKey('VIP_DISCOUNT_PERCENT');
            vipDiscountPercent = Number(config.value);
        } catch {
            vipDiscountPercent = 0;
        }

        // 4. Xác định hạng thành viên
        let membershipType = 'standard';
        if (userId) {
            const user = await models.User.findByPk(userId);
            if (user && user.membership_type) {
                membershipType = user.membership_type;
            }
        }

        // 5. Khởi tạo Strategy từ Factory
        const strategy = PricingStrategyFactory.createStrategy(
            isHoliday,
            isWeekend,
            membershipType,
            holidaySurchargePercent,
            weekendSurchargePercent,
            studentDiscountPercent,
            vipDiscountPercent
        );

        const pricingContext = new PricingContext(strategy);
        const finalPrice = pricingContext.calculate(basePrice);

        return Math.round(finalPrice);
    }

    static calculateFromConfigs(configs: PriceConfigLike[], startDateTime: Date, endDateTime: Date) {
        const bStartMins = dayjs(startDateTime).hour() * 60 + dayjs(startDateTime).minute();
        const bEndMins = dayjs(endDateTime).hour() * 60 + dayjs(endDateTime).minute();

        let totalPrice = 0;
        let totalCalculatedMinutes = 0;

        for (const config of configs) {
            const [cStartHour = 0, cStartMin = 0] = config.start_time.split(':').map(Number);
            const [cEndHour = 0, cEndMin = 0] = config.end_time.split(':').map(Number);

            const cStartMins = cStartHour * 60 + cStartMin;
            const cEndMins = cEndHour * 60 + cEndMin;

            const overlapStart = Math.max(bStartMins, cStartMins);
            const overlapEnd = Math.min(bEndMins, cEndMins);

            if (overlapStart < overlapEnd) {
                const overlapMinutes = overlapEnd - overlapStart;
                const overlapHours = overlapMinutes / 60;

                totalPrice += overlapHours * Number(config.price_per_hour);
                totalCalculatedMinutes += overlapMinutes;
            }
        }

        return { totalPrice, totalCalculatedMinutes };
    }
}