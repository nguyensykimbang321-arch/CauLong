import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RefreshToken extends Model {}

RefreshToken.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token_hash: { type: DataTypes.STRING, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { 
    sequelize, 
    modelName: 'RefreshToken', 
    tableName: 'refresh_tokens', 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default RefreshToken;