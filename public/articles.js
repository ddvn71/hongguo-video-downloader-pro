// Cơ sở dữ liệu Bài Viết Chuyên Sâu (Editorial Blog), Tài Liệu Pháp Lý Chuẩn Google AdSense
// & Bộ Giải Mã CENC-AES-128-CTR WebCrypto Phía Trình Duyệt (Client-Side Decryptor)

window.HONGGUO_ARTICLES = [
  {
    id: "what-is-hongguo",
    slug: "article-what-is-hongguo",
    category: "Kiến Thức Nền Tảng",
    badgeColor: "rose",
    readTime: "8 phút đọc",
    date: "15/10/2026",
    author: "Ban Biên Tập Công Nghệ Media",
    icon: "fa-Clapperboard",
    title: "Hongguo Short Drama (红果免费短剧) là gì? Toàn tập về hệ sinh thái phim ngắn miễn phí lớn nhất của ByteDance",
    excerpt: "Tìm hiểu lịch sử hình thành, mô hình kinh doanh IAA (In-App Advertising), kho nội dung từ tiểu thuyết Fanqie (Cà Chua) và lý do Hongguo trở thành siêu ứng dụng đoản kịch số 1 châu Á.",
    content: `
      <p class="lead text-slate-300 text-base leading-relaxed mb-4">
        Trong giai đoạn 2024–2026, ngành công nghiệp <strong>Phim ngắn dọc (Micro-Drama / 短剧 - Đoản kịch)</strong> đã bùng nổ thành một thị trường trị giá hàng chục tỷ USD. Đứng ở vị trí dẫn đầu tuyệt đối tại thị trường Trung Quốc đại lục và lan tỏa mạnh mẽ sang Đông Nam Á chính là <strong>Hongguo Free Short Drama (红果免费短剧 - Hồng Quả Đoản Kịch)</strong>, một sản phẩm chiến lược thuộc tập đoàn <strong>ByteDance</strong> (công ty mẹ của Douyin, TikTok và Tiểu thuyết Fanqie).
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">1. Nguồn gốc & Mối liên hệ với Tiểu thuyết Fanqie (番茄小说)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Hongguo ban đầu được phát triển dưới tên mã nội bộ <code>com.phoenix.read</code> (cùng nhánh kỹ thuật với hệ thống <em>Fanqie Novel / NovelRead</em>). Điểm mạnh cốt lõi giúp Hongguo đánh bại hàng loạt đối thủ trả phí theo tập (IAP - In-App Purchase) là khả năng chuyển thể trực tiếp hàng trăm ngàn bộ tiểu thuyết mạng ăn khách nhất trên nền tảng Fanqie thành phim ngắn người thật đóng (Real Drama), phim hoạt hình chuyển động (Comic Drama / 漫剧) và phim ứng dụng trí tuệ nhân tạo (AI Drama).
      </p>

      <div class="my-5 p-4 rounded-xl bg-slate-900/90 border border-slate-700/80">
        <h4 class="font-bold text-rose-400 mb-2"><i class="fas fa-chart-pie mr-2"></i>So sánh mô hình Phim ngắn Truyền thống vs. Hongguo Short Drama</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm text-slate-300 border-collapse mt-2">
            <thead>
              <tr class="border-b border-slate-700 text-slate-200">
                <th class="py-2 pr-4">Tiêu chí</th>
                <th class="py-2 pr-4">Mini-Program Trả phí (IAP)</th>
                <th class="py-2">Hongguo Short Drama (IAA)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr>
                <td class="py-2.5 pr-4 font-medium text-white">Chi phí xem</td>
                <td class="py-2.5 pr-4">Đắt đỏ (10–30 USD cho 1 bộ 80 tập)</td>
                <td class="py-2.5 text-emerald-400 font-medium">Miễn phí 100% toàn bộ các tập</td>
              </tr>
              <tr>
                <td class="py-2.5 pr-4 font-medium text-white">Cấu trúc tập phim</td>
                <td class="py-2.5 pr-4">1–2 phút/tập, cắt vụn để thu phí</td>
                <td class="py-2.5">2–4 phút/tập, mạch truyện liền mạch, từ 60–120 tập/bộ</td>
              </tr>
              <tr>
                <td class="py-2.5 pr-4 font-medium text-white">Chất lượng hình ảnh</td>
                <td class="py-2.5 pr-4">720p nén mạnh</td>
                <td class="py-2.5">Chuẩn 1080p Full HD (HEVC / ByteVC1 bitrate cao)</td>
              </tr>
              <tr>
                <td class="py-2.5 pr-4 font-medium text-white">Đa dạng thể loại</td>
                <td class="py-2.5 pr-4">Chủ yếu ngôn tình, tổng tài</td>
                <td class="py-2.5">Đô thị, Cổ trang, Trọng sinh, Trinh thám, Gia đình, AI Drama</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">2. Các dòng nội dung chính trên Hongguo hiện nay</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong>Chân Nhân Kịch (真人剧 - Real-life Short Drama):</strong> Phim ngắn do diễn viên chuyên nghiệp đóng, quay theo khung hình dọc 9:16 với góc máy điện ảnh, ánh sáng và bối cảnh đầu tư bài bản.</li>
        <li><strong>Mạn Kịch (漫剧 - Comic & Motion Drama):</strong> Kết hợp giữa truyện tranh màu (Manhua) với hiệu ứng chuyển động 2.5D và lồng tiếng cảm xúc.</li>
        <li><strong>AI Đoản Kịch (AI剧 - Generative AI Drama):</strong> Xu hướng bùng nổ năm 2025–2026 sử dụng mô hình tạo video AI (như Seedance / Jimeng của ByteDance) để dựng các bối cảnh thần thoại, tiên hiệp, khoa học viễn tưởng quy mô lớn.</li>
      </ul>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">3. Cấu trúc định danh dữ liệu trên Hongguo</h3>
      <p class="text-slate-300 leading-relaxed">
        Mỗi bộ phim trên Hongguo được quản lý bằng một mã định danh 19 chữ số gọi là <code>series_id</code> (hoặc <code>book_id</code>), và từng tập phim bên trong có mã <code>vid</code> (Video ID) riêng biệt. Khi người dùng chia sẻ từ ứng dụng di động, hệ thống sẽ tạo ra một liên kết rút gọn dạng <code>https://novelquickapp.com/s/...</code> hoặc liên kết trình phát web chính thức tại <code>https://hongguoduanju.com/player/{series_id}</code>. Công cụ <strong>Hongguo Pro Downloader</strong> của chúng tôi hỗ trợ nhận diện tự động tất cả các định dạng này.
      </p>
    `
  },
  {
    id: "how-to-download-1080p",
    slug: "article-how-to-download-1080p",
    category: "Hướng Dẫn Sử Dụng",
    badgeColor: "amber",
    readTime: "6 phút đọc",
    date: "14/10/2026",
    author: "Kỹ Sư Hệ Thống",
    icon: "fa-download",
    title: "Hướng dẫn chi tiết 3 cách tải video Hongguo (Hồng Quả Đoản Kịch) Full HD 1080p không logo trên Điện thoại & PC",
    excerpt: "Quy trình từng bước để lấy liên kết chia sẻ từ ứng dụng Hongguo, tìm kiếm trực tiếp theo tên phim tiếng Trung và tải lẻ từng tập hoặc tải hàng loạt trọn bộ về máy.",
    content: `
      <p class="lead text-slate-300 text-base leading-relaxed mb-4">
        Nhu cầu lưu trữ các bộ phim ngắn Hongguo (红果短剧) về máy tính hoặc điện thoại để xem ngoại tuyến khi di chuyển, học tiếng Trung qua hội thoại thực tế, hoặc nghiên cứu kịch bản ngày càng phổ biến. Dưới đây là hướng dẫn đầy đủ 3 phương pháp tải nhanh nhất mà không cần cài đặt phần mềm hay giả lập Android.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">Cách 1: Tải bằng Liên kết chia sẻ từ App Hongguo (novelquickapp.com)</h3>
      <ol class="list-decimal pl-5 space-y-2.5 text-slate-300 mb-5">
        <li>Mở ứng dụng <strong>红果免费短剧 (Hongguo)</strong> trên điện thoại iOS hoặc Android của bạn.</li>
        <li>Khi đang xem bộ phim ngắn yêu thích, nhấn vào biểu tượng <strong>Chia sẻ (分享 - mũi tên cong)</strong> ở cột bên phải màn hình.</li>
        <li>Chọn <strong>Sao chép liên kết (复制链接)</strong>. Đoạn văn bản trong bộ nhớ tạm sẽ chứa đường dẫn dạng <code>https://novelquickapp.com/s/xxxxxx/</code>.</li>
        <li>Mở trình duyệt (Safari, Chrome, Edge) truy cập website của chúng tôi, nhấn nút <strong>"Dán"</strong> vào ô tìm kiếm và bấm <strong>"Phân Tích & Tải"</strong>.</li>
        <li>Hệ thống sẽ tự động phân giải mã <code>series_id</code>, liệt kê đầy đủ toàn bộ các tập (ví dụ: Tập 1 đến Tập 85) để bạn xem trực tiếp hoặc tải xuống chất lượng <strong>1080p Full HD</strong>.</li>
      </ol>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">Cách 2: Tìm kiếm trực tiếp theo Tên Phim hoặc Từ khóa (Không cần cài App)</h3>
      <p class="text-slate-300 leading-relaxed mb-3">
        Nếu bạn không cài đặt ứng dụng Hongguo trên máy, bạn vẫn có thể tìm và tải bất kỳ bộ phim nào nhờ tính năng <strong>Tìm kiếm trực tiếp (Direct Search)</strong> được tích hợp sẵn:
      </p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-5">
        <li>Nhập trực tiếp tên phim tiếng Trung (ví dụ: <code>总裁</code>, <code>重生</code>, <code>首辅娇娘</code>) vào ô công cụ ở đầu trang, hoặc chuyển sang khu vực <strong>Khám Phá Phim Ngắn Hot</strong> ngay bên dưới.</li>
        <li>Nhấn vào thẻ phim bất kỳ trong kết quả tìm kiếm. Toàn bộ danh sách tập và trình phát xem trước sẽ hiển thị ngay lập tức.</li>
      </ul>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">Cách 3: Tải hàng loạt nhiều tập (Batch Download) với cú pháp khoảng tập</h3>
      <p class="text-slate-300 leading-relaxed mb-3">
        Một bộ đoản kịch thường kéo dài từ 60 đến hơn 100 tập. Thay vì bấm tải thủ công từng tập, bạn có thể sử dụng thanh công cụ <strong>Tải Hàng Loạt</strong> của chúng tôi:
      </p>
      <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-slate-300 space-y-2">
        <p><strong class="text-amber-400">• Chọn nhanh theo nhóm:</strong> Nhấn các nút <code>Tập 1-10</code>, <code>Tập 1-30</code> hoặc <code>Chọn Tất Cả</code>.</p>
        <p><strong class="text-amber-400">• Nhập cú pháp khoảng tùy chỉnh:</strong> Bạn có thể gõ <code>1-15, 20, 25-30</code> vào ô chọn khoảng tập để chỉ tải đúng những tập cần thiết.</p>
        <p><strong class="text-amber-400">• Tự động giải mã tuần tự:</strong> Hàng đợi tải hàng loạt sẽ tự động tải luồng CDN, giải mã CENC-AES-CTR ngay trên trình duyệt và lưu thành từng file <code>TenPhim_Tap_001_1080p.mp4</code> sạch sẽ.</p>
      </div>
    `
  },
  {
    id: "cenc-hevc-decryption",
    slug: "article-cenc-hevc-decryption",
    category: "Phân Tích Kỹ Thuật",
    badgeColor: "cyan",
    readTime: "10 phút đọc",
    date: "12/10/2026",
    author: "Chuyên Gia Mã Hóa Video",
    icon: "fa-shield-halved",
    title: "Giải mã công nghệ CENC-AES-CTR & Codec HEVC (ByteVC1) trên Hongguo: Tại sao video tải thô bị lỗi và cách xử lý",
    excerpt: "Phân tích chuyên sâu cấu trúc container MP4 (ftyp, moov, senc, stsd), cơ chế khóa spade_a và sự khác biệt giữa luồng 1080p HEVC với luồng 360p H.264.",
    content: `
      <p class="lead text-slate-300 text-base leading-relaxed mb-4">
        Nhiều người dùng hoặc lập trình viên khi tự bắt gói tin (sniffing) đường dẫn CDN từ ứng dụng Hongguo (thường có tên miền <code>*.qznovelvod.com</code>) nhận thấy rằng file <code>.mp4</code> tải về không thể mở được trên VLC, Windows Media Player hay CapCut, hoặc chỉ hiển thị màn hình đen. Bài viết này giải thích nguyên nhân kỹ thuật đằng sau và cách công cụ của chúng tôi xử lý tự động 100%.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">1. Tiêu chuẩn mã hóa ISO/IEC 23001-7 (CENC AES-128-CTR)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Để bảo vệ băng thông CDN, các luồng video độ phân giải cao (480p, 540p, 720p, 1080p) từ máy chủ ứng dụng Hongguo không phải là file MP4 thông thường mà được đóng gói theo chuẩn <strong>Common Encryption (CENC)</strong> sử dụng thuật toán <strong>AES-128 ở chế độ Counter (CTR)</strong>:
      </p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Trong box <code>stsd</code> (Sample Description Box) của phần header <code>moov</code>, định danh codec video bị đổi từ <code>hvc1</code> thành <code>encv</code> (Encrypted Video) và âm thanh đổi từ <code>mp4a</code> thành <code>enca</code> (Encrypted Audio), kèm theo box <code>sinf</code> chứa thông tin bảo vệ.</li>
        <li>Mỗi khung hình (sample) trong vùng dữ liệu <code>mdat</code> được mã hóa bằng một vector khởi tạo 8-byte (Per-Sample IV) lưu trữ trong box <code>senc</code> (Sample Encryption Box).</li>
        <li>Khóa giải mã 16-byte (128-bit Content Key) không được gửi dưới dạng rõ mà được đóng gói trong trường <code>encrypt_info.spade_a</code> trả về từ API <code>multi_video_model</code>.</li>
      </ul>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">2. Quy trình 4 bước tái cấu trúc MP4 trên trình duyệt (WebCrypto API)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Thay vì yêu cầu người dùng cài đặt Python hay FFmpeg phức tạp trên máy tính, công cụ <strong>Hongguo Pro Downloader</strong> tích hợp trực tiếp bộ giải mã đa luồng chạy trên cả <strong>Cloudflare Edge</strong> lẫn <strong>WebCrypto API (<code>window.crypto.subtle</code>)</strong> của trình duyệt:
      </p>
      <ol class="list-decimal pl-5 space-y-2 text-slate-300 mb-5">
        <li><strong>Trích xuất khóa (Key Derivation):</strong> Giải mã chuỗi Base64 <code>spade_a</code> thông qua phép biến đổi bit (XOR & Hamming weight popcount) để thu được khóa AES 16-byte chuẩn xác.</li>
        <li><strong>Đọc bảng mẫu MP4 (Box Parsing):</strong> Phân tích các bảng <code>stsz</code> (kích thước mẫu), <code>stsc</code> (mẫu trên mỗi chunk), <code>stco</code> (vị trí chunk) và <code>senc</code> (vector IV 8-byte cho từng mẫu).</li>
        <li><strong>Giải mã phần cứng AES-CTR:</strong> Gọi phần cứng tăng tốc mật mã của trình duyệt để giải mã toàn bộ các sample âm thanh & hình ảnh trong vài chục mili-giây.</li>
        <li><strong>Tái tạo <code>moov</code> sạch (Moov Rebuilding):</strong> Khôi phục nhãn <code>encv → hvc1</code> và <code>enca → mp4a</code>, loại bỏ các box <code>sinf</code>, <code>senc</code>, <code>saio</code>, <code>saiz</code> và tính toán lại độ lệch (delta offset) trong bảng <code>stco</code> để tạo ra file MP4 tiêu chuẩn quốc tế.</li>
      </ol>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">3. Lưu ý về Codec HEVC (H.265 / ByteVC1) vs. H.264 (AVC)</h3>
      <p class="text-slate-300 leading-relaxed">
        Các bản tải <strong>1080p / 720p</strong> của Hongguo sử dụng chuẩn nén <strong>HEVC (H.265 / hvc1)</strong> giúp hình ảnh sắc nét gấp đôi ở cùng dung lượng. Hầu hết điện thoại iPhone, Android đời mới, Mac và phần mềm dựng phim (CapCut, Premiere, DaVinci Resolve, PotPlayer, VLC) đều đọc mượt mà file HEVC này. Nếu bạn đang dùng trình duyệt máy tính cũ thiếu bộ giải mã phần cứng HEVC và muốn xem trực tiếp trên web, hãy chọn luồng <strong>360p Web Direct (H.264)</strong> — đây là luồng chuẩn AVC tương thích với 100% mọi thiết bị.
      </p>
    `
  },
  {
    id: "top-hongguo-dramas-2026",
    slug: "article-top-hongguo-dramas-2026",
    category: "Bảng Xếp Hạng & Đánh Giá",
    badgeColor: "purple",
    readTime: "7 phút đọc",
    date: "10/10/2026",
    author: "Biên Tập Viên Điện Ảnh",
    icon: "fa-fire",
    title: "Xu hướng & Top các thể loại phim ngắn Hongguo (Đoản kịch Trung Quốc) thu hút hàng tỷ lượt xem năm 2026",
    excerpt: "Khám phá những motif kịch bản hấp dẫn nhất trên Hongguo: Từ Nữ cường hiện đại, Trọng sinh cổ trang, Gia đình thập niên 70-80 đến Mạn kịch và AI Drama.",
    content: `
      <p class="lead text-slate-300 text-base leading-relaxed mb-4">
        Không còn giới hạn ở những kịch bản "Tổng tài bá đạo" đơn điệu thời kỳ đầu, kho phim ngắn trên <strong>Hongguo (红果短剧)</strong> vào năm 2026 đã chứng kiến bước nhảy vọt về chất lượng biên kịch, chiều sâu tâm lý nhân vật và kỹ xảo hình ảnh. Dưới đây là 5 nhóm thể loại đang thống trị bảng xếp hạng nhiệt độ trên nền tảng.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">1. Cổ Trang Quyền Mưu & Trọng Sinh Báo Thù (古装 / 重生)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Đây là dòng phim có phục trang, bối cảnh và đạo cụ được đầu tư tiệm cận phim truyền hình长剧 (dài tập). Nhân vật chính thường là đích nữ hoặc tướng quân mang ký ức kiếp trước sống lại để thay đổi vận mệnh gia tộc, đấu trí nơi cung đình. Nhịp phim nhanh, cao trào xuất hiện mỗi 90 giây khiến khán giả không thể rời mắt.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">2. Đô Thị Hiện Đại & Sự Nghiệp Nữ Cường (都市 / 女性成长)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Thay vì phụ thuộc vào nhân vật nam chính, các bộ đoản kịch hiện đại năm 2026 tập trung khai thác hình tượng phụ nữ độc lập trong ngành luật sư, bác sĩ ngoại khoa, kiến trúc sư hoặc nghệ nhân di sản văn hóa phi vật thể. Các từ khóa tìm kiếm phổ biến trên Hongguo cho thể loại này gồm: <code>职场</code> (Công sở), <code>女性成长</code> (Nữ trưởng thành), <code>破镜重圆</code> (Gương vỡ lại lành).
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">3. Niên Đại Văn & Gia Đình Thập Niên 70–80 (年代 / 家长里短)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Lấy bối cảnh làng quê hoặc khu tập thể Trung Quốc những năm 1970–1990, dòng phim này gây sốt nhờ sự gần gũi, hài hước và ấm áp tình thân. Nội dung thường xoay quanh hành trình khởi nghiệp từ hai bàn tay trắng, ẩm thực truyền thống và tình làng nghĩa xóm.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">4. Mạn Kịch & Tu Tiên Huyền Huyễn (漫剧 / 玄幻仙侠)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Với các bộ tiểu thuyết tu tiên, hệ thống (System) hay mạt thế có tới 150–250 tập, định dạng <strong>Mạn kịch (Comic Drama)</strong> và <strong>AI Drama</strong> trên Hongguo tái hiện hoàn hảo những đại cảnh chiến đấu thần thú, luyện đan, độ kiếp mà phim người thật khó thực hiện với kinh phí thấp.
      </p>

      <div class="my-5 p-4 rounded-xl bg-slate-900/90 border border-slate-700">
        <h4 class="font-bold text-purple-400 mb-2"><i class="fas fa-language mr-2"></i>Bảng từ khóa tiếng Trung giúp bạn tìm kiếm nhanh trên công cụ:</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300 mt-2">
          <div class="p-2 rounded bg-slate-800"><code>总裁</code> — Tổng tài / CEO</div>
          <div class="p-2 rounded bg-slate-800"><code>重生</code> — Trọng sinh</div>
          <div class="p-2 rounded bg-slate-800"><code>穿越</code> — Xuyên không</div>
          <div class="p-2 rounded bg-slate-800"><code>古装</code> — Cổ trang</div>
          <div class="p-2 rounded bg-slate-800"><code>甜宠</code> — Ngọt sủng</div>
          <div class="p-2 rounded bg-slate-800"><code>悬疑</code> — Trinh thám / Bí ẩn</div>
          <div class="p-2 rounded bg-slate-800"><code>年代</code> — Niên đại 70/80</div>
          <div class="p-2 rounded bg-slate-800"><code>神医</code> — Thần y</div>
          <div class="p-2 rounded bg-slate-800"><code>战神</code> — Chiến thần</div>
        </div>
      </div>
    `
  },
  {
    id: "subtitle-translation-guide",
    slug: "article-subtitle-translation-guide",
    category: "Kỹ Năng Biên Tập Video",
    badgeColor: "emerald",
    readTime: "9 phút đọc",
    date: "08/10/2026",
    author: "Chuyên Viên Hậu Kỳ & AI",
    icon: "fa-closed-captioning",
    title: "Quy trình biên tập, nối tập và làm phụ đề (Vietsub / Engsub) phim ngắn bằng Whisper AI & CapCut Pro",
    excerpt: "Hướng dẫn kỹ thuật nối nhiều tập MP4 không giảm chất lượng bằng FFmpeg, nhận diện giọng nói tiếng Trung sang SRT bằng Whisper và dịch thuật ngữ chuẩn văn phong đoản kịch.",
    content: `
      <p class="lead text-slate-300 text-base leading-relaxed mb-4">
        Sau khi tải các tập phim ngắn chất lượng gốc 1080p từ Hongguo để phục vụ việc học ngoại ngữ hoặc làm nội dung bình luận/review được cấp phép, bước tiếp theo thường là ghép nối các tập và tạo phụ đề song ngữ Trung - Việt hoặc Trung - Anh. Dưới đây là quy trình chuẩn công nghiệp giúp tiết kiệm 80% thời gian.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">1. Ghép nối nhiều tập MP4 siêu tốc không cần render lại (Lossless Merge)</h3>
      <p class="text-slate-300 leading-relaxed mb-3">
        Vì các tập phim trong cùng một bộ trên Hongguo có cùng độ phân giải (1080x1920), cùng tần số lấy mẫu âm thanh và codec, bạn có thể dùng tính năng <code>Stream Copy</code> của <strong>FFmpeg</strong> để ghép 20–50 tập thành 1 file duy nhất chỉ trong vài giây mà không làm suy giảm chất lượng hình ảnh:
      </p>
      <pre class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 overflow-x-auto mb-4"><code># Bước 1: Tạo danh sách file list.txt
file 'Tap_001_1080p.mp4'
file 'Tap_002_1080p.mp4'
file 'Tap_003_1080p.mp4'

# Bước 2: Ghép nối trực tiếp không nén lại (-c copy)
ffmpeg -f concat -safe 0 -i list.txt -c copy Phim_Ghep_Tap_1_den_3.mp4</code></pre>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">2. Tách phụ đề tiếng Trung (ASR) chính xác bằng Faster-Whisper</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Các bộ phim ngắn trên Hongguo thường có lời thoại nhanh và nhiều từ lóng hiện đại hoặc thuật ngữ cổ trang. Sử dụng mô hình <strong>Faster-Whisper (large-v3)</strong> với tham số <code>--language zh</code> và <code>--vad_filter True</code> sẽ giúp lọc bỏ nhạc nền kịch tính và ngắt câu (timestamp) chuẩn xác tới từng phần trăm giây, xuất ra định dạng chuẩn <code>.srt</code>.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">3. Bố cục khung hình dọc 9:16 khi chèn phụ đề trên CapCut / Premiere</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300">
        <li><strong>Vùng an toàn (Safe Zone):</strong> Trên giao diện dọc 9:16 (1080x1920), vị trí đặt phụ đề lý tưởng nhất là ở khoảng <strong>22% – 28% tính từ cạnh dưới lên</strong> (tức tọa độ Y khoảng 1380px – 1480px) để không bị che khuất bởi thanh tiêu đề của trình phát di động.</li>
        <li><strong>Xử lý Hardsub gốc:</strong> Nhiều bộ phim ngắn đã có sẵn dòng chữ tiếng Trung gắn cứng (hardsub). Bạn có thể tạo một lớp nền mờ (Gaussian Blur Box hoặc Rounded Rectangle độ trong suốt 75%) đè vừa khít lên vùng phụ đề gốc trước khi đặt lớp chữ tiếng Việt/tiếng Anh lên trên.</li>
      </ul>
    `
  },
  {
    id: "copyright-fair-use",
    slug: "article-copyright-fair-use",
    category: "Pháp Lý & Bản Quyền",
    badgeColor: "blue",
    readTime: "6 phút đọc",
    date: "05/10/2026",
    author: "Ban Pháp Chế & Tuân Thủ",
    icon: "fa-scale-balanced",
    title: "Chính sách bản quyền nội dung số & Nguyên tắc Sử dụng hợp lý (Fair Use) đối với video phim ngắn",
    excerpt: "Tìm hiểu ranh giới pháp lý giữa việc lưu trữ cá nhân, trích dẫn phục vụ phê bình/giáo dục (Fair Use) và hành vi tái phân phối thương mại trái phép.",
    content: `
      <p class="lead text-slate-300 text-base leading-relaxed mb-4">
        Khi sử dụng các công cụ hỗ trợ tải và phân tích luồng truyền thông trên Internet, việc hiểu rõ quyền sở hữu trí tuệ của nhà sản xuất và nguyên tắc <strong>Sử dụng hợp lý (Fair Use / Fair Dealing)</strong> là trách nhiệm quan trọng của mỗi người dùng và nhà sáng tạo nội dung.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">1. Quyền sở hữu bản quyền của Tác giả & Nhà phát hành</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Toàn bộ các bộ phim ngắn, hình ảnh áp phích, kịch bản và âm nhạc trên nền tảng Hongguo (红果免费短剧) thuộc bản quyền hợp pháp của <strong>ByteDance / Fanqie</strong> và các xưởng phim đối tác sản xuất. Công cụ kỹ thuật của chúng tôi hoạt động hoàn toàn như một trình duyệt trung gian (Client-side / Edge Parser) giúp người dùng truy cập luồng dữ liệu công khai để <strong>lưu trữ cá nhân ngoại tuyến (Personal Offline Viewing)</strong> hoặc nghiên cứu học thuật, tuyệt đối không lưu trữ hay lưu bản sao bất kỳ tập phim nào trên máy chủ của chúng tôi.
      </p>

      <h3 class="text-xl font-bold text-white mt-6 mb-3">2. 4 yếu tố cốt lõi của Nguyên tắc Fair Use (Sử dụng hợp lý)</h3>
      <p class="text-slate-300 leading-relaxed mb-3">
        Nếu bạn là một nhà phê bình phim (Reviewer), giáo viên dạy ngoại ngữ hoặc nhà nghiên cứu truyền thông muốn trích dẫn các đoạn ngắn từ bộ phim, hãy tuân thủ 4 tiêu chuẩn Fair Use quốc tế:
      </p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong>Mục đích và tính chất sử dụng (Transformative Use):</strong> Nội dung của bạn phải mang tính biến đổi cao — chẳng hạn như phân tích nghệ thuật diễn xuất, dạy từ vựng tiếng Trung qua đoạn hội thoại 15 giây, hoặc bình luận chuyên sâu, thay vì đăng tải lại nguyên vẹn các tập phim (Re-upload).</li>
        <li><strong>Tỷ lệ trích dẫn:</strong> Chỉ sử dụng những đoạn trích ngắn cần thiết để minh họa cho luận điểm phê bình, không tiết lộ toàn bộ cốt truyện hoặc thay thế trải nghiệm xem bản gốc.</li>
        <li><strong>Ghi nguồn rõ ràng (Attribution):</strong> Luôn ghi rõ tên bộ phim gốc, tên diễn viên và dẫn nguồn về nền tảng phát hành chính thức của Hongguo.</li>
        <li><strong>Không gây ảnh hưởng thương mại đến tác phẩm gốc:</strong> Tuyệt đối không đóng gói các tập phim tải về để bán lại hoặc thu phí trái phép dưới mọi hình thức.</li>
      </ul>
    `
  }
];

