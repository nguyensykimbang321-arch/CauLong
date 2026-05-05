import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryMovement extends Model {}

InventoryMovement.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    qty_delta: { type: DataTypes.INTEGER, allowNull: false }, // Số lượng tăng (+) hoặc giảm (-)
    reason: { type: DataTypes.ENUM('sale', 'return', 'adjustment', 'import'), allowNull: false },
    ref_order_id: { type: DataTypes.INTEGER, allowNull: true },
    note: { type: DataTypes.STRING, allowNull: true }
}, { 
    sequelize, 
    modelName: 'InventoryMovement', 
    tableName: 'inventory_movements', 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default InventoryMovement;