import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import { sendTemporaryPasswordEmail } from '../utils/email.js';
import { TokenUtil } from '../utils/token.util.js';
import dayjs from 'dayjs';

export class AuthService {
    static async register(data: any) {
        const { name, email, password, phone } = data;

        const existingUser = await models.User.findOne({ where: { email } });
        if (existingUser) {
            throw new ApiError('Email này đã được đăng ký', 409); // 409 Conflict
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await models.User.create({
            full_name: name,
            email,
            phone,
            password_hash: hashedPassword,
            role: 'customer' 
        });

        const token = TokenUtil.generateAccessToken(newUser.id, newUser.role);
        const { password_hash, ...userWithoutPassword } = newUser.toJSON();

        return { user: userWithoutPassword, token };
    }

    static async login(data: any, allowedRoles: string[]) {
        const { email, password } = data;

        const user = await models.User.findOne({ 
            where: { email },
            include: [
                {
                    model: models.StaffProfile,
                    as: 'staff_profile',
                    required: false 
                }
            ]
         });
        if (!user) {
            throw new ApiError('Email hoặc mật khẩu không đúng', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new ApiError('Email hoặc mật khẩu không đúng', 401);
        }

        if (!user.is_active) {
            throw new ApiError('Tài khoản của bạn đã bị khóa', 403);
        }

        if (!allowedRoles.includes(user.role)) {
            throw new ApiError('Tài khoản không có quyền truy cập hệ thống này', 403);
        }

        const accessToken = TokenUtil.generateAccessToken(user.id, user.role);
        const plainRefreshToken = TokenUtil.generateRefreshToken();
        const tokenHash = TokenUtil.hashToken(plainRefreshToken);

        await models.RefreshToken.create({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: dayjs().add(7, 'day').toDate(),
            revoked: false
        });

        const { password_hash, ...userWithoutPassword } = user.toJSON();

        return { user: userWithoutPassword, accessToken, refreshToken: plainRefreshToken };
    }

    static async refreshAccessToken(clientRefreshToken: string) {
        if (!clientRefreshToken) {
            throw new ApiError('Vui lòng đăng nhập', 401);
        }

        const tokenHash = TokenUtil.hashToken(clientRefreshToken);

        const tokenRecord = await models.RefreshToken.findOne({
            where: { token_hash: tokenHash }
        });

        if (!tokenRecord) {
            throw new ApiError('Refresh Token không hợp lệ', 401);
        }
        if (tokenRecord.revoked) {
            throw new ApiError('Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại!', 401);
        }
        if (dayjs().isAfter(dayjs(tokenRecord.expires_at))) {
            throw new ApiError('Phiên đăng nhập đã hết hạn', 401);
        }

        const user = await models.User.findByPk(tokenRecord.user_id);
        if (!user || !user.is_active) {
            throw new ApiError('Tài khoản không tồn tại hoặc bị khóa', 401);
        }

        const newAccessToken = TokenUtil.generateAccessToken(user.id, user.role);
        const newPlainRefreshToken = TokenUtil.generateRefreshToken();
        const newTokenHash = TokenUtil.hashToken(newPlainRefreshToken);

        // Rotation: delete the old one
        await tokenRecord.destroy(); 

        await models.RefreshToken.create({
            user_id: user.id,
            token_hash: newTokenHash,
            expires_at: dayjs().add(7, 'day').toDate(),
            revoked: false
        });

        return { newAccessToken, newRefreshToken: newPlainRefreshToken };
    }

    static async logout(clientRefreshToken: string) {
        if (!clientRefreshToken) return;
        const tokenHash = TokenUtil.hashToken(clientRefreshToken);
        await models.RefreshToken.destroy({ where: { token_hash: tokenHash } });
    }

    static async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await models.User.findOne({ where: { email } });
        if (!user) {
            throw new ApiError('Email không tồn tại trên hệ thống', 404);
        }

        // Sinh mật khẩu tạm thời ngẫu nhiên gồm 8 ký tự
        const tempPassword = Math.random().toString(36).slice(-8);

        // Mã hóa mật khẩu tạm thời
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Lưu mật khẩu tạm thời mới vào cơ sở dữ liệu
        user.password_hash = hashedPassword;
        await user.save();

        // Gửi email cho khách hàng
        try {
            await sendTemporaryPasswordEmail(email, tempPassword);
        } catch (error) {
            console.error('Lỗi gửi email khôi phục mật khẩu:', error);
            throw new ApiError('Có lỗi xảy ra khi gửi email khôi phục mật khẩu. Vui lòng thử lại sau.', 500);
        }

        return { message: 'Mật khẩu tạm thời mới đã được gửi vào email của bạn.' };
    }

    static async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{ message: string }> {
        const user = await models.User.findByPk(userId);
        if (!user) {
            throw new ApiError('Không tìm thấy thông tin tài khoản người dùng', 404);
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            throw new ApiError('Mật khẩu cũ không chính xác', 400);
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu mới
        user.password_hash = hashedPassword;
        await user.save();

        return { message: 'Đổi mật khẩu thành công.' };
    }
}