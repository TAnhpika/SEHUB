# SEHUB — Tài liệu Phân tích Nghiệp vụ

> Nền tảng học tập & cộng đồng sinh viên FPT  
> Phiên bản 1.0 · Giai đoạn 1

---

# 1. TỔNG QUAN HỆ THỐNG

## 1.1 Mục tiêu & Phạm vi

SEHUB là nền tảng học tập trực tuyến tích hợp cộng đồng, được xây dựng riêng cho sinh viên Đại học FPT. Hệ thống kết hợp bốn nhóm tính năng lớn:


| Nhóm tính năng                   | Tương đương nền tảng  | Ghi chú                                  |
| -------------------------------- | --------------------- | ---------------------------------------- |
| Mạng xã hội – bài viết cộng đồng | Facebook / Reddit     | Feed, like, comment, follow, chat        |
| Kho đề thi & làm bài trực tuyến  | Udemy / Kahoot        | Trắc nghiệm, nộp GitHub, OCR đề thi      |
| Thư viện tài liệu học tập        | Google Drive / Scribd | PDF, DOCX, PPTX; phân quyền Free/Premium |
| Thanh toán & Trợ lý AI           | PayOS + ChatGPT       | Nạp token, giải thích đáp án bằng AI     |


> ⚠️ **Lưu ý từ Mentor:** Do phạm vi quá rộng, Giai đoạn 1 cần cắt giảm tối đa tính năng phụ và tập trung vào 4 phân hệ cốt lõi: **Auth · Feed bài viết · Làm bài trắc nghiệm · Quản lý tài liệu.**

## 1.2 Kiến trúc Vai trò (Actor)

Hệ thống có 4 actor chính, phân quyền theo tầng:


| Actor             | Mô tả                      | Yêu cầu tài khoản    | Số lượng dự kiến           |
| ----------------- | -------------------------- | -------------------- | -------------------------- |
| Guest             | Khách chưa đăng nhập       | Không cần            | Cao – mọi truy cập lần đầu |
| Student (Free)    | Sinh viên đăng ký miễn phí | Email / Google OAuth | Đa số người dùng           |
| Student (Premium) | Sinh viên trả phí          | Nâng cấp từ Free     | Thiểu số – nguồn doanh thu |
| Moderator         | Kiểm duyệt viên            | Do Admin cấp quyền   | Số ít – quản lý nội dung   |
| Admin             | Quản trị viên hệ thống     | Tạo sẵn              | 1–3 người                  |


---

# 2. PHÂN TÍCH ACTOR CHI TIẾT

## 2.1 Guest — Khách chưa đăng nhập

### Mục tiêu của Guest

- Khám phá nền tảng trước khi quyết định đăng ký.
- Xem nhanh đề thi, bài viết để đánh giá giá trị của SEHUB.

### Quyền truy cập


| Tính năng                                | Được phép | Ghi chú                          |
| ---------------------------------------- | --------- | -------------------------------- |
| Xem danh sách đề thi cuối kỳ & thực hành | ✅         | Chỉ xem metadata – không làm bài |
| Xem bài viết cộng đồng                   | ✅         | Chỉ đọc – không like/comment     |
| Xem bài viết nổi bật (sidebar)           | ✅         |                                  |
| Xem gói Premium                          | ✅         | Trang giới thiệu pricing         |
| Like, comment, follow, nhắn tin          | ❌         | Yêu cầu đăng nhập                |
| Làm bài trắc nghiệm                      | ❌         | Yêu cầu Premium                  |
| Xem tài liệu                             | ❌         | Yêu cầu đăng nhập                |


> 📌 **Luồng chính của Guest:** Vào trang → Xem feed/đề thi → Thấy nội dung bị khóa → CTA đăng ký tài khoản.

---

## 2.2 Student (Free) — Sinh viên cơ bản

### Mục tiêu của Student Free

