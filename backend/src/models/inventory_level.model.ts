import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface InventoryLevelAttributes {
  id: number;
  variant_id: number;
  facility_id: number;
  quantity_on_hand: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date; // Bổ sung
}

export interface InventoryLevelCreationAttributes extends Optional<InventoryLevelAttributes, 'id' | 'quantity_on_hand'> {}

class InventoryLevel extends Model<InventoryLevelAttributes, InventoryLevelCreationAttributes> implements InventoryLevelAttributes {
  declare id: number;
  declare variant_id: number;
  declare facility_id: number;
  declare quantity_on_hand: number;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date; // Bổ sung
}

InventoryLevel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity_on_hand: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'inventory_levels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,           // BẬT KHIÊN XÓA MỀM
    deletedAt: 'deleted_at',  // Bổ sung
    indexes: [
      { unique: true, fields: ['variant_id', 'facility_id'] },
    ],
  }
);

export default InventoryLevel;