import React, { createContext, useContext, useMemo, useReducer, useState, useEffect } from 'react';
import mock from './mock.json';

const AppStoreContext = createContext(null);

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
    case 'cart/init': {
      return { ...state, cartItems: action.payload };
    }
    default:
      return state;
  }
}

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { cartItems: [] });
  const [loading, setLoading] = useState(true);
  const [user, setUserState] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Khởi tạo giỏ hàng trống để bắt đầu fresh
        dispatch({ type: 'cart/init', payload: [] });
        
        // Tương lai: Kiểm tra token trong AsyncStorage để tự động đăng nhập
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const setUser = (userData, token) => {
    setUserState(userData);
    if (token) {
      // Cập nhật token cho axios instance
      import('../services/api').then((m) => {
          m.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      });
    }
  };

  const logout = () => {
    setUserState(null);
    import('../services/api').then((m) => {
        delete m.default.defaults.headers.common['Authorization'];
    });
  };

  const apiContent = useMemo(() => {
    const addToCart = (product, variant, quantity = 1) =>
      dispatch({ type: 'cart/add', payload: { product, variant, quantity } });

    const setCartQty = (id, quantity) =>
      dispatch({ type: 'cart/setQty', payload: { id, quantity } });

    const removeFromCart = (id) =>
      dispatch({ type: 'cart/remove', payload: { id } });

    const clearCart = () =>
      dispatch({ type: 'cart/clear', payload: {} });

    return { state, addToCart, setCartQty, removeFromCart, clearCart, loading, user, setUser, logout };
  }, [state, loading, user]);

  return <AppStoreContext.Provider value={apiContent}>{children}</AppStoreContext.Provider>;

}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
