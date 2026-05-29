import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

// 1. Định nghĩa các cột (Sử dụng TypeScript Interface)
export interface AuditLogAttributes {
  id: number;
  actor_user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  payload: any | null; // Cột JSON có thể linh hoạt kiểu dữ liệu
  ip_address: string | null;
  created_at?: Date;
  updated_at?: Date;
}

// 2. Các cột có thể bỏ trống khi tạo mới
export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'actor_user_id' | 'entity_id' | 'payload' | 'ip_address'> {}

// 3. Khai báo Class Model
class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: number;
  declare actor_user_id: number | null;
  declare action: string;
  declare entity_type: string;
  declare entity_id: number | null;
  declare payload: any | null;
  declare ip_address: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

// 4. Khởi tạo với Sequelize
AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.STRING, allowNull: false },
    entity_id: { type: DataTypes.INTEGER, allowNull: true },
    payload: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING, allowNull: true }
  }, 
  { 
    sequelize, 
    tableName: 'audit_logs', 
    timestamps: true,
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
);

export default AuditLog;