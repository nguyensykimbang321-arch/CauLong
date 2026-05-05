import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AuditLog extends Model {}

AuditLog.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.STRING, allowNull: false },
    entity_id: { type: DataTypes.INTEGER, allowNull: true },
    payload: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING, allowNull: true }
}, { 
    sequelize, 
    modelName: 'AuditLog', 
    tableName: 'audit_logs', 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default AuditLog;