import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { AuthService } from '../services/auth.service';
import ThreeSportsBackground from '../../../components/ThreeSportsBackground';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../../types/api.type';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const response = await AuthService.login({
        email: values.email,
        password: values.password,
      });

      const { user, token } = response.data;

      if (user.role === 'customer') {
        message.error('Khách hàng không có quyền truy cập trang quản trị!');
        return;
      }

      setAuth(user, token);
      message.success('Đăng nhập thành công!');

      navigate('/');
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-4">
      <ThreeSportsBackground />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 shadow-lg ring-1 ring-blue-300/30">
            <span className="text-3xl">🏆</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-wide text-white">
            THỂ THAO VIP
          </h1>

          <p className="mt-2 text-sm text-blue-100/80">
            Đăng nhập hệ thống quản trị
          </p>
        </div>

        <Form
          name="admin_login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-blue-500" />}
              placeholder="Email admin@thethaovip.com"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-blue-500" />}
              placeholder="Mật khẩu"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              className="h-11 w-full rounded-lg bg-blue-600 font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-500"
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <p className="mt-6 text-center text-xs text-blue-100/60">
          Admin Dashboard · Powered by THỂ THAO VIP
        </p>
      </div>
    </div>
  );
};

export default LoginPage;