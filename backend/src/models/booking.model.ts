import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface BookingAttributes {
  id: number;
  user_id: number | null; // Người đặt (null nếu là khách walk-in)
  facility_id: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  total_cents: number;
  note: string | null;
  promo_code_id: number | null;
  checked_in_at: Date | null;
  cancelled_at: Date | null;
  cancel_reason: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'status' | 'payment_status' | 'total_cents' | 'note' | 'promo_code_id' | 'checked_in_at' | 'cancelled_at' | 'cancel_reason'> {}

class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  declare id: number;
  declare user_id: number | null;
  declare facility_id: number;
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  declare payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  declare total_cents: number;
  declare note: string | null;
  declare promo_code_id: number | null;
  declare checked_in_at: Date | null;
  declare cancelled_at: Date | null;
  declare cancel_reason: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

Booking.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
      defaultValue: 'pending',
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'refunded'),
      defaultValue: 'unpaid',
    },
    total_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
    note: { type: DataTypes.TEXT, allowNull: true },
    promo_code_id: { type: DataTypes.INTEGER, allowNull: true },
    checked_in_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.STRING(255), allowNull: true },
  },

 {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

export default Booking;