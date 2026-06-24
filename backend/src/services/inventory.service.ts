import { Op } from 'sequelize';
import models from '../models/index.js';
import sequelize from '../config/database.js';
import ApiError from '../utils/ErrorClass.js';
export class InventoryService {
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
        const transaction = options.transaction || await sequelize.transaction();

        const isOuterTransaction = !!options.transaction;
        try {
            console.log({
                variant_id: data.variant_id,
                facility_id: data.facility_id,
                qty_delta: data.qty_delta
            });
            const [inventory] = await models.InventoryLevel.findOrCreate({
                where: {
                    variant_id: data.variant_id,
                    facility_id: data.facility_id
                },
                defaults: {
                    variant_id: data.variant_id,
                    facility_id: data.facility_id,
                    quantity_on_hand: 0
                },
                transaction,
                lock: transaction.LOCK.UPDATE
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

            if (!isOuterTransaction) {
                await transaction.commit();
            }
            return inventory;
        } catch (error) {
            if (!isOuterTransaction) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    static async bulkAdjustInventory(
        adjustments: {
            variant_id: number;
            facility_id: number;
            qty_delta: number;
            reason: 'sale' | 'return' | 'adjustment' | 'import';
            note?: string;
            ref_order_id?: number;
        }[],
        options: { transaction?: any } = {}
    ) {
        const firstAdj = adjustments[0];
        if (!firstAdj) return [];

        const transaction = options.transaction || await sequelize.transaction();
        const isOuterTransaction = !!options.transaction;

        try {
            const facilityId = firstAdj.facility_id; // Assume all adjustments in a bulk are for the same facility (which is true for an order)
            const variantIds = adjustments.map(a => a.variant_id);

            // Fetch all required inventory levels with LOCK
            const inventories = await models.InventoryLevel.findAll({
                where: { facility_id: facilityId, variant_id: variantIds },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            const inventoryMap = new Map(inventories.map(i => [i.variant_id, i]));
            const updates = [];
            const movements = [];

            for (const adj of adjustments) {
                let inventory = inventoryMap.get(adj.variant_id);
                if (!inventory) {
                    // Create if not exists (rare in POS since we check stock first)
                    inventory = await models.InventoryLevel.create({
                        variant_id: adj.variant_id,
                        facility_id: adj.facility_id,
                        quantity_on_hand: 0
                    }, { transaction });
                }

                const newQuantity = inventory.quantity_on_hand + adj.qty_delta;
                if (newQuantity < 0) {
                    throw new ApiError('Số lượng tồn kho không đủ để thực hiện thao tác này', 400);
                }

                updates.push(inventory.update({ quantity_on_hand: newQuantity }, { transaction }));

                movements.push({
                    variant_id: adj.variant_id,
                    facility_id: adj.facility_id,
                    qty_delta: adj.qty_delta,
                    reason: adj.reason,
                    ref_order_id: adj.ref_order_id || null,
                    note: adj.note || '',
                    created_at: new Date()
                });
            }

            // Execute all updates concurrently
            await Promise.all(updates);

            // Bulk create movements
            await (models.InventoryMovement as any).bulkCreate(movements, { transaction });

            if (!isOuterTransaction) {
                await transaction.commit();
            }
            return inventories;
        } catch (error) {
            if (!isOuterTransaction) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    static async getLevelsByFacility(facilityId: number) {
        return await (models.InventoryLevel as any).findAll({
            where: {
                facility_id: facilityId
            },

            include: [
            {
                model: models.ProductVariant,
                as: "variant",

                include: [
                {
                    model: models.Product,
                    as: "product"
                }
                ]
            }
            ]
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
            include: [
            {
                model: models.ProductVariant,
                as: 'variant',
                include: [
                {
                    model: models.Product,
                    as: 'product'
                }
                ]
            }
]
        });
    }

    /**
     * 3. Cảnh báo tồn kho thấp
     */
    static async getLowStock(threshold: number = 5) {
        return await models.InventoryLevel.findAll({
            where: {
                quantity_on_hand: {
                    [Op.lt]: threshold
                }
            },
            order: [
                ['quantity_on_hand', 'ASC']
            ],
            include: [
                {
                    model: models.ProductVariant,
                    as: 'variant'
                }
            ]
        });
    }

    /**
     * 4. Kiểm kê (Đồng bộ số lượng thực tế)
     */
    static async checkStock(
        variant_id: number,
        facility_id: number,
        quantity: number
    ) {
        const inventory =
            await models.InventoryLevel.findOne({
                where: {
                    variant_id,
                    facility_id
                }
            });

        return (
            inventory &&
            inventory.quantity_on_hand >= quantity
        );
    }

    /**
     * 5. Lấy tồn kho của một biến thể tại một cơ sở
     */
    static async getVariantStock(facilityId: number, variantId: number) {
        const level = await models.InventoryLevel.findOne({
            where: {
                facility_id: facilityId,
                variant_id: variantId
            }
        });

        if (!level) {
            return {
                id: null,
                facility_id: facilityId,
                variant_id: variantId,
                quantity_on_hand: 0
            };
        }

        return level;
    }
}