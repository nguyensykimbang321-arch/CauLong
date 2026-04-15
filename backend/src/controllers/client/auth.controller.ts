import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service.js';
import AppResponse from '../../utils/AppResponse.js';

export class ClientAuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.register(req.body);
            return AppResponse.success(res, result, 'Đăng ký tài khoản thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body, ['customer']);
            return AppResponse.success(res, result, 'Đăng nhập ứng dụng thành công', 200);
        } catch (error) {
            next(error);
        }
    }
}