import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import sequelize from '../config/database.js';
import type { Transaction } from 'sequelize';

export class UserService {
    static async getUserByPhone(phone: string) {
        return await models.User.findOne({
            where: { phone, role: 'customer' },
            attributes: { exclude: ['password_hash'] }
        });
    }

    static async createGuestUser(phone: string, fullName: string, membershipType: 'standard' | 'student' | 'vip' = 'standard') {

        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        const dummyEmail = `guest_${phone}@thethaovip.local`; 

        return await models.User.create({
            email: dummyEmail,
            full_name: fullName,
            phone: phone,
            password_hash: hashedPassword,
            role: 'customer',
            membership_type: membershipType,
            loyalty_points: 0
        });
    }

    static async addPointsAndUpgrade(userId: number, amountPaid: number, transaction?: Transaction) {
        const findOptions = transaction
            ? { transaction, lock: transaction.LOCK.UPDATE }
            : {};
        const user = await models.User.findByPk(userId, findOptions);

        if (!user) return;

        const pointsEarned = Math.floor(amountPaid / 10000);
        
        if (pointsEarned > 0) {
            user.loyalty_points += pointsEarned;

            const VIP_THRESHOLD = 1000;
            
            if (user.loyalty_points >= VIP_THRESHOLD && user.membership_type !== 'vip') {
                user.membership_type = 'vip';
                console.log(`[Hệ thống] Khách hàng ${user.full_name} đã được thăng hạng VIP!`);
            }

            const saveOptions = transaction ? { transaction } : {};
            await user.save(saveOptions);
        }
    }

    static async createStaff(staffData: any) {
        const { full_name, email, phone, password, role, facility_id, job_title } = staffData;

        // 1. Kiểm tra email đã tồn tại chưa
        const existingUser = await models.User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Email này đã được sử dụng!');
        }

        // 2. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Bắt đầu Transaction để lưu vào 2 bảng cùng lúc
        const transaction = await sequelize.transaction();

        try {
            // 3.1 Tạo tài khoản trong bảng users
            const newUser = await models.User.create(
                {
                    full_name,
                    email,
                    phone,
                    password_hash,
                    role: role || 'staff', // Mặc định là staff nếu không truyền
                    is_active: true,
                },
                { transaction }
            );

            // 3.2 Tạo thông tin chi tiết trong bảng staff_profiles
            await models.StaffProfile.create(
                {
                    user_id: newUser.id,
                    facility_id: facility_id || null, 
                    job_title: job_title || 'Bán hàng',
                },
                { transaction }
            );

            // 4. Nếu mọi thứ thành công, Commit lưu vào Database
            await transaction.commit();

            // 5. Ẩn mật khẩu bằng Destructuring để sửa lỗi 2790
            // Tách password_hash ra một biến bỏ đi (_), phần còn lại gom vào userWithoutPassword
            const { password_hash: _, ...userWithoutPassword } = newUser.toJSON();
            
            return userWithoutPassword;

        } catch (error) {
            // Nếu có bất kỳ lỗi nào ở 1 trong 2 bảng, Rollback toàn bộ
            await transaction.rollback();
            throw error;
        }
    }

    static async getAllUsers() {
        return await models.User.findAll({
            // Rất quan trọng: Không được trả về password_hash [cite: 102, 291, 292]
            attributes: { exclude: ['password_hash'] },
            order: [['created_at', 'DESC']] // Sắp xếp tài khoản mới nhất lên đầu
        });
    }

    static async toggleUserStatus(userId: number) {
        // 1. Tìm user theo ID
        const user = await models.User.findByPk(userId);

        if (!user) {
            throw new ApiError('Không tìm thấy người dùng này trên hệ thống', 404);
        }

        // 2. Đảo ngược trạng thái (Nếu true thì thành false, nếu false thì thành true)
        user.is_active = !user.is_active;
        await user.save();

        // 3. Ẩn mật khẩu bằng Destructuring trước khi trả về
        const userJson = user.toJSON();
        const { password_hash: _, ...safeUser } = userJson as any;

        return safeUser;
    }
}