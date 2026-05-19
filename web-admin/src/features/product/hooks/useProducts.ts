import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd'; // Thay bằng thư viện bạn đang dùng
import { ProductService } from '../services/product.service';
import type { Product } from '../types/product.types';

export const useProducts = (refreshTrigger: number = 0) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Hàm gọi API lấy dữ liệu
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ProductService.getAllProducts();
      
      if (res.success) {
        setProducts(res.data); 
      }
    } catch (error) {
      message.error('Lỗi khi lấy danh sách sản phẩm!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line 
    fetchProducts();
  }, [fetchProducts, refreshTrigger]);

  // CHIA LƯỚI: Tách 2 danh sách ngay trong Hook để UI không phải lo việc này
  const multiVariantList = useMemo(() => 
    products.filter(p => p.variants && p.variants.length > 1), 
  [products]);

  const singleVariantList = useMemo(() => 
    products.filter(p => !p.variants || p.variants.length <= 1), 
  [products]);

  return {
    products,
    loading,
    multiVariantList,
    singleVariantList,
    refetch: fetchProducts // Xuất hàm này ra nếu UI cần ép load lại thủ công
  };
};