- Tham gia cộng đồng: đọc, chia sẻ, thảo luận về học tập.
- Luyện tập qua đề thi và tài liệu có sẵn.
- Tích lũy điểm, streak, mở khóa danh hiệu để có động lực học.

### Tính năng cốt lõi


| Nhóm         | Tính năng                                    | Giới hạn Free                       |
| ------------ | -------------------------------------------- | ----------------------------------- |
| Nội dung     | Xem câu hỏi trong đề thi                     | Xem câu hỏi – không xem đáp án      |
| Nội dung     | Xem tài liệu học tập                         | Tối đa 3 trang / tài liệu           |
| Cộng đồng    | Tạo, sửa, xóa bài viết                       | Markdown + tag, tối đa 10.000 ký tự |
| Cộng đồng    | Like, comment, reply, báo cáo bài viết       | Không giới hạn                      |
| Mạng xã hội  | Follow / nhắn tin thành viên                 | Cần đăng nhập; chat qua WebSocket   |
| Thông báo    | Like, comment, follow, cộng token, danh hiệu | Badge số lượng chưa đọc             |
| Gamification | Streak tuần, điểm, danh hiệu (26 loại)       | Tự động tích lũy                    |
| AI           | Giải thích đáp án bằng AI                    | 10 token / ngày (reset 00:00)       |
| Premium      | Mua gói nâng cấp (1m / 8m / 4y)              | Cần thanh toán qua PayOS            |


### Luồng Gamification

- Đăng bài → +10 điểm
- Nhận like → +2 điểm / like
- Streak 7 ngày liên tục → +20 điểm
- Đủ điểm → lên cấp: Bronze → Silver → Gold → Platinum
- Đạt Gold → voucher giảm 10% Premium; Platinum → giảm 20%

---

## 2.3 Student (Premium) — Sinh viên trả phí

### Giá trị gia tăng so với Free


| Tính năng                                      | Free          | Premium           |
| ---------------------------------------------- | ------------- | ----------------- |
| Xem đáp án đề thi                              | ❌             | ✅                 |
| AI giải thích đáp án                           | 10 token/ngày | 1.000 token/ngày  |
| Làm bài thi trực tuyến & xem kết quả           | ❌             | ✅                 |
| Nộp bài thực hành qua GitHub URL               | ❌             | ✅                 |
| Bình luận câu hỏi trong đề thi                 | ❌             | ✅                 |
| Trợ lý tư vấn thủ tục trường (chatbot)         | ❌             | ✅                 |
| Xem & tải full tài liệu (không giới hạn trang) | 3 trang       | ✅ Full + Download |


### Gói Premium


| Gói     | Thời hạn             | Voucher kèm       |
| ------- | -------------------- | ----------------- |
| 1 tháng | Trải nghiệm ngắn hạn | Không có          |
| 8 tháng | 1 học kỳ             | Voucher FTES 20%  |
| 4 năm   | Toàn khóa học        | Voucher FTES 100% |


---

## 2.4 Moderator — Kiểm duyệt viên

### Vai trò và trách nhiệm

Moderator là sinh viên hoặc cộng tác viên được Admin tin tưởng giao quyền quản lý nội dung. Họ không có quyền can thiệp vào cấu hình hệ thống hay tài khoản người dùng ngoài phạm vi kiểm duyệt.


| Nhóm quyền | Tính năng                             | Phạm vi                             |
| ---------- | ------------------------------------- | ----------------------------------- |
| Cộng đồng  | Xóa bài viết / bình luận vi phạm      | Toàn bộ nội dung công khai          |
| Cộng đồng  | Xử lý báo cáo (queue)                 | Chấp thuận xóa / Từ chối giữ nguyên |
| Cộng đồng  | Ghim / đề xuất bài nổi bật (sidebar)  | Trang chủ                           |
| Cộng đồng  | Duyệt nội dung (pre-moderation)       | Có thể bật/tắt theo chuyên mục      |
| Tài khoản  | Cảnh báo / khóa tạm tài khoản vi phạm | 1 ngày / 7 ngày / 30 ngày           |
| Đề thi     | Thêm đề thi cuối kỳ & thực hành       | Chờ Admin duyệt trước khi public    |


