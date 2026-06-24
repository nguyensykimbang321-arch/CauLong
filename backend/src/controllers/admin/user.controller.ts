import type { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/user.service.js';
import AppResponse from '../../utils/AppResponse.js';
import ApiError from '../../utils/ErrorClass.js';

export class AdminUserController{
    static async searchUserByPhone(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone } = req.query;
            if (!phone || typeof phone !== 'string' || phone.trim().length < 9) {
                throw new ApiError('Số điện thoại không hợp lệ!', 400);
            }
            const user = await UserService.getUserByPhone(phone.trim());
            if (!user) {
                throw new ApiError('Không tìm thấy khách hàng!', 404);
            }
            return AppResponse.success(res, user, 'Tìm thấy khách hàng thành công', 200);
        } catch (error) {
            next(error);
        }
    }

    static async getAll(req: Request, res: Response, next: NextFunction){
        try{
            const result = await UserService.getAllUsers();
            return AppResponse.success(res, result, 'Lấy danh sách người dùng thành công', 200);
        } catch(error){
            next(error);
        }
    }

    static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
        try{
            const id = Number(req.params.id);
            const result = await UserService.toggleUserStatus(id);
            const actionMessage = result.is_active ? 'mở khóa' : 'khóa';
            return AppResponse.success(
                res, 
                result, 
                `Đã ${actionMessage} thành công tài khoản của ${result.full_name}`, 
                200
            );
        } catch(error){
            next(error);
        }
    }

    static async createStaff(req: Request, res: Response, next: NextFunction) {
        try {
            const staffData = req.body;
            const result = await UserService.createStaff(staffData);
            return AppResponse.success(res, result, 'Tạo tài khoản nhân viên thành công', 201);
        } catch (error) {
            next(error);
        }
    }
}