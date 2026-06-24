import { Op } from 'sequelize';
import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import type { CreateSystemConfigInput, UpdateSystemConfigInput } from '../validations/systemConfig.validation.js';
import { getCache, setCache, deleteCache } from '../utils/cache.js';
import SystemConfig, { type SystemConfigAttributes } from '../models/system_config.model.js';

const SYSTEM_CONFIGS_ALL_KEY = 'caulong:w1:system-configs:all';
const SYSTEM_CONFIG_KEY_PREFIX = 'caulong:w1:system-config:key:';
const SYSTEM_CONFIG_TTL = 600; // 10 minutes (600 seconds)

export class SystemConfigService {
    // 1. Lấy danh sách cấu hình hệ thống
    static async getAllSystemConfigs(): Promise<SystemConfig[]> {
        const cached = await getCache<SystemConfigAttributes[]>(SYSTEM_CONFIGS_ALL_KEY);
        if (cached) {
            return cached.map(item => models.SystemConfig.build(item));
        }

        const configs = await models.SystemConfig.findAll({
            order: [['created_at', 'DESC']]
        });
        
        await setCache(SYSTEM_CONFIGS_ALL_KEY, configs.map(c => c.toJSON()), SYSTEM_CONFIG_TTL);
        return configs;
    }

    // 2. Lấy chi tiết cấu hình bằng ID
    static async getSystemConfigById(id: number): Promise<SystemConfig> {
        const config = await models.SystemConfig.findByPk(id);
        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình này!', 404);
        }
        return config;
    }

    // 3. Lấy cấu hình bằng Key
    static async getSystemConfigByKey(key: string): Promise<SystemConfig> {
        const cacheKey = `${SYSTEM_CONFIG_KEY_PREFIX}${key}`;
        const cached = await getCache<SystemConfigAttributes>(cacheKey);
        if (cached) {
            return models.SystemConfig.build(cached);
        }

        const config = await models.SystemConfig.findOne({
            where: { key }
        });
        if (!config) {
            throw new ApiError(`Không tìm thấy cấu hình với key '${key}'`, 404);
        }

        await setCache(cacheKey, config.toJSON(), SYSTEM_CONFIG_TTL);
        return config;
    }

    // 4. Thêm cấu hình mới
    static async createSystemConfig(data: CreateSystemConfigInput): Promise<SystemConfig> {
        const existingConfig = await models.SystemConfig.findOne({
            where: { key: data.key }
        });
        if (existingConfig) {
            throw new ApiError(`Cấu hình với key '${data.key}' đã tồn tại!`, 400);
        }

        const newConfig = await models.SystemConfig.create({
            key: data.key,
            value: data.value,
            description: data.description || null,
            data_type: data.data_type
        });

        // Invalidate Cache
        await deleteCache(SYSTEM_CONFIGS_ALL_KEY);
        await deleteCache(`${SYSTEM_CONFIG_KEY_PREFIX}${data.key}`);

        return newConfig;
    }

    // 5. Cập nhật cấu hình bằng ID
    static async updateSystemConfig(id: number, data: UpdateSystemConfigInput): Promise<SystemConfig> {
        const config = await models.SystemConfig.findByPk(id);
        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình này!', 404);
        }

        const oldKey = config.key;
        await config.update({
            value: data.value,
            description: data.description !== undefined ? data.description : config.description
        });

        // Invalidate Cache
        await deleteCache(SYSTEM_CONFIGS_ALL_KEY);
        await deleteCache(`${SYSTEM_CONFIG_KEY_PREFIX}${oldKey}`);

        return config;
    }

    // 6. Xóa cấu hình
    static async deleteSystemConfig(id: number): Promise<{ message: string }> {
        const config = await models.SystemConfig.findByPk(id);
        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình này!', 404);
        }

        const oldKey = config.key;
        await config.destroy();

        // Invalidate Cache
        await deleteCache(SYSTEM_CONFIGS_ALL_KEY);
        await deleteCache(`${SYSTEM_CONFIG_KEY_PREFIX}${oldKey}`);

        return { message: 'Đã xóa (mềm) cấu hình thành công' };
    }

    // 7. Khôi phục cấu hình từ thùng rác
    static async restoreSystemConfig(id: number): Promise<{ message: string }> {
        const config = await models.SystemConfig.findOne({
            where: { id },
            paranoid: false
        });

        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình trong thùng rác', 404);
        }

        await config.restore();

        // Invalidate Cache
        await deleteCache(SYSTEM_CONFIGS_ALL_KEY);
        await deleteCache(`${SYSTEM_CONFIG_KEY_PREFIX}${config.key}`);

        return { message: 'Khôi phục cấu hình thành công' };
    }
}
