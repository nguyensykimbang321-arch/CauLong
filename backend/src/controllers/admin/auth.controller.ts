import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service.js';
import AppResponse from '../../utils/AppResponse.js';

export class AdminAuthController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body, ['admin', 'manager', 'receptionist']);
            return AppResponse.success(res, result, 'Đăng nhập trang quản trị thành công', 200);
        } catch (error) {
            next(error);
        }
    }
}