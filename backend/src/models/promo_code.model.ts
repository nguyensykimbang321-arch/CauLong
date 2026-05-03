import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface PromoCodeAttributes {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_cents: number;
  max_uses: number | null;
  used_count: number;
  expires_at: Date | null;
  active: boolean;
  created_at?: Date;
}

export interface PromoCodeCreationAttributes extends Optional<PromoCodeAttributes, 'id' | 'used_count' | 'active' | 'max_uses' | 'expires_at'> {}

class PromoCode extends Model<PromoCodeAttributes, PromoCodeCreationAttributes> implements PromoCodeAttributes {
  declare id: number;
  declare code: string;
  declare type: 'percent' | 'fixed';
  declare value: number;
  declare min_order_cents: number;
  declare max_uses: number | null;
  declare used_count: number;
  declare expires_at: Date | null;
  declare active: boolean;
  declare readonly created_at: Date;
}

PromoCode.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false },
    value: { type: DataTypes.INTEGER, allowNull: false },
    min_order_cents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    max_uses: { type: DataTypes.INTEGER, allowNull: true },
    used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'promo_codes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default PromoCode;
