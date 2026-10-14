import { Alert, Card, Collapse, Select, Tag, Timeline } from 'antd';
import { Ban, Building2, CheckCircle2, CircleSlash, FileText, Filter, GitMerge, ShieldAlert, User as UserIcon } from 'lucide-react';
import { USERS } from '../engine/data';
import { TOPIC_LABEL, fmtValue, getUser } from '../engine/engine';
import type { Answer, TraceStep } from '../engine/types';

const STATUS_META = {
  SUCCESS: { color: 'green', label: 'Có căn cứ', icon: <CheckCircle2 size={14} /> },
  ABSTAIN: { color: 'orange', label: 'Từ chối · Escalate', icon: <CircleSlash size={14} /> },
  CONFLICT: { color: 'red', label: 'Mâu thuẫn · Escalate', icon: <GitMerge size={14} /> },
} as const;

const TRACE_COLOR: Record<TraceStep['kind'], string> = { info: 'blue', block: 'red', drop: 'gray', pick: 'green', warn: 'orange' };

interface Props {
  userId: string;
  onUserChange: (id: string) => void;
  answer: Answer;
}

export default function AnswerPanel({ userId, onUserChange, answer }: Props) {
  const user = getUser(userId);
  const meta = STATUS_META[answer.status];
  const blocked = answer.trace.filter((t) => t.kind === 'block').length;
  const dropped = answer.trace.filter((t) => t.kind === 'drop').length;

  return (
    <Card className="h-full" styles={{ body: { padding: 16 } }}>
      {/* Người hỏi */}
      <Select
        className="w-full"
        value={userId}
        onChange={onUserChange}
        options={USERS.map((u) => ({ value: u.userId, label: `${u.fullName} · ${u.company}/${u.department}` }))}
      />
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Tag icon={<Building2 size={12} className="mr-1 inline" />}>{user.company}</Tag>
        <Tag>{user.department}</Tag>
        <Tag icon={<UserIcon size={12} className="mr-1 inline" />}>{user.role} · cấp {user.roleLevel}</Tag>
        <Tag color={user.clearance >= 3 ? 'purple' : 'default'}>Mức mật {user.clearance}</Tag>
      </div>
      {user.groundTruthNote && (
        <Alert className="mt-2" type="warning" showIcon title="Dữ liệu kiểm thử (engine không đọc)" description={user.groundTruthNote} />
      )}

      {/* Câu trả lời */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <Tag color={meta.color} className="flex items-center gap-1">{meta.icon}{meta.label}</Tag>
          {answer.topic && <span className="text-xs text-slate-500">Chủ đề: {TOPIC_LABEL[answer.topic]}</span>}
        </div>

        {answer.status === 'SUCCESS' && answer.value !== null && (
          <div className="my-2 text-3xl font-bold text-slate-800">{fmtValue(answer.value, answer.unit ?? '')}</div>
        )}
        <p className="text-sm text-slate-700">{answer.text}</p>

        {answer.appliesTo && (
          <div className="mt-2 text-sm"><span className="font-medium">Áp dụng cho:</span> {answer.appliesTo}</div>
        )}

        {answer.citations.length > 0 && (
          <div className="mt-3 space-y-2">
            {answer.citations.map((c) => (
              <div key={c.docId + c.version} className="flex gap-2 rounded-md border border-slate-200 bg-white p-2 text-xs">
                <FileText size={16} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <div className="font-semibold">[{c.docId}] v{c.version} · {c.section}</div>
                  <div className="text-slate-600">{c.title}</div>
                  <div className="text-slate-500">
                    Hiệu lực từ {c.effectiveDate} · Ban hành: {c.issuer}
                    {answer.status === 'CONFLICT' && <> · <b>{fmtValue(c.value, c.unit)}</b></>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {answer.warnings.map((w) => (
          <Alert key={w} className="mt-2" type="warning" showIcon icon={<ShieldAlert size={16} />} title={w} />
        ))}
      </div>

      {/* Audit trace */}
      <Collapse
        className="mt-3"
        size="small"
        items={[{
          key: 't',
          label: (
            <span className="flex items-center gap-2 text-xs">
              <Filter size={14} /> Audit trace (Admin) · <Ban size={12} className="text-red-500" /> chặn {blocked} · loại {dropped}
            </span>
          ),
          children: (
            <Timeline
              className="pt-2"
              items={answer.trace.map((t) => ({
                color: TRACE_COLOR[t.kind],
                content: <span className="text-xs"><b>{t.step}</b> — {t.message}</span>,
              }))}
            />
          ),
        }]}
      />
    </Card>
  );
}
