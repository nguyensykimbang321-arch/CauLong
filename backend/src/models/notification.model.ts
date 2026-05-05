import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Notification extends Model {}

Notification.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    ref_type: { type: DataTypes.STRING, allowNull: true }, // VD: 'booking', 'order'
    ref_id: { type: DataTypes.INTEGER, allowNull: true }
}, { 
    sequelize, 
    modelName: 'Notification', 
    tableName: 'notifications', 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default Notification;