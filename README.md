# Appota Knowledge Assistant (MVP) - Web Demo

Ứng dụng web Prototype / MVP chứng minh giải pháp: **Permission-Aware & Scope-Aware RAG Engine** cho Appota Group.

Toàn bộ logic truy xuất và lọc quyền tất định (7 bước) chạy trực tiếp trên Client (TypeScript). Ứng dụng đã được đóng gói thành Single Page Application (SPA) tĩnh, sẵn sàng deploy lên Vercel/Netlify.

---

## 👥 6 Tài khoản Demo bối cảnh thực tế

Người dùng có thể đăng nhập bằng 1 cú click hoặc nhập username (mật khẩu chung: `password123`):

1. **`an.nguyen` (Nguyễn Văn An)**: Kỹ sư Phần mềm (Gamota / Engineering, Cấp 1, Mật 2).
   - Hưởng quy chế riêng cấp phòng ban: WFH tối đa 4 ngày/tuần, phụ cấp trực on-call.
2. **`binh.tran` (Trần Thị Bình)**: Chuyên viên Quản trị rủi ro (AppotaPay / Risk, Cấp 2, Mật 2).
   - Ràng buộc an ninh thanh toán PCI-DSS: Không được phép WFH (0 ngày/tuần).
3. **`chi.le` (Lê Minh Chi)**: Chuyên viên Phát triển thị trường (Gamota / Sales, Cấp 1, Mật 2).
   - Phòng ban không có quy chế WFH riêng $\rightarrow$ tự động kế thừa (fallback) chính sách công ty con Gamota (3 ngày/tuần).
4. **`dung.pham` (Phạm Quốc Dũng)**: Giám đốc Nhân sự (AppotaPay / HR, Director cấp 4, Mật 3 - Mật).
   - Lãnh đạo cấp cao: Có thẩm quyền truy cập văn bản tái cấu trúc nhân sự và khung lương bí mật.
5. **`em.hoang` (Hoàng Thu Em)**: Kỹ sư Vận hành (AppotaPay / Engineering, Cấp 1, Mật 2).
   - Thử nghiệm mức sàn: Quy chế công ty (10 ngày nghỉ phép) thấp hơn mức sàn Tập đoàn (12 ngày) $\rightarrow$ hệ thống tự áp dụng mức sàn.
   - Thử nghiệm mâu thuẫn: 2 văn bản công tác phí cùng hiệu lực $\rightarrow$ hệ thống từ chối chọn, báo mâu thuẫn.
6. **`ha.vu` (Vũ Thanh Hà)**: Chuyên viên (Gamota / Sales, Cấp 2, Mật 2).
   - Giả lập lỗi dữ liệu nhân sự (HRIS chưa cập nhật việc điều chuyển sang AppotaPay/Risk).

---

## 🎯 Cấu trúc ứng dụng Web

1. **Màn hình Đăng nhập (`LoginPage`)**:
   - Thẻ thông tin chi tiết của cả 6 nhân sự với đầy đủ: Họ tên, Email, Chức danh, Công ty, Phòng ban, Cấp bậc, Mức mật, Mô tả quyền hạn.
   - Hỗ trợ cả 2 chế độ: Chọn nhanh 1-Click hoặc Đăng nhập qua Form Username/Password.
2. **Trợ lý Tra cứu Chính sách (`ChatPage`)**:
   - Người dùng tự do nhập câu hỏi tùy ý (không dùng nút kịch bản dựng sẵn).
   - Tùy chỉnh ngày hiệu lực tra cứu (mặc định `2026-10-14`, có thể đổi sang `2027-02-01` để test văn bản tương lai).
   - Trả lời đầy đủ: Con số áp dụng, Diễn giải, Phạm vi áp dụng (Scope), Căn cứ trích dẫn nguồn, Cảnh báo mức sàn, và Audit Trace cho Admin.
   - Lưu lại lịch sử các câu hỏi đã tra cứu trong phiên làm việc.
   - Nút **"Đổi tài khoản"** trên Header giúp người dùng nhanh chóng đổi sang nhân sự khác để hỏi cùng một câu và quan sát kết quả khác biệt.
3. **Bộ kiểm thử 10 Tình huống (`TestsPage`)**:
   - Chạy trực tiếp 10 kịch bản kiểm thử trong bộ nhớ trình duyệt theo định dạng chuẩn Mission 2: *Kỳ vọng $\rightarrow$ Kết quả thực tế $\rightarrow$ Đạt/Chưa đạt $\rightarrow$ Điều học được*.
4. **Kho tri thức & Ma trận phân quyền (`KnowledgePage`)**:
   - 17 văn bản giả lập qua 3 cấp tổ chức.
   - Tự động hiển thị theo quyền của nhân sự đang đăng nhập (hoặc chọn nhân sự khác để xem thử).

---

## 🚀 Khởi chạy và Deploy

### Xem trực tiếp tại máy
```powershell
cd D:\appota-rag-web
npx vite preview --port 4173
```
Mở tại: `http://localhost:4173/`

### Deploy lên mạng (Netlify Drop)
1. Chạy `npm run build` để sinh thư mục `dist/`.
2. Mở [app.netlify.com/drop](https://app.netlify.com/drop) và kéo thả thư mục `D:\appota-rag-web\dist` vào trình duyệt để nhận link public gửi nhà tuyển dụng.
