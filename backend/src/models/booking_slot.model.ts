import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface BookingSlotAttributes {
    id: number;
    booking_id: number;
    court_id: number;
    start_at: Date;
    end_at: Date;
    price_cents: number; // Lưu giá snapshot tại thời điểm đặt
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingSlotCreationAttributes extends Optional<BookingSlotAttributes, 'id'> {}

class BookingSlot extends Model<BookingSlotAttributes, BookingSlotCreationAttributes> implements BookingSlotAttributes {
    declare id: number;
    declare booking_id: number;
    declare court_id: number;
    declare start_at: Date;
    declare end_at: Date;
    declare price_cents: number;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BookingSlot.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    court_id: { type: DataTypes.INTEGER, allowNull: false },
    start_at: { type: DataTypes.DATE, allowNull: false },
    end_at: { type: DataTypes.DATE, allowNull: false },
    price_cents: { type: DataTypes.INTEGER, allowNull: false },
}, {
    sequelize,
    tableName: 'booking_slots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Không cần paranoid cho bảng trung gian chi tiết này
});

export default BookingSlot;