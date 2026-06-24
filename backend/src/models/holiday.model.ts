import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '../config/database.js';

// 1. Khai báo Interface mô tả các cột trong Database
export interface HolidayAttributes {
    id: number;
    name: string;
    holiday_date: string; // Dùng string vì DATEONLY trả về định dạng 'YYYY-MM-DD'
    surcharge_percent: number;
    
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

// 2. Định nghĩa các trường có thể bỏ trống khi Create (id tự tăng)
export interface HolidayCreationAttributes extends Optional<HolidayAttributes, 'id'> {}

// 3. Khởi tạo Class Model
class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
    declare id: number;
    declare name: string;
    declare holiday_date: string;
    declare surcharge_percent: number;

    // Timestamps
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare readonly deleted_at: Date;
}

// 4. Ánh xạ vào Database
Holiday.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        holiday_date: {
            type: DataTypes.DATEONLY, // Chỉ lưu Ngày-Tháng-Năm, không lưu Giờ-Phút-Giây
            allowNull: false,
            unique: true, // Một ngày chỉ nên cài đặt 1 mức phụ thu lễ để tránh xung đột
        },
        surcharge_percent: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'holidays',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true, // Thêm khiên xóa mềm cho đồng bộ với các bảng khác
        deletedAt: 'deleted_at',
    }
);

export default Holiday;
