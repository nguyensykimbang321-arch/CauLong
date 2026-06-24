import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { ProductService } from '../services/product.service';
import type {
  Product,
  ProductFilter
} from '../types/product.types';

export const useProducts = (
  refreshTrigger = 0,
  filters?: ProductFilter
) => {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [total, setTotal] =
    useState<number>(0);

  const fetchProducts =
    useCallback(async () => {
      try {
        setLoading(true);

        const res =
          await ProductService.searchProducts(
            filters
          );

        if (res.success) {
          setProducts(res.data);
          setTotal(res.total || 0);
        }
      } catch (error) {
        message.error(
          'Lỗi khi lấy danh sách sản phẩm!'
        );

        console.error(error);
      } finally {
        setLoading(false);
      }
    }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [
    fetchProducts,
    refreshTrigger
  ]);

  const multiVariantList =
    useMemo(
      () =>
        products.filter(
          p =>
            p.variants &&
            p.variants.length > 1
        ),
      [products]
    );

  const singleVariantList =
    useMemo(
      () =>
        products.filter(
          p =>
            !p.variants ||
            p.variants.length <= 1
        ),
      [products]
    );

  return {
    products,
    loading,
    total,
    multiVariantList,
    singleVariantList,
    refetch: fetchProducts
  };
};