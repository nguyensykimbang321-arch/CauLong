import type { Request, Response, NextFunction } from 'express';
import AppResponse from '../utils/AppResponse.js';

const errorHandlingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    
    console.error("🔥 ERROR LOG:", err);

    let message = err.message || 'Lỗi hệ thống máy chủ';
    let statusCode = err.statusCode || 500;

    if (err.name === 'JsonWebTokenError') {
        message = 'Token không hợp lệ';
        statusCode = 401;
    } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        message = err.errors.map((e: any) => e.message).join(', ');
        statusCode = 400;
    }

    return AppResponse.error(res, message, statusCode);
};

export default errorHandlingMiddleware;