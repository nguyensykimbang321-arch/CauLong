import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface PaymentAttributes {
  id: number;
  provider: 'manual_transfer' | 'sandbox' | 'momo' | 'vnpay';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  amount_cents: number;
  booking_id: number | null;
  order_id: number | null;
  provider_ref: string | null;
  metadata: any | null;
  paid_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status' | 'booking_id' | 'order_id' | 'provider_ref' | 'metadata' | 'paid_at'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: number;
  declare provider: 'manual_transfer' | 'sandbox' | 'momo' | 'vnpay';
  declare status: 'pending' | 'paid' | 'failed' | 'refunded';
  declare amount_cents: number;
  declare booking_id: number | null;
  declare order_id: number | null;
  declare provider_ref: string | null;
  declare metadata: any | null;
  declare paid_at: Date | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    provider: {
      type: DataTypes.ENUM('manual_transfer', 'sandbox', 'momo', 'vnpay'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    amount_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    provider_ref: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Payment;
