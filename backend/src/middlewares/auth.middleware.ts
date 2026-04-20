import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import AppResponse from '../utils/AppResponse.js';

interface CustomJwtPayload extends JwtPayload {
    id: number;
    role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]; // Format: Bearer <token>
    if (!token) return AppResponse.error(res, 'Vui lòng đăng nhập', 401);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    } catch (error) {
        return AppResponse.error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    }
};