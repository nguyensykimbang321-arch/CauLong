import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface StaffProfileAttributes {
  id: number;
  user_id: number;
  facility_id: number | null; // null = all facilities (HQ)
  job_title: string | null;
  active: boolean;
  created_at?: Date;
}

export interface StaffProfileCreationAttributes extends Optional<StaffProfileAttributes, 'id' | 'facility_id' | 'job_title' | 'active'> {}

class StaffProfile extends Model<StaffProfileAttributes, StaffProfileCreationAttributes> implements StaffProfileAttributes {
  declare id: number;
  declare user_id: number;
  declare facility_id: number | null;
  declare job_title: string | null;
  declare active: boolean;

  declare readonly created_at: Date;
}

StaffProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    facility_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    job_title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'staff_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default StaffProfile;
