import type { Request, Response, NextFunction } from 'express';
import AppResponse from '../../utils/AppResponse.js';
import { SystemConfigService } from '../../services/systemConfig.service.js';

export class SystemConfigController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const configs = await SystemConfigService.getAllSystemConfigs();
            return AppResponse.success(res, configs, 'Lấy danh sách cấu hình thành công');
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const config = await SystemConfigService.getSystemConfigById(Number(req.params.id));
            return AppResponse.success(res, config, 'Lấy chi tiết cấu hình thành công');
        } catch (error) {
            next(error);
        }
    }

    static async getByKey(req: Request, res: Response, next: NextFunction) {
        try {
            const key = req.params.key;
            if (!key || typeof key !== 'string') {
                return AppResponse.error(res, 'Key cấu hình không hợp lệ', 400);
            }
            const config = await SystemConfigService.getSystemConfigByKey(key);
            return AppResponse.success(res, config, 'Lấy chi tiết cấu hình bằng key thành công');
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const newConfig = await SystemConfigService.createSystemConfig(req.body);
            return AppResponse.success(res, newConfig, 'Tạo cấu hình thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await SystemConfigService.updateSystemConfig(Number(req.params.id), req.body);
            return AppResponse.success(res, result, 'Cập nhật cấu hình thành công');
        } catch (error) {
            next(error);
        }
    }

    static async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await SystemConfigService.deleteSystemConfig(Number(req.params.id));
            return AppResponse.success(res, result, 'Xóa cấu hình thành công');
        } catch (error) {
            next(error);
        }
    }

    static async restore(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await SystemConfigService.restoreSystemConfig(Number(req.params.id));
            return AppResponse.success(res, result, 'Khôi phục cấu hình thành công');
        } catch (error) {
            next(error);
        }
    }
}
