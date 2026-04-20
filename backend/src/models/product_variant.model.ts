import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface ProductVariantAttributes {
    id: number;
    product_id: number;
    sku: string;
    ATTRS: any; // Cột lưu trữ thuộc tính động (size, color, v.v.)
    price_cents: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface ProductVariantCreationAttributes extends Optional<ProductVariantAttributes, 'id' | 'is_active' | 'ATTRS'> {}

class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes> implements ProductVariantAttributes {
    declare id: number;
    declare product_id: number;
    declare sku: string;
    declare ATTRS: any;
    declare price_cents: number;
    declare is_active: boolean;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

ProductVariant.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    ATTRS: { type: DataTypes.JSON, allowNull: true },
    price_cents: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    sequelize,
    tableName: 'product_variants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

export default ProductVariant;