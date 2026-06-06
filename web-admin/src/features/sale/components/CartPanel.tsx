import type { CartItem } from "../types/sale.types";

interface Props {
  items: CartItem[];
}

export default function CartPanel({
  items,
}: Props) {
  const total = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-bold mb-4">
        Giỏ hàng
      </h2>

      {items.map(item => (
        <div
          key={item.variantId}
          className="border-b py-3"
        >
          <div className="font-medium">
            {item.productName}
          </div>

          <div className="text-sm text-gray-500">
            {item.variantName}
          </div>

          <div>
            {item.quantity} ×{" "}
            {item.price.toLocaleString()}
          </div>
        </div>
      ))}

      <div className="mt-4 text-lg font-bold">
        Tổng:
        {" "}
        {total.toLocaleString()} đ
      </div>
    </div>
  );
}