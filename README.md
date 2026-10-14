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

## 📝 3 CÂU HỎI BẮT BUỘC (MISSION 2)

### Câu 1: Phần quan trọng nhất bạn chọn để hiện thực hóa trong MVP là gì? Vì sao nếu phần này hoạt động, bạn tin rằng hướng giải quyết của mình là khả thi?

* **Phần quan trọng nhất được chọn:** Lớp quyết định tri thức tất định (**Deterministic Knowledge Decision Engine**) bao gồm:
  1. Nhận diện bối cảnh danh tính người hỏi từ HRIS (`UserContext`: Công ty, Phòng ban, Cấp bậc, Mức mật).
  2. Lọc quyền truy cập (ACL) và hiệu lực văn bản (Status, Effective Date) **TRƯỚC KHI** tìm kiếm (Pre-retrieval filtering) bằng Rule Engine logic cố định, không dùng LLM.
  3. Bóc tách thực thể phạm vi (Entity Scope Extraction) để ngăn chặn hành vi hỏi chéo đơn vị trái quyền.
  4. Cơ chế giải quyết phân cấp thứ bậc (*Phòng ban > Công ty > Tập đoàn*), kiểm soát mức sàn bắt buộc (*Floor rule*), và phát hiện mâu thuẫn văn bản cùng cấp (*Conflict escalation*).
  5. Cơ chế từ chối đồng nhất (*Uniform Abstain*) để bảo vệ sự tồn tại của văn bản mật.
* **Vì sao chứng minh tính khả thi:**
  - Trong bài toán doanh nghiệp đa tầng như Appota Group, nút thắt rủi ro nhất **không phải là tìm kiếm từ khóa hay khả năng sinh văn bản của AI** (các công nghệ này đã có sẵn và dễ dàng thay thế). Rủi ro chí mạng khiến các hệ thống RAG thông thường thất bại là: **làm rò rỉ dữ liệu mật ra bên ngoài (Permission Leak)**, **dùng sai phiên bản hết hạn/bản nháp**, hoặc **trả lời sai ngữ cảnh phòng ban/công ty con**.
  - Khi lớp quyết định này hoạt động độc lập và đạt độ tin cậy tuyệt đối (Permission leak rate = 0, Version accuracy = 100%), thì việc tích hợp thêm Vector Search hay LLM ở các giai đoạn sau đều hoàn toàn an toàn: **LLM chỉ được phép tiếp cận tập tri thức đã qua kiểm duyệt gắt gao**, nên dù LLM có ảo giác (hallucinate) cũng không thể làm lộ bí mật tổ chức.

---

### Câu 2: So với kế hoạch ở Mission 1, bạn đã thay đổi quyết định hoặc thiết kế nào? Điều gì trong quá trình làm khiến bạn thay đổi?

1. **Thay đổi 1: Tạm hoãn Vector Search & LLM, sử dụng Lexicon + Template trích xuất trực tiếp trong MVP.**
   - *Lý do:* Ở Mission 1 dự kiến dùng Hybrid Search (Vector + Keyword) + LLM Reranker. Nhưng khi bắt tay làm MVP, việc đưa Vector Search và LLM vào sẽ tạo ra tính ngẫu nhiên (non-deterministic) và khó cô lập nguyên nhân lỗi khi kiểm thử (không biết sai do lọc quyền hay do embedding). Việc dùng Lexicon + trích xuất nguyên văn giúp kiểm chứng tự động 100% tính chính xác của logic phân quyền bằng con số và mã văn bản.
2. **Thay đổi 2: Chuyển từ "mô tả nguyên tắc chung" sang Bộ 3 quy tắc phân xử định lượng cụ thể.**
   - *Lý do:* Mission 1 chỉ ghi "Cấp cụ thể ghi đè cấp chung, trừ mức sàn". Khi giả lập dữ liệu thực tế của AppotaPay (quy định nghỉ phép 10 ngày < sàn 12 ngày; 2 văn bản công tác phí của Tài chính 800k vs HR 600k), nguyên tắc chung bị tắc. MVP buộc phải bổ sung:
     - So sánh giá trị số định lượng đối với `is_floor = true`.
     - Nếu 2 văn bản cùng cấp, cùng hiệu lực nhưng khác giá trị $\rightarrow$ Đưa về trạng thái `CONFLICT`, không tự ý lấy bản mới nhất vì sai nguyên tắc thẩm quyền ban hành.
