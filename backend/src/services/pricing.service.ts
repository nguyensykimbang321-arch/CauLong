import dayjs from 'dayjs';
import ApiError from '../utils/ErrorClass.js';
import models from '../models/index.js';
import { Op } from 'sequelize';

export class PricingService {
    static async calculateTotalPrice(facilityId: number, courtType: string, startDateTime: Date, endDateTime: Date) {
        const diffInMinutes = dayjs(endDateTime).diff(dayjs(startDateTime), 'minute');
        if (diffInMinutes <= 0) {
            throw new ApiError('Thời gian đặt sân không hợp lệ', 400);
        }

        const configs = await models.PriceConfig.findAll({
            where: {
                facility_id: facilityId,
                court_type: courtType
            }
        });

        if (!configs || configs.length === 0) {
            throw new ApiError('Không tìm thấy cấu hình giá cho sân này. Vui lòng liên hệ Admin.', 400);
        }

        const { totalPrice, totalCalculatedMinutes } = this.calculateFromConfigs(configs, startDateTime, endDateTime);

        if (totalCalculatedMinutes < diffInMinutes) {
            throw new ApiError('Khung giờ bạn đặt chứa khoảng thời gian chưa được thiết lập giá (Lỗi hệ thống). Vui lòng đổi giờ khác.', 400);
        }

        return Math.ceil(totalPrice);
    }

    static calculateFromConfigs(configs: any[], startDateTime: Date, endDateTime: Date) {
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
                
                totalPrice += overlapHours * config.price_per_hour;
                totalCalculatedMinutes += overlapMinutes;
            }
        }

        return { totalPrice, totalCalculatedMinutes };
    }
}