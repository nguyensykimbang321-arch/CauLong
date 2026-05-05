import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';


export interface InventoryMovementAttributes {
  id: number;
  variant_id: number;
  facility_id: number; // Đã đổi theo chuẩn kiến trúc mới
  qty_delta: number;
  reason: 'sale' | 'return' | 'adjustment' | 'import';
  ref_order_id: number | null;
  note: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface InventoryMovementCreationAttributes extends Optional<InventoryMovementAttributes, 'id' | 'ref_order_id' | 'note'> {}

class InventoryMovement extends Model<InventoryMovementAttributes, InventoryMovementCreationAttributes> implements InventoryMovementAttributes {
  declare id: number;
  declare variant_id: number;
  declare facility_id: number; // Đã đổi
  declare qty_delta: number;
  declare reason: 'sale' | 'return' | 'adjustment' | 'import';
  declare ref_order_id: number | null;
  declare note: string | null;
  
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

InventoryMovement.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    facility_id: { type: DataTypes.INTEGER, allowNull: false }, // Đã đổi
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
    updatedAt: 'updated_at', // Đã bật lại updated_at cho đồng bộ với các bảng khác
  }
);

export default InventoryMovement;