import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Email không hợp lệ'),
        password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
        phone: z.string().optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Email không hợp lệ'),
        password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
    }),
});