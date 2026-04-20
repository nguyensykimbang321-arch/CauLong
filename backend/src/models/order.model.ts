import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface OrderAttributes {
    id: number;
    user_id: number | null; // Khách vãng lai (walk-in) có thể không có tài khoản
    facility_id: number;    // Bán tại cơ sở nào
    status: 'pending' | 'completed' | 'cancelled';
    payment_method: 'cash' | 'transfer' | 'card';
    total_cents: number;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'user_id' | 'total_cents'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
    declare id: number;
    declare user_id: number | null;
    declare facility_id: number;
    declare status: 'pending' | 'completed' | 'cancelled';
    declare payment_method: 'cash' | 'transfer' | 'card';
    declare total_cents: number;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

Order.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' },
    payment_method: { type: DataTypes.ENUM('cash', 'transfer', 'card'), allowNull: false },
    total_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

export default Order;