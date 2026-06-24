import { create } from 'zustand';
import type { CartItem } from '../types/sale.types';

interface PosStore {
  cart: CartItem[];

  selectedFacilityId?: number;

  setFacilityId: (
    facilityId: number
  ) => void;

  addToCart: (item: CartItem) => void;

  updateQuantity: (
    variantId: number,
    quantity: number
  ) => void;

  removeItem: (
    variantId: number
  ) => void;

  clearCart: () => void;
}

export const usePosStore =
  create<PosStore>((set) => ({
    cart: [],

    selectedFacilityId: undefined,

    setFacilityId: (facilityId) => set({ selectedFacilityId: facilityId,}),

    addToCart: (item) =>
      set((state) => {
      const existing =
        state.cart.find(
          (cartItem) =>
            cartItem.variantId ===
            item.variantId
        );

      if (existing) {
        return {
          cart: state.cart.map(
            (cartItem) =>
              cartItem.variantId ===
              item.variantId
                ? {
                    ...cartItem,
                    quantity:
                      cartItem.quantity +
                      1,
                  }
                : cartItem
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          item,
        ],
      };
    }),

    updateQuantity: (
      variantId,
      quantity
    ) =>
      set((state) => ({
        cart: state.cart.map((item) =>
          item.variantId === variantId
            ? {
                ...item,
                quantity,
              }
            : item
        ),
      })),

    removeItem: (variantId) =>
      set((state) => ({
        cart: state.cart.filter(
          (item) =>
            item.variantId !== variantId
        ),
      })),

    clearCart: () =>
      set({
        cart: [],
      }),
  }));