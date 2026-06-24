import { z } from 'zod';

export const checkAvailabilitySchema = z.object({
    query: z.object({
        facility_id: z.coerce.number().positive(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD'),
        start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ bắt đầu phải có định dạng HH:mm'),
        end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ kết thúc phải có định dạng HH:mm'),
        court_type: z.enum(['badminton', 'tennis', 'football', 'table_tennis']).optional(),
    })
});
export type CheckAvailabilityQuery = z.infer<typeof checkAvailabilitySchema>['query'];

export const getDailyBookedSchema = z.object({
    query: z.object({
        facility_id: z.coerce.number()
            .refine(val => !isNaN(val), {
                message: 'facility_id phải là một số'
            })
            .positive('facility_id phải lớn hơn 0'),

        court_type: z.string()
            .min(1, 'court_type không được để trống'),

        date: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD (VD: 2026-05-10)')
    })
});

export const previewPriceSchema = z.object({
    body: z.object({
        facility_id: z.number({ message: 'ID cơ sở là bắt buộc' }),
        court_type: z.enum(['badminton', 'tennis', 'football', 'table_tennis'], { message: 'Loại sân không hợp lệ' }), // Chặn chỉ cho phép các loại sân có sẵn
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải là YYYY-MM-DD'),
        start_time: z.string().regex(/^\d{2}:(00|30)$/, 'Giờ bắt đầu phải chẵn giờ hoặc rưỡi (VD: 17:00, 17:30)'),
        end_time: z.string().regex(/^\d{2}:(00|30)$/, 'Giờ kết thúc phải chẵn giờ hoặc rưỡi (VD: 18:00, 18:30)')
    })
});

export type PreviewPriceInput = z.infer<typeof previewPriceSchema>['body'];

export const createBookingSchema = z.object({
    body: z.object({
        facility_id: z.number({ message: 'ID cơ sở là bắt buộc' }),
        court_id: z.number({ message: 'ID sân là bắt buộc' }),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải là YYYY-MM-DD'),
        start_time: z.string().regex(/^\d{2}:(00|30)$/, 'Giờ bắt đầu phải chẵn giờ hoặc rưỡi (VD: 17:00, 17:30)'),
        end_time: z.string().regex(/^\d{2}:(00|30)$/, 'Giờ kết thúc phải chẵn giờ hoặc rưỡi (VD: 18:00, 18:30)'),
        payment_method: z.enum(['cash', 'vnpay']).default('cash'),
    })
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];

export const createBookingByHotlineSchema = z.object({
    body: z.object({
        customer_phone: z.string({ message: 'Số điện thoại là bắt buộc' }).min(10, 'SĐT không hợp lệ'),
        customer_name: z.string().optional(),
        membership_type: z.enum(['standard', 'student', 'vip']).optional().default('standard'),
        facility_id: z.number({ message: 'ID cơ sở là bắt buộc' }),
        court_id: z.number({ message: 'ID sân là bắt buộc' }),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải là YYYY-MM-DD'),
        start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ bắt đầu là HH:mm'),
        end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ kết thúc là HH:mm')
    })
});
export type CreateBookingByHotlineInput = z.infer<typeof createBookingByHotlineSchema>['body'];

export const updateBookingStatusSchema = z.object({
    body: z.object({
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
        payment_status: z.enum(['unpaid', 'partial', 'paid', 'refunded']).optional(),
        payment_method: z.enum(['cash', 'vnpay']).optional(),
    })
});
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>['body'];

export const clientUpdateBookingSchema = z.object({
    body: z.object({
        status: z.enum(['cancelled'], { message: 'Khách hàng chỉ được phép hủy đặt sân' })
    })
});
export type ClientUpdateBookingInput = z.infer<typeof clientUpdateBookingSchema>['body'];