import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../features/auth/components/login';
import BookingPage from '../features/booking/components/BookingPage'; // Trang Table cũ của em
import BookingSchedulePage from '../features/booking/components/BookingSchedulePage';
import FacilityPage from '../features/facility/components/FacilityPage';

// --- TẠM THỜI MOCK CÁC COMPONENT ĐỂ TEST UI ---
const DashboardPage = () => <div className="p-4 font-semibold text-lg text-gray-700">Trang Tổng quan (Thống kê doanh thu)</div>;
const CourtListPage = () => <div className="p-4 font-semibold text-lg text-gray-700">Trang Quản lý Sân (Badminton, Tennis...)</div>;
const PricingPage = () => <div className="p-4 font-semibold text-lg text-gray-700">Trang Cấu hình Bảng giá</div>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      {
        index: true, // Tương đương path: '/'
        element: <DashboardPage />,
      },
      
      // 1. NHÓM QUẢN LÝ ĐẶT SÂN
      {
        path: 'booking',
        children: [
          {
            index: true, 
            element: <Navigate to="schedule" replace /> 
          },
          {
            path: 'schedule',
            element: <BookingSchedulePage />, // <--- Tí nữa mình sẽ ráp code Sa bàn vào đây!
          },
          {
            path: 'list',
            element: <BookingPage />, // Trang danh sách Table cũ của em
          },
        ]
      },

      // 2. NHÓM QUẢN LÝ CƠ SỞ & SÂN
      {
        path: 'facility',
        children: [
          {
            index: true,
            element: <Navigate to="branches" replace />
          },
          {
            path: 'branches',
            element: <FacilityPage />,
          },
          {
            path: 'courts',
            element: <CourtListPage />,
          },
        ]
      },

      // 3. CÁC MODULE ĐỘC LẬP
      {
        path: 'pricing',
        element: <PricingPage />,
      },
      {
        path: 'products',
        element: <div className="p-4 font-semibold text-lg text-gray-700">Trang Hàng hóa & Kho (W2 code ở đây)</div>,
      },
      {
        path: 'staff',
        element: <div className="p-4 font-semibold text-lg text-gray-700">Trang Quản lý Nhân viên</div>,
      },
    ],
  },
]);