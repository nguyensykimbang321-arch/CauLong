import React from 'react';
import { Menu, Layout } from 'antd';
import { TeamOutlined, ShoppingCartOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để lấy đường dẫn hiện tại

  // 1. Định nghĩa "đội hình" các mục trong Menu
  const menuItems: MenuProps['items'] = [
    // TODO: Sau này bạn có thể thêm Dashboard, Product... ở đây
    
    // Bao vợt "Nhân viên" (Menu xổ xuống)
    {
      key: 'employee-group',
      label: 'Nhân viên',
      icon: <TeamOutlined />,
      children: [
        {
          key: '/employee/pos',
          label: 'Bán hàng (POS)',
          icon: <ShoppingCartOutlined />,
        },
        {
          key: '/employee/orders',
          label: 'Quản lý Đơn hàng',
          icon: <AppstoreOutlined />,
        },
      ],
    },
  ];

  // 2. Hàm xử lý khi click vào 1 mục trong Menu
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    // e.key chính là '/employee/pos' hoặc '/employee/orders'
    navigate(e.key);
  };

  return (
    <Sider width={250} theme="light" className="min-h-screen border-r">
      {/* Logo hoặc Tên trang Web */}
      <div className="h-16 flex items-center justify-center font-bold text-xl border-b">
        🏸 Sân Cầu Lông
      </div>

      {/* Thanh Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}   // 💡 Tự động in đậm (highlight) cái menu đang đứng
        defaultOpenKeys={['employee-group']} // 💡 Mặc định mở sẵn cái bao vợt "Nhân viên"
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;