import type { Request, Response, NextFunction } from 'express';
import AppResponse from '../../utils/AppResponse.js';
import { PriceConfigService } from '../../services/priceConfig.service.js';

export class AdminPriceConfigController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const facilityId = req.query.facility_id ? Number(req.query.facility_id) : undefined;
            const result = await PriceConfigService.getAllConfigs(facilityId);
            return AppResponse.success(res, result, 'Lấy danh sách cấu hình giá thành công');
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await PriceConfigService.createConfig(req.body);
            return AppResponse.success(res, result, 'Thêm cấu hình giá thành công', 201);
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await PriceConfigService.updateConfig(id, req.body);
            return AppResponse.success(res, result, 'Cập nhật cấu hình giá thành công');
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await PriceConfigService.deleteConfig(id);
            return AppResponse.success(res, result, 'Xóa cấu hình giá thành công');
        } catch (error) { next(error); }
    }
}