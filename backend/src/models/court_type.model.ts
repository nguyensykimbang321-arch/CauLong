import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface CourtTypeAttributes {
    id: number;
    name: 'badminton' | 'tennis' | 'football' | 'table_tennis';
    surface: string | null;
    is_indoor: boolean;
    description: string | null;
    image: string | null;
    created_at?: Date;
}

export interface CourtTypeCreationAttributes extends Optional<CourtTypeAttributes, 'id' | 'is_indoor' | 'surface' | 'description' | 'image'> {}

class CourtType extends Model<CourtTypeAttributes, CourtTypeCreationAttributes> implements CourtTypeAttributes {
    declare id: number;
    declare name: 'badminton' | 'tennis' | 'football' | 'table_tennis';
    declare surface: string | null;
    declare is_indoor: boolean;
    declare description: string | null;
    declare image: string | null;

    declare readonly created_at: Date;
}

CourtType.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.ENUM('badminton', 'tennis', 'football', 'table_tennis'),
            allowNull: false,
        },
        surface: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        is_indoor: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'court_types',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    }
);

export default CourtType;
