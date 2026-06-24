import { z } from 'zod';

/**
 * 1. Validate cho việc Điều chỉnh / Nhập kho lẻ
 * (Mẫu bạn đã cung cấp)
 */
export const adjustInventorySchema = z.object({
    body: z.object({
        variant_id: z.number({ message: 'ID biến thể là bắt buộc' }),
        facility_id: z.number({ message: 'ID cơ sở là bắt buộc' }),
        qty_delta: z.number().refine(val => val !== 0, { message: 'Số lượng thay đổi phải khác 0' }),
        reason: z.enum(['sale', 'return', 'adjustment', 'import'], {
            message: 'Lý do không hợp lệ (import, sale, return, adjustment)'
        }),
        note: z.string().optional(),
        ref_order_id: z.number().optional()
    })
});

/**
 * 2. Validate cho việc Chuyển kho giữa 2 cơ sở
 */
export const transferStockSchema = z.object({
    body: z.object({
        variant_id: z.number({ message: 'ID biến thể là bắt buộc' }),
        from_facility_id: z.number({ message: 'ID cơ sở gửi là bắt buộc' }),
        to_facility_id: z.number({ message: 'ID cơ sở nhận là bắt buộc' }),
        quantity: z.number().positive({ message: 'Số lượng chuyển phải lớn hơn 0' }),
        note: z.string().optional()
    })
});

/**
 * 3. Validate cho việc Kiểm kê (Đồng bộ số lượng thực tế)
 */
export const syncStockSchema = z.object({
    body: z.object({
        variant_id: z.number({ message: 'ID biến thể là bắt buộc' }),
        facility_id: z.number({ message: 'ID cơ sở là bắt buộc' }),
        actual_quantity: z.number().min(0, { message: 'Số lượng thực tế không được âm' }),
        note: z.string().optional()
    })
});

/**
 * 4. Validate query cho việc lấy Lịch sử biến động
 */
export const getInventoryLogsSchema = z.object({
    query: z.object({
        facility_id: z.string().optional(),
        variant_id: z.string().optional(),
        reason: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional()
    })
});