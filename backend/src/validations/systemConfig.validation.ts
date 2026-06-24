import { z } from "zod";

export const createSystemConfigSchema = z.object({
  body: z.object({
    key: z
      .string()
      .min(1, "Key là bắt buộc")
      .regex(
        /^[A-Z0-9_]+$/,
        "Key chỉ được chứa chữ in hoa, số và dấu gạch dưới (VD: STUDENT_DISCOUNT)"
      ),

    value: z
      .string()
      .min(1, "Giá trị là bắt buộc"),

    description: z.string().optional().nullable(),

    data_type: z.enum(
      ["number", "string", "boolean"],
      {
        message: "Kiểu dữ liệu phải là number, string hoặc boolean",
      }
    ),
  }),
});

export type CreateSystemConfigInput = z.infer<typeof createSystemConfigSchema>["body"];

export const updateSystemConfigSchema = z.object({
  body: z.object({
    value: z
      .string()
      .min(1, "Giá trị là bắt buộc"),

    description: z.string().optional().nullable(),
    // Key và data_type thường không cho phép sửa
  }),
});

export type UpdateSystemConfigInput = z.infer<typeof updateSystemConfigSchema>["body"];
