import type { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../../services/inventory.service.js';
import AppResponse from '../../utils/AppResponse.js';

export class InventoryController {
    // API Nhập kho/Điều chỉnh kho
    static async adjust(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InventoryService.adjustInventory(req.body);
            return AppResponse.success(res, result, 'Cập nhật tồn kho thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    // API Xem tồn kho tại 1 chi nhánh
    static async getByFacility(req: Request, res: Response, next: NextFunction) {
        try {
            const facilityId = Number(req.params.facilityId);
            const result = await InventoryService.getLevelsByFacility(facilityId);
            return AppResponse.success(res, result, 'Lấy thông tin tồn kho thành công');
        } catch (error) {
            next(error);
        }
    }

    static async transfer(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InventoryService.transferStock(req.body);
            return AppResponse.success(res, result, 'Chuyển kho thành công');
        } catch (error) { next(error); }
    }

    // 3. Kiểm kê (Đồng bộ số lượng thực tế)
    static async sync(req: Request, res: Response, next: NextFunction) {
        try {
            const result =
    await InventoryService.checkStock(
        req.body.variant_id,
        req.body.facility_id,
        req.body.actual_quantity
    );
            return AppResponse.success(res, result, 'Đồng bộ thực tế thành công');
        } catch (error) { next(error); }
    }

    // 4. Xem lịch sử biến động
    static async getLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, ...filters } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            
            const result = await InventoryService.getMovements({ 
                ...filters, 
                limit, 
                offset 
            });
            return AppResponse.success(res, result, 'Lấy lịch sử thành công');
        } catch (error) { next(error); }
    }

    // 5. Cảnh báo hàng sắp hết
    static async getLowStock(req: Request, res: Response, next: NextFunction) {
        try {
            const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
            const result = await InventoryService.getLowStock(threshold);
            return AppResponse.success(res, result, 'Danh sách hàng tồn kho thấp');
        } catch (error) { next(error); }
    }

    // 6. Xem tồn kho chi tiết của 1 biến thể tại 1 chi nhánh
    static async getVariantStock(req: Request, res: Response, next: NextFunction) {
        try {
            const facilityId = Number(req.params.facilityId);
            const variantId = Number(req.params.variantId);
            const result = await InventoryService.getVariantStock(facilityId, variantId);
            return AppResponse.success(res, result, 'Lấy thông tin tồn kho thành công');
        } catch (error) {
            next(error);
        }
    }
}