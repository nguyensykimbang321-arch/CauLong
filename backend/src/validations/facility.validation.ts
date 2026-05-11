import { z } from 'zod';


export const createFacilitySchema = z.object({
    body: z.object({
        name: z.string({ message: 'Tên cơ sở là bắt buộc' }).min(3, 'Tên cơ sở quá ngắn'),
        address: z.string({ message: 'Địa chỉ là bắt buộc' }).min(5, 'Địa chỉ quá ngắn'),
        
        open_time: z.string().default('06:00:00'),
        close_time: z.string().default('22:00:00'),
        timezone: z.string().default('Asia/Ho_Chi_Minh'),
        
        avatar_url: z.string().url('Link ảnh không hợp lệ').nullable().optional().default(null),
        cancel_policy: z.any().nullable().optional().default(null),
        
        is_active: z.boolean().default(true)
    })
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>['body'];

export const updateFacilitySchema = z.object({
    body: z.object({
        name: z.string().min(3, 'Tên cơ sở quá ngắn').optional(),
        address: z.string().min(5, 'Địa chỉ quá ngắn').optional(),
        open_time: z.string().optional(),
        close_time: z.string().optional(),
        timezone: z.string().optional(),
        avatar_url: z.string().url('Link ảnh không hợp lệ').nullable().optional(),
        cancel_policy: z.any().nullable().optional(),
        is_active: z.boolean().optional()
    })
});

export type updateFacilityInput = z.infer<typeof updateFacilitySchema>['body'];