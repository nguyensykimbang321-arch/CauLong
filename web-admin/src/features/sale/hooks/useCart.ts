import { useState } from 'react';
import type { CartItem } from '../types/sale.types';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(
        p => p.variantId === item.variantId
      );

      if (existing) {
        return prev.map(p =>
          p.variantId === item.variantId
            ? {
                ...p,
                quantity: p.quantity + 1
              }
            : p
        );
      }

      return [...prev, item];
    });
  };

  return {
    items,
    addItem
  };
};