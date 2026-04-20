import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface OrderItemAttributes {
    id: number;
    order_id: number;
    variant_id: number;
    qty: number;
    unit_price_cents: number; // Lưu giá bán tại thời điểm mua (Tránh lỗi tăng/giảm giá sau này)
    created_at?: Date;
    updated_at?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
    declare id: number;
    declare order_id: number;
    declare variant_id: number;
    declare qty: number;
    declare unit_price_cents: number;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

OrderItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    variant_id: { type: DataTypes.INTEGER, allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false },
    unit_price_cents: { type: DataTypes.INTEGER, allowNull: false },
}, {
    sequelize,
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default OrderItem;