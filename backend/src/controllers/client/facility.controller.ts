import type { Request, Response, NextFunction } from "express";
import { FacilityService } from "../../services/facility.service.js";
import AppResponse from "../../utils/AppResponse.js";
import models from "../../models/index.js";

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
            const facility = await FacilityService.getFacilityById(Number(id));
            
            // Lấy thêm danh sách sân của cơ sở này
            const courts = await models.Court.findAll({
                where: { facility_id: Number(id), is_active: true }
            });

            const result = {
                ...facility.toJSON(),
                courts
            };

            return AppResponse.success(res, result, "Lấy chi tiết cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}
