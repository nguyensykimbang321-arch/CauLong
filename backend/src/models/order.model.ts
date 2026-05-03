import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface OrderAttributes {
  id: number;
  user_id: number | null;
  facility_id: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  payment_method: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  note: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'user_id' | 'total_cents' | 'subtotal_cents' | 'discount_cents' | 'note'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: number;
  declare user_id: number | null;
  declare facility_id: number;
  declare status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  declare payment_method: string;
  declare subtotal_cents: number;
  declare discount_cents: number;
  declare total_cents: number;
  declare note: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

Order.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  facility_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled', 'refunded'),
    defaultValue: 'pending',
  },
  payment_method: { type: DataTypes.STRING(50), allowNull: false },
  subtotal_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
  discount_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
  note: { type: DataTypes.TEXT, allowNull: true },
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