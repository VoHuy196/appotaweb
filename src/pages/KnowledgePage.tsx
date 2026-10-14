import { useMemo, useState } from 'react';
import { Card, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Eye } from 'lucide-react';
import { DOCUMENTS, USERS } from '../engine/data';
import { SCOPE_LABEL, TOPIC_LABEL, canAccess, fmtValue, getUser, validity } from '../engine/engine';
import { DEFAULT_AS_OF } from '../engine/tests';
import type { KnowledgeDoc, User } from '../engine/types';

const SCOPE_COLOR = { GROUP: 'geekblue', COMPANY: 'cyan', DEPARTMENT: 'purple' } as const;
const STATUS_COLOR = { ACTIVE: 'green', EXPIRED: 'default', DRAFT: 'orange' } as const;

interface Props {
  currentUser?: User;
}

export default function KnowledgePage({ currentUser }: Props) {
  const [viewer, setViewer] = useState<string>(currentUser ? currentUser.userId : 'U01');
  const user = getUser(viewer);

  const rows = useMemo(
    () => DOCUMENTS.map((d, i) => ({ ...d, key: i, acl: canAccess(user, d), valid: validity(d, DEFAULT_AS_OF) })),
    [user],
  );
  const usable = rows.filter((r) => !r.acl && !r.valid).length;

  const columns: ColumnsType<(typeof rows)[number]> = [
    {
      title: `Quyền của ${user.fullName}`, key: 'perm', width: 170, fixed: 'left',
      render: (_, r) => r.acl ? <Tag color="red">Chặn: {r.acl}</Tag>
        : r.valid ? <Tag>Loại: {r.valid}</Tag> : <Tag color="green">Được dùng</Tag>,
      filters: [{ text: 'Được dùng', value: 'ok' }, { text: 'Bị chặn quyền', value: 'acl' }, { text: 'Không hiệu lực', value: 'valid' }],
      onFilter: (v, r) => (v === 'ok' ? !r.acl && !r.valid : v === 'acl' ? !!r.acl : !r.acl && !!r.valid),
    },
    { title: 'Mã · phiên bản', key: 'id', width: 190, render: (_, r) => <><b>{r.docId}</b> <span className="text-slate-500">v{r.version}</span></> },
    { title: 'Tiêu đề', dataIndex: 'title', width: 260 },
    {
      title: 'Cấp', dataIndex: 'scopeLevel', width: 110,
      render: (s: KnowledgeDoc['scopeLevel']) => <Tag color={SCOPE_COLOR[s]}>{SCOPE_LABEL[s]}</Tag>,
      filters: Object.entries(SCOPE_LABEL).map(([value, text]) => ({ value, text })), onFilter: (v, r) => r.scopeLevel === v,
    },
    { title: 'Áp dụng', key: 'target', width: 170, render: (_, r) => `${r.targetCompany} / ${r.targetDept}` },
    {
      title: 'Chủ đề', dataIndex: 'topic', width: 130, render: (t: string) => TOPIC_LABEL[t] ?? t,
      filters: Object.entries(TOPIC_LABEL).map(([value, text]) => ({ value, text })), onFilter: (v, r) => r.topic === v,
    },
    { title: 'Giá trị', key: 'val', width: 170, render: (_, r) => <>{fmtValue(r.value, r.unit)} {r.isFloor && <Tag color="gold">mức sàn</Tag>}</> },
    { title: 'Trạng thái', dataIndex: 'status', width: 100, render: (s: KnowledgeDoc['status']) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
    { title: 'Hiệu lực', key: 'eff', width: 200, render: (_, r) => `${r.effectiveDate} → ${r.expirationDate ?? '…'}` },
    { title: 'Quyền tối thiểu', key: 'min', width: 130, render: (_, r) => `cấp ${r.minRoleLevel} · mật ${r.security}` },
    { title: 'Ban hành', dataIndex: 'issuer', width: 200 },
  ];

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="m-0 text-lg font-semibold">Kho tri thức & Ma trận phân quyền (17 văn bản mẫu)</h2>
          <p className="m-0 text-sm text-slate-500">
            Xem cách Rule Engine lọc kho dữ liệu <b>trước khi</b> bước vào tìm kiếm (ngày tra cứu {DEFAULT_AS_OF}).
            Với tài khoản <b>{user.fullName}</b>: có <b className="text-green-700">{usable}</b> tài liệu hợp lệ được phép truy xuất.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Eye size={16} /> Kiểm tra với quyền của:
          <Select className="w-72" value={viewer} onChange={setViewer}
            options={USERS.map((u) => ({ value: u.userId, label: `${u.fullName} · ${u.company}/${u.department}` }))} />
        </label>
      </div>
      <Table columns={columns} dataSource={rows} size="small" pagination={false} scroll={{ x: 1800 }}
        expandable={{ expandedRowRender: (r) => <p className="m-0 text-sm">{r.content}</p> }} />
    </Card>
  );
}
