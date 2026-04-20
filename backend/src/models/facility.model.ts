import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface FacilityAttributes {
    id: number;
    name: string;
    address: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface FacilityCreationAttributes extends Optional<FacilityAttributes, 'id' | 'is_active'> {}

class Facility extends Model<FacilityAttributes, FacilityCreationAttributes> implements FacilityAttributes {
    declare id: number;
    declare name: string;
    declare address: string;
    declare is_active: boolean;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

Facility.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'facilities',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true,
        deletedAt: 'deleted_at',
    }
);

export default Facility;