import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

// 1. Khai báo Interface mô tả các cột trong Database
export interface SystemConfigAttributes {
    id: number;
    key: string;
    value: string;
    description: string | null;
    data_type: 'number' | 'string' | 'boolean';
    
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

// 2. Định nghĩa các trường có thể bỏ trống khi Create (id tự tăng)
export interface SystemConfigCreationAttributes extends Optional<SystemConfigAttributes, 'id'> {}

// 3. Khởi tạo Class Model
class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes> implements SystemConfigAttributes {
    declare id: number;
    declare key: string;
    declare value: string;
    declare description: string | null;
    declare data_type: 'number' | 'string' | 'boolean';

    // Timestamps
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

// 4. Ánh xạ vào Database
SystemConfig.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true, // BẮT BUỘC: Đảm bảo không có 2 cấu hình trùng Key
        },
        value: {
            type: DataTypes.STRING(255),
            allowNull: false, // Dù là số hay boolean thì lưu vào DB vẫn là chuỗi (string)
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true, // Mô tả để Admin dễ hiểu
        },
        data_type: {
            type: DataTypes.ENUM('number', 'string', 'boolean'),
            allowNull: false,
            defaultValue: 'string', // Giúp code lúc lôi ra biết đường ép kiểu
        },
    },
    {
        sequelize,
        tableName: 'system_configs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true, // Bật khiên xóa mềm cho an toàn
        deletedAt: 'deleted_at',
    }
);

export default SystemConfig;
