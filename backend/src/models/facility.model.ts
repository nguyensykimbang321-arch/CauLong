import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface FacilityAttributes {
  id: number;
  name: string;
  address: string;
  timezone: string;
  open_time: string;
  close_time: string;
  avatar_url: string | null;
  cancel_policy: any | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface FacilityCreationAttributes extends Optional<FacilityAttributes, 'id' | 'is_active' | 'avatar_url' | 'cancel_policy' | 'timezone' | 'open_time' | 'close_time'> {}

class Facility extends Model<FacilityAttributes, FacilityCreationAttributes> implements FacilityAttributes {
  declare id: number;
  declare name: string;
  declare address: string;
  declare timezone: string;
  declare open_time: string;
  declare close_time: string;
  declare avatar_url: string | null;
  declare cancel_policy: any | null;
  declare is_active: boolean;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

Facility.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: false },
    timezone: { type: DataTypes.STRING(50), defaultValue: 'Asia/Ho_Chi_Minh' },
    open_time: { type: DataTypes.TIME, defaultValue: '06:00:00' },
    close_time: { type: DataTypes.TIME, defaultValue: '22:00:00' },
    avatar_url: { type: DataTypes.STRING(255), allowNull: true },
    cancel_policy: { type: DataTypes.JSON, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },


    {
        sequelize,
        tableName: 'facilities',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true,
        deletedAt: 'deleted_at',
    }
);

export default Facility;