import { useState } from 'react';
import { Alert, Button, Card, Collapse, Input, Tag, Timeline, Typography } from 'antd';
import {
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleSlash,
  Clock,
  FileText,
  Filter,
  GitMerge,
  HelpCircle,
  History,
  Send,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { ask, fmtValue, TOPIC_LABEL } from '../engine/engine';
import { DEFAULT_AS_OF } from '../engine/tests';
import type { Answer, ChatHistoryItem, TraceStep, User } from '../engine/types';

const { Text } = Typography;

const STATUS_META = {
  SUCCESS: { color: 'green', label: 'Có căn cứ hợp lệ', icon: <CheckCircle2 size={15} /> },
  ABSTAIN: { color: 'orange', label: 'Từ chối / Escalate', icon: <CircleSlash size={15} /> },
  CONFLICT: { color: 'red', label: 'Mâu thuẫn văn bản / Escalate', icon: <GitMerge size={15} /> },
} as const;

const TRACE_COLOR: Record<TraceStep['kind'], string> = {
  info: 'blue',
  block: 'red',
  drop: 'gray',
  pick: 'green',
  warn: 'orange',
};

interface Props {
  currentUser: User;
}

export default function ChatPage({ currentUser }: Props) {
  const [question, setQuestion] = useState('');
  const [asOf, setAsOf] = useState(DEFAULT_AS_OF);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);

  const handleAsk = (qToAsk?: string) => {
    const q = (qToAsk ?? question).trim();
    if (!q) return;

    const ans = ask(currentUser.userId, q, asOf);
    setCurrentAnswer(ans);
    setCurrentQuestion(q);

    const newItem: ChatHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      question: q,
      asOf,
      answer: ans,
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 9)]);
    setQuestion('');
  };

  const handleSelectHistory = (item: ChatHistoryItem) => {
    setCurrentQuestion(item.question);
    setCurrentAnswer(item.answer);
    setAsOf(item.asOf);
  };

  return (
    <div className="space-y-4">
      {/* Khung nhập câu hỏi trực tiếp của người dùng */}
      <Card className="shadow-xs" styles={{ body: { padding: 18 } }}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-500" />
            <span className="font-semibold text-slate-800">Đặt câu hỏi tra cứu chính sách</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={14} />
            <span>Ngày hiệu lực tra cứu:</span>
            <Input
              type="date"
              size="small"
              value={asOf}
              onChange={(e) => e.target.value && setAsOf(e.target.value)}
              className="w-36 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <Input.TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder={`Nhập câu hỏi của bạn (ví dụ: "Tôi được làm việc từ xa mấy ngày?", "Quy chế nghỉ phép năm", "Hạn mức công tác phí",...)...`}
            autoSize={{ minRows: 2, maxRows: 4 }}
            className="flex-1 text-sm"
          />
          <Button
            type="primary"
            size="large"
            icon={<Send size={16} />}
            onClick={() => handleAsk()}
            className="self-end md:self-auto"
            style={{ height: 'auto', minHeight: 48 }}
          >
            Tra cứu
          </Button>
        </div>

        {/* Gợi ý chủ đề thường hỏi */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <HelpCircle size={13} className="text-slate-400" />
          <span>Gợi ý chủ đề:</span>
          {['Làm việc từ xa (WFH)', 'Nghỉ phép năm', 'Công tác phí', 'Thưởng Tết', 'Trực on-call'].map(
            (topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  const sampleQ = `Chính sách ${topic.toLowerCase()} áp dụng cho tôi như thế nào?`;
                  setQuestion(sampleQ);
                  handleAsk(sampleQ);
                }}
                className="cursor-pointer rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 transition-colors hover:border-red-300 hover:text-red-600"
              >
                {topic}
              </button>
            ),
          )}
        </div>
      </Card>

      {/* Hiển thị kết quả tra cứu */}
      {currentAnswer ? (
        <Card className="shadow-xs" styles={{ body: { padding: 20 } }}>
          {/* Câu hỏi và bối cảnh người hỏi */}
          <div className="mb-4 rounded-md border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={12} /> Câu hỏi vừa tra cứu
              </span>
              <span>Ngày áp dụng: {asOf}</span>
            </div>
            <div className="mt-1 text-base font-semibold text-slate-800">
              “{currentQuestion}”
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-500">
              <span className="font-medium">Bối cảnh người hỏi:</span>
              <Tag icon={<UserIcon size={11} className="mr-0.5 inline" />}>{currentUser.fullName}</Tag>
              <Tag icon={<Building2 size={11} className="mr-0.5 inline" />}>{currentUser.company} / {currentUser.department}</Tag>
              <Tag>{currentUser.role}</Tag>
              <Tag color="cyan">Cấp {currentUser.roleLevel}</Tag>
              <Tag color={currentUser.clearance >= 3 ? 'purple' : 'default'}>Mức mật {currentUser.clearance}</Tag>
            </div>
          </div>

          {/* Phản hồi từ Assistant */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Tag color={STATUS_META[currentAnswer.status].color} className="flex items-center gap-1 text-sm py-1 px-2.5">
                {STATUS_META[currentAnswer.status].icon}
                {STATUS_META[currentAnswer.status].label}
              </Tag>
              {currentAnswer.topic && (
                <span className="text-xs text-slate-500">
                  Chủ đề phát hiện: <b>{TOPIC_LABEL[currentAnswer.topic] ?? currentAnswer.topic}</b>
                </span>
              )}
            </div>

            {/* Giá trị nổi bật (nếu có số liệu) */}
            {currentAnswer.status === 'SUCCESS' && currentAnswer.value !== null && (
              <div className="my-2 rounded-md bg-green-50/60 p-3.5 border border-green-200">
                <div className="text-xs font-medium text-green-800 uppercase tracking-wide">
                  Quy định áp dụng cho bạn
                </div>
                <div className="text-3xl font-extrabold text-green-700">
                  {fmtValue(currentAnswer.value, currentAnswer.unit ?? '')}
                </div>
              </div>
            )}

            {/* Nội dung diễn giải */}
            <div className="rounded-md bg-white p-3 border border-slate-200 text-sm leading-relaxed text-slate-800">
              {currentAnswer.text}
            </div>

            {/* Phạm vi áp dụng */}
            {currentAnswer.appliesTo && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Phạm vi văn bản áp dụng:</span>{' '}
                <Tag color="blue">{currentAnswer.appliesTo}</Tag>
              </div>
            )}

            {/* Danh sách căn cứ trích dẫn nguồn */}
            {currentAnswer.citations.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="text-xs font-semibold text-slate-600">Căn cứ trích dẫn:</div>
                {currentAnswer.citations.map((c) => (
                  <div
                    key={c.docId + c.version}
                    className="flex gap-2.5 rounded-md border border-slate-200 bg-slate-50/80 p-2.5 text-xs"
                  >
                    <FileText size={16} className="mt-0.5 shrink-0 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">
                        [{c.docId}] {c.title} — {c.section} (Phiên bản {c.version})
                      </div>
                      <div className="text-slate-500">
                        Hiệu lực từ: {c.effectiveDate} · Cơ quan ban hành: {c.issuer}
                        {currentAnswer.status === 'CONFLICT' && (
                          <span className="ml-2 font-bold text-red-600">
                            Giá trị quy định: {fmtValue(c.value, c.unit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cảnh báo vi phạm mức sàn hoặc phiên bản cũ */}
            {currentAnswer.warnings.map((w) => (
              <Alert
                key={w}
                type="warning"
                showIcon
                icon={<ShieldAlert size={16} />}
                message="Cảnh báo quy chế / Mức sàn"
                description={w}
                className="text-xs"
              />
            ))}

            {/* Audit Trace (Admin) */}
            <Collapse
              className="mt-3 bg-slate-50"
              size="small"
              items={[
                {
                  key: 'trace',
                  label: (
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Filter size={13} /> Audit Trace (Kiểm toán bảo mật & Quy tắc lọc tất định) ·
                      <span className="text-red-500 font-medium ml-1">
                        <Ban size={11} className="inline mr-0.5" />
                        Chặn {currentAnswer.trace.filter((t) => t.kind === 'block').length} ngoài quyền
                      </span>
                      {' · '}
                      <span className="text-slate-400">
                        Loại {currentAnswer.trace.filter((t) => t.kind === 'drop').length} hết hạn/nháp
                      </span>
                    </span>
                  ),
                  children: (
                    <Timeline
                      className="pt-2"
                      items={currentAnswer.trace.map((t, idx) => ({
                        key: idx,
                        color: TRACE_COLOR[t.kind],
                        content: (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-700">{t.step}</span>: {t.message}
                          </div>
                        ),
                      }))}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Card>
      ) : (
        <Card className="text-center py-10 shadow-xs" styles={{ body: { padding: 32 } }}>
          <Sparkles className="mx-auto text-red-400 mb-2" size={36} />
          <div className="text-base font-semibold text-slate-800">
            Xin chào {currentUser.fullName}!
          </div>
          <Text type="secondary" className="text-xs max-w-md mx-auto block mt-1">
            Bạn đang đăng nhập với tư cách <b>{currentUser.role}</b> tại <b>{currentUser.company} - {currentUser.department}</b>.
            Hãy nhập câu hỏi vào ô phía trên để nhận câu trả lời chính xác theo đúng quyền hạn và quy chế nội bộ.
          </Text>
        </Card>
      )}

      {/* Lịch sử câu hỏi gần đây trong phiên */}
      {history.length > 0 && (
        <Card
          size="small"
          title={
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <History size={14} /> Lịch sử tra cứu trong phiên làm việc
            </span>
          }
          styles={{ body: { padding: 12 } }}
        >
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistory(item)}
                className="flex cursor-pointer items-center justify-between py-2 text-xs transition-colors hover:bg-slate-50 px-2 rounded"
              >
                <div className="flex items-center gap-2 truncate">
                  <Tag
                    color={STATUS_META[item.answer.status].color}
                    className="m-0 text-[10px] py-0 px-1"
                  >
                    {item.answer.status}
                  </Tag>
                  <span className="font-medium text-slate-800 truncate">{item.question}</span>
                  {item.answer.value !== null && (
                    <span className="text-slate-500">
                      ({fmtValue(item.answer.value, item.answer.unit ?? '')})
                    </span>
                  )}
                </div>
                <span className="text-slate-400 shrink-0 ml-2">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
