import z from "zod";

export const createCourtSchema = z.object({
    body: z.object({
        name: z.string({ message: 'Tên sân là bắt buộc' }).min(2, 'Tên sân quá ngắn'),
        facility_id: z.number({ message: 'ID Cơ sở là bắt buộc' }),
        
        // Đổi thành court_type để khớp Model
        court_type: z.enum(['badminton', 'tennis', 'football', 'table_tennis'], { 
            message: 'Loại sân không hợp lệ' 
        }),
        
        // Đổi thành is_active để khớp Model
        is_active: z.boolean().optional().default(true)
    })
})

export type CreateCourtInput = z.infer<typeof createCourtSchema>['body'];

export const updateCourtSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        facility_id: z.number().optional(),
        
        // Cập nhật lại
        court_type: z.enum(['badminton', 'tennis', 'football', 'table_tennis']).optional(),
        is_active: z.boolean().optional()
    })
});

export type UpdateCourtInput = z.infer<typeof updateCourtSchema>['body'];