import { Op } from 'sequelize';
import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import type { CreateSystemConfigInput, UpdateSystemConfigInput } from '../validations/systemConfig.validation.js';

export class SystemConfigService {
    // 1. Lấy danh sách cấu hình hệ thống
    static async getAllSystemConfigs() {
        return await models.SystemConfig.findAll({
            order: [['created_at', 'DESC']]
        });
    }

    // 2. Lấy chi tiết cấu hình bằng ID
    static async getSystemConfigById(id: number) {
        const config = await models.SystemConfig.findByPk(id);
        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình này!', 404);
        }
        return config;
    }

    // 3. Lấy cấu hình bằng Key
    static async getSystemConfigByKey(key: string) {
        const config = await models.SystemConfig.findOne({
            where: { key }
        });
        if (!config) {
            throw new ApiError(`Không tìm thấy cấu hình với key '${key}'`, 404);
        }
        return config;
    }

    // 4. Thêm cấu hình mới
    static async createSystemConfig(data: CreateSystemConfigInput) {
        const existingConfig = await models.SystemConfig.findOne({
            where: { key: data.key }
        });
        if (existingConfig) {
            throw new ApiError(`Cấu hình với key '${data.key}' đã tồn tại!`, 400);
        }

        return await models.SystemConfig.create({
            key: data.key,
            value: data.value,
            description: data.description || null,
            data_type: data.data_type
        });
    }

    // 5. Cập nhật cấu hình bằng ID
    static async updateSystemConfig(id: number, data: UpdateSystemConfigInput) {
        const config = await models.SystemConfig.findByPk(id);
        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình này!', 404);
        }

        await config.update({
            value: data.value,
            description: data.description !== undefined ? data.description : config.description
        });
        return config;
    }

    // 6. Xóa cấu hình
    static async deleteSystemConfig(id: number) {
        const config = await models.SystemConfig.findByPk(id);
        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình này!', 404);
        }
        await config.destroy();
        return { message: 'Đã xóa (mềm) cấu hình thành công' };
    }

    // 7. Khôi phục cấu hình từ thùng rác
    static async restoreSystemConfig(id: number) {
        const config = await models.SystemConfig.findOne({
            where: { id },
            paranoid: false
        });

        if (!config) {
            throw new ApiError('Không tìm thấy cấu hình trong thùng rác', 404);
        }

        await config.restore();
        return { message: 'Khôi phục cấu hình thành công' };
    }
}
