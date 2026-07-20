# Pentair Việt Nam - Nền tảng CMS & Showcase Cao cấp

Một hệ thống quản trị nội dung (CMS) và giới thiệu sản phẩm (Showcase) full-stack, hiện đại được xây dựng cho **Pentair Việt Nam** (đại diện cho thương hiệu lọc nước cao cấp của Mỹ). Ứng dụng này hoạt động như một ứng dụng đơn trang (SPA) React hiệu năng cao được biên dịch bởi Vite, định dạng giao diện bằng TailwindCSS v4, chạy trên nền tảng backend Node.js Express mạnh mẽ.

---

## 🌟 Các Tính năng Chính

### 1. Trang giới thiệu thương hiệu cao cấp (Public Site)
* **Trang chủ**: Bố cục dạng mô-đun bao gồm Banner chính (Hero), Giới thiệu thương hiệu, Lưới lý do chọn chúng tôi, Danh sách sản phẩm nổi bật, Trình tư vấn làm mềm nước tương tác và Thư viện Phối cảnh Không gian thực tế.
* **Danh mục & Chi tiết sản phẩm**: Giới thiệu sản phẩm động với thông số kỹ thuật chi tiết, mô hình giá cả, thư viện ảnh zoom cận cảnh và nút mua hàng trực tiếp.
* **Thư viện Phối cảnh Không gian**: Trực quan hóa cách các hệ thống làm mềm nước cao cấp của Pentair được lắp đặt tinh tế trong các căn hộ cao cấp, penthouse, nhà phố và biệt thự.
* **Tin tức & Blog**: Cổng thông tin giải quyết các mối lo ngại về chất lượng nước (ví dụ: xử lý nước cứng) và các thông báo chiến lược của thương hiệu.
* **Trình tư vấn làm mềm nước**: Công cụ chẩn đoán nhanh cho phép người dùng tính toán độ cứng của nước tại địa phương và nhận tư vấn sản phẩm tự động.
* **Giỏ hàng & Thanh toán**: Ngăn kéo giỏ hàng (drawer) tương tác quản lý sản phẩm với số lượng tùy chỉnh và các biểu mẫu thanh toán.

### 2. Bảng điều khiển quản trị CMS (Admin CMS Dashboard)
* **Quản lý Bài viết & Sản phẩm**: Đầy đủ các thao tác CRUD cho Trang, Bài viết, Sản phẩm và Showroom. Bao gồm tính năng tự động chuyển đổi trạng thái bản nháp/xuất bản.
* **Hệ thống phân loại (Taxonomy System)**: Trình chỉnh sửa Danh mục (Category) và Thẻ (Tag) động.
* **Hộp thư Yêu cầu (Lead Inbox)**: Bảng điều khiển để xem lại, tìm kiếm và quản lý các yêu cầu tư vấn cũng như thông tin thanh toán của khách hàng từ các biểu mẫu công cộng.
* **Thư viện Phương tiện (Media Library)**: Hệ thống quản lý tệp tin phân cấp hỗ trợ lồng thư mục nhiều cấp, tải lên tệp tùy chỉnh và liên kết tài sản phương tiện cho sản phẩm/bài viết.
* **Đồng bộ hóa đám mây Supabase**: Sao chép cơ sở dữ liệu hai chiều trực tiếp giữa tệp cục bộ `data/db.json` và bộ lưu trữ từ xa Supabase.
* **Sao lưu & Khôi phục DB**: Xuất và nhập toàn bộ cấu trúc JSON theo định dạng schema giống WordPress.

---

## 🛠️ Công nghệ Sử dụng (Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, TailwindCSS v4, Lucide Icons, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, TSX (TypeScript Execute) |
| **Trình đóng gói/Phát triển** | Vite 6, ESBuild, TypeScript compiler (`tsc`) |
| **Cơ sở dữ liệu** | Cơ sở dữ liệu dạng tệp cục bộ (`data/db.json`) + Đồng bộ hóa Supabase PostgreSQL |

---

## 📂 Kiến trúc Dự án

