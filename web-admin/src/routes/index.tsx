import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../features/auth/components/login';
import BookingPage from '../features/booking/components/BookingPage'; // Trang Table cũ của em
import BookingSchedulePage from '../features/booking/components/BookingSchedulePage';
import { StaffPage } from '../features/staff/components/StaffPage';
import { ProductTable } from '../features/product/components/ProductTable';
import PosPage from '../features/sale/components/PosPage';
import FacilityPage from '../features/facility/components/FacilityPage';
import CourtPage from '../features/court/components/CourtPage';
import PriceConfigPage from '../features/priceConfig/components/PriceConfigPage';
import OrderPage from '../features/sale/components/OrderPage';
import HolidayPage from '../features/holiday/components/HolidayPage';
import SystemConfigPage from '../features/systemConfig/components/SystemConfigPage';
import RevenuePage from '../features/revenue/components/RevenuePage';

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
        element: <RevenuePage />,
      },
      {
        path: 'revenue',
        element: <RevenuePage />,
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
            element: <CourtPage />,
          },
        ]
      },

      {
        path: 'employee',
        children: [
          {
            index: true,
            element: <Navigate to="pos" replace />
          },
          {
            path: 'pos',
            element: <PosPage />,
          },
          {
            path: 'orders',
            element: <OrderPage />,
          }
        ]
      },

      // 3. CÁC MODULE ĐỘC LẬP
      {
        path: 'pricing',
        element: <PriceConfigPage />,
      },
      {
        path: 'holidays',
        element: <HolidayPage />,
      },
      {
        path: 'system-configs',
        element: <SystemConfigPage />,
      },
      {
        path: 'products',
        element: <ProductTable />,
      },
      {
        path: 'staff',
        element: <StaffPage />, 
      },
    ],
  },
]);