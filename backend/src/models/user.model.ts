import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

// 1. Khai báo Interface mô tả các cột trong Database
export interface UserAttributes {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  password_hash: string;
  avatar_url: string | null;
  role: 'admin' | 'staff' | 'customer';
  loyalty_points: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

// 2. Định nghĩa các trường có thể bỏ trống khi Create (VD: id tự tăng)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'is_active' | 'loyalty_points'> {}

// 3. Khởi tạo Class Model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare full_name: string | null;
  declare email: string;
  declare phone: string | null;
  declare password_hash: string;
  declare avatar_url: string | null;
  declare role: 'admin' | 'staff' | 'customer';
  declare loyalty_points: number;
  declare is_active: boolean;

  // Timestamps
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

// 4. Ánh xạ vào Database
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'staff', 'customer'),
      defaultValue: 'customer',
    },
    loyalty_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },

  {
    sequelize,
    tableName: 'users',
    timestamps: true, // Tự động quản lý created_at, updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Kích hoạt Soft Delete mà thầy trò mình đã chốt (thêm cột deleted_at)
    deletedAt: 'deleted_at',
  }
);

export default User;