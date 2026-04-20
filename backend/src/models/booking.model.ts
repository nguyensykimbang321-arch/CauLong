import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface BookingAttributes {
    id: number;
    user_id: number; // Người đặt
    facility_id: number; // Đặt ở cơ sở nào
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
    total_cents: number; // Tổng tiền tính bằng cent/đồng (tránh sai số)
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'status' | 'payment_status' | 'total_cents'> {}

class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
    declare id: number;
    declare user_id: number;
    declare facility_id: number;
    declare status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    declare payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
    declare total_cents: number;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

Booking.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    facility_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'), defaultValue: 'pending' },
    payment_status: { type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'refunded'), defaultValue: 'unpaid' },
    total_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

export default Booking;