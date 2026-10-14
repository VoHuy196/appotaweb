/**
 * Permission-aware & scope-aware retrieval engine (port từ engine.py).
 * 1 Context → 2 Intent & Scope Entity Extraction → 3 Boundary Check → 4 ACL filter → 5 Validity → 6 Retrieve
 * → 7 Scope resolution (ghi đè / mức sàn / mâu thuẫn) → 8 Answer có nguồn hoặc từ chối.
 * Quyền do rule engine tất định quyết định, KHÔNG dùng LLM.
 */
import { DOCUMENTS, USERS } from './data';
import type { Answer, Citation, KnowledgeDoc, ScopeLevel, TraceStep, User } from './types';

export const SCOPE_RANK: Record<ScopeLevel, number> = { GROUP: 0, COMPANY: 1, DEPARTMENT: 2 };
export const SCOPE_LABEL: Record<ScopeLevel, string> = { GROUP: 'Tập đoàn', COMPANY: 'Công ty', DEPARTMENT: 'Phòng ban' };

export const TOPIC_LABEL: Record<string, string> = {
  leave: 'Nghỉ phép', wfh: 'Làm việc từ xa', travel: 'Công tác phí', bonus: 'Thưởng',
  oncall: 'Trực on-call', restructure: 'Tái cấu trúc', salary_band: 'Khung lương',
};

/** Lexicon chủ đề (đã bỏ dấu). */
const TOPIC_LEXICON: Record<string, string[]> = {
  leave: ['nghi phep', 'phep nam', 'ngay phep', 'nghi hang nam', 'annual leave'],
  wfh: ['wfh', 'lam viec tu xa', 'work from home', 'lam tai nha', 'remote'],
  travel: ['cong tac phi', 'di cong tac', 'phu cap cong tac'],
  bonus: ['thuong tet', 'luong thang 13', 'bonus'],
  oncall: ['on-call', 'oncall', 'truc ngoai gio', 'phu cap truc'],
  restructure: ['cat giam nhan su', 'tai cau truc', 'sa thai', 'layoff', 'cat giam'],
  salary_band: ['khung luong', 'bac luong', 'tran luong', 'salary band'],
};

/** Câu từ chối DUY NHẤT – để không làm lộ SỰ TỒN TẠI của tài liệu bị hạn chế. */
export const abstainMessage = (company: string) =>
  `Mình không tìm thấy quy định đang có hiệu lực, áp dụng cho bạn, để trả lời câu hỏi này. ` +
  `Để tránh trả lời sai, mình đã chuyển câu hỏi tới bộ phận phụ trách: HR ${company}.`;

export const normalize = (s: string) =>
  s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

export const fmtValue = (v: number, unit: string) =>
  `${v >= 1000 ? v.toLocaleString('vi-VN') : v} ${unit}`;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface ScopeTarget {
  company: string | null;
  department: string | null;
}

/** Bóc tách thực thể phạm vi (Công ty / Phòng ban) xuất hiện trong câu hỏi */
export function detectScopeTarget(query: string): ScopeTarget {
  const q = normalize(query);
  let company: string | null = null;
  let department: string | null = null;

  if (q.includes('gamota')) {
    company = 'Gamota';
  } else if (q.includes('appotapay') || q.includes('appota pay')) {
    company = 'AppotaPay';
  }

  if (q.includes('engineering') || q.includes('ky thuat') || q.includes('dev') || q.includes('cntt') || q.includes('it')) {
    department = 'Engineering';
  } else if (q.includes('sales') || q.includes('kinh doanh') || q.includes('bd') || q.includes('thi truong')) {
    department = 'Sales';
  } else if (q.includes('risk') || q.includes('rui ro') || q.includes('kiem soat')) {
    department = 'Risk';
  } else if (q.includes('hr') || q.includes('nhan su')) {
    department = 'HR';
  }

  return { company, department };
}

