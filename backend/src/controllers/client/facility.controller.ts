import type { Request, Response, NextFunction } from "express";
import { FacilityService } from "../../services/facility.service.js";
import AppResponse from "../../utils/AppResponse.js";

export class ClientFacilityController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await FacilityService.getAllFacilities();
            return AppResponse.success(res, result, "Lấy danh sách cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            // Controller mỏng nhẹ: Chỉ gọi 1 hàm Service duy nhất
            const result = await FacilityService.getFacilityWithCourtsForClient(Number(id));

            return AppResponse.success(res, result, "Lấy chi tiết cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async getCourtTypes(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await FacilityService.getCourtTypesByFacility(Number(id));
            return AppResponse.success(res, result, "Lấy danh sách bộ môn thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}