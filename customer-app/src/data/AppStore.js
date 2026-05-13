import React, { createContext, useContext, useMemo, useReducer, useState, useEffect } from 'react';
import mock from './mock.json';
import storage from '../utils/storage';

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
        
        // Load user và token từ storage nếu có
        const savedToken = await storage.getItem('token');
        const savedUser = await storage.getItem('user');
        
        if (savedToken && savedUser) {
          setUserState(JSON.parse(savedUser));
          // Token sẽ được interceptor ở api.js tự động lấy từ AsyncStorage
        }
      } catch (e) {
        console.warn("Lỗi khơi tạo AppStore:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const setUser = async (userData, token) => {
    try {
      setUserState(userData);
      if (token) {
        await storage.setItem('token', token);
        await storage.setItem('user', JSON.stringify(userData));
      }
    } catch (e) {
      console.error("Lỗi lưu thông tin đăng nhập:", e);
    }
  };

  const logout = async () => {
    try {
      setUserState(null);
      await storage.removeItem('token');
      await storage.removeItem('user');
    } catch (e) {
        console.error("Lỗi đăng xuất:", e);
    }
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
