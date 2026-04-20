import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface ProductAttributes {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string | null;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'is_active' | 'description'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
    declare id: number;
    declare name: string;
    declare slug: string;
    declare category: string;
    declare description: string | null;
    declare is_active: boolean;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

Product.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    category: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    sequelize,
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

export default Product;