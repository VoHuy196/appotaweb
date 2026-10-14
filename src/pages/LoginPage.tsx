import { useState } from 'react';
import { Avatar, Button, Card, Col, Form, Input, Row, Tag, Typography } from 'antd';
import { Building2, KeyRound, LogIn, Mail, ShieldAlert, UserCheck, User as UserIcon } from 'lucide-react';
import { USERS } from '../engine/data';
import type { User } from '../engine/types';

const { Title, Text } = Typography;

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [activeTab, setActiveTab] = useState<'quick' | 'form'>('quick');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFormLogin = (values: { username: string; password?: string }) => {
    const found = USERS.find(
      (u) => u.username.toLowerCase() === values.username.trim().toLowerCase(),
    );
    if (found) {
      setErrorMsg('');
      onLogin(found);
    } else {
      setErrorMsg('Tên đăng nhập không đúng. Vui lòng chọn một trong các tài khoản demo bên dưới.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-4">
      <div className="mb-6 text-center">
        <Title level={2} className="m-0! text-slate-800">
          Cổng Tra Cứu Tri Thức Nội Bộ Appota
        </Title>
        <Text type="secondary" className="text-sm">
          Đăng nhập bằng một trong các tài khoản demo để kiểm nghiệm hệ thống phản hồi theo đúng bối cảnh, quyền hạn và phạm vi tổ chức.
        </Text>
      </div>

      <div className="mb-4 flex justify-center gap-2">
        <Button
          type={activeTab === 'quick' ? 'primary' : 'default'}
          onClick={() => setActiveTab('quick')}
          icon={<UserCheck size={16} />}
        >
          Chọn nhanh tài khoản Demo (6 bối cảnh)
        </Button>
        <Button
          type={activeTab === 'form' ? 'primary' : 'default'}
          onClick={() => setActiveTab('form')}
          icon={<KeyRound size={16} />}
        >
          Đăng nhập bằng Form (Username/Password)
        </Button>
      </div>

      {activeTab === 'form' ? (
        <Card className="mx-auto max-w-md shadow-sm" styles={{ body: { padding: 24 } }}>
          <Title level={4} className="mb-4 text-center">
            Đăng nhập hệ thống
          </Title>
          {errorMsg && (
            <div className="mb-3 rounded bg-red-50 p-2 text-xs text-red-600">
              {errorMsg}
            </div>
          )}
          <Form
            layout="vertical"
            initialValues={{ username: 'an.nguyen', password: 'password123' }}
            onFinish={handleFormLogin}
          >
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập username' }]}
            >
              <Input prefix={<UserIcon size={14} className="text-slate-400" />} placeholder="e.g. an.nguyen" />
            </Form.Item>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password prefix={<KeyRound size={14} className="text-slate-400" />} placeholder="password123" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block icon={<LogIn size={16} />}>
              Đăng nhập
            </Button>
          </Form>

          <div className="mt-4 rounded bg-slate-50 p-3 text-xs text-slate-500">
            <div className="font-semibold text-slate-700">Tài khoản mẫu:</div>
            <div>• an.nguyen (Gamota / Kỹ sư)</div>
            <div>• binh.tran (AppotaPay / Quản trị rủi ro)</div>
            <div>• chi.le (Gamota / Sales)</div>
            <div>• dung.pham (AppotaPay / HR Director)</div>
            <div>• em.hoang (AppotaPay / Kỹ sư)</div>
            <div>• ha.vu (Gamota / Sales)</div>
            <div className="mt-1 text-slate-400">Mật khẩu chung: password123</div>
          </div>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {USERS.map((user) => (
            <Col key={user.userId} xs={24} md={12} lg={8}>
              <Card
                hoverable
                className="flex h-full flex-col justify-between border-slate-200 shadow-xs transition-all hover:border-red-400"
                styles={{ body: { padding: 16 } }}
              >
                <div>
                  <div className="flex items-start gap-3">
                    <Avatar
                      size={44}
                      style={{ backgroundColor: user.avatarColor }}
                      className="font-bold shrink-0"
                    >
                      {user.fullName.split(' ').slice(-1)[0][0]}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-800">{user.fullName}</div>
                      <div className="text-xs text-slate-500">{user.role}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Mail size={11} /> {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <Tag icon={<Building2 size={12} className="mr-1 inline" />} color="blue">
                      {user.company}
                    </Tag>
                    <Tag>{user.department}</Tag>
                    <Tag color="cyan">Cấp {user.roleLevel}</Tag>
                    <Tag color={user.clearance >= 3 ? 'purple' : 'default'}>
                      Mức mật {user.clearance}
                    </Tag>
                  </div>

                  <p className="mt-2.5 min-h-[50px] text-xs text-slate-600">
                    {user.description}
                  </p>

                  {user.groundTruthNote && (
                    <div className="mt-1 flex items-start gap-1 rounded bg-amber-50 p-1.5 text-[11px] text-amber-800">
                      <ShieldAlert size={12} className="mt-0.5 shrink-0" />
                      <span>{user.groundTruthNote}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="primary"
                  block
                  className="mt-3"
                  icon={<LogIn size={14} />}
                  onClick={() => onLogin(user)}
                >
                  Đăng nhập bối cảnh này
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
