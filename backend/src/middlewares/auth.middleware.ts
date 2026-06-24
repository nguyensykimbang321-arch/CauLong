import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import AppResponse from '../utils/AppResponse.js';

interface CustomJwtPayload extends JwtPayload {
    id: number;
    role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Format: Bearer <token>

    if (!token) {
        console.error(`[Auth] No token provided for ${req.method} ${req.url}`);
        return AppResponse.error(res, 'Vui lòng đăng nhập', 401);
    }

    try {
        const secret = process.env.JWT_SECRET as string;
        const decoded = jwt.verify(token, secret) as CustomJwtPayload;
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    } catch (error: any) {
        console.error(`[Auth] Token verification failed for ${req.method} ${req.url}:`, error.message);
        return AppResponse.error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    }
};

export const optionalToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
    } catch (error) {
        // Bỏ qua lỗi token nếu là optional
    }
    next();
};