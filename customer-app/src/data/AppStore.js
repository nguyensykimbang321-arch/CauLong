import React, { createContext, useContext, useMemo, useReducer } from 'react';
import mock from './mock.json';

const AppStoreContext = createContext(null);

function createInitialState() {
  return {
    cartItems: (mock.cart_items ?? []).map((it) => ({ ...it })),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'cart/add': {
      const { product, variant, quantity } = action.payload;
      const qty = Math.max(1, Number(quantity) || 1);
      const variantId = variant?.id;
      if (!variantId) return state;

      const idx = state.cartItems.findIndex((x) => x.variant_id === variantId);
      if (idx >= 0) {
        const next = state.cartItems.slice();
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return { ...state, cartItems: next };
      }

      const newItem = {
        id: `ci_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        variant_id: variantId,
        product_id: product?.id,
        product_name: product?.name,
        variant_label: variant?.label,
        thumbnail_url: product?.thumbnail_url,
        price_cents: variant?.price_cents ?? 0,
        quantity: qty,
      };
      return { ...state, cartItems: [newItem, ...state.cartItems] };
    }
    case 'cart/setQty': {
      const { id, quantity } = action.payload;
      const qty = Number(quantity);
      if (!Number.isFinite(qty)) return state;

      const next = state.cartItems
        .map((x) => (x.id === id ? { ...x, quantity: Math.max(0, Math.floor(qty)) } : x))
        .filter((x) => x.quantity > 0);
      return { ...state, cartItems: next };
    }
    case 'cart/remove': {
      const { id } = action.payload;
      return { ...state, cartItems: state.cartItems.filter((x) => x.id !== id) };
    }
    case 'cart/clear': {
      return { ...state, cartItems: [] };
    }
    default:
      return state;
  }
}

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const api = useMemo(() => {
    const addToCart = (product, variant, quantity = 1) =>
      dispatch({ type: 'cart/add', payload: { product, variant, quantity } });

    const setCartQty = (id, quantity) =>
      dispatch({ type: 'cart/setQty', payload: { id, quantity } });

    const removeFromCart = (id) =>
      dispatch({ type: 'cart/remove', payload: { id } });

    const clearCart = () =>
      dispatch({ type: 'cart/clear', payload: {} });

    return { state, addToCart, setCartQty, removeFromCart, clearCart };
  }, [state]);

  return <AppStoreContext.Provider value={api}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}

