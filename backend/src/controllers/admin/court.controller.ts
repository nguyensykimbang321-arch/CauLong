import type {Request, Response, NextFunction } from "express";
import { CourtService } from "../../services/court.service.js";
import AppResponse from "../../utils/AppResponse.js";
import type { CreateCourtInput, UpdateCourtInput } from "../../validations/court.validation.js";

export class CourtController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await CourtService.getAllCourts();

            return AppResponse.success(res, result, "Lấy danh sách sân thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;

            const result = await CourtService.getCourtById(Number(id));

            return AppResponse.success(res, result, "Lấy chi tiết sân thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as CreateCourtInput;

            const result = await CourtService.createCourt(body);

            return AppResponse.success(res, result, "Tạo sân mới thành công", 201);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;
            const body = req.body as UpdateCourtInput;

            const result = await CourtService.updateCourt(Number(id), body);

            return AppResponse.success(res, result, "Cập nhật sân thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;

            const result = await CourtService.deleteCourt(Number(id));

            return AppResponse.success(res, result, "Xóa sân thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}