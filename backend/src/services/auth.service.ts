import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';
import jwt, { type SignOptions } from 'jsonwebtoken';


export class AuthService {
    static async register(data: any) {
        const { email, password, phone } = data;

        const existingUser = await models.User.findOne({ where: { email } });
        if (existingUser) {
            throw new ApiError('Email này đã được đăng ký', 409); // 409 Conflict
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await models.User.create({
            email,
            phone,
            password_hash: hashedPassword,
            role: 'customer' 
        });

        const { password_hash, ...userWithoutPassword } = newUser.toJSON();
        return userWithoutPassword;
    }

    static async login(data: any, allowedRoles: string[]) {
        const { email, password } = data;

        const user = await models.User.findOne({ where: { email } });
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

        const payload = { id: user.id, role: user.role };
        const secret = process.env.JWT_SECRET;
        const expiresInEnv = process.env.JWT_EXPIRES_IN;

        if (!secret || !expiresInEnv) {
            throw new ApiError('Lỗi cấu hình hệ thống: Thiếu JWT_SECRET hoặc JWT_EXPIRES_IN', 500);
        }

        const signOptions: SignOptions = {
            expiresIn: expiresInEnv as NonNullable<SignOptions['expiresIn']>
        }; 

        const token = jwt.sign(payload, secret, signOptions);

        const { password_hash, ...userWithoutPassword } = user.toJSON();

        return { user: userWithoutPassword, token };
    }
}