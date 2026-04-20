import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

// 1. Khai báo Interface mô tả các cột trong Database
export interface UserAttributes {
  id: number;
  email: string;
  phone: string | null;
  password_hash: string;
  role: 'admin' | 'manager' | 'receptionist' | 'customer';
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

// 2. Định nghĩa các trường có thể bỏ trống khi Create (VD: id tự tăng)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'is_active'> {}

// 3. Khởi tạo Class Model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare phone: string | null;
  declare password_hash: string;
  declare role: 'admin' | 'manager' | 'receptionist' | 'customer';
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
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'receptionist', 'customer'),
      defaultValue: 'customer',
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