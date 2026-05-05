import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const createPriceConfigSchema = z.object({
    body: z.object({
        facility_id: z.number({ message: 'ID cơ sở là bắt buộc' }),
        court_type: z.enum(['badminton', 'tennis', 'football'], { 
           message: 'Loại sân chỉ được là: badminton, tennis hoặc football'
        }),
        start_time: z.string().regex(timeRegex, 'Giờ bắt đầu phải là HH:mm hoặc HH:mm:ss'),
        end_time: z.string().regex(timeRegex, 'Giờ kết thúc phải là HH:mm hoặc HH:mm:ss'),
        price_per_hour: z.number().positive('Giá tiền phải lớn hơn 0')
    }).refine(data => data.start_time < data.end_time, {
        message: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
        path: ["end_time"]
    })
});

export type CreatePriceConfigInput = z.infer<typeof createPriceConfigSchema>['body'];

export const updatePriceConfigSchema = z.object({
    body: z.object({
        start_time: z.string().regex(timeRegex).optional(),
        end_time: z.string().regex(timeRegex).optional(),
        price_per_hour: z.number().positive().optional()
    }).refine(data => {
        if (data.start_time && data.end_time) {
            return data.start_time < data.end_time;
        }
        return true;
    }, {
        message: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
        path: ["end_time"]
    })
});

export type UpdatePriceConfigInput = z.infer<typeof updatePriceConfigSchema>['body'];