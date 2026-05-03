import { Model, DataTypes, type Optional,  } from 'sequelize';
import sequelize from '../config/database.js';

export interface CourtAttributes {
  id: number;
  facility_id: number;
  court_type_id: number;
  name: string;
  code: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface CourtCreationAttributes extends Optional<CourtAttributes, 'id' | 'status' | 'code'> {}

class Court extends Model<CourtAttributes, CourtCreationAttributes> implements CourtAttributes {
  declare id: number;
  declare facility_id: number;
  declare court_type_id: number;
  declare name: string;
  declare code: string | null;
  declare status: 'active' | 'maintenance' | 'inactive';

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

Court.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    facility_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    court_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {

      type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
      defaultValue: 'active',
    },
  },

    {
        sequelize,
        tableName: 'courts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true,
        deletedAt: 'deleted_at',
    }
);

export default Court;