3. **Thay đổi 3: Thiết kế câu từ chối đồng nhất (Uniform Abstain Message).**
   - *Lý do:* Ban đầu dự định từ chối dạng *"Bạn không đủ quyền xem văn bản này"*. Nhưng khi viết kịch bản Red-team test (TC04), ta nhận ra câu báo lỗi đó vô tình xác nhận **sự tồn tại của văn bản mật** (Existence Leak). Do đó, MVP chuyển sang một mẫu từ chối giống hệt câu hỏi về chủ đề không tồn tại.
4. **Thay đổi 4: Bổ sung Bóc tách thực thể phạm vi (Entity Scope Extraction) & Kiểm tra ranh giới tổ chức.**
   - *Lý do:* Phát hiện qua kiểm thử tình huống thực tế (khi nhân sự AppotaPay hỏi về Gamota/Engineering). Mission 1 ngầm định phạm vi cần tìm chính là bối cảnh của người hỏi. Khi người dùng hỏi chéo đơn vị, hệ thống trả lời sai đối tượng. MVP đã nâng cấp phát hiện thực thể công ty/phòng ban trong câu hỏi để chặn hỏi chéo ngay từ đầu.

---

### Câu 3: Trường hợp nào hiện khiến hệ thống dễ trả lời sai hoặc sử dụng sai tri thức nhất? Bạn phát hiện và kiểm soát rủi ro đó như thế nào?

* **Trường hợp nguy hiểm nhất:** Câu trả lời **"Sai mà trông hoàn toàn đúng" (False Authority / Scope Misalignment)**.
  - Đây là trường hợp câu trả lời có nguồn trích dẫn hợp lệ, người hỏi có quyền xem, nhưng nội dung **sai đối tượng cần áp dụng**. Có 2 dạng:
    1. *Hỏi về phạm vi của đơn vị khác (TC08):* Người dùng hỏi quy chế của đơn vị B trong khi mình thuộc đơn vị A. Nếu hệ thống không bóc tách thực thể, nó sẽ lấy quy định của đơn vị A trả lời, khiến người dùng tưởng đó là quy định của đơn vị B.
    2. *Dữ liệu danh tính HRIS bị lỗi thời (TC09):* Nhân sự đã chuyển từ Sales sang Risk, nhưng HRIS chưa đồng bộ. Bộ lọc Rule engine vẫn chạy đúng 100% logic, nhưng kết quả sai do dữ liệu đầu vào (Input) sai.
* **Cách phát hiện:**
  - Xây dựng bộ Golden Test Suite theo **sự thật nghiệp vụ (Business Ground Truth)** chứ không viết theo hành vi sẵn có của code.
  - Tạo các persona đặc biệt có dữ liệu danh tính lỗi thời (`U06 - Vũ Thanh Hà`) và các câu hỏi cố tình vượt ranh giới công ty/phòng ban để kiểm tra phản ứng của hệ thống.
  - Sử dụng hệ thống **Audit Trace** ghi lại toàn bộ nhật ký bối cảnh danh tính và lý do loại bỏ từng tài liệu.
* **Cách kiểm soát rủi ro:**
  - *Kiểm soát hiện có trong MVP:*
    - Bổ sung bộ bóc tách thực thể phạm vi (`detectScopeTarget`): Chặn ngay khi phát hiện người hỏi tra cứu quy chế riêng của công ty/phòng ban khác.
    - Luôn đính kèm huy hiệu **"Áp dụng cho: Công ty X - Phòng ban Y"** trong câu trả lời để người dùng có thể tự kiểm tra chéo mắt thường.
    - Cơ chế Abstain / Conflict: Thà từ chối để escalate cho HR còn hơn đoán mò.
  - *Kiểm soát cho phiên bản tương lai:*
    - Hiển thị thanh thông báo: *"Bạn đang được nhận diện là: [Đơn vị/Chức danh]"* kèm nút **"Báo sai bối cảnh"** để nhân sự phản ánh nếu HRIS chưa cập nhật.
    - Cơ chế đồng bộ (sync) và đối soát dữ liệu danh tính HRIS theo thời gian thực (Webhook / IdP Sync).

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
