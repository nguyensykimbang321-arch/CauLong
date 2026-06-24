import React, {
  useState,
  useEffect
} from 'react';

import { message } from 'antd';

import { InventoryService } from '../services/inventory.service';

import { ProductService } from '../services/product.service';

import type {
  AdjustInventoryPayload,
  Facility
} from '../types/product.types';

interface InventoryAdjustModalProps {
  open: boolean;
  variantId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const InventoryAdjustModal: React.FC<InventoryAdjustModalProps> = ({ 
  open, 
  variantId, 
  onClose, 
  onSuccess 
}) => {
  // State quản lý form
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState<number | null>(null);
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<'import' | 'sale' | 'return' | 'adjustment'>('import');
  const [notes, setNotes] = useState('');

  // Reset form mỗi khi mở modal mới
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const res = await ProductService.getFacilities();

        setFacilities(res.data);

        if (
          res.data &&
          res.data.length > 0
        ) {
          setFacilityId(
            res.data[0].id
          );
        }
      } catch (error) {
        console.error(error);
        message.error(
          "Không tải được danh sách cơ sở"
        );
      }
    };
    loadFacilities();
  }, []);

  // Hàm xử lý khi bấm nút "Xác nhận"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Chặn hành vi reload trang của form HTML

    if (!variantId || quantity === '') {
      message.warning('Vui lòng nhập số lượng hợp lệ!');
      return;
    }

    try {
      setLoading(true);
      
      // Đóng gói dữ liệu gửi lên API
      const payload: AdjustInventoryPayload =
      {
        variant_id: variantId,
        facility_id: facilityId!,
        qty_delta: type === 'add' ? Number(quantity) : -Number(quantity),
        reason: reason,
        note: notes,
      };

      // Tung cú đập gọi API
      await InventoryService.adjustInventory(payload);
      
      message.success('Cập nhật tồn kho thành công!');
      onSuccess(); // Đóng modal và báo cho ProductTable load lại data
      
    } catch (error) {
      message.error('Lỗi khi cập nhật tồn kho!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Nếu state open = false thì không render gì cả (Ẩn modal)
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-md p-4">      
    {/* Khung Modal */}
      <div className="bg-white border border-black rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-up">
        
        {/* Nút X (Đóng) ở góc trên */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Cập nhật Tồn kho</h3>
        </div>

        {/* Form Nhập Liệu */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cơ sở
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              required
              value={
                facilityId ?? ""
              }
              onChange={(e) =>
                setFacilityId(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {facilities.map(
                (facility) => (
                  <option
                    key={
                      facility.id
                    }
                    value={
                      facility.id
                    }
                  >
                    {facility.name}
                  </option>
                )
              )}
            </select>
          </div>
          
          <div className="flex gap-4">
            {/* Cột 1: Loại giao dịch */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại giao dịch
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'add' | 'subtract')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="add">Nhập thêm (+)</option>
                <option value="subtract">Xuất / Trừ đi (-)</option>
              </select>
            </div>

            {/* Cột 2: Số lượng */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: 50"
              />
            </div>
          </div>

          {/* Lý do */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as 'import' | 'sale' | 'return' | 'adjustment')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="import">
                Nhập hàng mới
              </option>

              <option value="sale">
                Bán hàng
              </option>

              <option value="return">
                Hàng trả lại
              </option>

              <option value="adjustment">
                Điều chỉnh kiểm kê
              </option>
            </select>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập ghi chú giao dịch..."
            ></textarea>
          </div>

          {/* Khu vực Nút bấm (Footer) */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || quantity === ''}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};