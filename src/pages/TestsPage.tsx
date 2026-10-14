import { useState } from 'react';
import { Button, Card, Progress, Tag } from 'antd';
import { ArrowRight, CheckCircle2, Lightbulb, Play, XCircle } from 'lucide-react';
import { getUser, fmtValue } from '../engine/engine';
import { runAllTests, type CaseResult } from '../engine/tests';

const KIND_COLOR = { good: 'green', hard: 'gold', fail: 'volcano' } as const;

export default function TestsPage() {
  const [results, setResults] = useState<CaseResult[]>(() => runAllTests());
  const [ranAt, setRanAt] = useState(() => new Date());
  const passed = results.filter((r) => r.passed).length;

  return (
    <div className="space-y-4">
      <Card styles={{ body: { padding: 16 } }}>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="m-0 text-lg font-semibold">Bộ kiểm thử Mission 2 – chạy trực tiếp trên trình duyệt</h2>
            <p className="m-0 text-sm text-slate-500">
              Kỳ vọng được viết theo <b>sự thật nghiệp vụ</b>, không theo hành vi engine → các ca thất bại là thất bại thật, không bị che giấu.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Progress type="circle" size={64} percent={Math.round((passed / results.length) * 100)} format={() => `${passed}/${results.length}`} />
            <Button type="primary" icon={<Play size={14} />} onClick={() => { setResults(runAllTests()); setRanAt(new Date()); }}>
              Chạy lại
            </Button>
          </div>
        </div>
        <p className="mb-0 mt-2 text-xs text-slate-400">Lần chạy: {ranAt.toLocaleTimeString('vi-VN')}</p>
      </Card>

      {results.map(({ tc, passed: ok, results: rs }) => (
        <Card key={tc.id} styles={{ body: { padding: 16 } }} className={ok ? '' : 'border-red-200!'}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {ok ? <CheckCircle2 className="text-green-600" size={20} /> : <XCircle className="text-red-500" size={20} />}
            <span className="font-semibold">{tc.id} · {tc.name}</span>
            <Tag color={KIND_COLOR[tc.kind]}>{tc.kindLabel}</Tag>
            <Tag color={ok ? 'success' : 'error'} className="ml-auto">{ok ? 'ĐẠT' : 'CHƯA ĐẠT'}</Tag>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto_1.4fr]">
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Kỳ vọng</div>
              {tc.expectation}
            </div>
            <ArrowRight className="hidden self-center text-slate-400 md:block" size={18} />
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Kết quả thực tế</div>
              <ul className="m-0 space-y-1 pl-4">
                {rs.map(({ check, answer, errors }, i) => (
                  <li key={i}>
                    <b>{getUser(check.userId).fullName}</b>
                    {check.asOf !== '2026-10-14' && <span className="text-slate-500"> (ngày {check.asOf})</span>}
                    {' → '}
                    <Tag color={answer.status === 'SUCCESS' ? 'green' : answer.status === 'CONFLICT' ? 'red' : 'orange'}>{answer.status}</Tag>
                    {answer.value !== null && <b>{fmtValue(answer.value, answer.unit ?? '')}</b>}
                    {answer.citations.length > 0 && (
                      <span className="text-xs text-slate-500"> · {answer.citations.map((c) => `${c.docId} v${c.version}`).join(', ')}</span>
                    )}
                    {errors.length > 0 && <div className="text-xs text-red-600">↳ {errors.join('; ')}</div>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <span><b>Điều học được:</b> {tc.lesson}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
