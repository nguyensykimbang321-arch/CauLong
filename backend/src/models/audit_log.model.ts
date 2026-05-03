import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface AuditLogAttributes {
  id: number;
  actor_user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  payload: any | null;
  ip_address: string | null;
  created_at?: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'actor_user_id' | 'payload' | 'ip_address'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: number;
  declare actor_user_id: number | null;
  declare action: string;
  declare entity_type: string;
  declare entity_id: number;
  declare payload: any | null;
  declare ip_address: string | null;
  declare readonly created_at: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.INTEGER, allowNull: false },
    payload: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default AuditLog;