---

## 2.5 Admin — Quản trị viên hệ thống

### Toàn quyền hệ thống


| Phân hệ      | Quyền Admin                                                                       |
| ------------ | --------------------------------------------------------------------------------- |
| Đề thi       | CRUD đề thi (OCR ảnh + kiểm tra trùng SHA-256) + Duyệt đề từ Moderator            |
| Tài liệu     | Upload/phân loại/xóa tài liệu; phân quyền Free/Premium                            |
| Tài khoản    | Tìm kiếm, xem, khóa vĩnh viễn, mở khóa, reset mật khẩu                            |
| Phân quyền   | Nâng/thu hồi quyền Moderator;                                                     |
| Gamification | Cấu hình danh hiệu, ngưỡng cấp, điểm thưởng, voucher                              |
| Chatbot      | Cập nhật knowledge base, cấu hình prompt, xem lịch sử hội thoại                   |
| Thanh toán   | Xác nhận giao dịch PayOS, cộng token thủ công (audit trail bất biến), refund tiền |
| Thống kê     | Dashboard: người dùng, đề thi, tài liệu, doanh thu, kiểm duyệt                    |
|              |                                                                                   |



| Use Case      | Actor         | Luồng chính                                                                        | Lưu ý kỹ thuật                             |
| ------------- | ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| Đăng ký       | Guest         | Nhập email/username/password → Xác nhận → Tạo tài khoản. Hoặc: OAuth Google 1 bước | BCrypt mã hóa mật khẩu; validate real-time |
| Đăng nhập     | Student/Admin | Email hoặc username + password. Hoặc: OAuth Google                                 | Toggle show/hide password; JWT token       |
| Quên mật khẩu | Student       | Chọn Email/SMS → Gửi OTP → Xác minh OTP → Đặt lại mật khẩu                         | OTP có thời hạn; giới hạn số lần gửi       |
| Đăng xuất     | Student/Admin | Xóa session/token → Về trạng thái Guest                                            | Clear local storage/cookie                 |


---

## 3.2 Phân hệ Cộng đồng & Bài viết


| Feature            | Mô tả                                         | Actor    | Điều kiện |
| ------------------ | --------------------------------------------- | -------- | --------- |
| Feed bài viết      | Danh sách bài mới nhất, lọc theo kỳ/ngành     | Tất cả   |           |
| Tạo bài viết       | Markdown, tag, tối đa 10.000 ký tự            | Student+ | Đăng nhập |
| Tương tác bài viết | Like (+2đ), comment, reply, share, view count | Student+ | Đăng nhập |
| Báo cáo bài viết   | Gửi nội dung + lý do vi phạm                  | Student+ | Đăng nhập |
| Tìm kiếm bài viết  | Theo từ khóa, chủ đề, tag                     | Tất cả   |           |
| Bài viết nổi bật   | Sidebar hiển thị đề xuất từ Moderator         | Tất cả   |           |
| Streak & Thống kê  | Streak tuần, số ngày/bài học/phút học         | Student+ | Đăng nhập |


---

## 3.3 Phân hệ Đề thi cuối kỳ


| Feature              | Free                   | Premium                     | Mô tả                                   |
| -------------------- | ---------------------- | --------------------------- | --------------------------------------- |
| Danh sách đề thi     | ✅                      | ✅                           | Lọc theo kỳ học và chuyên ngành (AI/SE) |
| Chi tiết bộ đề       | ✅                      | ✅                           | Mã đề, loại đề, ngày tạo, số câu hỏi    |
| Xem câu hỏi          | ✅ (không có đáp án)    | ✅ (có đáp án)               | Điều hướng qua lại từng câu             |
| Làm bài trực tuyến   | ❌                      | ✅                           | 50 câu, nộp bài, ghi nhận kết quả       |
| AI giải thích đáp án | 1 lượt/ngày (10 token) | 100 lượt/ngày (1.000 token) | Token reset 00:00 hàng ngày             |
| Bình luận câu hỏi    | ❌                      | ✅                           | Thảo luận trực tiếp dưới từng câu       |


