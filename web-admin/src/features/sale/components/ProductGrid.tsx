import ProductCard from "./ProductCard";
import type { PosProduct } from "../types/sale.types";

interface ProductGridProps {
  products: PosProduct[];
  onSelectProduct: (
    product: PosProduct
  ) => void;
}

export default function ProductGrid({
  products,
  onSelectProduct,
}: ProductGridProps) {
  return (
    <div
      className="
        grid
        grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-4
      "
    >
      {products.map((product) => (
        <ProductCard
          key={product.variant.id}
          product={product}
          onClick={() =>
            onSelectProduct(product)
          }
        />
      ))}
    </div>
  );
}