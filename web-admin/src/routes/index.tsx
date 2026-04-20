import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';

// (Tạm thời mock các component để test, sau này em sẽ import từ thư mục features)
const DashboardPage = () => <div>Trang Tổng quan (Thống kê doanh thu)</div>;
const BookingPage = () => <div>Trang Quản lý Đặt Sân (W1 code ở đây)</div>;
const LoginPage = () => <div className="p-10 text-center">Trang Đăng Nhập (AuthLayout riêng)</div>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AdminLayout />, // Layout bao bọc bên ngoài
    children: [
      {
        index: true, // index = path '/'
        element: <DashboardPage />,
      },
      {
        path: 'booking',
        element: <BookingPage />,
      },
      {
        path: 'products',
        element: <div>Trang Hàng hóa (W2 code ở đây)</div>,
      },
      {
        path: 'staff',
        element: <div>Trang Nhân viên</div>,
      },
    ],
  },
]);