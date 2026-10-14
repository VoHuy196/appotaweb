/**
 * Permission-aware & scope-aware retrieval engine (port từ engine.py).
 * 1 Context → 2 Intent → 3 ACL filter (trước retrieval) → 4 Validity → 5 Retrieve
 * → 6 Scope resolution (ghi đè / mức sàn / mâu thuẫn) → 7 Answer có nguồn hoặc từ chối.
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

/** Lexicon chủ đề (đã bỏ dấu). Cố ý đơn giản để kết quả tất định – xem hạn chế TC07. */
const TOPIC_LEXICON: Record<string, string[]> = {
  leave: ['nghi phep', 'phep nam', 'ngay phep', 'nghi hang nam', 'annual leave'],
  wfh: ['wfh', 'lam viec tu xa', 'work from home', 'lam tai nha', 'remote'],
  travel: ['cong tac phi', 'di cong tac', 'phu cap cong tac'],
  bonus: ['thuong tet', 'luong thang 13', 'bonus'],
  oncall: ['on-call', 'oncall', 'truc ngoai gio', 'phu cap truc'],
  restructure: ['cat giam nhan su', 'tai cau truc', 'sa thai', 'layoff', 'cat giam'],
  salary_band: ['khung luong', 'bac luong', 'tran luong', 'salary band'],
};

/** Câu từ chối DUY NHẤT – giống hệt nhau dù tài liệu không tồn tại hay bị chặn quyền,
 *  để không làm lộ SỰ TỒN TẠI của tài liệu bị hạn chế. */
export const abstainMessage = (company: string) =>
  `Mình không tìm thấy quy định đang có hiệu lực, áp dụng cho bạn, để trả lời câu hỏi này. ` +
  `Để tránh trả lời sai, mình đã chuyển câu hỏi tới bộ phận phụ trách: HR ${company}.`;

export const normalize = (s: string) =>
  s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

export const fmtValue = (v: number, unit: string) =>
  `${v >= 1000 ? v.toLocaleString('vi-VN') : v} ${unit}`;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  const abstain = (topic: string | null): Answer => ({
    status: 'ABSTAIN', text: abstainMessage(user.company), value: null, topic, citations: [], warnings: [], trace,
  });

  t('1 · Bối cảnh', `${user.fullName} | ${user.company}/${user.department} | ${user.role} (cấp ${user.roleLevel}, mật ${user.clearance}) | ngày ${asOf}`);

  // 2. Intent
  const topics = detectTopics(query);
  t('2 · Chủ đề', topics.length ? topics.map((x) => TOPIC_LABEL[x]).join(', ') : 'KHÔNG XÁC ĐỊNH', topics.length ? 'info' : 'warn');
  if (!topics.length) return abstain(null);
  const topic = topics[0];
  const warnings: string[] = [];
  if (topics.length > 1)
    warnings.push(`Câu hỏi có nhiều chủ đề (${topics.map((x) => TOPIC_LABEL[x]).join(', ')}); MVP chỉ trả lời chủ đề chính: ${TOPIC_LABEL[topic]}.`);

  // 3. ACL – lọc trên TOÀN BỘ kho, trước khi tìm kiếm
  const permitted = DOCUMENTS.filter((doc) => {
    const r = canAccess(user, doc);
    if (r) t('3 · Lọc quyền', `CHẶN ${doc.docId} v${doc.version} (${r})`, 'block');
    return !r;
  });

  // 4. Validity
  const valid = permitted.filter((doc) => {
    const r = validity(doc, asOf);
    if (r) t('4 · Hiệu lực', `LOẠI ${doc.docId} v${doc.version} (${r})`, 'drop');
    return !r;
  });

  // 5. Retrieve trong tập đã lọc
  const cands = valid.filter((doc) => doc.topic === topic);
  t('5 · Truy xuất', `Ứng viên hợp lệ: ${cands.map((c) => c.docId).join(', ') || 'không có'}`, cands.length ? 'info' : 'warn');
  if (!cands.length) return abstain(topic);

  // 6. Scope resolution
  const topRank = Math.max(...cands.map((c) => SCOPE_RANK[c.scopeLevel]));
  const winners = cands.filter((c) => SCOPE_RANK[c.scopeLevel] === topRank);
  t('6 · Phạm vi', `Cấp cụ thể nhất: ${SCOPE_LABEL[winners[0].scopeLevel]} → ${winners.map((w) => w.docId).join(', ')}`, 'pick');

  if (new Set(winners.map((w) => w.value)).size > 1) {
    t('6 · Mâu thuẫn', 'Nhiều tài liệu cùng cấp, cùng hiệu lực, giá trị khác nhau → không tự chọn, escalate', 'warn');
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
    t('6 · Mức sàn', `${chosen.docId}=${value} thấp hơn mức sàn ${floor.docId}=${floor.value} → áp dụng mức sàn`, 'warn');
    warnings.push(`${chosen.docId} quy định ${fmtValue(value, chosen.unit)}, THẤP HƠN mức sàn bắt buộc của ${floor.docId} ` +
      `(${fmtValue(floor.value, floor.unit)}). Áp dụng mức sàn; đã báo ${chosen.owner} rà soát.`);
    chosen = floor;
    value = floor.value;
  }

  permitted
    .filter((x) => x.docId === chosen.docId && x.version !== chosen.version && x.status === 'EXPIRED')
    .forEach((old) => warnings.push(`Bản ${old.version} (${fmtValue(old.value, old.unit)}) đã hết hiệu lực từ ${old.expirationDate}; đang dùng bản ${chosen.version}.`));

  t('7 · Trả lời', `Dùng ${chosen.docId} v${chosen.version}`, 'pick');
  return {
    status: 'SUCCESS', text: chosen.content, value, unit: chosen.unit, topic, appliesTo: scopeText(chosen),
    citations: [cite(chosen)], warnings, trace,
  };
}