export function detectTopics(query: string): string[] {
  const q = normalize(query);
  return Object.entries(TOPIC_LEXICON)
    .map(([topic, kws]) => ({
      topic,
      score: kws.filter((k) => new RegExp(`(^|[^\\p{L}\\d])${escapeRe(k)}(?=$|[^\\p{L}\\d])`, 'u').test(q)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.topic);
}

export function canAccess(user: User, doc: KnowledgeDoc): string | null {
  if (doc.targetCompany !== 'ALL' && doc.targetCompany !== user.company) return 'khác công ty';
  if (doc.targetDept !== 'ALL' && doc.targetDept !== user.department) return 'khác phòng ban';
  if (user.roleLevel < doc.minRoleLevel) return 'cấp bậc không đủ';
  if (user.clearance < doc.security) return 'mức bảo mật không đủ';
  return null;
}

export function validity(doc: KnowledgeDoc, asOf: string): string | null {
  if (doc.status === 'DRAFT') return 'bản nháp';
  if (doc.status === 'EXPIRED') return 'đã hết hiệu lực';
  if (doc.effectiveDate > asOf) return `chưa đến ngày hiệu lực (${doc.effectiveDate})`;
  if (doc.expirationDate && doc.expirationDate < asOf) return `hết hạn từ ${doc.expirationDate}`;
  return null;
}

const scopeText = (doc: KnowledgeDoc) =>
  doc.scopeLevel === 'GROUP' ? 'Toàn Tập đoàn Appota'
  : doc.scopeLevel === 'COMPANY' ? `Công ty ${doc.targetCompany} (mọi phòng ban)`
  : `Công ty ${doc.targetCompany} – Phòng ${doc.targetDept}`;

const cite = (x: KnowledgeDoc): Citation => ({
  docId: x.docId, version: x.version, title: x.title, section: x.section, effectiveDate: x.effectiveDate,
  owner: x.owner, issuer: x.issuer, value: x.value, unit: x.unit,
});

export const getUser = (id: string) => USERS.find((u) => u.userId === id)!;

export function ask(userId: string, query: string, asOf: string): Answer {
  const user = getUser(userId);
  const trace: TraceStep[] = [];
  const t = (step: string, message: string, kind: TraceStep['kind'] = 'info') => trace.push({ step, message, kind });
  const abstain = (topic: string | null, customMsg?: string, warningMsg?: string): Answer => ({
    status: 'ABSTAIN',
    text: customMsg ?? abstainMessage(user.company),
    value: null,
    topic,
    citations: [],
    warnings: warningMsg ? [warningMsg] : [],
    trace,
  });

  t('1 · Bối cảnh', `${user.fullName} | ${user.company}/${user.department} | ${user.role} (cấp ${user.roleLevel}, mật ${user.clearance}) | ngày ${asOf}`);

  // 2. Intent & Scope Target Extraction
  const topics = detectTopics(query);
  t('2 · Chủ đề', topics.length ? topics.map((x) => TOPIC_LABEL[x]).join(', ') : 'KHÔNG XÁC ĐỊNH', topics.length ? 'info' : 'warn');
  if (!topics.length) return abstain(null);
  const topic = topics[0];

  const targetScope = detectScopeTarget(query);
  if (targetScope.company || targetScope.department) {
    t('2 · Đích phạm vi', `Câu hỏi đề cập đích danh: Công ty=${targetScope.company ?? 'mặc định'}, Phòng ban=${targetScope.department ?? 'mặc định'}`);
  }

  // 3. Boundary Check: Cố tình hỏi về Công ty khác hoặc Phòng ban khác ngoài quyền
  if (targetScope.company && targetScope.company !== user.company) {
    t('3 · Giới hạn công ty', `CHẶN: Người hỏi thuộc ${user.company} nhưng cố vấn tin quy chế nội bộ của ${targetScope.company}`, 'block');
    return abstain(
      topic,
      `Bạn thuộc công ty ${user.company}, trong khi câu hỏi hướng tới quy định nội bộ của ${targetScope.company}. Theo chính sách phân quyền thông tin, hệ thống không cung cấp quy chế riêng của đơn vị khác cho nhân sự ngoài công ty. Vui lòng liên hệ HR ${targetScope.company} nếu bạn có nhu cầu công tác liên đơn vị.`,
      `Phát hiện câu hỏi hướng tới đơn vị khác (${targetScope.company}); người hỏi thuộc ${user.company}.`,
    );
  }

  if (targetScope.department && targetScope.department !== user.department && user.roleLevel < 4) {
    t('3 · Giới hạn phòng ban', `CHẶN: Người hỏi thuộc phòng ${user.department} nhưng hỏi quy chế riêng của phòng ${targetScope.department}`, 'block');
    return abstain(
      topic,
      `Bạn thuộc phòng ban ${user.department}, câu hỏi đề cập đến quy chế riêng của phòng ban ${targetScope.department}. Hệ thống chỉ cung cấp quy chế cấp phòng ban cho nhân sự trực thuộc phòng ban đó. Vui lòng liên hệ quản lý hoặc HR của phòng ${targetScope.department}.`,
      `Người hỏi thuộc phòng ${user.department}, không có thẩm quyền tra cứu quy chế riêng của phòng ${targetScope.department}.`,
    );
  }

  const warnings: string[] = [];
  if (topics.length > 1)
    warnings.push(`Câu hỏi có nhiều chủ đề (${topics.map((x) => TOPIC_LABEL[x]).join(', ')}); MVP chỉ trả lời chủ đề chính: ${TOPIC_LABEL[topic]}.`);

  // 4. ACL – lọc trên TOÀN BỘ kho, trước khi tìm kiếm
  const permitted = DOCUMENTS.filter((doc) => {
    const r = canAccess(user, doc);
    if (r) t('4 · Lọc quyền', `CHẶN ${doc.docId} v${doc.version} (${r})`, 'block');
    return !r;
  });

  // 5. Validity
  const valid = permitted.filter((doc) => {
    const r = validity(doc, asOf);
    if (r) t('5 · Hiệu lực', `LOẠI ${doc.docId} v${doc.version} (${r})`, 'drop');
    return !r;
  });

  // 6. Retrieve trong tập đã lọc
  const cands = valid.filter((doc) => doc.topic === topic);
  t('6 · Truy xuất', `Ứng viên hợp lệ: ${cands.map((c) => c.docId).join(', ') || 'không có'}`, cands.length ? 'info' : 'warn');
  if (!cands.length) return abstain(topic);

  // 7. Scope resolution
  const topRank = Math.max(...cands.map((c) => SCOPE_RANK[c.scopeLevel]));
  const winners = cands.filter((c) => SCOPE_RANK[c.scopeLevel] === topRank);
  t('7 · Phạm vi', `Cấp cụ thể nhất: ${SCOPE_LABEL[winners[0].scopeLevel]} → ${winners.map((w) => w.docId).join(', ')}`, 'pick');

  if (new Set(winners.map((w) => w.value)).size > 1) {
    t('7 · Mâu thuẫn', 'Nhiều tài liệu cùng cấp, cùng hiệu lực, giá trị khác nhau → không tự chọn, escalate', 'warn');
    const owners = [...new Set(winners.map((w) => w.owner))].join(', ');
    return {
      status: 'CONFLICT',
      text: `Mình tìm thấy các quy định ĐANG CÙNG HIỆU LỰC nhưng MÂU THUẪN nhau, nên không tự chọn một con số. ` +
            `Đã báo ${owners} xác nhận văn bản áp dụng. Bạn vui lòng chờ xác nhận trước khi dùng.`,
      value: null, topic, citations: winners.map(cite), warnings, trace,
    };
  }

  let chosen = winners[0];
  let value = chosen.value;
  const floor = cands.find((f) => f.isFloor && SCOPE_RANK[f.scopeLevel] < topRank && f.value > value);
  if (floor) {
    t('7 · Mức sàn', `${chosen.docId}=${value} thấp hơn mức sàn ${floor.docId}=${floor.value} → áp dụng mức sàn`, 'warn');
    warnings.push(`${chosen.docId} quy định ${fmtValue(value, chosen.unit)}, THẤP HƠN mức sàn bắt buộc của ${floor.docId} ` +
      `(${fmtValue(floor.value, floor.unit)}). Áp dụng mức sàn; đã báo ${chosen.owner} rà soát.`);
    chosen = floor;
    value = floor.value;
  }

  permitted
    .filter((x) => x.docId === chosen.docId && x.version !== chosen.version && x.status === 'EXPIRED')
    .forEach((old) => warnings.push(`Bản ${old.version} (${fmtValue(old.value, old.unit)}) đã hết hiệu lực từ ${old.expirationDate}; đang dùng bản ${chosen.version}.`));

  t('8 · Trả lời', `Dùng ${chosen.docId} v${chosen.version}`, 'pick');
  return {
    status: 'SUCCESS', text: chosen.content, value, unit: chosen.unit, topic, appliesTo: scopeText(chosen),
    citations: [cite(chosen)], warnings, trace,
  };
}
