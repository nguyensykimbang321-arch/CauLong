import { z } from "zod";

export const createHolidaySchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(1, "Tên ngày lễ là bắt buộc")
            .min(2, "Tên ngày lễ quá ngắn"),

        holiday_date: z
            .string()
            .min(1, "Ngày lễ là bắt buộc")
            .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                "Định dạng ngày không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD (VD: 2026-04-30)"
            ),

        surcharge_percent: z
            .number()
            .min(0, "Phần trăm phụ thu không được là số âm")
    })
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>["body"];

export const updateHolidaySchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, "Tên ngày lễ quá ngắn")
            .optional(),

        holiday_date: z
            .string()
            .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                "Định dạng ngày không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD"
            )
            .optional(),

        surcharge_percent: z
            .number()
            .min(0, "Phần trăm phụ thu không được là số âm")
            .optional()
    })
});

export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>["body"];
