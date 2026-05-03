import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface InventoryMovementAttributes {
  id: number;
  variant_id: number;
  warehouse_id: number;
  qty_delta: number;
  reason: 'sale' | 'return' | 'adjustment' | 'import';
  ref_order_id: number | null;
  note: string | null;
  created_at?: Date;
}

export interface InventoryMovementCreationAttributes extends Optional<InventoryMovementAttributes, 'id' | 'ref_order_id' | 'note'> {}

class InventoryMovement extends Model<InventoryMovementAttributes, InventoryMovementCreationAttributes> implements InventoryMovementAttributes {
  declare id: number;
  declare variant_id: number;
  declare warehouse_id: number;
  declare qty_delta: number;
  declare reason: 'sale' | 'return' | 'adjustment' | 'import';
  declare ref_order_id: number | null;
  declare note: string | null;
  declare readonly created_at: Date;
}

InventoryMovement.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
    qty_delta: { type: DataTypes.INTEGER, allowNull: false },
    reason: {
      type: DataTypes.ENUM('sale', 'return', 'adjustment', 'import'),
      allowNull: false,
    },
    ref_order_id: { type: DataTypes.INTEGER, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'inventory_movements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default InventoryMovement;
