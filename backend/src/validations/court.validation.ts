import z from "zod";

export const createCourtSchema = z.object({
    body: z.object({
        name: z.string({ message: 'Tên sân là bắt buộc' }).min(2, 'Tên sân quá ngắn'),
        facility_id: z.number({ message: 'ID Cơ sở là bắt buộc' }),
        court_type: z.enum(['badminton', 'tennis', 'football']).optional().default('badminton'),
        is_active: z.boolean().optional().default(true)
    })
})

export type CreateCourtInput = z.infer<typeof createCourtSchema>['body'];

export const updateCourtSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        facility_id: z.number().optional(),
        court_type: z.enum(['badminton', 'tennis', 'football']).optional(),
        is_active: z.boolean().optional()
    })
});

export type UpdateCourtInput = z.infer<typeof updateCourtSchema>['body'];