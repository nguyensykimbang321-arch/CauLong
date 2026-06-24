import React, { useEffect, useState } from 'react';
import type { Product, ProductFilter, ProductVariant, InventoryLevel } from '../types/product.types';
import { useProducts } from '../hooks/useProducts';
import { useModal } from '../hooks/useModal';
import { InventoryService } from '../services/inventory.service';
import { ProductService } from '../services/product.service';
import { message, Pagination } from 'antd';
import { ProductFormModal } from './ProductFormModal';
import { VariantFormModal } from './VariantFormModal';
import { InventoryAdjustModal } from './InventoryModal';

export const ProductTable: React.FC = () => {
  // Trạng thái trigger reload danh sách sản phẩm khi hoàn tất thêm/sửa/nhập kho
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // 🔥 FIX Ở ĐÂY: Tạo 2 state riêng biệt
  // 1. localFilters: Lưu trữ giá trị người dùng ĐANG GÕ (không gọi API)
  const [localFilters, setLocalFilters] = useState<ProductFilter>({ page: 1, limit: 10 });
  // 2. filters: State chính thức để GỌI API (Chỉ cập nhật khi bấm Tìm Kiếm)
  const [filters, setFilters] = useState<ProductFilter>({ page: 1, limit: 10 });

  // Gọi Hook lấy dữ liệu với state filters (chính thức)
  const { loading, total, multiVariantList, singleVariantList, refetch } = useProducts(refreshTrigger, filters);
  const allProducts = [...multiVariantList, ...singleVariantList];

  const PAGE_SIZE = 10;

  // State quản lý các dòng đang được Mở rộng (Xổ xuống)
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [expandedVariants, setExpandedVariants] = useState<number[]>([]);

  const [facilitiesMap, setFacilitiesMap] = useState<Record<number, string>>({});

  // Khởi tạo useModal bọc các payload dữ liệu tương ứng
  const productModal = useModal<Product>();
  const variantModal = useModal<{ productId: number; variant?: ProductVariant }>();
  const inventoryModal = useModal<{ variantId: number }>();

  const [variantStocks, setVariantStocks] = useState<Record<number, { id: number; facility_id: number; quantity_on_hand: number; }[]>>({});

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const res = await ProductService.getFacilities();
        const map = Object.fromEntries(
          res.data.map(f => [f.id, f.name])
        );
        setFacilitiesMap(map);
      } catch (error) {
        console.error("Lỗi khi tải danh sách cơ sở:", error);
      }
    };

    loadFacilities();
  }, []);

  const loadVariantStock = async (variantId: number) => {
    // Đã load rồi thì bỏ qua
    if (variantStocks[variantId]) return;
    try {
      const facilityIds = Object.keys(facilitiesMap).map(Number);
      const stocks: {
        id: number;
        facility_id: number;
        quantity_on_hand: number;
      }[] = await Promise.all(
        facilityIds.map(async (facilityId) => {

          const res = await InventoryService.getVariantStock(
            facilityId,
            variantId
          );

          const stock = res.data as InventoryLevel;

          return {
            id: stock.id,
            facility_id: stock.facility_id,
            quantity_on_hand: stock.quantity_on_hand
          };
        })
      );

      setVariantStocks(prev => ({ ...prev, [variantId]: stocks }));
    } catch (error) {
      console.error(error);
      message.error("Không tải được tồn kho");
    }
  };

  const toggleVariantExpand = (variantId: number) => {
    setExpandedVariants(prev =>
      prev.includes(variantId)
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    );
  };

  const toggleExpandRow = (product: Product) => {
    setExpandedRows(prev => {
      if (prev.includes(product.id)) {
        return prev.filter(id => id !== product.id);
      } else {
        // Khi mở rộng sản phẩm, tải tồn kho cho tất cả biến thể
        product.variants?.forEach(variant => {
          loadVariantStock(variant.id);
        });
        return [...prev, product.id];
      }
    });
  };

  const handleReloadTable = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Hàm xử lý Xóa mềm / Khôi phục sản phẩm cha
  const handleToggleProductStatus = async (id: number) => {
    try {
      await ProductService.toggleDeleteProduct(id);
      message.success('Cập nhật trạng thái sản phẩm thành công!');
      refetch();
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật sản phẩm!');
      console.error(error);
    }
  };

  // Hàm xử lý Xóa mềm / Khôi phục một biến thể (Variant)
  const handleToggleVariantStatus = async (productId: number, variantId: number) => {
    try {
      await ProductService.toggleDeleteVariant(productId, variantId);
      message.success('Cập nhật trạng thái biến thể thành công!');
      refetch();
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật biến thể!');
      console.error(error);
    }
  };

  // Hàm kích hoạt Tìm kiếm
  const handleSearch = () => {
    setFilters({ ...localFilters, page: 1 }); // Chuyển state local sang state gọi API, reset về trang 1
    setLocalFilters(prev => ({ ...prev, page: 1 }));
  };

  // Hàm Làm mới bộ lọc
  const handleResetFilters = () => {
    const defaultFilters = { page: 1, limit: 10 };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  if (loading && refreshTrigger === 0) {
    return <div className="p-10 text-center text-lg text-gray-500 animate-pulse">Đang tải dữ liệu trên sân... 🏸</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* KHU VỰC HEADER VÀ NÚT THÊM SẢN PHẨM */}
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800">
          Danh sách Sản phẩm ({total})
        </h2>

        <button
          type="button"
          onClick={() => productModal.open()}
          className="bg-blue-600 text-white px-5 py-2 rounded-md shadow font-medium hover:bg-blue-700 transition"
        >
          + Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* KHU VỰC TÌM KIẾM (Cập nhật dùng localFilters) */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        <input
          placeholder="Tìm tên, slug, sku..."
          value={localFilters.search || ""}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // Nhấn Enter để tìm
          className="border rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          placeholder="Danh mục (vd: racket)"
          value={localFilters.category || ""}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="border rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          type="number"
          placeholder="Giá từ"
          value={localFilters.min_price || ""}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, min_price: Number(e.target.value) || undefined }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="border rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          type="number"
          placeholder="Giá đến"
          value={localFilters.max_price || ""}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, max_price: Number(e.target.value) || undefined }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="border rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mb-5 flex gap-3 items-center">
        <select
          value={localFilters.rating || ''}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, rating: Number(e.target.value) || undefined }))}
          className="border rounded px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">Tất cả đánh giá</option>
          <option value="5">5 sao</option>
          <option value="4">Từ 4 sao</option>
          <option value="3">Từ 3 sao</option>
        </select>

        <select
          value={localFilters.sort || ''}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, sort: e.target.value as unknown as ProductFilter['sort'] || undefined }))}
          className="border rounded px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">Mặc định</option>
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="rating">Đánh giá cao nhất</option>
        </select>

        {/* Nút Tìm kiếm và Làm mới */}
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition shadow-sm ml-auto"
        >
          Tìm kiếm
        </button>
        <button
          onClick={handleResetFilters}
          className="bg-gray-100 text-gray-700 border border-gray-300 px-5 py-2 rounded-md font-medium hover:bg-gray-200 transition shadow-sm"
        >
          Làm mới
        </button>
      </div>

      {/* KHU VỰC HIỂN THỊ BẢNG ĐA TẦNG */}
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 font-semibold uppercase text-sm">
              <th className="px-5 py-3 border-b-2 border-gray-200 w-10"></th>
              <th className="px-5 py-3 border-b-2 border-gray-200">Sản phẩm</th>
              <th className="px-5 py-3 border-b-2 border-gray-200">Danh mục</th>
              <th className="px-5 py-3 border-b-2 border-gray-200">Số phân loại</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Chưa có dữ liệu sản phẩm.</td></tr>
            )}

            {allProducts.map((product) => {
              const isExpanded = expandedRows.includes(product.id);
              const isDeleted = !!product.deleted_at;

              return (
                <React.Fragment key={product.id}>
                  {/* ======================================================== */}
                  {/* DÒNG SẢN PHẨM CHA */}
                  {/* ======================================================== */}
                  <tr className={`hover:bg-blue-50 transition-colors ${isDeleted ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4 border-b border-gray-200 text-center cursor-pointer" onClick={() => toggleExpandRow(product)}>
                      <button type="button" className="text-xl font-bold text-gray-500 hover:text-blue-600">
                        {isExpanded ? '−' : '+'}
                      </button>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          {product.thumbnail_url ? (
                            <img className="w-full h-full rounded object-cover" src={product.thumbnail_url} alt={product.name} />
                          ) : (
                            <div className="w-full h-full rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Img</div>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className={`text-gray-900 font-medium ${isDeleted ? 'line-through' : ''}`}>{product.name}</p>
                          <p className="text-gray-500 text-xs">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm uppercase">
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{product.category}</span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">{product.variants?.length || 0} loại</span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => variantModal.open({ productId: product.id })}
                          disabled={isDeleted}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          + Thêm Phân Loại
                        </button>
                        <button
                          type="button"
                          onClick={() => productModal.open(product)}
                          disabled={isDeleted}
                          className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProductStatus(product.id)}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                        >
                          {isDeleted ? 'Khôi phục' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ======================================================== */}
                  {/* BẢNG CON (CÁC BIẾN THỂ) NẰM XỔ XUỐNG DƯỚI */}
                  {/* ======================================================== */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="p-4 border-b border-gray-200">
                        <div className="ml-12 border-l-4 border-blue-400 pl-4">
                          <h4 className="font-semibold text-gray-600 mb-2">Các phiên bản của {product.name}</h4>
                          <table className="min-w-full bg-white rounded shadow-sm">
                            <thead className="bg-gray-200 text-gray-600 text-xs uppercase">
                              <tr>
                                <th className="px-4 py-2 w-10"></th>
                                <th className="px-4 py-2 text-left">SKU</th>
                                <th className="px-4 py-2 text-left">Thuộc tính</th>
                                <th className="px-4 py-2 text-left">Giá</th>
                                <th className="px-4 py-2 text-left">Tổng tồn</th>
                                <th className="px-4 py-2 text-center">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.variants?.length === 0 && (
                                <tr><td colSpan={6} className="p-3 text-center text-gray-400 text-sm">Chưa có phân loại nào.</td></tr>
                              )}
                              {product.variants?.map(variant => {
                                const isVariantExpanded = expandedVariants.includes(variant.id);
                                const inventories = variantStocks[variant.id] || variant.inventory_levels || [];

                                const totalStock = inventories.reduce((sum, item) => sum + item.quantity_on_hand, 0);
                                const isLowStock = totalStock <= 5;
                                const isVarDeleted = !!variant.deleted_at;

                                return (
                                  <React.Fragment key={variant.id}>
                                    {/* Dòng variant */}
                                    <tr className={`border-b text-sm ${isVarDeleted ? 'opacity-50' : ''}`}>
                                      <td className="px-2 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            toggleVariantExpand(variant.id);
                                            loadVariantStock(variant.id);
                                          }}
                                          className="font-bold text-blue-600"
                                        >
                                          {isVariantExpanded ? "−" : "+"}
                                        </button>
                                      </td>

                                      <td className="px-4 py-2">{variant.sku}</td>

                                      <td className="px-4 py-2">
                                        {variant.attributes && Object.keys(variant.attributes).length > 0 ? (
                                          Object.entries(variant.attributes).map(([k, v]) => (
                                            <span key={k} className="inline-block bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-xs mr-1">
                                              {k}: {String(v)}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-gray-400 italic text-xs">Tiêu chuẩn</span>
                                        )}
                                      </td>

                                      <td className="px-4 py-2 font-medium">
                                        {variant.price_cents.toLocaleString("vi-VN")} đ
                                      </td>

                                      <td className={`px-4 py-2 font-bold ${isLowStock ? "text-red-600" : "text-green-600"}`}>
                                        {totalStock}
                                      </td>

                                      <td className="px-4 py-2">
                                        <div className="flex justify-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() => inventoryModal.open({ variantId: variant.id })}
                                            disabled={isVarDeleted}
                                            className="text-blue-600 hover:underline disabled:no-underline"
                                          >
                                            Nhập kho
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => variantModal.open({ productId: product.id, variant })}
                                            disabled={isVarDeleted}
                                            className="text-yellow-600 hover:underline disabled:no-underline"
                                          >
                                            Sửa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleVariantStatus(product.id, variant.id)}
                                            className="text-gray-600 hover:underline"
                                          >
                                            {isVarDeleted ? "Phục hồi" : "Xóa"}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Bảng tồn kho chi tiết của variant */}
                                    {isVariantExpanded && (
                                      <tr>
                                        <td colSpan={6} className="bg-slate-50 px-10 md:px-40 py-3 border-b border-black-200">
                                          <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                              <thead className="bg-slate-100">
                                                <tr>
                                                  <th className="px-4 py-2 text-left">Cơ sở (Chi nhánh)</th>
                                                  <th className="px-4 py-2 text-center w-40">Số lượng tồn</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {inventories.length > 0 ? (
                                                  inventories.map((inv) => (
                                                    <tr key={inv.facility_id} className="border-t">
                                                      <td className="px-4 py-2">
                                                        {facilitiesMap[inv.facility_id] ?? `CN ${inv.facility_id}`}
                                                      </td>
                                                      <td className={`px-4 py-2 text-center font-medium ${inv.quantity_on_hand <= 5 ? "text-red-600" : "text-green-600"}`}>
                                                        {inv.quantity_on_hand}
                                                      </td>
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan={2} className="px-4 py-3 text-center text-gray-400">
                                                      Chưa có dữ liệu tồn kho tại các cơ sở
                                                    </td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-4 mt-4 flex justify-center">
        <Pagination
          current={filters.page || 1}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={(page) => {
            setFilters(prev => ({ ...prev, page }));
            setLocalFilters(prev => ({ ...prev, page }));
          }}
          showSizeChanger={false}
        />
      </div>

      {/* ========================================================================= */}
      {/* KHU VỰC LỒNG CÁC COMPONENTS POPUP MODALS ĐỂ XỬ LÝ SỰ KIỆN */}
      {/* ========================================================================= */}
      <ProductFormModal
        key={productModal.data?.id || 'new'}
        open={productModal.isOpen}
        product={productModal.data}
        onClose={productModal.close}
        onSuccess={() => {
          productModal.close();
          handleReloadTable();
        }}
      />

      <VariantFormModal
        open={variantModal.isOpen}
        productId={variantModal.data?.productId || null}
        variant={variantModal.data?.variant}
        onClose={variantModal.close}
        onSuccess={() => {
          variantModal.close();
          handleReloadTable();
        }}
      />

      <InventoryAdjustModal
        open={inventoryModal.isOpen}
        variantId={inventoryModal.data?.variantId || null}
        onClose={inventoryModal.close}
        onSuccess={() => {
          inventoryModal.close();
          handleReloadTable();
        }}
      />
    </div>
  );
};