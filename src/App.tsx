import { useState } from 'react';
import { Avatar, Button, Layout, Tabs, Tag } from 'antd';
import {
  Building2,
  Database,
  FlaskConical,
  LogOut,
  MessagesSquare,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import ChatPage from './pages/ChatPage';
import KnowledgePage from './pages/KnowledgePage';
import LoginPage from './pages/LoginPage';
import TestsPage from './pages/TestsPage';
import type { User } from './engine/types';

const tab = (icon: React.ReactNode, text: string) => (
  <span className="flex items-center gap-1.5 font-medium">
    {icon}
    {text}
  </span>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('chat');

  return (
    <Layout className="min-h-screen bg-slate-100/60">
      {/* Header chính */}
      <Layout.Header className="flex h-auto! items-center justify-between border-b border-slate-200 bg-white! px-4! py-3! shadow-xs md:px-8!">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <ShieldCheck size={26} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-slate-900">
              Appota Knowledge Assistant
            </div>
            <div className="text-xs text-slate-500">
              Tra cứu tri thức theo bối cảnh & phân quyền tất định (Mission 2 MVP)
            </div>
          </div>
        </div>

        {/* Thông tin tài khoản đăng nhập */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="font-semibold text-slate-800 text-sm">{currentUser.fullName}</div>
              <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
                <Building2 size={11} /> {currentUser.company} · {currentUser.department}
                <Tag color="cyan" className="m-0 text-[10px] py-0 px-1">Cấp {currentUser.roleLevel}</Tag>
                <Tag color={currentUser.clearance >= 3 ? 'purple' : 'default'} className="m-0 text-[10px] py-0 px-1">
                  Mật {currentUser.clearance}
                </Tag>
              </div>
            </div>
            <Avatar
              style={{ backgroundColor: currentUser.avatarColor }}
              size={36}
              className="font-bold shrink-0"
            >
              {currentUser.fullName.split(' ').slice(-1)[0][0]}
            </Avatar>
            <Button
              type="text"
              danger
              icon={<LogOut size={16} />}
              onClick={() => setCurrentUser(null)}
              title="Đổi tài khoản đăng nhập"
              className="flex items-center text-xs"
            >
              <span className="hidden md:inline">Đổi tài khoản</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <UserIcon size={14} /> Chế độ Demo
          </div>
        )}
      </Layout.Header>

      {/* Nội dung ứng dụng */}
      <Layout.Content className="mx-auto w-full max-w-7xl px-4 py-5 md:px-8">
        {!currentUser ? (
          <LoginPage onLogin={(user) => setCurrentUser(user)} />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="custom-app-tabs"
            items={[
              {
                key: 'chat',
                label: tab(<MessagesSquare size={16} />, 'Trợ lý Tra cứu Chính sách'),
                children: <ChatPage currentUser={currentUser} />,
              },
              {
                key: 'tests',
                label: tab(<FlaskConical size={16} />, 'Bộ kiểm thử (10 Scenarios)'),
                children: <TestsPage />,
              },
              {
                key: 'kb',
                label: tab(<Database size={16} />, 'Kho tri thức & Phân quyền'),
                children: <KnowledgePage currentUser={currentUser} />,
              },
            ]}
          />
        )}
      </Layout.Content>

      <Layout.Footer className="bg-transparent! text-center text-xs text-slate-400 py-4">
        Appota Group © 2026 · Hệ thống tra cứu tri thức nội bộ có nhận thức bối cảnh & phân quyền tất định
      </Layout.Footer>
    </Layout>
  );
}