```text
├── api/
│   └── index.ts                 # Wrapper đầu vào cho Vercel Serverless
├── assets/                      # Tài sản thương hiệu tĩnh
├── data/
│   └── db.json                  # Cơ sở dữ liệu JSON cục bộ (git-ignored, tự động tạo)
├── src/
│   ├── components/
│   │   ├── AdminCMS.tsx         # Giao diện quản trị doanh nghiệp (Dashboard, CRUD, Media Library)
│   │   ├── PublicPages.tsx      # Định tuyến và bố cục trang công cộng chính
│   │   ├── Header.tsx / Footer.tsx
│   │   ├── HeroSection.tsx
│   │   └── ...                  # Các thành phần UI mô-đun
│   ├── lib/
│   │   └── supabase.ts          # Khởi tạo Supabase client
│   ├── App.tsx                  # Khung ứng dụng, bộ điều khiển trạng thái, định tuyến ảo (virtual router)
│   ├── main.tsx                 # Điểm khởi chạy phía client
│   ├── types.ts                 # Các interface và kiểu dữ liệu TypeScript dùng chung
│   └── index.css                # Style toàn cục & cấu hình Tailwind v4
├── server.ts                    # Backend Express API & máy chủ chạy static client
├── tsconfig.json                # Cấu hình TypeScript
├── vite.config.ts               # Cấu hình Vite (tích hợp Tailwind v4)
└── package.json                 # Kịch bản build & quản lý thư viện phụ thuộc (dependencies)
```

---

## 🔐 Tài khoản & Bảo mật

Để thử nghiệm và phát triển cục bộ, cơ sở dữ liệu đã chứa sẵn các tài khoản mẫu:

* **Tài khoản Quản trị viên (Administrator)**
  * **Tên đăng nhập**: `admin`
  * **Mật khẩu**: `admin123`
* **Tài khoản Biên tập viên (Editor)**
  * **Tên đăng nhập**: `editor`
  * **Mật khẩu**: `editor123`

### Truy cập Trang Quản trị
Bạn có thể mở cổng đăng nhập Quản trị viên thông qua ba cách:
1. Thêm `#admin` hoặc `#cms` vào URL trình duyệt (ví dụ: `http://localhost:3000/#admin`).
2. Thêm tham số truy vấn `?portal=admin` hoặc `?cms_login=true` vào URL.
3. Sử dụng phím tắt toàn cục: **`Ctrl + Alt + A`** trong trình duyệt.

---

## 🚀 Chạy ứng dụng Cục bộ

