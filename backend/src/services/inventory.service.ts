import { Op } from 'sequelize';
import models from '../models/index.js';
import sequelize from '../config/database.js';
import ApiError from '../utils/ErrorClass.js';

export class InventoryService {
    /**
     * Cập nhật tồn kho (Dùng cho cả Nhập kho thủ công và Điều chỉnh)
     */
    static async adjustInventory(data: {
        variant_id: number;
        facility_id: number;
        qty_delta: number;
        reason: 'sale' | 'return' | 'adjustment' | 'import';
        note?: string;
        ref_order_id?: number;
    },
        options: { transaction?: any } = {}
    ) {
        const transaction = await sequelize.transaction();

        try {
            // 1. Cập nhật hoặc Tạo mới bản ghi trong inventory_levels (Sử dụng Upsert logic)
            // Dựa trên UNIQUE (variant_id, facility_id) [cite: 1375, 1382]
            const [inventory, created] = await (models.InventoryLevel as any).findOrCreate({
                where: { 
                    variant_id: data.variant_id, 
                    facility_id: data.facility_id 
                },
                defaults: {
                    variant_id: data.variant_id,
                    facility_id: data.facility_id,
                    quantity_on_hand: 0
                },
                transaction
            });

            // Tính toán số lượng mới
            const newQuantity = inventory.quantity_on_hand + data.qty_delta;
            if (newQuantity < 0) {
                throw new ApiError('Số lượng tồn kho không đủ để thực hiện thao tác này', 400);
            }

            // Cập nhật số dư mới
            await inventory.update({ quantity_on_hand: newQuantity }, { transaction });

            // 2. Ghi nhật ký vào inventory_movements [cite: 1374]
            await (models.InventoryMovement as any).create({
                variant_id: data.variant_id,
                facility_id: data.facility_id,
                qty_delta: data.qty_delta,
                reason: data.reason,
                ref_order_id: data.ref_order_id || null,
                note: data.note || '',
                created_at: new Date()
            }, { transaction });

            await transaction.commit();
            return inventory;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Lấy danh sách tồn kho theo cơ sở
     */
    static async getLevelsByFacility(facilityId: number) {
        return await (models.InventoryLevel as any).findAll({
            where: { facility_id: facilityId },
            include: [{ model: models.ProductVariant, as: 'variant' }]
        });
    }

    static async transferStock(data: {
        variant_id: number;
        from_facility_id: number;
        to_facility_id: number;
        quantity: number;
        note?: string;
    }) {
        if (data.from_facility_id === data.to_facility_id) {
            throw new ApiError('Cơ sở gửi và nhận phải khác nhau', 400);
        }

        const transaction = await sequelize.transaction();
        try {
            // Xuất kho từ cơ sở A
            await this.adjustInventory({
                variant_id: data.variant_id,
                facility_id: data.from_facility_id,
                qty_delta: -data.quantity,
                reason: 'adjustment',
                note: `Chuyển sang cơ sở ${data.to_facility_id}. ${data.note || ''}`
            }, { transaction });

            // Nhập kho vào cơ sở B
            await this.adjustInventory({
                variant_id: data.variant_id,
                facility_id: data.to_facility_id,
                qty_delta: data.quantity,
                reason: 'import',
                note: `Nhận từ cơ sở ${data.from_facility_id}. ${data.note || ''}`
            }, { transaction });

            await transaction.commit();
            return { message: "Chuyển kho hoàn tất" };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * 2. Lấy lịch sử biến động (Logs)
     */
    static async getMovements(filters: any) {
        const { variant_id, facility_id, reason, limit = 20, offset = 0 } = filters;
        const where: any = {};
        if (variant_id) where.variant_id = variant_id;
        if (facility_id) where.facility_id = facility_id;
        if (reason) where.reason = reason;

        return await (models.InventoryMovement as any).findAndCountAll({
            where,
            limit: Number(limit),
            offset: Number(offset),
            order: [['created_at', 'DESC']],
            include: [{ model: models.ProductVariant, as: 'variant' }]
        });
    }

    /**
     * 3. Cảnh báo tồn kho thấp
     */
    static async getLowStock(threshold: number = 5) {
        return await (models.InventoryLevel as any).findAll({
            where: {
                quantity_on_hand: { [Op.lt]: threshold }
            },
            include: [{ model: models.ProductVariant, as: 'variant' }]
        });
    }

    /**
     * 4. Kiểm kê (Đồng bộ số lượng thực tế)
     */
    static async syncStock(data: {
        variant_id: number;
        facility_id: number;
        actual_quantity: number;
        note?: string;
    }) {
        const currentLevel = await (models.InventoryLevel as any).findOne({
            where: { variant_id: data.variant_id, facility_id: data.facility_id }
        });

        const currentQty = currentLevel ? currentLevel.quantity_on_hand : 0;
        const diff = data.actual_quantity - currentQty;

        if (diff === 0) return { message: "Số lượng khớp, không cần điều chỉnh" };

        return await this.adjustInventory({
            variant_id: data.variant_id,
            facility_id: data.facility_id,
            qty_delta: diff,
            reason: 'adjustment',
            note: `Kiểm kê thực tế: ${data.note || ''}`
        });
    }
}