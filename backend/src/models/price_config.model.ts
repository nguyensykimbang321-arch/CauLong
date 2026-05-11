import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface PriceConfigAttributes {
    id: number;
    facility_id: number;
    court_type: 'badminton' | 'tennis' | 'football' | 'table_tennis';
    start_time: string; 
    end_time: string;  
    price_per_hour: number;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface PriceConfigCreationAttributes extends Optional<PriceConfigAttributes, 'id'> {}

class PriceConfig extends Model<PriceConfigAttributes, PriceConfigCreationAttributes> implements PriceConfigAttributes {
    declare id: number;
    declare facility_id: number;
    declare court_type: 'badminton' | 'tennis' | 'football' | 'table_tennis';
    declare start_time: string;
    declare end_time: string;
    declare price_per_hour: number;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

PriceConfig.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    court_type: { type: DataTypes.STRING, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    price_per_hour: { type: DataTypes.INTEGER, allowNull: false },
}, {
    sequelize,
    tableName: 'price_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

export default PriceConfig;