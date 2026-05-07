import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  DashboardOutlined,  
  UserOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  SettingOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../features/auth/store/auth.store';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
    
    // NHÓM QUẢN LÝ ĐẶT SÂN
    { 
      key: '/booking', 
      icon: <CalendarOutlined />, 
      label: 'Quản lý Đặt Sân',
      children: [
        { key: '/booking/schedule', label: 'Sa bàn lịch sân' },
        { key: '/booking/list', label: 'Danh sách đơn hàng' },
      ]
    },

    // NHÓM CƠ SỞ VẬT CHẤT & GIÁ (Chỉ Admin mới thấy - Em có thể check role ở đây sau)
    {
      key: '/facility-management',
      icon: <AppstoreOutlined />,
      label: 'Cơ sở & Sân',
      children: [
        { key: '/facility/branches', label: 'Quản lý Cơ sở' },
        { key: '/facility/courts', label: 'Quản lý Sân' },
        { key: '/pricing', label: 'Cấu hình bảng giá' },
      ]
    },

    // CÁC MODULE KHÁC
    { key: '/products', icon: <SettingOutlined />, label: 'Hàng hóa & Kho' },
    { key: '/staff', icon: <UserOutlined />, label: 'Nhân viên' },
  ];

  const userMenu = {
    items: [
      { key: 'profile', label: 'Tài khoản của tôi', icon: <UserOutlined /> },
      { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: handleLogout, danger: true },
    ]
  };

  const getOpenKeys = () => {
    const paths = location.pathname.split('/').filter(i => i);
    if (paths.length > 1) {
      return [`/${paths[0]}`];
    }
    return [];
  };

  return (
    // 1. Thêm hasSider để AntD tự động chia bố cục ngang (Row)
    <Layout hasSider className="min-h-screen">
      
      {/* SIDEBAR */}
      <Sider 
        theme="light" // Khai báo rõ theme sáng cho AntD
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        style={{ background: '#fff' }} // Ép cứng màu trắng để không bị AntD đè
        // 2. Thêm h-screen và sticky để thanh menu luôn full màn hình và đứng im khi cuộn
        className="shadow-md h-screen sticky top-0 left-0 overflow-y-auto z-20" 
      >
        <div className="h-16 flex items-center justify-center font-bold text-xl text-blue-600 border-b">
          {collapsed ? 'VIP' : 'THỂ THAO VIP'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="mt-2 border-r-0"
        />
      </Sider>

      {/* 3. Thêm flex flex-col vào Layout bọc ngoài Content để xếp dọc */}
      <Layout className="flex flex-col min-h-screen">
        
        {/* HEADER */}
        <Header 
          style={{ padding: 0, background: '#fff' }} // Bắt buộc dùng style để xóa màu đen mặc định
          className="flex justify-between items-center shadow-sm px-4 sticky top-0 z-10"
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg w-16 h-16"
          />
          
          <div className="flex items-center gap-4 pr-4">
            <span className="font-medium text-gray-700">
              Chào, {user?.email || 'Quản trị viên'}
            </span>
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <Button type="primary" shape="circle" icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>

        {/* CONTENT */}
        {/* 4. Thêm flex-1 để Content giãn nở lấp đầy toàn bộ khoảng trống còn lại */}
        <Content className="flex-1 m-6 p-6 bg-white rounded-lg shadow-sm overflow-auto">
          <Outlet />
        </Content>
        
      </Layout>
    </Layout>
  );
};

export default AdminLayout;