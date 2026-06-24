import { z } from 'zod';

// ===============================================================
// 1. VALIDATOR CHO SẢN PHẨM (PRODUCTS)
// ===============================================================

// Schema thêm mới sản phẩm
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),

    slug: z.string(),

    category: z.enum([
      'racket',
      'shuttlecock',
      'shoes',
      'apparel',
      'accessory'
    ]),

    description: z.string().optional(),

    thumbnail_url: z.string().url().optional(),

    default_variant: z
      .object({
        sku: z.string(),
        price_cents: z.number().positive()
      })
      .optional(),

    variants: z
      .array(
        z.object({
          sku: z.string(),
          price_cents: z.number().positive(),
          attributes: z.record(z.string(), z.any()).optional()
        })
      )
      .optional()
  })
});

// Trích xuất Type để dùng ở Controller nếu cần
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];

// Schema cập nhật thông tin sản phẩm (Cho phép cập nhật 1 phần - Partial)
export const updateProductSchema = z.object({
    params: z.object({
        id: z.coerce.number({ message: 'ID sản phẩm trên URL phải là một số' })
            .positive('ID sản phẩm không hợp lệ')
    }),
    body: z.object({
        name: z.string().min(1, 'Tên sản phẩm không được để trống').optional(),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug không hợp lệ').optional(),
        category: z.enum(['racket', 'shuttlecock', 'shoes', 'apparel', 'accessory']).optional(),
        description: z.string().nullish(),
        thumbnail_url: z.string().url('Đường dẫn ảnh không hợp lệ').nullish(),
        
        // Bổ sung cho phần cập nhật
        rating: z.number().min(0).max(5).nullish(),
        review_count: z.number().int().min(0).nullish(),
        
        // Đã đổi từ 'active' thành 'is_active'
        is_active: z.boolean().nullish()
    })
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];

const variantCoreSchema = z.object({
    sku: z.string({ message: 'Mã SKU là bắt buộc' })
        .min(1, 'Mã SKU không được để trống'),
    
    price_cents: z.number({ message: 'Giá sản phẩm là bắt buộc' })
        .int('Giá tiền phải là số nguyên')
        .min(0, 'Giá tiền không được là số âm'),
    
    barcode: z.string().nullish(), // Cho phép null
    
    // attributes là cột JSON trong DB, cấu trúc z.record giúp ép kiểu thành một Object dạng { "key": "value" }
    attributes: z.record(z.string(), z.any()).nullish(), 
    
    is_active: z.boolean().nullish()
});

export const addVariantsSchema = z.object({
    params: z.object({
        id: z.coerce.number({ message: 'ID sản phẩm trên URL phải là một số' })
            .positive('ID sản phẩm không hợp lệ')
    }),
    body: z.object({
        // Ép buộc body gửi lên phải có mảng "variants" và ít nhất 1 phần tử
        variants: z.array(variantCoreSchema)
            .min(1, 'Danh sách biến thể (variants) không được để trống')
    })
});

export const updateVariantSchema = z.object({
    params: z.object({
        variantId: z.coerce.number({ message: 'ID biến thể trên URL phải là một số' })
            .positive('ID biến thể không hợp lệ')
    }),
    // Dùng hàm .partial() để biến tất cả các trường bắt buộc thành "không bắt buộc" (optional).
    // Phù hợp cho việc khách hàng chỉ muốn cập nhật 1 trường (VD: chỉ đổi giá)
    body: variantCoreSchema.partial().refine(
        (data) => Object.keys(data).length > 0,
        { message: 'Bạn phải gửi ít nhất 1 trường dữ liệu cần cập nhật' }
    )
});

export const ProductFilterDto = z.object({
  search: z.string().trim().optional(),

  category: z.string().trim().optional(),

  min_price: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),

  max_price: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),

  rating: z.coerce
    .number()
    .min(0)
    .max(5)
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  sort: z.enum([
    'newest',
    'oldest',
    'price_asc',
    'price_desc',
    'rating'
  ]).optional(),

  attrs: z.record(z.string(), z.string()).optional()
})
.refine(
  data =>
    !data.min_price ||
    !data.max_price ||
    data.min_price <= data.max_price,
  {
    message: 'min_price phải nhỏ hơn max_price',
    path: ['min_price']
  }
);

export type ProductFilterInput = z.infer<typeof ProductFilterDto>;
export type AddVariantsInput = z.infer<typeof addVariantsSchema>['body'];
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>['body'];