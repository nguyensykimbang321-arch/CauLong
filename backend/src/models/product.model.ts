import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface ProductAttributes {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  thumbnail_url: string | null;
  rating: number;
  review_count: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'is_active' | 'description' | 'thumbnail_url' | 'rating' | 'review_count'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare category: string;
  declare description: string | null;
  declare thumbnail_url: string | null;
  declare rating: number;
  declare review_count: number;
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
  thumbnail_url: { type: DataTypes.STRING(255), allowNull: true },
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  review_count: { type: DataTypes.INTEGER, defaultValue: 0 },
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