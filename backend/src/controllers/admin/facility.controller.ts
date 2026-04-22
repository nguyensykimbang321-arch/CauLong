import type { Request, Response, NextFunction } from "express";
import { FacilityService } from "../../services/facility.service.js";
import AppResponse from "../../utils/AppResponse.js";
import type { CreateFacilityInput, updateFacilityInput } from "../../validations/facility.validation.js";

export class FacilityController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await FacilityService.getAllFacilities();

            return AppResponse.success(res, result, "Lấy danh sách cơ sở thành công", 200);
        } catch (error) {
            next(error)
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;

            const result = await FacilityService.getFacilityById(Number(id));

            return AppResponse.success(res, result, "Lấy chi tiết cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as CreateFacilityInput;
            
            const result = await FacilityService.createFacility(body);

            return AppResponse.success(res, result, "Tạo cơ sở mới thành công", 201);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as updateFacilityInput;
            const {id} = req.params;

            const result = await FacilityService.updateFacility(Number(id), body);

            return AppResponse.success(res, result, "Cập nhật cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;

            const result = await FacilityService.deleteFacility(Number(id));
            return AppResponse.success(res, result, "Xóa cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}