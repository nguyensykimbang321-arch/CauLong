import  models  from "../models/index.js";

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
}