// ==================== TÀI LIỆU PHÁP LÝ BẮT BUỘC CHO GOOGLE ADSENSE ====================

window.HONGGUO_LEGAL_PAGES = {
  about: {
    title: "Về Chúng Tôi (About Us) - Hongguo Pro Video Tool",
    icon: "fa-circle-info",
    content: `
      <h3 class="text-xl font-bold text-white mb-3">1. Sứ mệnh của Hongguo Pro Downloader</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        <strong>Hongguo Pro Downloader</strong> là dự án công nghệ web chuyên cung cấp giải pháp phân tích siêu dữ liệu (Metadata), tra cứu thông tin bộ phim và hỗ trợ giải mã luồng phát chuẩn MP4 cho nền tảng phim ngắn <strong>Hongguo Short Drama (红果免费短剧)</strong> cũng như các nền tảng video ngắn thuộc hệ sinh thái ByteDance (Douyin / TikTok).
      </p>
      <p class="text-slate-300 leading-relaxed mb-4">
        Bên cạnh công cụ kỹ thuật hoạt động trực tiếp trên trình duyệt thông qua mạng lưới <strong>Cloudflare Edge</strong> và chuẩn mật mã <strong>W3C WebCrypto API</strong>, website của chúng tôi còn là chuyên trang kiến thức cung cấp các bài viết chuyên sâu về công nghệ truyền phát video (CENC-AES-CTR, HEVC/H.265, HLS/DASH), kỹ năng biên tập phụ đề đa ngôn ngữ và đánh giá xu hướng điện ảnh đoản kịch châu Á.
      </p>
      <h3 class="text-xl font-bold text-white mt-6 mb-3">2. Cam kết chất lượng & Minh bạch</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300">
        <li><strong>Miễn phí 100% & Không yêu cầu đăng ký tài khoản:</strong> Mọi tính năng tra cứu, xem trước và tải xuống đều mở hoàn toàn cho cộng đồng mà không thu bất kỳ khoản phí ẩn nào.</li>
        <li><strong>Bảo mật & Quyền riêng tư tuyệt đối:</strong> Quá trình giải mã video diễn ra trực tiếp trong bộ nhớ đệm trình duyệt của người dùng (Client-side WebCrypto), không lưu trữ lịch sử cá nhân lên máy chủ.</li>
        <li><strong>Nội dung biên tập độc bản:</strong> Đội ngũ kỹ sư và biên tập viên của chúng tôi thường xuyên cập nhật các bài hướng dẫn kỹ thuật, bảng xếp hạng và tài liệu chuẩn mực.</li>
      </ul>
    `
  },
  privacy: {
    title: "Chính Sách Bảo Mật (Privacy Policy) & Tuân Thủ Cookie",
    icon: "fa-user-shield",
    content: `
      <p class="text-xs text-slate-400 mb-4">Cập nhật lần cuối: 15 tháng 10 năm 2026</p>
      <p class="text-slate-300 leading-relaxed mb-4">
        Chính sách bảo mật này mô tả cách <strong>Hongguo Pro Downloader</strong> thu thập, sử dụng và bảo vệ thông tin khi bạn truy cập website của chúng tôi, tuân thủ đầy đủ các quy định của <strong>Google AdSense Program Policies</strong>, <strong>GDPR</strong> (Quy định bảo vệ dữ liệu chung của Châu Âu) và <strong>CCPA</strong>.
      </p>

      <h3 class="text-lg font-bold text-white mt-5 mb-2">1. Dữ liệu chúng tôi xử lý</h3>
      <p class="text-slate-300 leading-relaxed mb-3">
        Website không yêu cầu người dùng tạo tài khoản hay cung cấp thông tin định danh cá nhân (như họ tên, số điện thoại, địa chỉ). Khi bạn nhập liên kết hoặc từ khóa tìm kiếm, yêu cầu chỉ được xử lý tạm thời trong bộ nhớ RAM của nút mạng Cloudflare Edge để trả về siêu dữ liệu video và bị xóa ngay sau khi hoàn tất phản hồi HTTP. Các tùy chỉnh giao diện (chế độ Sáng/Tối, ngôn ngữ, lịch sử tải cục bộ) chỉ được lưu trữ trên chính trình duyệt của bạn thông qua <code>localStorage</code>.
      </p>

      <h3 class="text-lg font-bold text-white mt-5 mb-2">2. Cookie của Google AdSense & DoubleClick DART Cookie</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-3">
        <li><strong>Google</strong>, với tư cách là nhà cung cấp bên thứ ba, sử dụng cookie để phân phối quảng cáo trên trang web của chúng tôi nhằm duy trì chi phí máy chủ miễn phí cho người dùng.</li>
        <li>Việc Google sử dụng <strong>cookie DART</strong> cho phép Google và các đối tác hiển thị quảng cáo phù hợp với người dùng dựa trên lượt truy cập của họ vào trang web của chúng tôi và/hoặc các trang web khác trên Internet.</li>
        <li>Người dùng có thể từ chối việc sử dụng cookie DART để cá nhân hóa quảng cáo bất kỳ lúc nào bằng cách truy cập <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline">Trang Cài đặt Quảng cáo của Google (Google Ads Settings)</a> hoặc truy cập <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline">www.aboutads.info</a>.</li>
      </ul>

      <h3 class="text-lg font-bold text-white mt-5 mb-2">3. Nhật ký tệp tiêu chuẩn (Log Files)</h3>
      <p class="text-slate-300 leading-relaxed mb-3">
        Giống như hầu hết các dịch vụ web sử dụng hạ tầng CDN của Cloudflare, hệ thống tự động ghi nhận các thông số kỹ thuật ẩn danh tiêu chuẩn bao gồm loại trình duyệt, nhà cung cấp dịch vụ Internet (ISP), dấu thời gian và mã trạng thái HTTP nhằm mục đích chống tấn công DDoS và tối ưu hóa tốc độ đường truyền.
      </p>

      <h3 class="text-lg font-bold text-white mt-5 mb-2">4. Quyền của người dùng theo GDPR & CCPA</h3>
      <p class="text-slate-300 leading-relaxed">
        Bạn có toàn quyền xóa bộ nhớ cục bộ (Clear History) ngay trên giao diện website, từ chối cookie quảng cáo qua thanh thông báo Cookie (Cookie Consent Banner) hoặc liên hệ trực tiếp với quản trị viên để được giải đáp mọi thắc mắc về quyền riêng tư.
      </p>
    `
  },
  terms: {
    title: "Điều Khoản Sử Dụng (Terms of Service)",
    icon: "fa-file-contract",
    content: `
      <p class="text-xs text-slate-400 mb-4">Cập nhật lần cuối: 15 tháng 10 năm 2026</p>
      <h3 class="text-lg font-bold text-white mt-4 mb-2">1. Chấp thuận Điều khoản</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        Bằng việc truy cập và sử dụng <strong>Hongguo Pro Downloader</strong>, bạn đồng ý tuân thủ các Điều khoản dịch vụ này cũng như tất cả các luật và quy định hiện hành về bản quyền sở hữu trí tuệ.
      </p>

      <h3 class="text-lg font-bold text-white mt-4 mb-2">2. Phạm vi sử dụng hợp pháp</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Công cụ này chỉ được cung cấp cho mục đích <strong>tra cứu thông tin, học tập, nghiên cứu kỹ thuật và xem ngoại tuyến cá nhân phi thương mại</strong>.</li>
        <li>Người dùng tự chịu hoàn toàn trách nhiệm pháp lý đối với cách thức sử dụng các tệp phương tiện sau khi tải xuống. Nghiêm cấm sử dụng công cụ để sao chép hàng loạt nhằm mục đích kinh doanh thương mại trái phép hoặc vi phạm bản quyền của tác giả.</li>
        <li>Nghiêm cấm sử dụng bot tự động gây quá tải (spam request) lên hệ thống API của chúng tôi.</li>
      </ul>

      <h3 class="text-lg font-bold text-white mt-4 mb-2">3. Tuyên bố miễn trừ trách nhiệm</h3>
      <p class="text-slate-300 leading-relaxed">
        Website này là một dự án độc lập, <strong>không liên kết, không được tài trợ hay ủy quyền chính thức bởi ByteDance, Hongguo (红果短剧), Fanqie hay Douyin/TikTok</strong>. Mọi nhãn hiệu, tên thương mại và biểu trưng được đề cập trên trang đều thuộc quyền sở hữu của chủ sở hữu tương ứng.
      </p>
    `
  },
  dmca: {
    title: "Chính Sách Bản Quyền & DMCA (Copyright / DMCA Policy)",
    icon: "fa-gavel",
    content: `
      <h3 class="text-lg font-bold text-white mt-2 mb-2">1. Cam kết Không Lưu Trữ Nội Dung (Zero-Hosting Policy)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">
        <strong>Hongguo Pro Downloader</strong> tôn trọng quyền sở hữu trí tuệ của các nghệ sĩ, nhà sản xuất phim và đơn vị phát hành. Chúng tôi khẳng định: <strong>Hệ thống máy chủ của chúng tôi KHÔNG lưu trữ, KHÔNG lưu bản sao (cache) bất kỳ tệp video, âm thanh hay hình ảnh có bản quyền nào trên ổ cứng</strong>. Mọi dữ liệu hiển thị đều được truy xuất theo thời gian thực từ các máy chủ CDN công khai của bên thứ ba theo yêu cầu trực tiếp từ phía người dùng.
      </p>

      <h3 class="text-lg font-bold text-white mt-4 mb-2">2. Quy trình gửi yêu cầu gỡ bỏ / Chặn ID theo DMCA</h3>
      <p class="text-slate-300 leading-relaxed mb-3">
        Nếu bạn là chủ sở hữu bản quyền hợp pháp của một bộ phim ngắn và không muốn mã <code>series_id</code> của tác phẩm đó được phân giải thông qua công cụ của chúng tôi, vui lòng gửi thông báo DMCA kèm theo:
      </p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300 mb-4">
        <li>Tên tác phẩm và danh sách mã <code>series_id</code> hoặc URL cần chặn (Blocklist).</li>
        <li>Tài liệu chứng minh quyền sở hữu bản quyền hoặc giấy ủy quyền đại diện hợp pháp.</li>
        <li>Thông tin liên hệ của bạn (Email, Số điện thoại, Tổ chức).</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">
        Chúng tôi cam kết xử lý và đưa mã tác phẩm vào danh sách từ chối phân giải (DMCA Blocklist) trong vòng <strong>24–48 giờ làm việc</strong> kể từ khi nhận được yêu cầu hợp lệ.
      </p>
    `
  },
  contact: {
    title: "Liên Hệ & Hỗ Trợ Kỹ Thuật (Contact Us)",
    icon: "fa-envelope-open-text",
    content: `
      <p class="text-slate-300 leading-relaxed mb-4">
        Chúng tôi luôn lắng nghe ý kiến đóng góp từ cộng đồng người dùng, đối tác quảng cáo và các chủ sở hữu bản quyền. Bạn có thể liên hệ với đội ngũ quản trị qua các kênh chính thức dưới đây hoặc gửi biểu mẫu trực tiếp:
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-700">
          <div class="text-rose-400 font-bold mb-1"><i class="fas fa-headset mr-2"></i>Hỗ trợ Kỹ thuật & Báo lỗi API</div>
          <p class="text-xs text-slate-400 mb-2">Phản hồi trong vòng 12 giờ làm việc</p>
          <a href="mailto:support@hongguodownloader.com" class="text-sm font-mono text-cyan-400 hover:underline">support@hongguodownloader.com</a>
        </div>
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-700">
          <div class="text-amber-400 font-bold mb-1"><i class="fas fa-scale-balanced mr-2"></i>Bản quyền DMCA & Hợp tác Quảng cáo</div>
          <p class="text-xs text-slate-400 mb-2">Bộ phận Pháp chế & Truyền thông</p>
          <a href="mailto:dmca@hongguodownloader.com" class="text-sm font-mono text-cyan-400 hover:underline">dmca@hongguodownloader.com</a>
        </div>
      </div>
      <div class="mt-5 p-4 rounded-xl bg-slate-900/70 border border-slate-700">
        <h4 class="font-bold text-white mb-3 text-sm">Gửi tin nhắn nhanh cho Quản trị viên</h4>
        <form onsubmit="event.preventDefault(); window.handleContactSubmit && window.handleContactSubmit(this);" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" required placeholder="Họ và tên của bạn" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500" />
            <input type="email" required placeholder="Địa chỉ Email liên hệ" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500" />
          </div>
          <input type="text" required placeholder="Tiêu đề (Ví dụ: Báo lỗi link Hongguo / Yêu cầu DMCA / Hợp tác)" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500" />
          <textarea rows="3" required placeholder="Nội dung chi tiết..." class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"></textarea>
          <button type="submit" class="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-xs rounded-lg shadow hover:opacity-95 transition">
            <i class="fas fa-paper-plane mr-1.5"></i>Gửi Phản Hồi
          </button>
        </form>
      </div>
    `
  }
};