---

## 3.4 Phân hệ Đề thi thực hành


| Feature                | Mô tả                                      | Actor           |
| ---------------------- | ------------------------------------------ | --------------- |
| Danh sách đề thực hành | Lọc theo môn (vd: PRF192), loại đề, số câu | Tất cả          |
| Xem nội dung đề        | PDF/hình ảnh/text mô tả yêu cầu            | Tất cả          |
| Nộp bài qua GitHub URL | Paste link Repository URL vào hệ thống     | Premium         |
| Đề liên quan           | Gợi ý đề cùng môn học                      | Tất cả          |
| Xem danh sách nộp bài  | Danh sách sinh viên đã nộp (GitHub URL)    | Moderator/Admin |


---

## 3.5 Phân hệ Tài liệu học tập


| Feature                    | Free                           | Premium                      |
| -------------------------- | ------------------------------ | ---------------------------- |
| Xem tài liệu               | 3 trang / tài liệu             | Full access – không giới hạn |
| Tải tài liệu               | ❌                              | ✅ Download đầy đủ            |
| Phân loại tài liệu         | Theo kỳ & chuyên ngành (AI/SE) | Như Free                     |
| Câu hỏi ôn tập lý thuyết   | Xem (không làm bài)            | Xem + làm bài                |
| Bài tập thực hành tài liệu | Xem đề bài                     | Làm bài + gợi ý hướng dẫn    |


---

## 3.6 Phân hệ Hồ sơ & Gamification


| Feature             | Mô tả                                                         | Kỹ thuật                       |
| ------------------- | ------------------------------------------------------------- | ------------------------------ |
| Trang cá nhân       | Avatar, tên, cấp độ, điểm, thống kê hoạt động                 | Đọc từ DB                      |
| Heatmap 6 tháng     | Lịch nhiệt hiển thị mức độ hoạt động theo ngày                | Tính toán phức tạp – nên cache |
| Streak tuần         | Chuỗi học liên tục; thưởng +20đ mỗi 7 ngày                    | Cron job / event-driven        |
| 26 danh hiệu        | First Blogger, Fresh Dev, Active Learner... điều kiện rõ ràng | Quét điều kiện khi có sự kiện  |
| Cấp độ & Tiến trình | Bronze→Silver→Gold→Platinum; thanh tiến trình                 | Ngưỡng do Admin cấu hình       |
| Bài viết gần đây    | Danh sách bài của người dùng kèm like/comment                 | Phân trang                     |


---

## 3.7 Phân hệ Tìm kiếm & Nhắn tin


| Feature             | Mô tả                                                             | Actor    |
| ------------------- | ----------------------------------------------------------------- | -------- |
| Tìm kiếm người dùng | Theo tên/username; hiển thị cấp độ                                | Student+ |
| Follow              | Theo dõi thành viên; hiển thị follower/following                  | Student+ |
| Chat real-time      | WebSocket; lưu lịch sử; trạng thái đã đọc/chưa đọc                | Student+ |
| Thông báo           | Badge số lượng; các loại: like, comment, follow, token, danh hiệu | Student+ |


---

## 3.8 Phân hệ Premium & Thanh toán


| Bước          | Mô tả                                                    | Kỹ thuật                   |
| ------------- | -------------------------------------------------------- | -------------------------- |
| 1. Chọn gói   | Student chọn 1m / 8m / 4y trên trang Pricing             | UI                         |
| 2. Tạo đơn    | Hệ thống tạo mã QR / thông tin chuyển khoản qua PayOS    | PayOS API                  |
| 3. Thanh toán | Student chuyển khoản ngân hàng với mã đơn trong nội dung | Ngân hàng                  |
| 4. Webhook    | PayOS gửi webhook xác nhận về hệ thống                   | Webhook + signature verify |
| 5. Kích hoạt  | Admin xác nhận → Hệ thống cộng token / kích hoạt Premium | Audit trail bất biến       |


