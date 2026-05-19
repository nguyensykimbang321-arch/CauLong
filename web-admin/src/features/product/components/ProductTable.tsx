import React, { useState } from 'react';
import type { Product, ProductVariant } from '../types/product.types';
import { useProducts } from '../hooks/useProducts';
import { useModal } from '../hooks/useModal';
import { ProductService } from '../services/product.service';
import { message } from 'antd';

// Import trọn bộ Modals phục vụ các nút chức năng trên bảng
import { ProductFormModal } from './ProductFormModal';
import { VariantFormModal } from './VariantFormModal';
import { InventoryAdjustModal } from './InventoryModal';

export const ProductTable: React.FC = () => {
  // Trạng thái trigger reload danh sách sản phẩm khi hoàn tất thêm/sửa/nhập kho
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // 1. Gọi Hook lấy dữ liệu đã chia sẵn 2 danh sách, truyền kèm trigger làm mới
  const { loading, multiVariantList, singleVariantList, refetch } = useProducts(refreshTrigger);

  // 2. State quản lý Tab đang mở ('multi': Có phân loại, 'single': Tiêu chuẩn)
  const [activeTab, setActiveTab] = useState<'multi' | 'single'>('multi');

  // 3. State quản lý các dòng đang được Mở rộng (Xổ xuống) trong Danh sách 1
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // 4. Khởi tạo useModal bọc các payload dữ liệu tương ứng
  const productModal = useModal<Product>();
  const variantModal = useModal<{ productId: number; variant?: ProductVariant }>();
  const inventoryModal = useModal<{ variantId: number }>();

  const toggleExpandRow = (productId: number) => {
    setExpandedRows(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
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

  if (loading && refreshTrigger === 0) {
    return <div className="p-10 text-center text-lg text-gray-500 animate-pulse">Đang tải dữ liệu trên sân... 🏸</div>;
  }

  // =========================================================================
  // RENDER: DANH SÁCH 1 (SẢN PHẨM CÓ BIẾN THỂ)
  // =========================================================================
  const renderMultiVariantTable = () => (
    <table className="min-w-full leading-normal">
      <thead>
        <tr className="bg-gray-100 text-left text-gray-600 font-semibold uppercase text-sm">
          <th className="px-5 py-3 border-b-2 border-gray-200 w-10"></th>
          <th className="px-5 py-3 border-b-2 border-gray-200">Sản phẩm</th>
          <th className="px-5 py-3 border-b-2 border-gray-200">Danh mục</th>
          <th className="px-5 py-3 border-b-2 border-gray-200">Số biến thể</th>
          <th className="px-5 py-3 border-b-2 border-gray-200 text-center">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {multiVariantList.length === 0 && (
          <tr><td colSpan={5} className="p-4 text-center text-gray-500">Không có sản phẩm nào có biến thể.</td></tr>
        )}
        {multiVariantList.map((product) => {
          const isExpanded = expandedRows.includes(product.id);
          const isDeleted = !!product.deleted_at;
          return (
            <React.Fragment key={product.id}>
              {/* DÒNG SẢN PHẨM CHA */}
              <tr className={`hover:bg-blue-50 transition-colors ${isDeleted ? 'opacity-50' : ''}`}>
                <td className="px-5 py-4 border-b border-gray-200 text-center cursor-pointer" onClick={() => toggleExpandRow(product.id)}>
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

              {/* BẢNG CON (CÁC BIẾN THỂ) NẰM XỔ XUỐNG DƯỚI */}
              {isExpanded && (
                <tr className="bg-gray-50">
                  <td colSpan={5} className="p-4 border-b border-gray-200">
                    <div className="ml-12 border-l-4 border-blue-400 pl-4">
                      <h4 className="font-semibold text-gray-600 mb-2">Các phiên bản của {product.name}</h4>
                      <table className="min-w-full bg-white rounded shadow-sm">
                        <thead className="bg-gray-200 text-gray-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-2 text-left">SKU</th>
                            <th className="px-4 py-2 text-left">Thuộc tính</th>
                            <th className="px-4 py-2 text-left">Giá</th>
                            <th className="px-4 py-2 text-left">Tồn kho</th>
                            <th className="px-4 py-2 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.variants?.map(variant => {
                            const inv = variant.inventory_levels;
                            const isLowStock = inv && inv.available_quantity <= inv.low_stock_threshold;
                            const isVarDeleted = !!variant.deleted_at;

                            return (
                              <tr key={variant.id} className={`border-b text-sm ${isVarDeleted ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-2">{variant.sku}</td>
                                <td className="px-4 py-2">
                                  {variant.attributes && Object.entries(variant.attributes).map(([k, v]) => (
                                    <span key={k} className="inline-block bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-xs mr-1">{k}: {String(v)}</span>
                                  ))}
                                </td>
                                <td className="px-4 py-2 font-medium">{(variant.price_cents).toLocaleString('vi-VN')} đ</td>
                                <td className="px-4 py-2">
                                  {inv ? (
                                    <span className={`font-bold ${isLowStock ? 'text-red-600 flex items-center gap-1 animate-pulse' : 'text-green-600'}`}>
                                      {inv.available_quantity} {isLowStock && <span title={`Sắp hết hàng! (Dưới mức ${inv.low_stock_threshold})`}>⚠️ sắp hết</span>}
                                    </span>
                                  ) : <span className="text-gray-400">N/A</span>}
                                </td>
                                <td className="px-4 py-2 flex justify-center gap-3">
                                  <button type="button" onClick={() => inventoryModal.open({ variantId: variant.id })} disabled={isVarDeleted} className="text-blue-600 hover:underline disabled:text-gray-400">Nhập kho</button>
                                  <button type="button" onClick={() => variantModal.open({ productId: product.id, variant })} disabled={isVarDeleted} className="text-yellow-600 hover:underline disabled:text-gray-400">Sửa</button>
                                  <button type="button" onClick={() => handleToggleVariantStatus(product.id, variant.id)} className="text-gray-600 hover:underline">{isVarDeleted ? 'Phục hồi' : 'Xóa'}</button>
                                </td>
                              </tr>
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
  );

  // =========================================================================
  // RENDER: DANH SÁCH 2 (SẢN PHẨM TIÊU CHUẨN)
  // =========================================================================
  const renderSingleVariantTable = () => (
    <table className="min-w-full leading-normal">
      <thead>
        <tr className="bg-gray-100 text-left text-gray-600 font-semibold uppercase text-sm">
          <th className="px-5 py-3 border-b-2 border-gray-200">Sản phẩm</th>
          <th className="px-5 py-3 border-b-2 border-gray-200">Danh mục</th>
          <th className="px-5 py-3 border-b-2 border-gray-200">Giá</th>
          <th className="px-5 py-3 border-b-2 border-gray-200">Tồn kho</th>
          <th className="px-5 py-3 border-b-2 border-gray-200 text-center">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {singleVariantList.length === 0 && (
          <tr><td colSpan={5} className="p-4 text-center text-gray-500">Không có sản phẩm tiêu chuẩn nào.</td></tr>
        )}
        {singleVariantList.map((product) => {
          const variant = product.variants?.[0]; // Lấy variant duy nhất làm đại diện
          const inv = variant?.inventory_levels;
          const isLowStock = inv && inv.available_quantity <= inv.low_stock_threshold;
          const isDeleted = !!product.deleted_at;

          return (
            <tr key={product.id} className={`hover:bg-gray-50 ${isDeleted ? 'opacity-50' : ''}`}>
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
              <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium">
                {variant ? `${(variant.price_cents).toLocaleString('vi-VN')} đ` : '-'}
              </td>
              <td className="px-5 py-4 border-b border-gray-200 text-sm">
                {inv ? (
                  <span className={`font-bold ${isLowStock ? 'text-red-600 flex items-center gap-1' : 'text-green-600'}`}>
                    {inv.available_quantity} {isLowStock && <span title={`Cảnh báo: Kho sắp hết! (Dưới mức ${inv.low_stock_threshold})`}>⚠️ sắp hết</span>}
                  </span>
                ) : <span className="text-gray-400">N/A</span>}
              </td>
              <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                <div className="flex justify-center gap-2">
                  <button 
                    type="button"
                    onClick={() => variant && inventoryModal.open({ variantId: variant.id })} 
                    disabled={!variant || isDeleted} 
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Nhập kho
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
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* KHU VỰC ĐIỀU HƯỚNG TABS & NÚT THÊM CHUNG */}
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('multi')}
            className={`font-semibold pb-3 border-b-2 text-base transition-colors ${activeTab === 'multi' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Sản phẩm có biến thể ({multiVariantList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`font-semibold pb-3 border-b-2 text-base transition-colors ${activeTab === 'single' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Sản phẩm tiêu chuẩn ({singleVariantList.length})
          </button>
        </div>
        
        <button 
          type="button"
          onClick={() => productModal.open()}
          className="bg-blue-600 text-white px-5 py-2 rounded-md shadow font-medium hover:bg-blue-700 transition"
        >
          + Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* KHU VỰC HIỂN THỊ BẢNG THEO TAB ĐƯỢC CHỌN */}
      <div className="overflow-x-auto">
        {activeTab === 'multi' ? renderMultiVariantTable() : renderSingleVariantTable()}
      </div>

      {/* ========================================================================= */}
      {/* KHU VỰC LỒNG CÁC COMPONENTS POPUP MODALS ĐỂ XỬ LÝ SỰ KIỆN */}
      {/* ========================================================================= */}
      <ProductFormModal 
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