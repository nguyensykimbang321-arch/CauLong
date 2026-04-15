import { Model, DataTypes, type Optional,  } from 'sequelize';
import sequelize from '../config/database.js';

export interface CourtAttributes {
    id: number;
    facility_id: number;
    name: string;
    court_type: 'badminton' | 'tennis' | 'football'; // Tạm thời dùng ENUM cho nhanh MVP
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface CourtCreationAttributes extends Optional<CourtAttributes, 'id' | 'is_active'> {}

class Court extends Model<CourtAttributes, CourtCreationAttributes> implements CourtAttributes {
    declare id: number;
    declare facility_id: number;
    declare name: string;
    declare court_type: 'badminton' | 'tennis' | 'football';
    declare is_active: boolean;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

Court.init(
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
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        court_type: {
            type: DataTypes.ENUM('badminton', 'tennis', 'football'),
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'courts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true,
        deletedAt: 'deleted_at',
    }
);

export default Court;