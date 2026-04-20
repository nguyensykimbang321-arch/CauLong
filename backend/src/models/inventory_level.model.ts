import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface InventoryLevelAttributes {
    id: number;
    variant_id: number;
    facility_id: number; // Trong MVP này, mỗi cơ sở coi như 1 kho để giảm độ phức tạp
    quantity_on_hand: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface InventoryLevelCreationAttributes extends Optional<InventoryLevelAttributes, 'id' | 'quantity_on_hand'> {}

class InventoryLevel extends Model<InventoryLevelAttributes, InventoryLevelCreationAttributes> implements InventoryLevelAttributes {
    declare id: number;
    declare variant_id: number;
    declare facility_id: number;
    declare quantity_on_hand: number;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

InventoryLevel.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity_on_hand: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    sequelize,
    tableName: 'inventory_levels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        // Đảm bảo không bao giờ có 2 dòng tồn kho của cùng 1 sản phẩm tại cùng 1 cơ sở
        { unique: true, fields: ['variant_id', 'facility_id'] }
    ]
});

export default InventoryLevel;