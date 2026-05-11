import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface WarehouseAttributes {
    id: number;
    facility_id: number;
    name: string;
    created_at?: Date;
    updated_at?: Date; // Bổ sung
    deleted_at?: Date; // Bổ sung
}

export interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id'> {}

class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
    declare id: number;
    declare facility_id: number;
    declare name: string;

    declare readonly created_at: Date;
    declare readonly updated_at: Date; // Bổ sung
    declare readonly deleted_at: Date; // Bổ sung
}

Warehouse.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        facility_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'warehouses',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at', // Đổi thành true/string thay vì false
        paranoid: true,          // BẬT KHIÊN XÓA MỀM
        deletedAt: 'deleted_at', // Tên cột trong DB
    }
);

export default Warehouse;