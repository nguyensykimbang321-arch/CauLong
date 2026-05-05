import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class StaffProfile extends Model {}

StaffProfile.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    facility_id: { type: DataTypes.INTEGER, allowNull: true }, // null nghĩa là quản lý toàn hệ thống
    job_title: { type: DataTypes.STRING, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { 
    sequelize, 
    modelName: 'StaffProfile', 
    tableName: 'staff_profiles', 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
});

export default StaffProfile;