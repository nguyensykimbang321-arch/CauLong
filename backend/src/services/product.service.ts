import models  from "../models/index.js";
import ApiError from '../utils/ErrorClass.js';
import sequelize from '../config/database.js';

export class ProductService {
    static async getAllProducts() {
        return await (models.Product as any).findAll({
            where: { is_active: true },
            include: [
                {
                    model: models.ProductVariant,
                    as: 'variants',
                    include: [
                        {
                            model: models.InventoryLevel,
                            as: 'inventory_levels'
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    static async getBySlug(slug: string) {
        return await (models.Product as any).findOne({
            where: { slug, is_active: true },

            include: [
                {
                    model: models.ProductVariant,
                    as: 'variants'
                }
            ]
        });
    }

    static async getAllProductsForAdmin(queryParams?: any) {
        try {
            return await (models.Product as any).findAll({
                include: [
                    {
                        model: models.ProductVariant,
                        as: 'variants',
                        include: [
                            {
                                model: models.InventoryLevel,
                                as: 'inventory_levels',
                                attributes: ['id', 'facility_id', 'available_quantity', 'reserved_quantity', 'low_stock_threshold']
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    }

    static async getProductDetail(productId: number) {
        const product = await models.Product.findByPk(productId, {
        include: [
            {
            model: models.ProductVariant,
            include: [{ model: models.InventoryLevel }]
            }
        ]
        });
        
        if (!product) throw new ApiError('Sản phẩm không tồn tại', 404);
        return product;
    }

    static async createProduct(data: any) {
        const transaction = await sequelize.transaction();

        try {
            // 2. Tạo Product và cho phép "chèn" luôn mảng biến thể vào bảng product_variants
            const product = await models.Product.create(data, {
                include: [
                    {
                        model: models.ProductVariant,
                        as: 'variants' // Lưu ý: Tên này phải khớp với alias (as) bạn cấu hình trong models/index.ts
                    }
                ],
                transaction: transaction
            });

            // 3. Nếu mọi thứ trót lọt, chốt dữ liệu vào Database
            await transaction.commit();
            return product;

        } catch (error) {
            // 4. Nếu có bất kỳ lỗi gì (VD: trùng slug, trùng sku), hoàn tác toàn bộ
            await transaction.rollback();
            throw error; // Ném lỗi ra ngoài để ApiError và Middleware bắt lấy
        }
    }

    static async updateProduct(productId: number, data: any) {
        const product = await models.Product.findByPk(productId);
        if (!product) throw new ApiError('Sản phẩm không tồn tại', 404);
        
        return await product.update(data);
    }

    static async toggleProductDeletion(productId: number) {
        // 1. Tìm sản phẩm, bao gồm cả các bản ghi đã bị xóa mềm (paranoid: false)
        const product = await models.Product.findByPk(productId, { 
            paranoid: false 
        });

        if (!product) throw new ApiError('Sản phẩm không tồn tại', 404);

        // 2. Kiểm tra trạng thái hiện tại
        if (product.deleted_at) {
            // TRƯỜNG HỢP: Đang nằm trong thùng rác -> Khôi phục
            
            await product.restore(); // Khôi phục (set deleted_at = null)
            await product.update({ is_active: true }); // Tự động bật trạng thái bán

            return { 
                message: 'Đã khôi phục và tự động kích hoạt sản phẩm', 
                status: 'restored',
                is_active: true,
                deleted_at: null 
            };
        } else {
            // TRƯỜNG HỢP: Đang hoạt động bình thường -> Xóa mềm
            
            await product.update({ is_active: false }); // Tắt trạng thái bán TRƯỚC
            await product.destroy(); // Ném vào thùng rác SAU (gắn deleted_at)

            return { 
                message: 'Đã vô hiệu hóa và xóa mềm sản phẩm', 
                status: 'deleted',
                is_active: false,
                deleted_at: new Date() // Giá trị thời gian thực để FE hiển thị
            };
        }
    }

    static async getVariantsByProductId(productId: number) {
        // 1. (Tùy chọn) Kiểm tra xem sản phẩm cha có thực sự tồn tại không
        const product = await models.Product.findByPk(productId);
        if (!product) throw new ApiError('Sản phẩm không tồn tại', 404);

        // 2. Lấy toàn bộ biến thể có product_id khớp với ID truyền vào
        const variants = await models.ProductVariant.findAll({
            where: { product_id: productId },
            order: [['created_at', 'ASC']] // Sắp xếp theo thứ tự tạo cũ nhất lên trước (Tùy chọn)
        });

        return variants;
    }

    // Hàm thêm danh sách biến thể cho sản phẩm đã có
    static async addVariantsToProduct(productId: number, variantsData: any[]) {
        // 1. Kiểm tra xem sản phẩm cha có tồn tại không
        const product = await models.Product.findByPk(productId);
        if (!product) throw new ApiError('Sản phẩm không tồn tại', 404);

        // 2. Gắn product_id vào từng biến thể
        const variantsToCreate = variantsData.map(variant => ({
            ...variant,
            product_id: productId // Móc nối vào cây vợt cha
        }));

        // 3. Dùng bulkCreate để lưu toàn bộ mảng vào DB cùng lúc
        const createdVariants = await models.ProductVariant.bulkCreate(variantsToCreate);
        return createdVariants;
    }

    static async updateVariant(variantId: number, updateData: any) {
        const variant = await models.ProductVariant.findByPk(variantId);
        if (!variant) throw new ApiError('Biến thể sản phẩm không tồn tại', 404);

        // Cập nhật các trường được gửi lên (price_cents, sku, attributes...)
        await variant.update(updateData);
        return variant;
    }

    static async toggleVariantDeletion(variantId: number) {
        // Tìm biến thể, kể cả những cái đang nằm trong thùng rác (paranoid: false)
        const variant = await models.ProductVariant.findByPk(variantId, { 
            paranoid: false 
        });

        if (!variant) throw new ApiError('Biến thể sản phẩm không tồn tại', 404);

        if (variant.deleted_at) {
            // Nếu đang bị xóa -> Khôi phục và bật bán
            await variant.restore();
            await variant.update({ is_active: true });

            return { 
                message: 'Đã khôi phục và kích hoạt lại biến thể', 
                status: 'restored',
                is_active: true,
                deleted_at: null 
            };
        } else {
            // Nếu đang hoạt động -> Tắt bán và Xóa mềm
            await variant.update({ is_active: false });
            await variant.destroy();

            return { 
                message: 'Đã vô hiệu hóa và xóa mềm biến thể', 
                status: 'deleted',
                is_active: false,
                deleted_at: new Date()
            };
        }
    }


}
