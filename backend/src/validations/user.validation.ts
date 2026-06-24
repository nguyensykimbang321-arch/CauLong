import { z } from 'zod';

// =========================================================
// 1. Schema Validation cho API POST /api/v1/users/staff
// =========================================================
export const createStaffSchema = z.object({
    body: z.object({
        full_name: z.string({ message: 'Họ tên là bắt buộc' })
            .min(2, 'Họ tên phải có ít nhất 2 ký tự')
            .max(100, 'Họ tên không được vượt quá 100 ký tự'),
            
        email: z.string({ message: 'Email là bắt buộc' })
            .email('Email không đúng định dạng'),
            
        phone: z.string()
            .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ')
            .optional(),
            
        password: z.string({ message: 'Mật khẩu là bắt buộc' })
            .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
            
        role: z.enum(['admin', 'staff', 'customer'], {
            message: 'Role chỉ có thể là admin, staff hoặc customer',
        }).optional(),
            
        facility_id: z.number({ message: 'ID Cơ sở phải là một số' })
            .positive('ID Cơ sở không hợp lệ')
            .nullish(),
            
        job_title: z.string()
            .max(50, 'Chức danh không được quá 50 ký tự')
            .optional(),
    })
});

// Xuất type để dùng trong Controller: const body = req.body as CreateStaffInput;
export type CreateStaffInput = z.infer<typeof createStaffSchema>['body'];


// =========================================================
// 2. Schema Validation cho API PATCH /api/v1/users/:id/status-lock
// =========================================================
export const toggleUserStatusSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .refine(val => !isNaN(val), {
                message: 'ID người dùng phải là một số'
            })
            .positive('ID người dùng phải lớn hơn 0'),
    })
});

export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>['params'];