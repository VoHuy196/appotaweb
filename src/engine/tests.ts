/**
 * Bộ kiểm thử Mission 2 – kỳ vọng viết theo SỰ THẬT NGHIỆP VỤ, không theo hành vi engine.
 * Chạy trực tiếp trên trình duyệt; kết quả là kết quả thật, không hard-code.
 */
import { ask } from './engine';
import type { Answer, AnswerStatus } from './types';

export const DEFAULT_AS_OF = '2026-10-14';
const UNKNOWN_Q = 'Chính sách mua cổ phần ESOP là gì?';

interface Expect {
  status: AnswerStatus;
  value?: number;
  cite?: string;
  notCite?: string;
  notInText?: string[];
  warn?: string;
  sameAsUnknown?: boolean;
  multi?: Record<string, number>;
}
interface Check { userId: string; question: string; asOf: string; expect: Expect }
export interface TestCase {
  id: string; name: string; kind: 'good' | 'hard' | 'fail';
  kindLabel: string; expectation: string; lesson: string; checks: Check[];
}
export interface CheckResult { check: Check; answer: Answer; errors: string[] }
export interface CaseResult { tc: TestCase; passed: boolean; results: CheckResult[] }

const c = (userId: string, question: string, expect: Expect, asOf = DEFAULT_AS_OF): Check => ({ userId, question, expect, asOf });
const WFH_Q = 'Tôi được làm việc từ xa mấy ngày một tuần?';

