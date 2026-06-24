import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import ApiError from './ErrorClass.js';

export class TokenUtil {
    static generateAccessToken(userId: number, role: string): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new ApiError('Lỗi cấu hình hệ thống: Thiếu JWT_SECRET', 500);
        }
        const expiresIn = (process.env.JWT_EXPIRES_IN || '15m') as NonNullable<SignOptions['expiresIn']>;

        return jwt.sign(
            { id: userId, role },
            secret,
            { expiresIn }
        );
    }

    static generateRefreshToken(): string {
        return crypto.randomBytes(40).toString('hex');
    }

    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
