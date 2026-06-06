import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface OrderAttributes {
  id: number;
  user_id: number | null;
  facility_id: number;
  status: 'pending_payment' | 'pending_pickup' | 'completed' | 'cancelled' | 'refunded' | 'expired';
  total_cents: number;
  note: string | null;
  pickup_type: 'immediate' | 'pickup_store';
  pickup_time: Date | null;
  reservation_expires_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'user_id' | 'total_cents' | 'note' | 'pickup_type' | 'pickup_time' | 'reservation_expires_at'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: number;
  declare user_id: number | null;
  declare facility_id: number;
  declare status: 'pending_payment' | 'pending_pickup' | 'completed' | 'cancelled' | 'refunded' | 'expired';
  declare total_cents: number;
  declare note: string | null;
  declare pickup_type: 'immediate' | 'pickup_store';
  declare pickup_time: Date | null;
  declare reservation_expires_at: Date | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

Order.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  facility_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending_payment', 'pending_pickup', 'completed', 'cancelled', 'refunded', 'expired'),
    defaultValue: 'pending_payment',
  },

  total_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
  note: { type: DataTypes.TEXT, allowNull: true },
  pickup_type: {
    type: DataTypes.ENUM('immediate', 'pickup_store'),
    defaultValue: 'immediate',
    allowNull: false,
  },
  pickup_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reservation_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
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