import z from "zod";

export const createCourtSchema = z.object({
    body: z.object({
        name: z.string({ message: 'Tên sân là bắt buộc' }).min(2, 'Tên sân quá ngắn'),
        facility_id: z.number({ message: 'ID Cơ sở là bắt buộc' }),
        court_type_id: z.number({ message: 'ID Loại sân là bắt buộc' }),
        status: z.enum(['active', 'maintenance', 'inactive']).optional().default('active')
    })
})

export type CreateCourtInput = z.infer<typeof createCourtSchema>['body'];

export const updateCourtSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        facility_id: z.number().optional(),
        court_type_id: z.number().optional(),
        status: z.enum(['active', 'maintenance', 'inactive']).optional()
    })
});


export type UpdateCourtInput = z.infer<typeof updateCourtSchema>['body'];