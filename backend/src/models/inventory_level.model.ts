import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface InventoryLevelAttributes {
  id: number;
  variant_id: number;
  warehouse_id: number;
  quantity_on_hand: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface InventoryLevelCreationAttributes extends Optional<InventoryLevelAttributes, 'id' | 'quantity_on_hand'> {}

class InventoryLevel extends Model<InventoryLevelAttributes, InventoryLevelCreationAttributes> implements InventoryLevelAttributes {
  declare id: number;
  declare variant_id: number;
  declare warehouse_id: number;
  declare quantity_on_hand: number;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

InventoryLevel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity_on_hand: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'inventory_levels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      // Đảm bảo mỗi variant chỉ có 1 bản ghi tồn kho tại mỗi kho
      { unique: true, fields: ['variant_id', 'warehouse_id'] },
    ],
  }
);

export default InventoryLevel;