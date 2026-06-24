import { Op } from "sequelize";
import Court from "../models/court.model.js";
import models from "../models/index.js";
import ApiError from "../utils/ErrorClass.js";
import type { CreatePriceConfigInput, UpdatePriceConfigInput } from "../validations/priceConfig.validation.js";
import { getCache, setCache, deleteCache } from "../utils/cache.js";
import PriceConfig, { type PriceConfigAttributes } from "../models/price_config.model.js";

const PRICE_CONFIG_PREFIX = 'caulong:w1:price-configs:facility:';
const PRICE_CONFIG_TTL = 300; // 5 minutes (300 seconds)

export class PriceConfigService {
    static async getAllConfigs(facilityId?: number): Promise<PriceConfig[]> {
        const cacheKey = `${PRICE_CONFIG_PREFIX}${facilityId ? facilityId : 'all'}`;
        const cached = await getCache<PriceConfigAttributes[]>(cacheKey);
        if (cached) {
            return cached.map(item => models.PriceConfig.build(item, {
                isNewRecord: false,
                include: [{ model: models.Facility, as: 'facility' }]
            }));
        }

        const whereCondition = facilityId ? { facility_id: facilityId } : {};
        const configs = await models.PriceConfig.findAll({
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

        await setCache(cacheKey, configs.map(c => c.toJSON()), PRICE_CONFIG_TTL);
        return configs;
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

    static async createConfig(data: CreatePriceConfigInput): Promise<PriceConfig> {
        await this.checkTimeOverlap(data.facility_id, data.court_type, data.start_time, data.end_time);
        const newConfig = await models.PriceConfig.create(data as any);

        // Invalidate Cache
        await deleteCache(`${PRICE_CONFIG_PREFIX}${data.facility_id}`);
        await deleteCache(`${PRICE_CONFIG_PREFIX}all`);

        return newConfig;
    }

    static async updateConfig(id: number, data: UpdatePriceConfigInput): Promise<PriceConfig> {
        const config = await models.PriceConfig.findByPk(id);
        if (!config) throw new ApiError('Không tìm thấy cấu hình giá này', 404);

        const oldFacilityId = config.facility_id;
        const checkFacilityId = data.facility_id || config.facility_id;
        const checkCourtType = data.court_type || config.court_type;
        const checkStartTime = data.start_time || config.start_time;
        const checkEndTime = data.end_time || config.end_time;

        await this.checkTimeOverlap(
            checkFacilityId,
            checkCourtType, 
            checkStartTime, 
            checkEndTime,  
            id            
        );
        await config.update(data as any);

        // Invalidate Cache
        await deleteCache(`${PRICE_CONFIG_PREFIX}${oldFacilityId}`);
        if (data.facility_id && data.facility_id !== oldFacilityId) {
            await deleteCache(`${PRICE_CONFIG_PREFIX}${data.facility_id}`);
        }
        await deleteCache(`${PRICE_CONFIG_PREFIX}all`);

        return config;
    }

    static async deleteConfig(id: number): Promise<{ message: string }> {
        const config = await models.PriceConfig.findByPk(id);
        if (!config) throw new ApiError('Không tìm thấy cấu hình giá này', 404);
        
        const oldFacilityId = config.facility_id;
        await config.destroy();

        // Invalidate Cache
        await deleteCache(`${PRICE_CONFIG_PREFIX}${oldFacilityId}`);
        await deleteCache(`${PRICE_CONFIG_PREFIX}all`);

        return { message: 'Đã xóa cấu hình giá thành công' };
    }
}