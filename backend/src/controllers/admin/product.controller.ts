import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../../services/product.service.js";
import AppResponse from "../../utils/AppResponse.js";

export class AdminProductController{
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.getAllProducts();
            return AppResponse.success(res, result, 'Lấy danh sách sản phẩm thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await ProductService.getProductDetail(id);
            if (!result) {
                return AppResponse.error(res, 'Sản phẩm không tồn tại');
            }
            return AppResponse.success(res, result, 'Lấy thông tin sản phẩm thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.createProduct(req.body);
            return AppResponse.success(res, result, 'Tạo sản phẩm thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await ProductService.updateProduct(id, req.body);
            return AppResponse.success(res, result, 'Cập nhật sản phẩm thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async toggleDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            
            // 1. Hứng kết quả từ Service (Trong này đã có sẵn thông báo động)
            const result = await ProductService.toggleProductDeletion(id);
            
            // 2. Truyền result.message thay vì fix cứng chữ "Xóa..."
            // Đồng thời trả luôn result ra làm data để Frontend cập nhật UI
            return AppResponse.success(res, result, result.message, 200);
        } catch (error) {
            next(error);
        }
    }

    static async getVariants(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id); // Lấy ID từ URL (VD: /products/1/variants -> id = 1)
            
            const variants = await ProductService.getVariantsByProductId(id);
            
            return AppResponse.success(res, variants, 'Lấy danh sách biến thể thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async addVariants(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const { variants } = req.body; // Lấy mảng variants từ Postman
            
            const result = await ProductService.addVariantsToProduct(id, variants);
            
            return AppResponse.success(res, result, 'Thêm biến thể thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    static async updateVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const variantId = Number(req.params.variantId); // Lấy variantId từ URL
            
            // Truyền thẳng req.body xuống Service giống hệt cách làm với Product cha
            const result = await ProductService.updateVariant(variantId, req.body);
            
            return AppResponse.success(res, result, 'Cập nhật biến thể thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async toggleDeleteVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const variantId = Number(req.params.variantId);
            
            // Hứng cục result chứa message động từ Service
            const result = await ProductService.toggleVariantDeletion(variantId);
            
            return AppResponse.success(res, result, result.message, 200);
        } catch (error) {
            next(error);
        }
    }

    static async searchProduct(req: Request, res: Response, next: NextFunction) {
        const result = await ProductService.searchProduct(req.query);

        return res.status(200).json({
            success: true,
            total: result.count,
            page: Number(req.query.page || 1),
            data: result.rows
        });
    }
}