---

# 4. ĐÁNH GIÁ RỦI RO & ĐỀ XUẤT CẢI TIẾN

## 4.1 Rủi ro Nghiệp vụ (Business Logic)

### A. Đề thi thực hành thiếu luồng đánh giá

> 🔴 **Bất ổn:** Sinh viên nộp GitHub URL xong không nhận được trạng thái Đạt/Chưa đạt, điểm số, hay nhận xét. Luồng nghiệp vụ bị đứt gãy tại giai đoạn phản hồi.


| Tùy chọn giải pháp                                                             | Ưu điểm                       | Nhược điểm                           |
| ------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------ |
| Moderator nhận xét thủ công qua form                                           | Đơn giản, không cần dev nhiều | Không mở rộng được khi lượng bài lớn |
| Tích hợp auto-grade (test runner)                                              | Chính xác, nhanh              | Chi phí dev cao, phức tạp            |
| Tạm thời: thêm cột trạng thái (Đã xem / Đạt / Chưa đạt) cho Moderator cập nhật | MVP, đủ dùng Giai đoạn 1      | Vẫn cần người xét thủ công           |


**→ Đề xuất Giai đoạn 1:** Thêm cột trạng thái và ô nhận xét ngắn cho Moderator. Hiển thị kết quả cho sinh viên ngay trên giao diện nộp bài.

### B. Chat real-time – nguy cơ spam & thiếu bảo vệ người dùng

> 🔴 **Bất ổn:** Không có chức năng Block người dùng hoặc Report hội thoại. Môi trường cộng đồng sinh viên dễ bị spam quảng cáo, quấy rối học thuật.


| Cần bổ sung                                  | Mức độ ưu tiên     |
| -------------------------------------------- | ------------------ |
| Block người dùng (chặn nhắn tin)             | Cao                |
| Report hội thoại vi phạm gửi về Moderator    | Cao                |
| Rate limit tin nhắn (vd: tối đa 30 tin/phút) | Trung bình         |
| Lọc từ ngữ nhạy cảm tự động (keyword filter) | Thấp – Giai đoạn 2 |


### C. Pre-moderation thiếu quy trình chỉnh sửa & gửi lại

> 🔴 **Bất ổn:** Khi bài viết bị Reject, sinh viên không thể chỉnh sửa bài đó để gửi duyệt lại. Phải viết bài mới hoàn toàn → gây ức chế, giảm đóng góp cộng đồng.

**→ Đề xuất:** Thêm trạng thái Rejected cho bài viết. Cho phép tác giả chỉnh sửa bài Rejected rồi Submit lại (chuyển về Pending). Moderator nhận thông báo bài được gửi lại.

---

## 4.2 Rủi ro Kỹ thuật (Technical Risks)

### A. OCR + SHA-256 – lỗ hổng phát hiện trùng đề

> 🔴 **Bất ổn:** OCR không chính xác 100%. Sai 1 ký tự (O → 0) → hash SHA-256 thay đổi hoàn toàn → hệ thống nhận nhầm là đề mới → lưu trùng.


| Giải pháp bổ sung                  | Mô tả                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Normalize text trước khi hash      | Lowercase, trim, chuẩn hóa unicode, loại bỏ ký tự đặc biệt trước khi hash                      |
| Similarity matching (fuzzy search) | Dùng Levenshtein distance hoặc MinHash để phát hiện nội dung gần giống (>90% giống → cảnh báo) |
| Admin review trước khi lưu         | OCR xong → Admin xem kết quả trước → Xác nhận lưu                                              |


### B. Cron Job reset token – nguy cơ nghẽn Database

> 🔴 **Bất ổn:** Cập nhật đồng loạt hàng ngàn record vào đúng 00:00 → Table Lock → sập API khác đang chạy.


