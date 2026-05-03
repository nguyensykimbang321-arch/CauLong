import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface WarehouseAttributes {
  id: number;
  facility_id: number;
  name: string;
  created_at?: Date;
}

export interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id'> {}

class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
  declare id: number;
  declare facility_id: number;
  declare name: string;
  declare readonly created_at: Date;
}

Warehouse.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
  },
  {
    sequelize,
    tableName: 'warehouses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Warehouse;