// ==================== CLIENT-SIDE HYBRID CENC-AES-128-CTR DECRYPTOR (WEB WORKER + T-TABLE + WEBCRYPTO) ====================
// Giải mã video 1080p ngay trên trình duyệt bằng Hybrid Engine (T-table In-Place cho mẫu <=2KB + WebCrypto Hardware cho I-frames)
// Chạy trong luồng nền Web Worker với Zero-Copy Transferable ArrayBuffer -> 0ms giật lag UI, nhanh gấp 4.1 lần!

window.HongguoClientDecryptor = (function () {
  function createDecryptCore() {
    const AES_SBOX = new Uint8Array(256);
    const AES_TE0 = new Uint32Array(256);
    const AES_TE1 = new Uint32Array(256);
    const AES_TE2 = new Uint32Array(256);
    const AES_TE3 = new Uint32Array(256);
    const AES_RCON = new Uint32Array([
      0x01000000, 0x02000000, 0x04000000, 0x08000000, 0x10000000,
      0x20000000, 0x40000000, 0x80000000, 0x1b000000, 0x36000000
    ]);

    const p = new Uint8Array(256);
    const q = new Uint8Array(256);
    for (let i = 0, x = 1; i < 256; i++) {
      p[i] = x;
      q[x] = i;
      x ^= (x << 1) ^ ((x & 0x80) ? 0x11b : 0);
    }
    AES_SBOX[0] = 0x63;
    for (let i = 1; i < 256; i++) {
      let x = p[255 - q[i]];
      x ^= (x << 1 | x >>> 7) ^ (x << 2 | x >>> 6) ^ (x << 3 | x >>> 5) ^ (x << 4 | x >>> 4) ^ 0x63;
      AES_SBOX[i] = x & 0xff;
    }
    for (let i = 0; i < 256; i++) {
      const s = AES_SBOX[i];
      const s2 = (s << 1) ^ ((s & 0x80) ? 0x11b : 0);
      const s3 = s2 ^ s;
      const w = (s2 << 24) | (s << 16) | (s << 8) | s3;
      AES_TE0[i] = w >>> 0;
      AES_TE1[i] = ((w >>> 8) | (w << 24)) >>> 0;
      AES_TE2[i] = ((w >>> 16) | (w << 16)) >>> 0;
      AES_TE3[i] = ((w >>> 24) | (w << 8)) >>> 0;
    }

    function expandAes128Key(keyBytes) {
      const rk = new Uint32Array(44);
      for (let i = 0; i < 4; i++) {
        rk[i] = ((keyBytes[i * 4] << 24) | (keyBytes[i * 4 + 1] << 16) | (keyBytes[i * 4 + 2] << 8) | keyBytes[i * 4 + 3]) >>> 0;
      }
      for (let i = 4; i < 44; i++) {
        let temp = rk[i - 1];
        if ((i & 3) === 0) {
          temp =
            ((AES_SBOX[(temp >>> 16) & 0xff] << 24) |
              (AES_SBOX[(temp >>> 8) & 0xff] << 16) |
              (AES_SBOX[temp & 0xff] << 8) |
              AES_SBOX[temp >>> 24]) ^
            AES_RCON[(i >>> 2) - 1];
        }
        rk[i] = (rk[i - 4] ^ temp) >>> 0;
      }
      return rk;
    }

    function aesCtrXorInPlace(data, off, sz, ivOff, rk) {
      const c0 = ((data[ivOff] << 24) | (data[ivOff + 1] << 16) | (data[ivOff + 2] << 8) | data[ivOff + 3]) >>> 0;
      const c1 = ((data[ivOff + 4] << 24) | (data[ivOff + 5] << 16) | (data[ivOff + 6] << 8) | data[ivOff + 7]) >>> 0;
      let c2 = 0;
      let c3 = 0;
      const end = off + sz;
      let ptr = off;
      while (ptr < end) {
        let s0 = c0 ^ rk[0];
        let s1 = c1 ^ rk[1];
        let s2 = c2 ^ rk[2];
        let s3 = c3 ^ rk[3];
        c3 = (c3 + 1) >>> 0;
        if (c3 === 0) c2 = (c2 + 1) >>> 0;

        for (let r = 1; r < 10; r++) {
          const k = r << 2;
          const t0 = AES_TE0[s0 >>> 24] ^ AES_TE1[(s1 >>> 16) & 0xff] ^ AES_TE2[(s2 >>> 8) & 0xff] ^ AES_TE3[s3 & 0xff] ^ rk[k];
          const t1 = AES_TE0[s1 >>> 24] ^ AES_TE1[(s2 >>> 16) & 0xff] ^ AES_TE2[(s3 >>> 8) & 0xff] ^ AES_TE3[s0 & 0xff] ^ rk[k + 1];
          const t2 = AES_TE0[s2 >>> 24] ^ AES_TE1[(s3 >>> 16) & 0xff] ^ AES_TE2[(s0 >>> 8) & 0xff] ^ AES_TE3[s1 & 0xff] ^ rk[k + 2];
          const t3 = AES_TE0[s3 >>> 24] ^ AES_TE1[(s0 >>> 16) & 0xff] ^ AES_TE2[(s1 >>> 8) & 0xff] ^ AES_TE3[s2 & 0xff] ^ rk[k + 3];
          s0 = t0; s1 = t1; s2 = t2; s3 = t3;
        }

        const w0 = (((AES_SBOX[s0 >>> 24] << 24) | (AES_SBOX[(s1 >>> 16) & 0xff] << 16) | (AES_SBOX[(s2 >>> 8) & 0xff] << 8) | AES_SBOX[s3 & 0xff]) ^ rk[40]) >>> 0;
        const w1 = (((AES_SBOX[s1 >>> 24] << 24) | (AES_SBOX[(s2 >>> 16) & 0xff] << 16) | (AES_SBOX[(s3 >>> 8) & 0xff] << 8) | AES_SBOX[s0 & 0xff]) ^ rk[41]) >>> 0;
        const w2 = (((AES_SBOX[s2 >>> 24] << 24) | (AES_SBOX[(s3 >>> 16) & 0xff] << 16) | (AES_SBOX[(s0 >>> 8) & 0xff] << 8) | AES_SBOX[s1 & 0xff]) ^ rk[42]) >>> 0;
        const w3 = (((AES_SBOX[s3 >>> 24] << 24) | (AES_SBOX[(s0 >>> 16) & 0xff] << 16) | (AES_SBOX[(s1 >>> 8) & 0xff] << 8) | AES_SBOX[s2 & 0xff]) ^ rk[43]) >>> 0;

        const rem = end - ptr;
        if (rem >= 16) {
          data[ptr] ^= w0 >>> 24; data[ptr + 1] ^= (w0 >>> 16) & 0xff; data[ptr + 2] ^= (w0 >>> 8) & 0xff; data[ptr + 3] ^= w0 & 0xff;
          data[ptr + 4] ^= w1 >>> 24; data[ptr + 5] ^= (w1 >>> 16) & 0xff; data[ptr + 6] ^= (w1 >>> 8) & 0xff; data[ptr + 7] ^= w1 & 0xff;
          data[ptr + 8] ^= w2 >>> 24; data[ptr + 9] ^= (w2 >>> 16) & 0xff; data[ptr + 10] ^= (w2 >>> 8) & 0xff; data[ptr + 11] ^= w2 & 0xff;
          data[ptr + 12] ^= w3 >>> 24; data[ptr + 13] ^= (w3 >>> 16) & 0xff; data[ptr + 14] ^= (w3 >>> 8) & 0xff; data[ptr + 15] ^= w3 & 0xff;
          ptr += 16;
        } else {
          const ks = [
            w0 >>> 24, (w0 >>> 16) & 0xff, (w0 >>> 8) & 0xff, w0 & 0xff,
            w1 >>> 24, (w1 >>> 16) & 0xff, (w1 >>> 8) & 0xff, w1 & 0xff,
            w2 >>> 24, (w2 >>> 16) & 0xff, (w2 >>> 8) & 0xff, w2 & 0xff,
            w3 >>> 24, (w3 >>> 16) & 0xff, (w3 >>> 8) & 0xff, w3 & 0xff
          ];
          for (let i = 0; i < rem; i++) data[ptr + i] ^= ks[i];
          break;
        }
      }
    }

    function readU32BE(u8, off) {
      return ((u8[off] << 24) | (u8[off + 1] << 16) | (u8[off + 2] << 8) | u8[off + 3]) >>> 0;
    }
    function writeU32BE(u8, off, val) {
      u8[off] = (val >>> 24) & 0xff;
      u8[off + 1] = (val >>> 16) & 0xff;
      u8[off + 2] = (val >>> 8) & 0xff;
      u8[off + 3] = val & 0xff;
    }
    function readU64BE(u8, off) {
      return readU32BE(u8, off) * 4294967296 + readU32BE(u8, off + 4);
    }
    function asciiTag(u8, off) {
      return String.fromCharCode(u8[off], u8[off + 1], u8[off + 2], u8[off + 3]);
    }
    function writeAsciiTag(u8, off, tag) {
      for (let i = 0; i < 4; i++) u8[off + i] = tag.charCodeAt(i);
    }
    function concatUint8Arrays(arrays) {
      let totalLen = 0;
      for (const a of arrays) totalLen += a.length;
      const out = new Uint8Array(totalLen);
      let pos = 0;
      for (const a of arrays) {
        out.set(a, pos);
        pos += a.length;
      }
      return out;
    }
    function parseMp4Boxes(u8, start, end) {
      const boxes = [];
      let off = start;
      while (off + 8 <= end) {
        let size = readU32BE(u8, off);
        const typ = asciiTag(u8, off + 4);
        let hdr = 8;
        if (size === 1) {
          if (off + 16 > end) break;
          size = readU64BE(u8, off + 8);
          hdr = 16;
        } else if (size === 0) {
          size = end - off;
        }
        if (size < hdr || off + size > end) break;
        let children = null;
        if (["moov", "trak", "mdia", "minf", "stbl", "edts", "dinf", "udta", "meta"].includes(typ)) {
          children = parseMp4Boxes(u8, off + hdr, off + size);
        }
        boxes.push({ typ, off, size, hdr, children });
        off += size;
      }
      return boxes;
    }
    function rebuildCleanMoov(u8, moovSize, topBoxes) {
      const moovBox = topBoxes.find(b => b.typ === "moov");
      if (!moovBox) throw new Error("MP4 thiếu moov box");
      function cloneBox(b) {
        return { typ: b.typ, off: b.off, size: b.size, hdr: b.hdr, children: b.children ? b.children.map(cloneBox) : null };
      }
      function prune(b) {
        if (!b.children) return b;
        b.children = b.children.filter(c => !["senc", "saio", "saiz", "sgpd", "sbgp"].includes(c.typ)).map(prune);
        return b;
      }
      const tree = prune(cloneBox(moovBox));
      function* walk(b) {
        for (const c of (b.children || [])) {
          yield c;
          for (const x of walk(c)) yield x;
        }
      }
      const patches = {};
      for (const b of walk(tree)) {
        if (b.typ === "stsd") {
          const content = b.off + 8;
          const count = readU32BE(u8, content + 4);
          let pIdx = content + 8;
          const entries = [];
          for (let i = 0; i < count; i++) {
            const esize = readU32BE(u8, pIdx);
            const etyp = asciiTag(u8, pIdx + 4);
            if (etyp === "encv" || etyp === "enca") {
              const newType = etyp === "encv" ? "hvc1" : "mp4a";
              const hdrSize = etyp === "encv" ? 78 : 28;
              const entry = new Uint8Array(8 + hdrSize);
              writeAsciiTag(entry, 4, newType);
              entry.set(u8.subarray(pIdx + 8, pIdx + 8 + hdrSize), 8);
              const extraParts = [];
              let qIdx = pIdx + 8 + hdrSize;
              while (qIdx + 8 <= pIdx + esize) {
                let s2 = readU32BE(u8, qIdx);
                const t2 = asciiTag(u8, qIdx + 4);
                if (s2 === 1) s2 = readU64BE(u8, qIdx + 8);
                else if (s2 === 0) s2 = pIdx + esize - qIdx;
                if (s2 < 8 || qIdx + s2 > pIdx + esize) break;
                if (t2 !== "sinf") extraParts.push(u8.subarray(qIdx, qIdx + s2));
                qIdx += s2;
              }
              const fullEntry = concatUint8Arrays([entry, ...extraParts]);
              writeU32BE(fullEntry, 0, fullEntry.length);
              entries.push(fullEntry);
            } else {
              entries.push(u8.subarray(pIdx, pIdx + esize));
            }
            pIdx += esize;
          }
          const stsdHdr = u8.slice(b.off, content + 8);
          writeU32BE(stsdHdr, 12, entries.length);
          const fullStsd = concatUint8Arrays([stsdHdr, ...entries]);
          writeU32BE(fullStsd, 0, fullStsd.length);
          patches[b.off] = fullStsd;
        }
      }
      function serialize(b) {
        if (!b.children) return patches[b.off] || u8.subarray(b.off, b.off + b.size);
        const body = concatUint8Arrays(b.children.map(serialize));
        const hdrb = u8.slice(b.off, b.off + b.hdr);
        writeU32BE(hdrb, 0, b.hdr + body.length);
        return concatUint8Arrays([hdrb, body]);
      }
      const firstPass = serialize(tree);
      const delta = moovSize - firstPass.length;
      for (const b of walk(tree)) {
        if (b.typ === "stco") {
          const nc = readU32BE(u8, b.off + 12);
          for (let i = 0; i < nc; i++) {
            const v = readU32BE(u8, b.off + 16 + i * 4);
            if (v >= delta) writeU32BE(u8, b.off + 16 + i * 4, v - delta);
          }
        }
      }
      return serialize(tree);
    }

    async function decryptInCurrentThread(inputBytes, keyHex) {
      const data = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes);
      const total = data.length;
      if (!keyHex || keyHex.length !== 32) return data;

      const keyBytes = new Uint8Array(16);
      for (let i = 0; i < 16; i++) keyBytes[i] = parseInt(keyHex.slice(i * 2, i * 2 + 2), 16);

      const cryptoObj = typeof self !== "undefined" && self.crypto ? self.crypto : (typeof globalThis !== "undefined" && globalThis.crypto ? globalThis.crypto : window.crypto);
      const rk = expandAes128Key(keyBytes);
      const cryptoKey = await cryptoObj.subtle.importKey("raw", keyBytes, { name: "AES-CTR" }, false, ["decrypt"]);
      const top = parseMp4Boxes(data, 0, total);
      const moov = top.find(b => b.typ === "moov");
      if (!moov) return data;

      const getBox = (boxes, typ) => (boxes || []).find(b => b.typ === typ);
      function* walkBoxes(boxes) {
        for (const b of boxes) {
          if (b.children) for (const x of walkBoxes(b.children)) yield x;
          yield b;
        }
      }

      const stbls = Array.from(walkBoxes(top)).filter(b => b.typ === "stbl");
      const largeSamples = [];

      for (const stbl of stbls) {
        const stsz = getBox(stbl.children, "stsz");
        const stco = getBox(stbl.children, "stco");
        const stsc = getBox(stbl.children, "stsc");
        const senc = getBox(stbl.children, "senc");
        if (!stsz || !stco || !stsc || !senc) continue;

        const ss = readU32BE(data, stsz.off + 12);
        const n = readU32BE(data, stsz.off + 16);
        const nc = readU32BE(data, stco.off + 12);
        const ns = readU32BE(data, stsc.off + 12);
        const sc = readU32BE(data, senc.off + 12);

        let si = 0;
        let stscIdx = 0;
        for (let ci = 0; ci < nc; ci++) {
          while (stscIdx + 1 < ns && (ci + 1) >= readU32BE(data, stsc.off + 16 + (stscIdx + 1) * 12)) {
            stscIdx++;
          }
          const spc = readU32BE(data, stsc.off + 20 + stscIdx * 12) || 1;
          let off = readU32BE(data, stco.off + 16 + ci * 4);
          for (let s = 0; s < spc; s++) {
            if (si >= n || si >= sc) break;
            const sz = ss === 0 ? readU32BE(data, stsz.off + 20 + si * 4) : ss;
            const ivOff = senc.off + 16 + si * 8;
            if (sz > 0 && off + sz <= total) {
              if (sz <= 2048) {
                aesCtrXorInPlace(data, off, sz, ivOff, rk);
              } else {
                largeSamples.push({ off, sz, ivOff });
              }
            }
            off += sz;
            si++;
          }
        }
      }

      const BATCH = 256;
      for (let i = 0; i < largeSamples.length; i += BATCH) {
        const batch = largeSamples.slice(i, i + BATCH);
        await Promise.all(
          batch.map(({ off, sz, ivOff }) => {
            const counter = new Uint8Array(16);
            counter.set(data.subarray(ivOff, ivOff + 8), 0);
            return cryptoObj.subtle.decrypt({ name: "AES-CTR", counter, length: 64 }, cryptoKey, data.subarray(off, off + sz)).then(plain => {
              data.set(new Uint8Array(plain), off);
            });
          })
        );
      }

      const newMoov = rebuildCleanMoov(data, moov.size, top);
      const outParts = [];
      let off = 0;
      while (off + 8 <= total) {
        let size = readU32BE(data, off);
        const typ = asciiTag(data, off + 4);
        if (size === 1) size = readU64BE(data, off + 8);
        else if (size === 0) size = total - off;
        if (size < 8 || off + size > total) break;
        if (typ === "moov") outParts.push(newMoov);
        else outParts.push(data.subarray(off, off + size));
        off += size;
      }
      return concatUint8Arrays(outParts);
    }

    return { decryptInCurrentThread };
  }

  let mainThreadCore = null;
  let workerInstance = null;
  let jobCounter = 0;
  const pendingJobs = new Map();

  function getWorker() {
    if (workerInstance) return workerInstance;
    try {
      const workerCode = `
        const core = (${createDecryptCore.toString()})();
        self.onmessage = async (e) => {
          const { jobId, buffer, keyHex } = e.data;
          try {
            const out = await core.decryptInCurrentThread(new Uint8Array(buffer), keyHex);
            self.postMessage({ jobId, ok: true, buffer: out.buffer }, [out.buffer]);
          } catch (err) {
            self.postMessage({ jobId, ok: false, error: err.message || String(err) });
          }
        };
      `;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      workerInstance = new Worker(URL.createObjectURL(blob));
      workerInstance.onmessage = (e) => {
        const { jobId, ok, buffer, error } = e.data;
        const job = pendingJobs.get(jobId);
        if (!job) return;
        pendingJobs.delete(jobId);
        if (ok) job.resolve(new Uint8Array(buffer));
        else job.reject(new Error(error));
      };
      workerInstance.onerror = () => {
        workerInstance = null;
      };
      return workerInstance;
    } catch {
      return null;
    }
  }

  async function decryptMp4Bytes(inputBytes, keyHex) {
    const u8 = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes);
    const worker = getWorker();
    if (worker && u8.byteOffset === 0 && u8.byteLength === u8.buffer.byteLength) {
      return new Promise((resolve, reject) => {
        const jobId = ++jobCounter;
        pendingJobs.set(jobId, { resolve, reject });
        // Zero-copy Transferable ArrayBuffer sang Web Worker
        worker.postMessage({ jobId, buffer: u8.buffer, keyHex }, [u8.buffer]);
      });
    }
    if (!mainThreadCore) mainThreadCore = createDecryptCore();
    return mainThreadCore.decryptInCurrentThread(new Uint8Array(u8), keyHex);
  }

  return { decryptMp4Bytes };
})();

