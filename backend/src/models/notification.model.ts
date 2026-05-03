import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface NotificationAttributes {
  id: number;
  user_id: number;
  type: 'booking_confirmed' | 'booking_reminder' | 'order_status' | 'promotion';
  title: string;
  body: string;
  is_read: boolean;
  ref_type: string | null;
  ref_id: number | null;
  created_at?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'is_read' | 'ref_type' | 'ref_id'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: number;
  declare user_id: number;
  declare type: 'booking_confirmed' | 'booking_reminder' | 'order_status' | 'promotion';
  declare title: string;
  declare body: string;
  declare is_read: boolean;
  declare ref_type: string | null;
  declare ref_id: number | null;
  declare readonly created_at: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM('booking_confirmed', 'booking_reminder', 'order_status', 'promotion'),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    ref_type: { type: DataTypes.STRING(50), allowNull: true },
    ref_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Notification;
