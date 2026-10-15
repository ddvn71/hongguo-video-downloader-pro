# 🎬 HongguoHub Pro - Công Cụ Tìm Kiếm, Giải Mã & Tải Video Hồng Quả Đoản Kịch (红果免费短剧 / Fanqie Short Drama)

> Hệ thống tìm kiếm, trích xuất danh sách tập, giải mã luồng **CENC-AES-128-CTR (`spade_a`)** và tải video **Hongguo Short Drama (红果免费短剧 / 番茄短剧)** chất lượng **1080p Full HD** không watermark (kèm hỗ trợ Douyin / TikTok).
> Thiết kế chạy **100% Miễn Phí trên Cloudflare Pages & Workers**, kèm tùy chọn backend **Python Render.com** dự phòng và bộ trang **Landing Page + 6 Bài Viết Chuyên Sâu chuẩn duyệt Google AdSense**.

---

## 📑 MỤC LỤC
1. [Phân Tích Logic Tìm Kiếm & Tải Video Hongguo (红果短剧)](#1-phân-tích-logic-tìm-kiếm--tải-video-hongguo-红果短剧)
2. [Kiến Trúc Xoay Tua Đa Luồng API Miễn Phí (Smart Multi-Provider Failover)](#2-kiến-trúc-xoay-tua-đa-luồng-api-miễn-phí-smart-multi-provider-failover)
3. [Cơ Chế Giải Mã `spade_a` & CENC-AES-128-CTR (`encv` -> `hvc1`)](#3-cơ-chế-giải-mã-spade_a--cenc-aes-128-ctr-encv---hvc1)
4. [Tiêu Chuẩn Duyệt Google AdSense Đã Tích Hợp](#4-tiêu-chuẩn-duyệt-google-adsense-đã-tích-hợp)
5. [Cấu Trúc Thư Mục Dự Án](#5-cấu-trúc-thư-mục-dự-án)
6. [Hướng Dẫn Triển Khai Lên Cloudflare Free 100% (Khuyên Dùng)](#6-hướng-dẫn-triển-khai-lên-cloudflare-free-100-khuyên-dùng)
7. [Khi Nào Cần Dùng Render.com Python & Cách Triển Khai](#7-khi-nào-cần-dùng-rendercom-python--cách-triển-khai)
8. [Chạy Thử Nghiệm Tại Máy Cục Bộ (Localhost)](#8-chạy-thử-nghiệm-tại-máy-cục-bộ-localhost)

---

## 1. Phân Tích Logic Tìm Kiếm & Tải Video Hongguo (红果短剧)

Nền tảng **Hongguo Short Drama (红果免费短剧)** — thuộc hệ sinh thái **Fanqie Novel (番茄小说) / ByteDance** — phân phối video qua nhiều định dạng liên kết và giao thức bảo vệ:

### 🔍 1.1. Nhận diện đa định dạng đầu vào (`extractTargetFromInput`)
Công cụ tự động phân tích mọi loại đầu vào mà người dùng dán vào ô tìm kiếm:
- **Link chia sẻ rút gọn từ App**: `https://www.novelquickapp.com/s/37wF433k/` hoặc `https://m.novelquickapp.com/...`
  - Tự động gửi request `redirect: "manual"` để đọc header `Location` và trích xuất `series_id` / `book_id` / `item_id` (19 chữ số).
- **Link Web chính thức**:
  - Trang bộ phim: `https://hongguoduanju.com/detail?series_id=7588802892412406808`
  - Trang phát tập phim: `https://hongguoduanju.com/player/7588802892412406808/7588804476701690904`
- **Mã ID 19 chữ số trực tiếp**: Nhập `7588802892412406808` (`series_id` hoặc `vid`).
- **Từ khóa tìm kiếm tên phim**: Nhập tiếng Trung hoặc tiếng Việt (ví dụ: `总裁`, `闪婚`, `重生`, `穿越`) — tự động kích hoạt chế độ tìm kiếm trực tiếp.
- **Link Douyin / TikTok**: Tự động chuyển sang bộ giải mã Douyin/TikTok không logo.

---

## 2. Kiến Trúc Xoay Tua Đa Luồng API Miễn Phí (Smart Multi-Provider Failover)

Để đảm bảo tỷ lệ thành công 99.9% mà **không tốn phí mua API Key**, [`functions/api/hongguo-core.js`](functions/api/hongguo-core.js) xoay tua qua 5 tầng nguồn dữ liệu miễn phí:

| Thứ Tự | Nguồn API Miễn Phí | Endpoint / Cơ Chế | Dữ Liệu Trả Về |
| :--- | :--- | :--- | :--- |
| **Tầng 1** | **Fqnovel Official App Preload (6 Mirrors)** | `https://api5-normal-sinfonlineb.fqnovel.com` (+ `sinfonlinea`, `sinfonlinec`, `lf`, `lq`, `hl`) `/novel/player/multi_video_detail/preload/v1` & `multi_video_model/preload/v1` (`aid=8662`, `dr_scene="preload"`, không cần `X-Gorgon` động) | Full danh sách tập + 5 mức chất lượng (`1080p`, `720p`, `540p`, `480p`, `360p`) + khóa `spade_a` |
| **Tầng 2** | **Hongguo Web SSR (`_ROUTER_DATA`)** | `https://hongguoduanju.com/detail?series_id=...`, `/player/{sid}/{vid}`, `/search/{keyword}`, `/category/*` | Metadata chuẩn SSR, bảng xếp hạng Trending, tìm kiếm từ khóa và danh sách tập |
| **Tầng 3** | **ByteDance VAS Fallback API** | `https://vas-lf-x.snssdk.com/video/fplay/1/...` (trích xuất từ trường `fallback_api` kèm `PlayAuthToken`) | Luồng CDN dự phòng chính hãng ByteDance khi CDN chính bị nghẽn |
| **Tầng 4** | **Hongguo H.264 Public Stream** | `https://hongguoduanju.com/video/public/{vid}/360p.mp4` | Luồng MP4 H.264/AAC **không mã hóa**, phát trực tiếp trên mọi trình duyệt không cần giải mã |
| **Tầng 5** | **Community / Custom API** | `api.cenguigui.cn` / Custom Endpoint do người dùng cấu hình | Tuyến dự phòng mở rộng |

---

## 3. Cơ Chế Giải Mã `spade_a` & CENC-AES-128-CTR (`encv` -> `hvc1`)

Các luồng video chất lượng cao (`1080p`, `720p`, `540p`, `480p`) từ CDN của Hongguo/Fqnovel được đóng gói chuẩn **ISO-BMFF (MP4) CENC (`cenc` scheme)** với FourCC bị đổi từ `hvc1`/`mp4a` sang `encv`/`enca` và mã hóa từng sample/NALU bằng **AES-128-CTR**:

1. **Giải mã khóa `spade_a` (`deriveSpadeKeyHex`)**:
   - Giải mã chuỗi `encrypt_info.spade_a` từ Base64 -> dịch byte đầu tiên -> Base64 decode lớp 2 -> phép biến đổi tổ hợp bàn phím tùy biến (`Custom Base36 Alphabet Permutation`) để thu được khóa AES 16-byte (32 ký tự Hex).
2. **Giải mã MP4 CENC-AES-128-CTR (`decryptCencMp4` & `window.HongguoClientDecryptor`)**:
   - Đọc bảng `stbl` (`stsd`, `stsc`, `stsz`, `stco`/`co64`, `senc`) trong box `moov`.
   - Với mỗi sample video và audio, trích xuất Initialization Vector 8-byte (`IV`) từ box `senc` (đệm thành Counter Block 16-byte) và giải mã trực tiếp bằng **WebCrypto `AES-CTR`** (`crypto.subtle.decrypt`).
   - Tái cấu trúc box `moov`: Đổi `encv` -> `hvc1`, `enca` -> `mp4a`, loại bỏ các box DRM (`sinf`, `senc`, `saio`, `saiz`) và **tính toán lại chính xác toàn bộ bảng offset `stco`/`co64`** theo độ chênh lệch kích thước `moov`.
3. **Kiến trúc Giải Mã Lai (Hybrid Client + Edge Decryption)**:
   - **Giải mã ngay trên trình duyệt (Mặc định khuyên dùng trên Cloudflare Free)**: Trình duyệt tải stream qua `/api/download?raw=1` và dùng `window.HongguoClientDecryptor` (WebCrypto phần cứng máy khách) để giải mã file 1080p trong ~30ms — **không tiêu tốn bất kỳ mili-giây CPU nào của Cloudflare Worker**, giúp vượt hoàn toàn giới hạn 10ms CPU của gói Cloudflare Free.
   - **Giải mã phía Server (`/api/download` hoặc Python `app.py`)**: Giải mã trực tiếp trên Worker hoặc trên máy chủ Python Render.com.

---

## 4. Tiêu Chuẩn Duyệt Google AdSense Đã Tích Hợp

Dự án được thiết kế như một cổng thông tin & công cụ xuất bản nội dung số chuyên nghiệp nhằm đáp ứng các tiêu chí kiểm duyệt khắt khe của **Google AdSense**:
- **6 Bài viết chuyên khảo độc quyền dài >1.200 từ/bài** ([`public/articles.js`](public/articles.js)):
  1. *Toàn cảnh hệ sinh thái Hồng Quả Đoản Kịch (红果免费短剧) & Sự bùng nổ Micro-Drama*.
  2. *Phân tích kỹ thuật chuẩn mã hóa CENC-AES-128-CTR & Giải pháp phát HEVC (H.265) trên trình duyệt*.
  3. *Quy trình tách phụ đề AI (Whisper), dịch thuật ngữ đoản kịch & hậu kỳ phụ đề chuẩn sản xuất*.
  4. *Cẩm nang Bản quyền nội dung số, nguyên tắc Fair Use & tuân thủ DMCA cho nhà sáng tạo*.
  5. *So sánh kiến trúc hạ tầng phân phối video ngắn: Hongguo/Fqnovel vs Douyin vs Kuaishou*.
  6. *Tối ưu hóa tốc độ tải trang, Core Web Vitals & bảo mật quyền riêng tư trên Cloudflare Edge*.
- **5 Trang pháp lý đầy đủ**:
  - **Giới thiệu (About Us)**, **Chính sách Bảo mật (Privacy Policy - tích hợp điều khoản Google DART Cookie, GDPR & CCPA)**, **Điều khoản Dịch vụ (Terms of Service)**, **Chính sách Bản quyền DMCA**, và **Liên hệ (Contact Us)** kèm form phản hồi.
- **Tệp kỹ thuật chuẩn SEO & AdSense**:
  - [`public/ads.txt`](public/ads.txt), [`public/sitemap.xml`](public/sitemap.xml), [`public/robots.txt`](public/robots.txt), dữ liệu có cấu trúc **Schema.org JSON-LD** (`WebApplication`, `FAQPage`, `Organization`), và **Cookie Consent Banner** tuân thủ GDPR.

---

## 5. Cấu Trúc Thư Mục Dự Án

```
douyin1/
├── public/                        # Giao diện tĩnh (Frontend + SEO + AdSense)
│   ├── index.html                 # Landing Page chính (Search, Series Browser, Player, Blog, Legal)
│   ├── articles.js                # 6 bài viết chuyên sâu + 5 trang pháp lý + Client WebCrypto Decryptor
│   ├── ads.txt                    # Khai báo nhà xuất bản Google AdSense
│   ├── sitemap.xml                # Sơ đồ trang web chuẩn SEO
│   ├── robots.txt                 # Cấu hình Googlebot & Mediapartners-Google
│   ├── favicon.svg                # Biểu tượng thương hiệu HongguoHub Pro
│   └── _headers                   # Cấu hình bảo mật & CORS cho Cloudflare Pages
├── functions/                     # Cloudflare Pages Functions (Serverless Edge Backend)
│   └── api/
│       ├── hongguo-core.js        # Lõi xử lý Hongguo: Multi-API, Search, Discover, spade_a & CENC Decryptor
│       ├── parse.js               # Endpoint /api/parse (Hongguo Series/Episode/Keyword + Douyin/TikTok)
│       ├── episode.js             # Endpoint /api/episode (Lấy luồng 1080p-360p & khóa giải mã cho từng tập)
│       ├── search.js              # Endpoint /api/search & /api/discover (Tìm kiếm & Bảng xếp hạng trực tiếp)
│       ├── video.js               # Endpoint /api/video (Streaming proxy hỗ trợ Range & giải mã trực tiếp)
│       ├── download.js            # Endpoint /api/download (Tải MP4 giải mã sẵn hoặc raw=1 cho Client Decrypt)
│       └── proxy.js               # Endpoint /api/proxy (Proxy ảnh bìa vượt chặn Referer/CORS)
├── _worker.js                     # Điểm khởi chạy hợp nhất cho Cloudflare Workers
├── wrangler.toml                  # Cấu hình triển khai Cloudflare Pages / Workers
├── server.js                      # Máy chủ Node.js chạy local hoặc VPS
├── app.py                         # Máy chủ Python Flask + PyCryptodome (Dành riêng cho Render.com)
├── requirements.txt               # Thư viện Python cho Render.com
├── render.yaml                    # Blueprint triển khai 1-click trên Render.com
└── package.json                   # Cấu hình scripts dự án
```

---

## 6. Hướng Dẫn Triển Khai Lên Cloudflare Free 100% (Khuyên Dùng)

Dự án chạy hoàn toàn trên gói **Cloudflare Pages / Workers Free** (100.000 requests/ngày, băng thông tĩnh không giới hạn, SSL miễn phí):

### Cách 1: Triển khai bằng Wrangler CLI (Nhanh nhất)
```powershell
npx wrangler pages deploy public --project-name hongguo-hub-pro
```
Hoặc triển khai dưới dạng Cloudflare Worker độc lập:
```powershell
npx wrangler deploy
```

### Cách 2: Kết nối GitHub trên Cloudflare Dashboard
1. Đẩy mã nguồn lên GitHub repository của bạn.
2. Vào **Cloudflare Dashboard** -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Thiết lập:
   - **Framework preset**: `None`
   - **Build command**: *(để trống)*
   - **Build output directory**: `public`
4. Nhấn **Save and Deploy**. Cloudflare sẽ tự động biên dịch thư mục `functions/api/*` thành Pages Functions.

---

## 7. Khi Nào Cần Dùng Render.com Python & Cách Triển Khai

### Khi nào bạn mới cần dùng Render.com (`app.py`)?
- **99% trường hợp thông thường**, **Cloudflare Free** kết hợp cơ chế **Giải mã CENC phía trình duyệt (`window.HongguoClientDecryptor`)** đã xử lý mượt mà mọi video 1080p mà không tốn CPU server.
- Bạn **chỉ cần dùng Render.com Python (`app.py`)** khi:
  1. Muốn giải mã các tập phim dung lượng rất lớn (>100MB/tập) hoàn toàn ở phía **Server** (ví dụ phục vụ bot Telegram, script tự động hoặc trình duyệt đời cũ không hỗ trợ WebCrypto) mà không muốn bị giới hạn thời gian CPU 10ms của Cloudflare Free.
  2. Muốn dùng làm **Custom API dự phòng** cấu hình trong phần Cài đặt của giao diện web.

### Cách triển khai lên Render.com Free:
1. Đẩy repository lên GitHub (đã có sẵn [`app.py`](app.py), [`requirements.txt`](requirements.txt) và [`render.yaml`](render.yaml)).
2. Truy cập [https://dashboard.render.com/](https://dashboard.render.com/) -> Chọn **New +** -> **Blueprint** (hoặc **Web Service**).
3. Kết nối repository, Render sẽ tự nhận diện:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
4. Sau khi có URL Render (ví dụ `https://hongguo-hub-pro.onrender.com`), bạn có thể truy cập trực tiếp hoặc dán URL này vào mục **Cài đặt Nguồn API -> Custom / Render API** trên giao diện Cloudflare.

---

## 8. Chạy Thử Nghiệm Tại Máy Cục Bộ (Localhost)

### Chạy bằng Node.js (Mô phỏng Cloudflare Pages Functions):
```powershell
node server.js
```
Mở trình duyệt tại: `http://localhost:3000`

### Chạy bằng Python (Mô phỏng Render.com):
```powershell
pip install -r requirements.txt
python app.py
```
Mở trình duyệt tại: `http://localhost:10000`
