import type { PosProduct } from "../types/sale.types";

interface ProductCardProps {
  product: PosProduct;
  onClick: () => void;
}

export default function ProductCard({
  product,
  onClick,
}: ProductCardProps) {
  return (
    <div
      className="border rounded-lg p-3 cursor-pointer hover:shadow-md"
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-100 rounded mb-2">
        {product.variant.product.thumbnail_url && (
          <img
            src={product.variant.product.thumbnail_url}
            alt={product.variant.product.name}
            className="w-full h-full object-cover rounded"
          />
        )}
      </div>

      <h3 className="font-medium">
        {product.variant.product.name}
      </h3>

      <p className="text-sm text-gray-500">
        SKU: {product.variant.sku}
      </p>

      <p className="font-semibold">
        {product.variant.price_cents.toLocaleString()} đ
      </p>

      <p className="text-xs text-gray-500">
        Tồn: {product.quantity_on_hand}
      </p>
    </div>
  );
}