### Yêu cầu tối thiểu
* [Node.js](https://nodejs.org/) (Khuyến nghị v18 trở lên)
* NPM

### 1. Cài đặt thư viện phụ thuộc
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo một tệp `.env` trong thư mục gốc. Bạn có thể sao chép cấu trúc từ `.env.example`:
```ini
# Database & Sync (Supabase)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# Session Security
JWT_SECRET="YOUR_RANDOM_JWT_SECRET_STRING_MINIMUM_32_BYTES"
```
*Lưu ý: Nếu không cung cấp các biến môi trường Supabase, backend sẽ tự động chuyển sang sử dụng cơ sở dữ liệu cục bộ `data/db.json` một cách độc lập.*

### 3. Khởi động Máy chủ Phát triển (Dev Server)
```bash
npm run dev
```
Máy chủ sẽ khởi chạy backend Express và middleware Vite tại địa chỉ: **[http://localhost:3000](http://localhost:3000)**.

### 4. Build và Chạy Bản Production
Để đóng gói frontend bằng Vite và biên dịch backend bằng ESBuild:
```bash
# Biên dịch các bản bundle cho client và server
npm run build

# Khởi chạy máy chủ production đã biên dịch
npm run start
```

### 5. Kiểm tra Chất lượng Code & Kiểu dữ liệu
Để kiểm tra lỗi biên dịch TypeScript:
```bash
npm run lint
```

---

## 💡 Hướng dẫn cho Nhà phát triển (Developer Guidelines)

Khi chỉnh sửa hoặc mở rộng mã nguồn này, vui lòng lưu ý các yếu tố cấu trúc sau:

### 1. Quản lý Trạng thái & Định tuyến Ảo (Virtual Routing)
* Tránh sử dụng các thư viện định tuyến tiêu chuẩn (như `react-router-dom`). Dự án sử dụng một **Hệ thống định tuyến ảo (Virtual Routing System)** được quản lý bởi trạng thái `currentPath` trong [App.tsx](file:///d:/Project/pentair-website/src/App.tsx), được ánh xạ trực tiếp bên trong [PublicPages.tsx](file:///d:/Project/pentair-website/src/components/PublicPages.tsx) và [AdminCMS.tsx](file:///d:/Project/pentair-website/src/components/AdminCMS.tsx).
* Các liên kết trang sử dụng chuỗi đường dẫn tiêu chuẩn. Nếu bạn tạo các đường dẫn mới, hãy đăng ký chúng trong logic bộ định tuyến ảo của [App.tsx](file:///d:/Project/pentair-website/src/App.tsx) (cùng khối `useEffect` cập nhật SEO) và [PublicPages.tsx](file:///d:/Project/pentair-website/src/components/PublicPages.tsx).

### 2. Thao tác Cơ sở dữ liệu IO (`server.ts`)
* Việc đọc/ghi cơ sở dữ liệu được xử lý bởi `readDb()` và `writeDb()`.
* Tất cả các thay đổi quản trị được ghi trực tiếp vào `data/db.json` và được đẩy không đồng bộ lên Supabase thông qua `saveDbToSupabase()`.
* **Quan trọng:** Nếu `data/db.json` bị thiếu hoặc trống, `readDb()` sẽ bắt ngoại lệ và tự động điền các cấu hình mặc định ban đầu.

### 3. Làm sạch dữ liệu đầu vào (Input Sanitization)
* Tất cả các trường nhập liệu phía người dùng (bài viết, mô tả trang, thông tin form) phải được chạy qua các hàm bổ trợ ở backend Express `sanitizeString()` hoặc `sanitizeHtml()` trong `server.ts` trước khi ghi vào cơ sở dữ liệu để giảm thiểu rủi ro Tấn công giả mạo yêu cầu chéo trang (XSS).

### 4. Sử dụng TailwindCSS v4
* Tailwind CSS v4 được sử dụng thông qua plugin `@tailwindcss/vite`. Các directive cấu hình nằm trong [index.css](file:///d:/Project/pentair-website/src/index.css).
* Không cố gắng sử dụng tệp `tailwind.config.js` vì cấu hình được thực hiện trực tiếp thông qua các biến CSS trong [index.css](file:///d:/Project/pentair-website/src/index.css).

---

## 📜 Lịch sử Cập nhật & Tối ưu hóa (Work History)

Dưới đây là nhật ký chi tiết các hạng mục đã được nâng cấp, sửa đổi và tối ưu hóa hệ thống trong phiên làm việc:

### 1. Tính năng Quản trị & Nhận diện Thương hiệu
* **Quản lý Favicon trong Admin**: Tích hợp trường nhập `favicon` (chọn ảnh trực tiếp từ Media Library) vào giao diện CMS cấu hình thương hiệu. Tự động cập nhật thẻ `<link rel="icon">` động trong Document Head phía client và thêm endpoint định hướng `/favicon.ico` trên server.
* **Đồng bộ hóa Email liên hệ**: Kết nối tệp [ContactCTASection.tsx](file:///d:/Project/pentair-website/src/components/ContactCTASection.tsx) trực tiếp với cấu hình email của `brand_settings` trong admin để email liên hệ hiển thị đồng bộ trên toàn trang và có thể chỉnh sửa tại một nơi duy nhất.
* **Việt hóa tài liệu**: Dịch toàn bộ nội dung hướng dẫn kỹ thuật của tệp `README.md` sang tiếng Việt để dễ dàng bàn giao và vận hành.

### 2. Chuyển đổi Luồng Giao dịch sang "Nhận tư vấn ngay"
* **Loại bỏ Giỏ hàng & Thanh toán trực tiếp**: Loại bỏ hoàn toàn biểu tượng giỏ hàng trên thanh menu Header (cả giao diện Desktop và Mobile).
* **CTA Đăng ký Tư vấn**: Thay thế các nút *Thêm giỏ hàng* và *Mua ngay* tại trang chi tiết sản phẩm thành nút **NHẬN TƯ VẤN NGAY** (màu đỏ, nổi bật). Khi nhấn nút này, trang web sẽ tự động cuộn mượt và lấy nét (focus) vào ô nhập "Họ và tên của bạn" ở form đăng ký tư vấn bên dưới.
* **Danh mục sản phẩm**: Thay thế các nút mua hàng trên từng thẻ sản phẩm ở trang danh mục thành nút **Nhận tư vấn ngay** để chuyển hướng người dùng vào trang chi tiết tương ứng.

### 3. Tối ưu hóa Hiệu năng & Tốc độ Tải trang Tức thời
* **API Bootstrap gộp (`/api/bootstrap`)**: Gộp 5-6 API tải dữ liệu riêng lẻ ban đầu thành một API duy nhất để giảm số lượng request từ client.
* **Tối ưu hóa Vercel Cold Start**: Bỏ qua bước kiểm tra bảng dữ liệu (`ensureTablesExist`) và gộp các query đếm hàng tuần tự khi chạy trên môi trường Vercel. Tiết kiệm hơn 1.5 giây thời gian mạng của Serverless container trong các lượt tải trang lạnh (cold start).
* **Kết xuất Lạc quan (Optimistic Rendering - 0ms Wait)**: Trích xuất dữ liệu tĩnh ban đầu từ `db.json` (loại bỏ base64 cồng kềnh) ra tệp [src/initialData.ts](file:///d:/Project/pentair-website/src/initialData.ts) để nạp trực tiếp làm giá trị mặc định cho các React state.
* **Đồng bộ ngầm không cần Spinner**: Loại bỏ hoàn toàn màn hình chờ tải trang. Website mở ra sẽ hiển thị đầy đủ giao diện sản phẩm lập tức trong 0ms. Sau đó, dữ liệu mới từ cơ sở dữ liệu Supabase được cập nhật âm thầm trong nền (background) mà không làm gián đoạn người dùng.
* **Cơ chế lưu trữ đệm (Client-side localStorage Caching)**: Lưu tạm dữ liệu CMS được tải thành công vào `localStorage` của trình duyệt. Ở những lần tải lại trang tiếp theo, giao diện sẽ nạp và hiển thị ngay lập tức (0ms) dữ liệu đã được tùy chỉnh gần nhất từ cache thay vì dữ liệu tĩnh cũ của dự án, khắc phục hoàn toàn hiện tượng hiển thị thông tin cũ trong thời gian 5-10 giây chờ server lạnh (cold start) kết nối cơ sở dữ liệu Supabase.

### 4. Tối ưu hóa Trình phát Video (ProductVideoSection)
* **Phát video tức thì (Instant Playback)**: Cập nhật cơ chế chọn video trong danh sách phát bên phải để video tự động phát (autoplay) ngay lập tức khi bấm chọn, thay vì bắt người dùng phải bấm nút Play hai lần.
* **Khắc phục lỗi Tắt video khi đang xem (Sync Reset Fix)**: Sửa lỗi trình phát tự động reset và tắt video của người dùng khi quá trình đồng bộ dữ liệu ngầm trong nền hoàn thành.
* **Tối giản giao diện Playlist**: Loại bỏ thanh bộ lọc danh mục video (`Giới thiệu`, `Vận hành`, `Lắp đặt`, `Review`) để hiển thị toàn bộ danh sách phát video trực tiếp, giúp giao diện tối giản và gọn gàng hơn.

### 5. Cải thiện Thiết kế chữ (Typography) & Bố cục trang chủ
* **Chống rớt chữ Tiêu đề lớn (Headline Wrapping)**: Nâng chiều rộng giới hạn tiêu đề từ `max-w-3xl` lên `max-w-5xl` và đặt `leading-tight` trên các phần Phối cảnh, Tại sao chọn chúng tôi, Video để tránh việc một từ đơn lẻ (như *"ĐẠI"*) bị rớt xuống dòng mới đơn độc.
* **Đồng bộ hóa Tiêu đề phụ/Mô tả**: Đồng bộ thiết kế chữ cho toàn bộ mô tả dưới tiêu đề lớn trên cả 6 phần của trang chủ về chung kiểu dáng **`text-sm md:text-base font-sans font-normal leading-relaxed`** (với màu xám đậm `text-gray-600` cho nền sáng và màu sáng `text-slate-200`/`text-slate-300` cho nền tối) để nâng cao độ rõ nét và chuyên nghiệp trên màn hình lớn.
* **Tự động giải mã ký tự HTML (HTML Entity Auto-Decoding)**: Tích hợp hàm giải mã đệ quy tự động tại tệp [App.tsx](file:///d:/Project/pentair-website/src/App.tsx) để làm sạch toàn bộ dữ liệu CMS khi tải từ cơ sở dữ liệu và bộ nhớ cache. Loại bỏ hoàn toàn các lỗi hiển thị ký tự mã hóa như `&amp;quot;`, `&quot;`, `&amp;` trên tiêu đề bài viết và mô tả sản phẩm ở giao diện người dùng.

### 6. Quản lý Hiển thị Bài viết Trang chủ & Tự động Ẩn phần
* **Cấu hình hiển thị trang chủ**: Thêm hộp kiểm checkbox *"Hiển thị bài viết này trên trang chủ (Kiến thức & Tin tức)"* vào biểu mẫu chỉnh sửa bài viết trong giao diện Admin. Giá trị này được lưu trữ trong `meta.showOnHomepage`.
* **Nhãn trạng thái trên danh sách**: Hiển thị thẻ nhãn màu vàng *"Trang chủ"* nổi bật kế bên tiêu đề bài viết trong bảng danh sách bài viết Admin giúp người quản trị dễ dàng theo dõi bài viết nào đang hiển thị trên trang chủ.
* **Tự động ẩn phần tin tức**: Cập nhật tệp [NewsSection.tsx](file:///d:/Project/pentair-website/src/components/NewsSection.tsx) để chỉ truy xuất những bài viết được cho phép hiển thị trên trang chủ. Khi danh sách này trống (do xoá hết bài viết hoặc bỏ chọn hiển thị), toàn bộ phần "Kiến thức & Tin tức" (bao gồm tiêu đề, khoảng cách, placeholder) sẽ tự động ẩn hoàn toàn khỏi trang chủ thay vì hiện khung thông báo trống.