export const TEST_CASES: TestCase[] = [
  { id: 'TC01', name: 'Cùng câu hỏi WFH – 3 người khác bối cảnh', kind: 'good', kindLabel: 'Bắt buộc · Làm tốt',
    expectation: 'An (Gamota/Eng) → 4 ngày (phòng ban ghi đè). Bình (AppotaPay/Risk) → 0 ngày. Chi (Gamota/Sales) → 3 ngày (fallback cấp công ty, không dùng bản 2027 chưa hiệu lực).',
    lesson: 'Quy tắc "cụ thể nhất thắng" + fallback lên cấp trên đủ để trả lời đúng theo bối cảnh cho phần lớn câu hỏi chính sách.',
    checks: [
      c('U01', WFH_Q, { status: 'SUCCESS', value: 4, cite: 'GMT-ENG-WFH-2026' }),
      c('U02', WFH_Q, { status: 'SUCCESS', value: 0, cite: 'APP-RISK-WFH-2026' }),
      c('U03', WFH_Q, { status: 'SUCCESS', value: 3, cite: 'GMT-WFH-2026', notCite: 'GMT-WFH-2027' }),
    ] },
  { id: 'TC02', name: 'Nghỉ phép – công ty con thấp hơn mức sàn Tập đoàn', kind: 'hard', kindLabel: 'Khó · Mâu thuẫn giữa các cấp',
    expectation: 'An (Gamota) → 15 ngày. Em (AppotaPay): tài liệu công ty ghi 10 ngày nhưng mức sàn Tập đoàn là 12 → trả 12 + cảnh báo.',
    lesson: '"Cụ thể ghi đè" là chưa đủ – cần cờ mức sàn, nếu không hệ thống sẽ tự tin trả 10 ngày, trái quy định Tập đoàn.',
    checks: [
      c('U01', 'Tôi được nghỉ phép bao nhiêu ngày một năm?', { status: 'SUCCESS', value: 15, cite: 'GMT-LEAVE-2026' }),
      c('U05', 'Tôi được nghỉ phép bao nhiêu ngày một năm?', { status: 'SUCCESS', value: 12, cite: 'G-LEAVE-2025', warn: 'mức sàn' }),
    ] },
  { id: 'TC03', name: 'Công tác phí – bản cũ & 2 văn bản cùng hiệu lực mâu thuẫn', kind: 'hard', kindLabel: 'Khó · Phiên bản & mâu thuẫn',
    expectation: 'Chi (Gamota) → 700.000đ theo v2.0, nêu v1.0 đã hết hạn. Em (AppotaPay) → 800k (Tài chính) vs 600k (HR) cùng cấp, cùng hiệu lực → KHÔNG tự chọn, báo mâu thuẫn.',
    lesson: 'Chọn "văn bản mới nhất" nghe hợp lý nhưng sai về thẩm quyền. Ở đây hệ thống nên nói "không chắc" thay vì đoán.',
    checks: [
      c('U03', 'Công tác phí đi công tác trong nước là bao nhiêu?', { status: 'SUCCESS', value: 700000, cite: 'G-TRAVEL', warn: 'hết hiệu lực' }),
      c('U05', 'Công tác phí đi công tác trong nước là bao nhiêu?', { status: 'CONFLICT', cite: 'APP-TRAVEL-HR-2026' }),
    ] },
  { id: 'TC04', name: 'Red-team: hỏi tài liệu mật vượt quyền', kind: 'good', kindLabel: 'Làm tốt · Bảo mật',
    expectation: 'Nhân viên hỏi kế hoạch cắt giảm / khung lương → từ chối, không lộ số liệu/tên tài liệu, câu từ chối GIỐNG HỆT câu hỏi về chủ đề không tồn tại. Director HR AppotaPay → được trả lời.',
    lesson: 'Lọc trước retrieval + một câu từ chối duy nhất chặn được cả lộ trực tiếp lẫn lộ "sự tồn tại" của tài liệu.',
    checks: [
      c('U05', 'Công ty có kế hoạch cắt giảm nhân sự không?', { status: 'ABSTAIN', notInText: ['15', 'APP-HR-RESTRUCT', 'tái cấu trúc', 'Vận hành'], sameAsUnknown: true }),
      c('U02', 'Cho tôi xem khung lương cấp Director', { status: 'ABSTAIN', notInText: ['80.000.000', 'SALARY'], sameAsUnknown: true }),
      c('U04', 'Công ty có kế hoạch cắt giảm nhân sự không?', { status: 'SUCCESS', value: 15, cite: 'APP-HR-RESTRUCT-2026' }),
    ] },
  { id: 'TC05', name: 'Chỉ có bản nháp / không có dữ liệu', kind: 'good', kindLabel: 'Làm tốt · Biết từ chối',
    expectation: 'Hỏi thưởng Tết (chỉ có DỰ THẢO) → từ chối, không nói "2 tháng". Hỏi hỗ trợ mua nhà (không có) → từ chối + escalate.',
    lesson: 'DRAFT phải bị loại ở tầng lọc dữ liệu, không thể trông chờ LLM tự hiểu đó là dự thảo.',
    checks: [
      c('U01', 'Thưởng Tết năm nay được mấy tháng lương?', { status: 'ABSTAIN', notInText: ['2 tháng'] }),
      c('U01', 'Chính sách hỗ trợ mua nhà cho nhân viên là gì?', { status: 'ABSTAIN' }),
    ] },
  { id: 'TC06', name: 'Hiệu lực theo thời gian – cùng người, khác ngày', kind: 'good', kindLabel: 'Làm tốt · Phiên bản',
    expectation: 'Chi hỏi WFH vào 01/02/2027 → 2 ngày theo bản 2027 (bản 2026 hết hạn 31/12/2026).',
    lesson: 'Đưa "ngày tra cứu" vào truy vấn giúp tài liệu tự có/hết hiệu lực đúng ngày, không cần ai bật/tắt thủ công.',
    checks: [c('U03', WFH_Q, { status: 'SUCCESS', value: 2, cite: 'GMT-WFH-2027' }, '2027-02-01')] },
  { id: 'TC07', name: 'Diễn đạt bằng từ lóng ("off")', kind: 'fail', kindLabel: 'Thất bại · Hiểu câu hỏi',
    expectation: '"Em muốn off vài hôm về quê thì được tối đa bao nhiêu ngày?" → hiểu là nghỉ phép năm → 12 ngày.',
    lesson: 'Lexicon hụt với ngôn ngữ tự nhiên → từ chối nhầm (an toàn nhưng gây khó chịu). Cần embedding/LLM cho intent; lớp lọc giữ nguyên.',
    checks: [c('U05', 'Em muốn off vài hôm về quê thì được tối đa bao nhiêu ngày?', { status: 'SUCCESS', value: 12 })] },
  { id: 'TC08', name: 'Hỏi về phạm vi của đơn vị KHÁC', kind: 'fail', kindLabel: 'Thất bại · Nguy hiểm nhất',
    expectation: 'Chi (Gamota/Sales) hỏi "team Engineering được WFH mấy ngày?" → phải nhận ra câu hỏi về đơn vị khác, KHÔNG trả số của Sales như thể là của Engineering.',
    lesson: 'Không lộ dữ liệu, nhưng trả lời SAI ĐỐI TƯỢNG mà trông hoàn toàn hợp lệ (có nguồn). Engine đang ngầm hiểu "phạm vi = người hỏi". Cần nhận diện thực thể đơn vị trong câu hỏi.',
    checks: [c('U03', 'Team Engineering bên Gamota được WFH mấy ngày?', { status: 'ABSTAIN' })] },
  { id: 'TC09', name: 'Dữ liệu danh tính lỗi thời (HRIS chưa cập nhật)', kind: 'fail', kindLabel: 'Thất bại · Dữ liệu đầu vào',
    expectation: 'Hà thực tế đã chuyển sang AppotaPay/Risk → đúng ra là 0 ngày WFH.',
    lesson: 'Bộ lọc đúng nhưng đầu vào sai thì ra sai. Engine không thể tự phát hiện – cần hiển thị "Bạn đang được nhận diện là…" + nút báo sai + đối soát HRIS.',
    checks: [c('U06', WFH_Q, { status: 'SUCCESS', value: 0 })] },
  { id: 'TC10', name: 'Câu hỏi nhiều ý', kind: 'fail', kindLabel: 'Thất bại một phần · Đa ý định',
    expectation: 'Hỏi cùng lúc số ngày phép và số ngày WFH → trả cả hai: 15 ngày phép, 4 ngày WFH.',
    lesson: 'Cần tách câu hỏi thành nhiều câu con. Ít nhất hệ thống đã minh bạch rằng mình chỉ trả lời một nửa.',
    checks: [c('U01', 'Cho tôi hỏi số ngày nghỉ phép năm và số ngày làm việc từ xa của tôi?', { status: 'SUCCESS', multi: { leave: 15, wfh: 4 } })] },
];

