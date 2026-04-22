import { z } from 'zod';

export const createFacilitySchema = z.object({
    body: z.object({
        name: z.string({ message: 'Tên cơ sở là bắt buộc' }).min(3, 'Tên cơ sở quá ngắn'),
        address: z.string({ message: 'Địa chỉ là bắt buộc' }).min(5, 'Địa chỉ quá ngắn'),
        is_active: z.boolean().optional().default(true)
    })
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>['body'];

export const updateFacilitySchema = z.object({
    body: z.object({
        name: z.string().min(3, 'Tên cơ sở quá ngắn').optional(),
        address: z.string().min(5, 'Địa chỉ quá ngắn').optional(),
        is_active: z.boolean().optional()
    })
});

export type updateFacilityInput = z.infer<typeof updateFacilitySchema>['body'];