import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Payment extends Model {}

Payment.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider: { type: DataTypes.ENUM('cash', 'transfer', 'momo', 'vnpay'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'paid', 'failed'), defaultValue: 'pending' },
    amount_cents: { type: DataTypes.INTEGER, allowNull: false },
    booking_id: { type: DataTypes.INTEGER, allowNull: true },
    order_id: { type: DataTypes.INTEGER, allowNull: true },
    provider_ref: { type: DataTypes.STRING, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true }
}, { 
    sequelize, 
    modelName: 'Payment', 
    tableName: 'payments', 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default Payment;