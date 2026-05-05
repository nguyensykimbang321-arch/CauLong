import { Op } from "sequelize";
import Court from "../models/court.model.js";
import models from "../models/index.js";
import ApiError from "../utils/ErrorClass.js";
import type { CreatePriceConfigInput, UpdatePriceConfigInput } from "../validations/priceConfig.validation.js";

export class PriceConfigService {
    static async getAllConfigs(facilityId?: number) {
        const whereCondition = facilityId ? { facility_id: facilityId } : {};
        return await models.PriceConfig.findAll({
            where: whereCondition,
            order: [
                ['facility_id', 'ASC'],
                ['court_type', 'ASC'],
                ['start_time', 'ASC']
            ],
            include:[
                {
                    model: models.Facility,
                    as: 'facility', 
                    attributes: ['name']
                }
            ]
        });
    }

    private static async checkTimeOverlap(facilityId: number, courtType: string, startTime: string, endTime: string, excludeId?: number) {
        const court = await models.Court.findOne({
            where: { 
                facility_id: facilityId,
                court_type: courtType, 
                is_active: true 
            }
        });

        if(!court) {
            throw new ApiError('Cơ sở này không tồn tại hoặc không kinh doanh loại sân này', 404);
        }

        const whereCondition: any = {
            facility_id: facilityId,
            court_type: courtType,
            [Op.and]: [
                { start_time: {[Op.lt]: endTime } },
                { end_time: {[ Op.gt ]: startTime } }
            ]
        };

        if(excludeId) {
            whereCondition.id = { [Op.ne]: excludeId };
        }

        const overlap = await models.PriceConfig.findOne({ where: whereCondition });
        if (overlap) {
            throw new ApiError(`Khung giờ này bị trùng lặp với một cấu hình giá hiện có (${overlap.start_time} - ${overlap.end_time}) của loại sân ${courtType}`, 400);
        }
    }

    static async createConfig(data: CreatePriceConfigInput) {
        await this.checkTimeOverlap(data.facility_id, data.court_type, data.start_time, data.end_time);
        return await models.PriceConfig.create(data as any);
    }

    static async updateConfig(id: number, data: UpdatePriceConfigInput) {
        const config = await models.PriceConfig.findByPk(id);
        if (!config) throw new ApiError('Không tìm thấy cấu hình giá này', 404);

        const newStartTime = data.start_time || config.start_time;
        const newEndTime = data.end_time || config.end_time;

        if (data.start_time || data.end_time) {
            await this.checkTimeOverlap(config.facility_id, config.court_type, newStartTime, newEndTime, id);
        }

        await config.update(data as any);
        return config;
    }

    static async deleteConfig(id: number) {
        const config = await models.PriceConfig.findByPk(id);
        if (!config) throw new ApiError('Không tìm thấy cấu hình giá này', 404);
        
        await config.destroy();
        return { message: 'Đã xóa cấu hình giá thành công' };
    }
    
}