| Giải pháp                      | Mô tả                                                                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lazy reset (tính toán khi cần) | Không lưu giá trị token trong DB. Khi user dùng AI, kiểm tra: nếu ngày hiện tại ≠ ngày dùng cuối → coi như đã reset. Chỉ update 1 record khi user thực sự dùng. |
| Partition Cron Job theo batch  | Thay vì update tất cả lúc 00:00, chia thành nhiều batch nhỏ (vd: 100 records/giây) từ 00:00–00:05.                                                              |
| Sử dụng Redis TTL              | Lưu token count vào Redis với TTL = thời gian đến 00:00 ngày sau. Hết TTL = tự reset. Không tốn DB.                                                             |


**→ Đề xuất tốt nhất cho Giai đoạn 1:** Lazy reset – không cần Cron Job, không tốn tài nguyên, logic đơn giản.

### C. Gamification – gánh nặng tính toán trang cá nhân

> 🔴 **Bất ổn:** Mỗi lần tải trang cá nhân → backend phải tính lại heatmap 6 tháng + quét điều kiện 26 danh hiệu → high latency.


| Giải pháp                             | Mô tả                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Cache trang cá nhân (Redis)           | Cache kết quả heatmap + danh hiệu với TTL = 1 giờ. Invalidate cache khi có hành động mới.              |
| Event-driven badge check              | Thay vì quét điều kiện khi tải trang, chỉ kiểm tra điều kiện danh hiệu liên quan khi có event phù hợp. |
| Materialized View / Precomputed Stats | Duy trì bảng thống kê precomputed, cập nhật tăng dần khi có event. Trang cá nhân chỉ đọc bảng này.     |


---

# 5. ROADMAP & ƯU TIÊN GIAI ĐOẠN 1

> 🎯 **Mục tiêu Giai đoạn 1:** Hoàn thành tài liệu thiết kế và MVP của 4 phân hệ cốt lõi. Cắt tối đa tính năng phụ.


| Mức độ             | Phân hệ              | Feature cần hoàn thành                                                                                      | Cắt bỏ / Lùi Giai đoạn 2                              |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 🔴 P0 (Bắt buộc)   | Authentication       | Đăng ký (Email + OAuth Google), Đăng nhập, Quên mật khẩu (OTP), Đăng xuất                                   |                                                       |
| 🔴 P0 (Bắt buộc)   | Feed bài viết        | Xem feed, Tạo/sửa/xóa bài (Markdown), Like/comment/reply, Báo cáo bài viết, Bài viết nổi bật (sidebar)      | Pre-moderation, Streak & heatmap chi tiết             |
| 🔴 P0 (Bắt buộc)   | Làm bài trắc nghiệm  | Danh sách đề thi, Xem câu hỏi (Free), Xem đáp án + làm bài online (Premium), AI giải thích (token giới hạn) | Bình luận câu hỏi, Đề thực hành nộp GitHub            |
| 🔴 P0 (Bắt buộc)   | Quản lý tài liệu     | Upload/phân loại (Admin), Xem 3 trang (Free), Full access + download (Premium)                              | Câu hỏi ôn tập, bài tập thực hành tài liệu            |
| 🟡 P1 (Nên có)     | Hồ sơ & Gamification | Trang cá nhân cơ bản, Điểm + cấp độ, Một số danh hiệu cơ bản                                                | Heatmap 6 tháng, 26 danh hiệu đầy đủ, Streak chi tiết |
| 🟡 P1 (Nên có)     | Premium & PayOS      | Trang pricing, Tích hợp PayOS, Admin cộng token thủ công                                                    | Voucher tự động theo rank                             |
| 🟢 P2 (Có thể lùi) | Chat & Follow        | Follow cơ bản, Thông báo cơ bản                                                                             | Chat real-time WebSocket, Block/Report chat           |
| 🟢 P2 (Có thể lùi) | Chatbot AI tư vấn    | —                                                                                                           | Toàn bộ chatbot, Knowledge base cấu hình              |


## 5.1 Tóm tắt quyết định cắt giảm


