import type { Request, Response, NextFunction } from 'express';
import AppResponse from '../utils/AppResponse.js';

export const requireRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
            return AppResponse.error(res, 'Bạn không có quyền truy cập chức năng này', 403);
        }
        next();
    };
};