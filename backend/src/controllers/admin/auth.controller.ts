import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service.js';
import AppResponse from '../../utils/AppResponse.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AdminAuthController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body, ['admin', 'staff']);
            
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

            return AppResponse.success(
                res, 
                {
                    user: result.user,
                    token: result.accessToken
                }, 
                'Đăng nhập trang quản trị thành công', 
                200
            );
        } catch (error) {
            next(error);
        }
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const clientRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            
            const result = await AuthService.refreshAccessToken(clientRefreshToken);

            res.cookie(REFRESH_COOKIE_NAME, result.newRefreshToken, COOKIE_OPTIONS);

            return AppResponse.success(
                res,
                { token: result.newAccessToken },
                'Cấp lại Access Token thành công',
                200
            );
        } catch (error) {
            res.clearCookie(REFRESH_COOKIE_NAME);
            next(error);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const clientRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            await AuthService.logout(clientRefreshToken);

            res.clearCookie(REFRESH_COOKIE_NAME);
            return AppResponse.success(res, null, 'Đăng xuất thành công', 200);
        } catch (error) {
            next(error);
        }
    }
}