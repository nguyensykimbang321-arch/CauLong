import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface PriceRuleAttributes {
  id: number;
  court_id: number | null;
  day_of_week: number | null; // 0-6, NULL = every day
  start_hour: number;
  end_hour: number;
  price_cents: number;
  active: boolean;
  created_at?: Date;
}

export interface PriceRuleCreationAttributes extends Optional<PriceRuleAttributes, 'id' | 'court_id' | 'day_of_week' | 'active'> {}

class PriceRule extends Model<PriceRuleAttributes, PriceRuleCreationAttributes> implements PriceRuleAttributes {
  declare id: number;
  declare court_id: number | null;
  declare day_of_week: number | null;
  declare start_hour: number;
  declare end_hour: number;
  declare price_cents: number;
  declare active: boolean;

  declare readonly created_at: Date;
}

PriceRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    court_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_hour: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    end_hour: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'price_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default PriceRule;
