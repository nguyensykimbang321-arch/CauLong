import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PromoCode extends Model {}

PromoCode.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false },
    value: { type: DataTypes.INTEGER, allowNull: false },
    min_order_cents: { type: DataTypes.INTEGER, defaultValue: 0 },
    max_uses: { type: DataTypes.INTEGER, allowNull: true },
    used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { 
    sequelize, 
    modelName: 'PromoCode', 
    tableName: 'promo_codes', 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default PromoCode;