import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../../services/product.service.js";
import AppResponse from "../../utils/AppResponse.js";

export class ClientProductController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.getAllProducts();
            return AppResponse.success(res, result, "Lấy danh sách sản phẩm thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}