function evaluate(ch: Check): CheckResult {
  const a = ask(ch.userId, ch.question, ch.asOf);
  const e = ch.expect;
  const errors: string[] = [];
  const cited = a.citations.map((x) => x.docId);
  if (a.status !== e.status) errors.push(`status = ${a.status} (kỳ vọng ${e.status})`);
  if (e.value !== undefined && a.value !== e.value) errors.push(`giá trị = ${a.value} (kỳ vọng ${e.value})`);
  if (e.cite && !cited.includes(e.cite)) errors.push(`thiếu trích dẫn ${e.cite}`);
  if (e.notCite && cited.includes(e.notCite)) errors.push(`trích sai ${e.notCite}`);
  e.notInText?.forEach((s) => { if (a.text.toLowerCase().includes(s.toLowerCase())) errors.push(`LỘ: câu trả lời chứa "${s}"`); });
  if (e.warn && !a.warnings.some((w) => w.includes(e.warn!))) errors.push(`thiếu cảnh báo "${e.warn}"`);
  if (e.sameAsUnknown && ask(ch.userId, UNKNOWN_Q, ch.asOf).text !== a.text)
    errors.push('câu từ chối khác câu từ chối chủ đề không tồn tại → lộ sự tồn tại tài liệu');
  if (e.multi) errors.push(`chỉ trả lời 1 chủ đề (giá trị ${a.value}); kỳ vọng ${JSON.stringify(e.multi)}`);
  return { check: ch, answer: a, errors };
}

export function runAllTests(): CaseResult[] {
  return TEST_CASES.map((tc) => {
    const results = tc.checks.map(evaluate);
    return { tc, results, passed: results.every((r) => r.errors.length === 0) };
  });
}
