import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CartItem extends Model {}

CartItem.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, { 
    sequelize, 
    modelName: 'CartItem', 
    tableName: 'cart_items',
    indexes: [{ unique: true, fields: ['user_id', 'variant_id'] }], // Ràng buộc giỏ hàng
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default CartItem;