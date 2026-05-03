import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface RefreshTokenAttributes {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  created_at?: Date;
}

export interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'revoked'> {}

class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  declare id: number;
  declare user_id: number;
  declare token_hash: string;
  declare expires_at: Date;
  declare revoked: boolean;

  declare readonly created_at: Date;
}

RefreshToken.init(
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
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default RefreshToken;
