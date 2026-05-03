import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface CartItemAttributes {
  id: number;
  user_id: number;
  variant_id: number;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CartItemCreationAttributes extends Optional<CartItemAttributes, 'id'> {}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  declare id: number;
  declare user_id: number;
  declare variant_id: number;
  declare quantity: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

CartItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    sequelize,
    tableName: 'cart_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ unique: true, fields: ['user_id', 'variant_id'] }],
  }
);

export default CartItem;