| Feature bị cắt / lùi                   | Lý do                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| Chat real-time (WebSocket)             | Chi phí dev cao; cần giải quyết Block/Report trước; không cốt lõi Giai đoạn 1 |
| Heatmap 6 tháng                        | Gánh nặng tính toán; cần giải pháp cache trước khi launch                     |
| 26 danh hiệu đầy đủ                    | Cần cấu hình Gamification Engine hoàn chỉnh; lùi sau khi có user thật         |
| Chatbot tư vấn học vụ                  | Cần knowledge base riêng; không ảnh hưởng học tập cốt lõi                     |
| Đề thực hành nộp GitHub (đầy đủ)       | Thiếu luồng đánh giá – cần thiết kế lại trước khi build                       |
| Pre-moderation bật/tắt theo chuyên mục | Phức tạp; Giai đoạn 1 dùng post-moderation đơn giản hơn                       |


---

# 6. PHỤ LỤC – BẢNG TỔNG HỢP FEATURE THEO ACTOR


| Feature                      | Guest | Free          | Premium         | Mod             | Admin            |
| ---------------------------- | ----- | ------------- | --------------- | --------------- | ---------------- |
| Đăng ký / Đăng nhập          | ✅     | ✅             | ✅               | ✅               | ✅                |
| Xem danh sách đề thi         | ✅     | ✅             | ✅               | ✅               | ✅                |
| Xem câu hỏi (không đáp án)   | ✅     | ✅             | ✅               | ✅               | ✅                |
| Xem đáp án                   | ❌     | ❌             | ✅               | ✅               | ✅                |
| Làm bài trắc nghiệm online   | ❌     | ❌             | ✅               | ✅               | ✅                |
| AI giải thích đáp án         | ❌     | 10 token/ngày | 1000 token/ngày | 1000 token/ngày | ✅                |
| Nộp bài thực hành (GitHub)   | ❌     | ❌             | ✅               | ✅               | ✅                |
| Bình luận câu hỏi đề thi     | ❌     | ❌             | ✅               | ✅               | ✅                |
| Xem tài liệu                 | ❌     | 3 trang       | Full            | Full            | Full             |
| Tải tài liệu                 | ❌     | ❌             | ✅               | ✅               | ✅                |
| Xem bài viết                 | ✅     | ✅             | ✅               | ✅               | ✅                |
| Tạo/sửa/xóa bài viết         | ❌     | ✅             | ✅               | ✅               | ✅                |
| Like, comment, reply         | ❌     | ✅             | ✅               | ✅               | ✅                |
| Báo cáo bài viết             | ❌     | ✅             | ✅               | ✅               | ✅                |
| Follow / nhắn tin            | ❌     | ✅             | ✅               | ✅               | ✅                |
| Tích điểm, streak, danh hiệu | ❌     | ✅             | ✅               | ✅               | ❌                |
| Xóa nội dung vi phạm         | ❌     | ❌             | ❌               | ✅               | ✅                |
| Xử lý báo cáo                | ❌     | ❌             | ❌               | ✅               | ✅                |
| Ghim bài nổi bật             | ❌     | ❌             | ❌               | ✅               | ✅                |
| Cảnh báo / khóa tài khoản    | ❌     | ❌             | ❌               | ✅ (tạm)         | ✅ (vĩnh viễn)    |
| Thêm / duyệt đề thi          | ❌     | ❌             | ❌               | ✅ (thêm)        | ✅ (CRUD + duyệt) |
| Phân quyền hệ thống          | ❌     | ❌             | ❌               | ❌               | ✅                |
| Cấu hình Gamification        | ❌     | ❌             | ❌               | ❌               | ✅                |
| Dashboard thống kê           | ❌     | ❌             | ❌               | ❌               | ✅                |
| Cộng token / xác nhận PayOS  | ❌     | ❌             | ❌               | ❌               | ✅                |


---

*— Hết tài liệu — Phiên bản 1.0 · Giai đoạn 1*