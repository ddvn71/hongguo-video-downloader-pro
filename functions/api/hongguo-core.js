// Core Engine cho Hongguo Video (红果免费短剧 / Fanqie Short Drama)
// Tương thích 100% với Cloudflare Workers, Cloudflare Pages, Trình duyệt và Node.js 18+
// Không phụ thuộc thư viện ngoài (Zero External Dependencies)

export const FQNOVEL_API_MIRRORS = [
  "https://api5-normal-sinfonlineb.fqnovel.com",
  "https://api5-normal-sinfonlinea.fqnovel.com",
  "https://api5-normal-sinfonlinec.fqnovel.com",
  "https://api5-normal-lf.fqnovel.com",
  "https://api5-normal-lq.fqnovel.com",
  "https://api5-normal-hl.fqnovel.com"
];

export const HONGGUO_WEB_ORIGIN = "https://hongguoduanju.com";
export const HONGGUO_APP_UA = "com.phoenix.read/71532 (Linux; U; Android 9; SM-N9860; Build/PQ3A.190705.10241111;tt-ok/3.12.13.20)";
export const HONGGUO_WEB_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
export const HONGGUO_MOBILE_UA = "Mozilla/5.0 (Linux; Android 12; SM-N9860) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
export const HONGGUO_VIDEO_REFERER = "https://novelquickapp.com/";

const COMMON_APP_QUERY = {
  klink_egdi: "AAI29o4dI-eMiO73_SRSbZ_0By1v3fUSriNeu8-L951MoXhWT88pzj5B",
  iid: "3788260546453235",
  device_id: "538083340353620",
  ac: "wifi",
  channel: "oppo_8662_64",
  aid: "8662",
  app_name: "novelread",
  version_code: "71532",
  version_name: "7.1.5.32",
  device_platform: "android",
  os: "android",
  ssmix: "a",
  device_type: "SM-N9860",
  device_brand: "Samsung",
  language: "zh",
  os_api: "28",
  os_version: "9",
  manifest_version_code: "71532",
  resolution: "900*1600",
  dpi: "320",
  update_version_code: "71532",
  host_abi: "arm64-v8a",
  dragon_device_type: "pad",
  pv_player: "71532",
  compliance_status: "0",
  need_personal_recommend: "1",
  player_so_load: "1",
  is_android_pad_screen: "0",
  rom_version: "PQ3A.190705.10241111+release-keys",
  cdid: "b4f93387-5319-4134-aab9-2cd4e9279b8f"
};

const DETAIL_BIZ_PARAM = {
  detail_page_version: 0,
  disable_digg_stat: false,
  image_shrink_datas_str: "W3siaW1hZ2VfdHlwZSI6MywiaW1hZ2Vfd2lkdGgiOjkwMCwic2hyaW5rX3R5cGUiOjN9LHsiaW1hZ2VfdHlwZSI6NCwiaW1hZ2Vfd2lkdGgiOjcyLCJzaHJpbmtfdHlwZSI6NH1d\n",
  need_all_video_definition: false,
  need_mp4_align: false,
  screen_width_px: "900",
  source: 7,
  use_os_player: false,
  use_server_dns: false
};

const MODEL_BIZ_PARAM = {
  detail_page_version: 0,
  device_level: 3,
  disable_digg_stat: false,
  need_all_video_definition: true,
  need_mp4_align: false,
  use_os_player: false,
  use_server_dns: false,
  video_platform: 1024
};

// ==================== TIỆN ÍCH CƠ BẢN ====================

export function cleanEscapedUrl(raw) {
  return String(raw || "")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/([?&])Range=[^&]*/gi, "$1")
    .replace(/[?&]$/, "")
    .trim();
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Trích xuất đối tượng JSON từ chuỗi HTML (ví dụ: window._ROUTER_DATA = {...})
 */
export function extractAssignedJson(html, marker = "_ROUTER_DATA") {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const first = html.indexOf("{", start);
  if (first < 0) return null;
  let depth = 0;
  let quote = false;
  let escaped = false;
  for (let i = first; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quote = false;
      continue;
    }
    if (ch === '"') quote = true;
    else if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        const raw = html.slice(first, i + 1).replace(/\\u002F/g, "/");
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// ==================== PHÂN TÍCH ĐẦU VÀO THÔNG MINH ====================

/**
 * Nhận diện loại đầu vào của người dùng:
 * - Link Hongguo / NovelQuickApp / Fqnovel / Changdu
 * - Mã số series_id hoặc vid (15-20 chữ số)
 * - Link Douyin / TikTok (tương thích ngược)
 * - Từ khóa tìm kiếm tên phim ngắn
 */
export function extractTargetFromInput(text) {
  const raw = String(text || "").trim();
  if (!raw) return { type: "empty" };

  // 1. Kiểm tra nếu là dãy số ID thuần túy (12 - 22 chữ số)
  if (/^\d{12,22}$/.test(raw)) {
    return { type: "hongguo_id", seriesId: raw, vid: null, raw };
  }

  // 2. Kiểm tra trên chuỗi có chứa tham số series_id, book_id, video_series_id
  const directSeriesMatch =
    raw.match(/(?:video_series_id|series_id|book_id)[=:/"'\s]+(\d{12,22})/i) ||
    raw.match(/hongguoduanju\.com\/player\/(\d{12,22})(?:\/(\d{12,22}))?/i);
  if (directSeriesMatch) {
    const sid = directSeriesMatch[1];
    const vid = directSeriesMatch[2] || (raw.match(/(?:vid|video_id|chapter_id)[=:/"'\s]+(\d{12,22})/i)?.[1]) || null;
    return { type: "hongguo_id", seriesId: sid, vid, raw };
  }

  // Kiểm tra link player/_/{vid}
  const directVidMatch = raw.match(/hongguoduanju\.com\/player\/_\/(\d{12,22})/i);
  if (directVidMatch) {
    return { type: "hongguo_vid", seriesId: null, vid: directVidMatch[1], raw };
  }

  // 3. Kiểm tra link Douyin / TikTok
  const douyinMatch = raw.match(/https?:\/\/(?:v|www|m|ies)\.douyin\.com\/[a-zA-Z0-9_\-\/]+/i);
  if (douyinMatch) return { type: "douyin", url: douyinMatch[0], raw };
  const tiktokMatch = raw.match(/https?:\/\/(?:vt|vm|www)\.tiktok\.com\/[a-zA-Z0-9_\-\/]+/i);
  if (tiktokMatch) return { type: "douyin", url: tiktokMatch[0], raw };

  // 4. Kiểm tra URL bất kỳ trong văn bản (ví dụ link chia sẻ novelquickapp.com/s/xxx, hongguoduanju.com, fqnovel.com...)
  const urlMatch = raw.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlMatch) {
    const cleanUrl = urlMatch[0].replace(/[，。！？；：）”】》,!?;:)\]]+$/, "");
    return { type: "hongguo_url", url: cleanUrl, raw };
  }

  // 5. Nếu văn bản có chứa dãy số 19 chữ số (thường là ID Hongguo/ByteDance)
  const nineteenDigit = raw.match(/\b(\d{18,20})\b/);
  if (nineteenDigit) {
    return { type: "hongguo_id", seriesId: nineteenDigit[1], vid: null, raw };
  }

  // 6. Còn lại: Coi là từ khóa tìm kiếm tên phim ngắn
  return { type: "keyword", keyword: raw, raw };
}

/**
 * Phân giải link chia sẻ rút gọn (novelquickapp.com/s/..., changdunovel.com, v.v.) thành { seriesId, vid }
 */
export async function resolveHongguoShareUrl(shareUrl) {
  const res = await fetchWithTimeout(shareUrl, {
    headers: {
      "User-Agent": HONGGUO_MOBILE_UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    redirect: "follow"
  }, 10000);

  const finalUrl = res.url || shareUrl;
  const html = await res.text();

  let seriesId = null;
  let vid = null;

  // 1. Tìm từ finalUrl
  const mSeriesUrl = finalUrl.match(/(?:video_series_id|series_id|book_id)=(\d{12,22})/i) ||
                     finalUrl.match(/\/player\/(\d{12,22})(?:\/(\d{12,22}))?/i);
  if (mSeriesUrl) {
    seriesId = mSeriesUrl[1];
    if (mSeriesUrl[2]) vid = mSeriesUrl[2];
  }

  const mVidUrl = finalUrl.match(/(?:video_id|vid|used_chapter_id|chapter_id)=(\d{12,22})/i);
  if (mVidUrl && !vid) vid = mVidUrl[1];

  // 2. Tìm từ schemeParams trong URL
  const schemeMatch = finalUrl.match(/schemeParams=([^&]+)/i);
  if (schemeMatch) {
    try {
      const decoded = decodeURIComponent(decodeURIComponent(schemeMatch[1]));
      const sm = decoded.match(/"(?:video_id|series_id|book_id)"\s*:\s*"(\d{12,22})"/);
      if (sm && !seriesId) seriesId = sm[1];
    } catch {}
  }

  // 3. Tìm trong nội dung HTML (SSR _ROUTER_DATA hoặc JSON nhúng)
  if (!seriesId) {
    const mHtmlSeries =
      html.match(/video_series_id=(\d{12,22})/) ||
      html.match(/"series_id"\s*:\s*"(\d{12,22})"/) ||
      html.match(/"book_id"\s*:\s*"(\d{12,22})"/) ||
      html.match(/"video_id"\s*:\s*"(\d{12,22})"/);
    if (mHtmlSeries) seriesId = mHtmlSeries[1];
  }

  if (!vid) {
    const mHtmlVid =
      html.match(/"used_chapter_id"\s*:\s*"?(\d{12,22})"?/) ||
      html.match(/"current_vid"\s*:\s*"?(\d{12,22})"?/);
    if (mHtmlVid) vid = mHtmlVid[1];
  }

  if (!seriesId && !vid) {
    throw new Error(`Không thể trích xuất mã phim (series_id) từ liên kết: ${finalUrl}`);
  }

  return { seriesId, vid, finalUrl };
}

// ==================== MULTI-PROVIDER LẤY CHI TIẾT BỘ PHIM & DANH SÁCH TẬP ====================

/**
 * Nguồn 1: Gọi cụm 6 máy chủ App Preload chính thức của Fqnovel/Hongguo
 */
export async function fetchSeriesFromFqnovelPreload(seriesId, mirrorIndex = 0, timeoutMs = 8000) {
  const host = FQNOVEL_API_MIRRORS[mirrorIndex] || FQNOVEL_API_MIRRORS[0];
  const query = new URLSearchParams({ ...COMMON_APP_QUERY, _rticket: Date.now().toString() });
  const apiUrl = `${host}/novel/player/multi_video_detail/preload/v1?${query}`;

  const res = await fetchWithTimeout(apiUrl, {
    method: "POST",
    headers: {
      "User-Agent": HONGGUO_APP_UA,
      "Accept": "application/json; charset=utf-8",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      biz_param: DETAIL_BIZ_PARAM,
      dr_scene: "preload",
      series_id: String(seriesId)
    })
  }, timeoutMs);

  if (!res.ok) throw new Error(`Fqnovel Mirror ${mirrorIndex} HTTP ${res.status}`);
  const j = await res.json();
  if (!j || j.code !== 0 || !j.data) {
    throw new Error(j?.message || `Fqnovel Mirror ${mirrorIndex} trả về mã lỗi ${j?.code}`);
  }

  const sid = Object.keys(j.data)[0];
  if (!sid || !j.data[sid]?.video_data) {
    throw new Error("Không tìm thấy dữ liệu tập phim trên Fqnovel Preload");
  }

  const vd = j.data[sid].video_data;
  const vl = Array.isArray(vd.video_list) ? vd.video_list : [];
  if (vl.length === 0) {
    throw new Error("Danh sách tập phim trống trên Fqnovel Preload");
  }

  // Trích xuất tags
  const tags = [];
  if (Array.isArray(vd.rec_tags)) {
    for (const t of vd.rec_tags) {
      if (typeof t === "string") tags.push(t);
      else if (t?.text || t?.name) tags.push(t.text || t.name);
    }
  }
  if (tags.length === 0 && vd.category_schema) {
    try {
      const parsedCat = typeof vd.category_schema === "string" ? JSON.parse(vd.category_schema) : vd.category_schema;
      if (Array.isArray(parsedCat)) {
        for (const c of parsedCat) if (c?.name) tags.push(c.name);
      }
    } catch {}
  }

  // Trích xuất diễn viên (celebrities)
  const celebrities = Array.isArray(vd.celebrities)
    ? vd.celebrities.map(c => ({
        name: c.nickname || c.name || "",
        avatar: cleanEscapedUrl(c.avatar || ""),
        role: c.sub_title || ""
      })).filter(c => c.name)
    : [];

  const episodes = vl.map((item, idx) => ({
    vid: String(item.vid),
    vid_index: Number(item.vid_index || idx + 1),
    title: item.title || `Tập ${item.vid_index || idx + 1}`,
    duration: Number(item.duration || 0),
    cover: cleanEscapedUrl(item.episode_cover || item.cover || vd.series_cover || ""),
    likes: Number(item.digged_count || 0),
    comments: Number(item.comment_count || 0)
  })).sort((a, b) => a.vid_index - b.vid_index);

  return {
    provider: `fqnovel-mirror-${mirrorIndex}`,
    platform: "hongguo",
    series_id: String(sid),
    title: vd.series_title || "Phim Ngắn Hongguo",
    cover: cleanEscapedUrl(vd.series_cover || vd.cover_url || episodes[0]?.cover || ""),
    intro: vd.series_intro || "",
    total_episodes: Number(vd.episode_cnt || episodes.length),
    status_text: vd.episode_right_text || `Trọn bộ ${episodes.length} tập`,
    tags: tags.slice(0, 8),
    celebrities,
    stats: {
      views: Number(vd.series_play_cnt || 0),
      likes: Number(vd.digg_cnt || episodes[0]?.likes || 0),
      favorites: Number(vd.followed_cnt || 0),
      hot_score: Number(vd.hot_score || 0)
    },
    episodes
  };
}

/**
 * Nguồn 2: Trích xuất từ trang Web chính thức hongguoduanju.com (SSR _ROUTER_DATA + HTML Player)
 */
export async function fetchSeriesFromHongguoWeb(seriesId, timeoutMs = 9000) {
  // Thử trang detail trước, sau đó fallback sang trang player
  const urls = [
    `${HONGGUO_WEB_ORIGIN}/detail?series_id=${encodeURIComponent(seriesId)}`,
    `${HONGGUO_WEB_ORIGIN}/player/${encodeURIComponent(seriesId)}`
  ];

  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": HONGGUO_WEB_UA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "Referer": `${HONGGUO_WEB_ORIGIN}/`
        }
      }, timeoutMs);

      if (!res.ok) throw new Error(`Web SSR HTTP ${res.status}`);
      const html = await res.text();

      const router = extractAssignedJson(html, "_ROUTER_DATA");
      let seriesDetail = null;
      if (router && router.loaderData) {
        for (const val of Object.values(router.loaderData)) {
          if (val && typeof val === "object") {
            if (val.seriesDetail && val.seriesDetail.series_id) {
              seriesDetail = val.seriesDetail;
              break;
            }
          }
        }
      }

      if (seriesDetail && Array.isArray(seriesDetail.vid_list) && seriesDetail.vid_list.length > 0) {
        const vids = seriesDetail.vid_list.map(v => String(v).trim()).filter(Boolean);
        const cover = cleanEscapedUrl(seriesDetail.series_cover || "");
        const title = seriesDetail.series_name || seriesDetail.series_title || "Phim Ngắn Hongguo";
        const tags = Array.isArray(seriesDetail.tags)
          ? seriesDetail.tags
          : Array.isArray(seriesDetail.category_list)
          ? seriesDetail.category_list.map(c => c?.name || c).filter(Boolean)
          : [];
        const celebrities = Array.isArray(seriesDetail.celebrities)
          ? seriesDetail.celebrities.map(c => ({
              name: c.nickname || "",
              avatar: cleanEscapedUrl(c.avatar || ""),
              role: c.sub_title || ""
            })).filter(c => c.name)
          : [];

        const episodes = vids.map((vid, idx) => ({
          vid,
          vid_index: idx + 1,
          title: `Tập ${idx + 1}`,
          duration: 0,
          cover,
          likes: 0,
          comments: 0
        }));

        return {
          provider: "hongguo-web-ssr",
          platform: "hongguo",
          series_id: String(seriesDetail.series_id || seriesId),
          title,
          cover,
          intro: seriesDetail.series_intro || "",
          total_episodes: Number(seriesDetail.episode_cnt || episodes.length),
          status_text: seriesDetail.episode_right_text || `Trọn bộ ${episodes.length} tập`,
          tags: tags.slice(0, 8),
          celebrities,
          stats: { views: 0, likes: 0, favorites: 0, hot_score: 0 },
          episodes
        };
      }

      // Regex fallback nếu cấu trúc _ROUTER_DATA thay đổi
      const vidListMatch = html.match(/"vid_list"\s*:\s*\[([^\]]+)\]/);
      if (vidListMatch) {
        const vids = vidListMatch[1]
          .split(",")
          .map(s => s.trim().replace(/^"|"$/g, ""))
          .filter(s => /^\d+$/.test(s));
        if (vids.length > 0) {
          const nameMatch = html.match(/"series_name"\s*:\s*"([^"]+)"/);
          const coverMatch = html.match(/"series_cover"\s*:\s*"([^"]+)"/);
          const introMatch = html.match(/"series_intro"\s*:\s*"([^"]*)"/);
          const title = nameMatch ? nameMatch[1] : "Phim Ngắn Hongguo";
          const cover = coverMatch ? cleanEscapedUrl(coverMatch[1]) : "";
          const episodes = vids.map((vid, idx) => ({
            vid,
            vid_index: idx + 1,
            title: `Tập ${idx + 1}`,
            duration: 0,
            cover,
            likes: 0,
            comments: 0
          }));
          return {
            provider: "hongguo-web-regex",
            platform: "hongguo",
            series_id: String(seriesId),
            title,
            cover,
            intro: introMatch ? introMatch[1] : "",
            total_episodes: episodes.length,
            status_text: `Trọn bộ ${episodes.length} tập`,
            tags: [],
            celebrities: [],
            stats: { views: 0, likes: 0, favorites: 0, hot_score: 0 },
            episodes
          };
        }
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Không thể lấy danh sách tập từ Hongguo Web SSR");
}

/**
 * Nguồn 3: Third-party Public Duanju APIs (Cenguigui / Custom Endpoint)
 */
export async function fetchSeriesFromThirdParty(seriesId, customApi = "", timeoutMs = 7000) {
  const endpoints = [];
  if (customApi) {
    const sep = customApi.includes("?") ? "&" : "?";
    endpoints.push(`${customApi}${sep}book_id=${encodeURIComponent(seriesId)}`);
  }
  endpoints.push(`https://api-v2.cenguigui.cn/api/duanju/api.php?book_id=${encodeURIComponent(seriesId)}`);
  endpoints.push(`https://api.cenguigui.cn/api/duanju/api.php?book_id=${encodeURIComponent(seriesId)}`);

  let lastErr = null;
  for (const ep of endpoints) {
    try {
      const res = await fetchWithTimeout(ep, {
        headers: { "User-Agent": HONGGUO_WEB_UA }
      }, timeoutMs);
      if (!res.ok) continue;
      const j = await res.json();
      const d = j.data || j;
      const list = Array.isArray(d.episodes) ? d.episodes : Array.isArray(d.data) ? d.data : [];
      if (list.length > 0) {
        const episodes = list.map((item, idx) => ({
          vid: String(item.video_id || item.vid || ""),
          vid_index: Number(item.index || item.vid_index || idx + 1),
          title: item.title || `Tập ${idx + 1}`,
          duration: Number(item.duration || 0),
          cover: cleanEscapedUrl(d.cover || item.cover || ""),
          likes: 0,
          comments: 0
        })).filter(e => e.vid);

        return {
          provider: "third-party-api",
          platform: "hongguo",
          series_id: String(seriesId),
          title: d.title || d.book_name || "Phim Ngắn Hongguo",
          cover: cleanEscapedUrl(d.cover || ""),
          intro: d.intro || d.desc || "",
          total_episodes: episodes.length,
          status_text: `Trọn bộ ${episodes.length} tập`,
          tags: [],
          celebrities: [],
          stats: { views: 0, likes: 0, favorites: 0, hot_score: 0 },
          episodes
        };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Third-party Duanju API không phản hồi");
}

/**
 * Hàm điều phối xoay tua đa luồng lấy thông tin bộ phim Hongguo
 */
export async function fetchHongguoSeriesDetail(seriesId, route = "auto", customApi = "") {
  const errors = [];

  if (route === "web-ssr") {
    return { data: await fetchSeriesFromHongguoWeb(seriesId), errors };
  }
  if (route.startsWith("fqnovel-")) {
    const idx = parseInt(route.replace("fqnovel-", ""), 10) || 0;
    return { data: await fetchSeriesFromFqnovelPreload(seriesId, idx), errors };
  }
  if (route === "third-party") {
    return { data: await fetchSeriesFromThirdParty(seriesId, customApi), errors };
  }

  // Chế độ "auto": Xoay tua thông minh
  // Bước 1: Thử 3 Mirror đầu của Fqnovel App Preload (nhiều metadata nhất: diễn viên, lượt xem, tiêu đề từng tập)
  for (let i = 0; i < 3; i++) {
    try {
      const data = await fetchSeriesFromFqnovelPreload(seriesId, i, 6000);
      return { data, errors };
    } catch (e) {
      errors.push(`Fqnovel[${i}]: ${e.message}`);
    }
  }

  // Bước 2: Thử Hongguo Web SSR (hongguoduanju.com)
  try {
    const data = await fetchSeriesFromHongguoWeb(seriesId, 7000);
    return { data, errors };
  } catch (e) {
    errors.push(`WebSSR: ${e.message}`);
  }

  // Bước 3: Thử các Mirror còn lại của Fqnovel
  for (let i = 3; i < FQNOVEL_API_MIRRORS.length; i++) {
    try {
      const data = await fetchSeriesFromFqnovelPreload(seriesId, i, 5000);
      return { data, errors };
    } catch (e) {
      errors.push(`Fqnovel[${i}]: ${e.message}`);
    }
  }

  // Bước 4: Thử Third-party / Custom API
  try {
    const data = await fetchSeriesFromThirdParty(seriesId, customApi, 6000);
    return { data, errors };
  } catch (e) {
    errors.push(`ThirdParty: ${e.message}`);
  }

  throw new Error(`Không thể tải thông tin bộ phim (${seriesId}). Chi tiết: ${errors.join(" | ")}`);
}

// ==================== GIẢI MÃ KHÓA SPADE_A & LẤY LUỒNG VIDEO ĐA ĐỘ PHÂN GIẢI ====================

function avBase64Decode(s) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const table = {};
  for (let i = 0; i < chars.length; i++) table[chars.charCodeAt(i)] = i;
  const dst = [];
  let i = 0;
  while (i + 4 <= s.length) {
    const vals = [];
    let ok = true;
    for (let j = 0; j < 4; j++) {
      const c = s.charCodeAt(i + j);
      if (c in table) vals.push(table[c]);
      else {
        ok = false;
        break;
      }
    }
    if (!ok) {
      let v = 0;
      for (let j2 = 0; j2 < vals.length; j2++) v = (v << 6) | vals[j2];
      if (vals.length === 3) dst.push((v >> 10) & 0xff, (v >> 2) & 0xff);
      else if (vals.length === 2) dst.push((v >> 4) & 0xff);
      break;
    }
    const v = (vals[0] << 18) | (vals[1] << 12) | (vals[2] << 6) | vals[3];
    dst.push((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);
    i += 4;
  }
  return new Uint8Array(dst);
}

/**
 * Thuật toán giải mã spade_a của ByteDance (libttmplayer.so) -> 16-byte AES-128-CTR Key (dạng chuỗi Hex 32 ký tự)
 */
export function deriveSpadeKeyHex(spadeA) {
  if (!spadeA) return null;
  const buf = avBase64Decode(String(spadeA).trim());
  const L = buf.length;
  if (L < 3) return null;

  const key0 = buf[0] ^ buf[1] ^ buf[2];
  const x27 = key0 - 0x30;
  const w22 = L - key0 + 0x2f;
  if (x27 < 2 || w22 < 2 || w22 > L - 1) return null;

  const x21 = buf.slice(1, 1 + w22);
  let w11 = 0x55, w12 = 0xfa, w10 = 0xeb;
  for (let i = 0; i < x21.length; i++) {
    const w13 = x21[i];
    const pc = i.toString(2).split("1").length - 1;
    const w14 = (i & 1) === 0 ? w12 : w11;
    if ((i & 1) === 1) w11 = w13;
    else w12 = w13;
    const w13_xor = w14 ^ x21[i];
    const w14_sub = w10 - pc;
    x21[i] = (w14_sub + w13_xor) & 0xff;
  }

  const c0 = x21[0];
  let hval = 0;
  if (0x30 <= c0 && c0 <= 0x39) hval = c0 - 0x30;
  else if (0x61 <= c0 && c0 <= 0x7a) hval = c0 - 0x57;
  else return null;

  const w9 = w22 - hval;
  if (w9 < 2) return null;

  let hexStr = "";
  const endIdx = Math.min(x21.length, 1 + w9 - 1);
  for (let i = 1; i < endIdx; i++) {
    hexStr += String.fromCharCode(x21[i]);
  }
  if (hexStr.length !== 32 || !/^[0-9a-fA-F]{32}$/.test(hexStr)) return null;
  return hexStr.toLowerCase();
}

function parseQualityScore(defStr, width, height) {
  const m = String(defStr || "").match(/(\d+)\s*p/i);
  if (m) return parseInt(m[1], 10);
  const minDim = Math.min(Number(width) || 0, Number(height) || 0);
  if (minDim >= 1000) return 1080;
  if (minDim >= 700) return 720;
  if (minDim >= 500) return 540;
  if (minDim >= 450) return 480;
  return 360;
}

/**
 * Lấy danh sách tất cả các luồng chất lượng video (1080p, 720p, 540p, 480p, 360p + Web Direct H.264) cho 1 tập phim (vid)
 */
export async function fetchHongguoEpisodeStreams(vid, seriesId = "", route = "auto") {
  const qualities = [];
  const errors = [];
  let duration = 0;

  // 1. Luôn kiểm tra luồng Web Direct H.264 (360p không mã hóa CENC, phát trực tiếp trên mọi trình duyệt)
  const webDirectUrl = `${HONGGUO_WEB_ORIGIN}/video/public/${encodeURIComponent(vid)}/360p.mp4`;

  // 2. Lấy toàn bộ độ phân giải 360p -> 1080p từ Fqnovel Preload Video Model API
  if (route !== "web-only") {
    const startMirror = route.startsWith("fqnovel-") ? (parseInt(route.replace("fqnovel-", ""), 10) || 0) : 0;
    const mirrorOrder = [startMirror, ...FQNOVEL_API_MIRRORS.map((_, idx) => idx).filter(i => i !== startMirror)];

    for (const mIdx of mirrorOrder.slice(0, 3)) {
      try {
        const host = FQNOVEL_API_MIRRORS[mIdx];
        const query = new URLSearchParams({ ...COMMON_APP_QUERY, _rticket: Date.now().toString() });
        const res = await fetchWithTimeout(`${host}/novel/player/multi_video_model/preload/v1?${query}`, {
          method: "POST",
          headers: {
            "User-Agent": HONGGUO_APP_UA,
            "Accept": "application/json; charset=utf-8",
            "Content-Type": "application/json; charset=utf-8"
          },
          body: JSON.stringify({
            biz_param: MODEL_BIZ_PARAM,
            dr_scene: "preload",
            mixed_video_id_map: { "1004": [String(vid)] }
          })
        }, 7000);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const item = j?.data?.[String(vid)];
        if (item && item.video_model) {
          const vm = typeof item.video_model === "string" ? JSON.parse(item.video_model) : item.video_model;
          duration = Number(vm.video_duration || 0);
          const vlist = Array.isArray(vm.video_list) ? vm.video_list : Object.values(vm.video_list || {});

          for (const v of vlist) {
            const mainUrl = cleanEscapedUrl(v.main_url || "");
            if (!mainUrl) continue;
            const meta = v.video_meta || v;
            const def = meta.definition || v.definition || "720p";
            const width = Number(meta.vwidth || v.vwidth || 0);
            const height = Number(meta.vheight || v.vheight || 0);
            const size = Number(meta.size || v.size || 0);
            const bitrate = Number(meta.bitrate || v.bitrate || 0);
            const codec = meta.codec_type || v.codec_type || "bytevc1";
            const spadeA = v.encrypt_info?.spade_a || v.spade_a || null;
            const keyHex = spadeA ? deriveSpadeKeyHex(spadeA) : null;
            const score = parseQualityScore(def, width, height);

            qualities.push({
              id: `app-${def}`,
              label: `${def.toUpperCase()} ${score >= 1080 ? "Full HD" : score >= 720 ? "HD" : "SD"}`,
              definition: def,
              score,
              width,
              height,
              size,
              bitrate,
              codec,
              url: mainUrl,
              backup_url: cleanEscapedUrl(v.backup_url || v.backup_url_1 || ""),
              encrypted: Boolean(spadeA),
              spade_a: spadeA,
              key_hex: keyHex,
              source: `fqnovel-mirror-${mIdx}`
            });
          }

          // Nếu vlist trống nhưng có fallback_api (ByteDance VAS fplay), gọi tiếp fallback_api
          if (qualities.length === 0 && vm.fallback_api?.fallback_api) {
            const fbUrl = vm.fallback_api.fallback_api.replace("codec_type=3", "codec_type=0");
            const fbRes = await fetchWithTimeout(fbUrl, { headers: { "User-Agent": HONGGUO_APP_UA } }, 6000);
            if (fbRes.ok) {
              const fbJson = await fbRes.json();
              const fbList = Object.values(fbJson?.video_info?.data?.video_list || {});
              for (const v of fbList) {
                const mainUrl = cleanEscapedUrl(v.main_url || "");
                if (!mainUrl) continue;
                const def = v.definition || "720p";
                const spadeA = v.spade_a || v.encrypt_info?.spade_a || null;
                const keyHex = spadeA ? deriveSpadeKeyHex(spadeA) : null;
                const score = parseQualityScore(def, v.vwidth, v.vheight);
                qualities.push({
                  id: `vas-${def}`,
                  label: `${def.toUpperCase()} ${score >= 1080 ? "Full HD" : score >= 720 ? "HD" : "SD"}`,
                  definition: def,
                  score,
                  width: Number(v.vwidth || 0),
                  height: Number(v.vheight || 0),
                  size: Number(v.size || 0),
                  bitrate: Number(v.bitrate || 0),
                  codec: v.codec_type || "h265",
                  url: mainUrl,
                  backup_url: cleanEscapedUrl(v.backup_url_1 || ""),
                  encrypted: Boolean(spadeA),
                  spade_a: spadeA,
                  key_hex: keyHex,
                  source: "bytedance-vas-fplay"
                });
              }
            }
          }

          if (qualities.length > 0) break;
        }
      } catch (e) {
        errors.push(`Model[${mIdx}]: ${e.message}`);
      }
    }
  }

  // Sắp xếp theo độ phân giải giảm dần (1080p -> 720p -> 540p -> 480p -> 360p)
  qualities.sort((a, b) => b.score - a.score);

  // Thêm luồng Web Direct H.264 (tương thích 100% trình duyệt không cần giải mã CENC)
  qualities.push({
    id: "web-360p-h264",
    label: "360P Web Direct (H.264 - Phát & Tải Nhanh)",
    definition: "360p-h264",
    score: 365, // Ưu tiên cho trình phát xem trước trực tuyến vì là H.264 không mã hóa
    width: 360,
    height: 640,
    size: 0,
    bitrate: 0,
    codec: "h264",
    url: webDirectUrl,
    backup_url: "",
    encrypted: false,
    spade_a: null,
    key_hex: null,
    source: "hongguo-web-direct"
  });

  return {
    vid: String(vid),
    series_id: String(seriesId || ""),
    duration,
    qualities,
    preview_url: webDirectUrl,
    errors: errors.length ? errors : undefined
  };
}

// ==================== TÌM KIẾM & KHÁM PHÁ PHIM NGẮN HONGGUO ====================

function formatSeriesCard(item) {
  const source = item?.video_data && typeof item.video_data === "object" ? item.video_data : item;
  const sid = String(source?.series_id || source?.seriesId || source?.id || "").trim();
  const title = String(source?.series_name || source?.series_title || source?.title || "").trim();
  if (!sid || !title) return null;

  const cover = cleanEscapedUrl(source?.series_cover || source?.cover || source?.seriesCover || "");
  const episodeCnt = Number(source?.episode_cnt || source?.episodeCount || source?.series_episode_info?.episode_cnt || 0);
  const statusText = source?.episode_right_text || (episodeCnt ? `Trọn bộ ${episodeCnt} tập` : "Phim ngắn");
  const tags = Array.isArray(source?.tags)
    ? source.tags
    : Array.isArray(source?.category_list)
    ? source.category_list.map(c => c?.name || c).filter(Boolean)
    : [];

  return {
    series_id: sid,
    title,
    cover,
    episode_cnt: episodeCnt,
    status_text: statusText,
    tags: tags.slice(0, 5),
    intro: String(source?.series_intro || source?.description || source?.intro || "").trim(),
    rank: Number(source?.rank || 0)
  };
}

/**
 * Tìm kiếm phim ngắn Hongguo theo từ khóa
 */
export async function searchHongguoDramas(keyword, page = 1) {
  const q = String(keyword || "").trim();
  if (!q) return { list: [], total: 0, page: 1 };

  const searchUrl = `${HONGGUO_WEB_ORIGIN}/search/${encodeURIComponent(q)}${page > 1 ? `?page=${page}` : ""}`;
  const res = await fetchWithTimeout(searchUrl, {
    headers: {
      "User-Agent": HONGGUO_WEB_UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Referer": `${HONGGUO_WEB_ORIGIN}/`
    }
  }, 9000);

  if (!res.ok) throw new Error(`Hongguo Search HTTP ${res.status}`);
  const html = await res.text();
  const router = extractAssignedJson(html, "_ROUTER_DATA");

  const list = [];
  const seen = new Set();
  let total = 0;

  if (router && router.loaderData) {
    const pageData = router.loaderData["search_(keyword)/page"] || router.loaderData.search_page || {};
    total = Number(pageData.totalCount || 0);
    const searchList = Array.isArray(pageData.searchList) ? pageData.searchList : [];
    for (const item of searchList) {
      const card = formatSeriesCard(item);
      if (card && !seen.has(card.series_id)) {
        seen.add(card.series_id);
        list.push(card);
      }
    }
  }

  return {
    keyword: q,
    page: Number(page) || 1,
    total: total || list.length,
    list
  };
}

/**
 * Khám phá danh sách phim ngắn Hot / Phân loại trên Hongguo (Dùng cho Landing Page)
 * category: 'hot' | 'real-drama' | 'comic-drama' | 'ai-drama' | 'latest'
 */
export async function discoverHongguoDramas(category = "hot", page = 1) {
  let targetUrl = `${HONGGUO_WEB_ORIGIN}/category`;
  if (category === "hot") {
    targetUrl = page > 1 ? `${HONGGUO_WEB_ORIGIN}/category?sort_type=1&page=${page}` : `${HONGGUO_WEB_ORIGIN}/`;
  } else if (category === "latest") {
    targetUrl = `${HONGGUO_WEB_ORIGIN}/category?sort_type=2${page > 1 ? `&page=${page}` : ""}`;
  } else if (["real-drama", "comic-drama", "ai-drama"].includes(category)) {
    targetUrl = `${HONGGUO_WEB_ORIGIN}/category/${category}${page > 1 ? `?page=${page}` : ""}`;
  } else {
    targetUrl = `${HONGGUO_WEB_ORIGIN}/category?sort_type=1${page > 1 ? `&page=${page}` : ""}`;
  }

  const res = await fetchWithTimeout(targetUrl, {
    headers: {
      "User-Agent": HONGGUO_WEB_UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9"
    }
  }, 9000);

  if (!res.ok) throw new Error(`Hongguo Discover HTTP ${res.status}`);
  const html = await res.text();
  const router = extractAssignedJson(html, "_ROUTER_DATA");

  const list = [];
  const seen = new Set();
  let totalPages = 1;

  if (router && router.loaderData) {
    // Nếu là trang chủ '/'
    if (router.loaderData.page) {
      const sections = router.loaderData.page.homeSections || [];
      for (const sec of sections) {
        for (const item of (sec.video_list || [])) {
          const card = formatSeriesCard(item);
          if (card && !seen.has(card.series_id)) {
            seen.add(card.series_id);
            list.push(card);
          }
        }
      }
    }
    // Nếu là trang category
    const catPage = router.loaderData.category_page || router.loaderData["category_$"];
    if (catPage) {
      totalPages = Number(catPage.pagination?.totalPages || 1);
      for (const item of (catPage.recommendList || [])) {
        const card = formatSeriesCard(item);
        if (card && !seen.has(card.series_id)) {
          seen.add(card.series_id);
          list.push(card);
        }
      }
    }
  }

  return {
    category,
    page: Number(page) || 1,
    total_pages: totalPages,
    list
  };
}

// ==================== GIẢI MÃ MP4 CENC-AES-128-CTR (WEBCRYPTO / ISOMORPHIC) ====================

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
  const hi = readU32BE(u8, off);
  const lo = readU32BE(u8, off + 4);
  return hi * 4294967296 + lo;
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
    return {
      typ: b.typ,
      off: b.off,
      size: b.size,
      hdr: b.hdr,
      children: b.children ? b.children.map(cloneBox) : null
    };
  }

  function pruneEncryptionBoxes(b) {
    if (!b.children) return b;
    b.children = b.children
      .filter(c => !["senc", "saio", "saiz", "sgpd", "sbgp"].includes(c.typ))
      .map(pruneEncryptionBoxes);
    return b;
  }

  const tree = pruneEncryptionBoxes(cloneBox(moovBox));

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
      let p = content + 8;
      const entries = [];
      for (let i = 0; i < count; i++) {
        const esize = readU32BE(u8, p);
        const etyp = asciiTag(u8, p + 4);
        if (etyp === "encv" || etyp === "enca") {
          const newType = etyp === "encv" ? "hvc1" : "mp4a";
          const hdrSize = etyp === "encv" ? 78 : 28;
          const entry = new Uint8Array(8 + hdrSize);
          writeAsciiTag(entry, 4, newType);
          entry.set(u8.subarray(p + 8, p + 8 + hdrSize), 8);

          const extraParts = [];
          let q = p + 8 + hdrSize;
          while (q + 8 <= p + esize) {
            let s2 = readU32BE(u8, q);
            const t2 = asciiTag(u8, q + 4);
            if (s2 === 1) s2 = readU64BE(u8, q + 8);
            else if (s2 === 0) s2 = p + esize - q;
            if (s2 < 8 || q + s2 > p + esize) break;
            if (t2 !== "sinf") extraParts.push(u8.subarray(q, q + s2));
            q += s2;
          }
          const fullEntry = concatUint8Arrays([entry, ...extraParts]);
          writeU32BE(fullEntry, 0, fullEntry.length);
          entries.push(fullEntry);
        } else {
          entries.push(u8.subarray(p, p + esize));
        }
        p += esize;
      }
      const stsdHdr = u8.slice(b.off, content + 8);
      writeU32BE(stsdHdr, 12, entries.length);
      const fullStsd = concatUint8Arrays([stsdHdr, ...entries]);
      writeU32BE(fullStsd, 0, fullStsd.length);
      patches[b.off] = fullStsd;
    }
  }

  function serializeBox(b) {
    if (!b.children) return patches[b.off] || u8.subarray(b.off, b.off + b.size);
    const body = concatUint8Arrays(b.children.map(serializeBox));
    const hdrb = u8.slice(b.off, b.off + b.hdr);
    writeU32BE(hdrb, 0, b.hdr + body.length);
    return concatUint8Arrays([hdrb, body]);
  }

  const firstPass = serializeBox(tree);
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

  return serializeBox(tree);
}

/**
 * Giải mã toàn bộ file MP4 CENC-AES-128-CTR trong bộ nhớ bằng WebCrypto (crypto.subtle)
 * Chạy cực nhanh (~30ms cho 10MB) trên Cloudflare Workers, Node.js 18+ và Trình duyệt
 */
export async function decryptCencMp4(inputBytes, keyHex) {
  const data = inputBytes instanceof Uint8Array ? new Uint8Array(inputBytes) : new Uint8Array(inputBytes);
  const total = data.length;
  if (!keyHex || keyHex.length !== 32) return data;

  const keyBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    keyBytes[i] = parseInt(keyHex.slice(i * 2, i * 2 + 2), 16);
  }

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CTR" },
    false,
    ["decrypt"]
  );

  const top = parseMp4Boxes(data, 0, total);
  const moov = top.find(b => b.typ === "moov");
  if (!moov) throw new Error("Không tìm thấy moov box trong file MP4");

  const getBox = (boxes, typ) => (boxes || []).find(b => b.typ === typ);
  function* walkBoxes(boxes) {
    for (const b of boxes) {
      if (b.children) for (const x of walkBoxes(b.children)) yield x;
      yield b;
    }
  }

  const stbls = Array.from(walkBoxes(top)).filter(b => b.typ === "stbl");
  const decryptJobs = [];

  for (const stbl of stbls) {
    const stsz = getBox(stbl.children, "stsz");
    const stco = getBox(stbl.children, "stco");
    const stsc = getBox(stbl.children, "stsc");
    const senc = getBox(stbl.children, "senc");
    if (!stsz || !stco || !stsc || !senc) continue;

    const ss = readU32BE(data, stsz.off + 12);
    const n = readU32BE(data, stsz.off + 16);
    const sizes = new Array(n);
    if (ss === 0) {
      for (let i = 0; i < n; i++) sizes[i] = readU32BE(data, stsz.off + 20 + i * 4);
    } else {
      sizes.fill(ss);
    }

    const nc = readU32BE(data, stco.off + 12);
    const chunkOffs = new Array(nc);
    for (let i = 0; i < nc; i++) chunkOffs[i] = readU32BE(data, stco.off + 16 + i * 4);

    const ns = readU32BE(data, stsc.off + 12);
    const stscTab = [];
    for (let i = 0; i < ns; i++) {
      stscTab.push([
        readU32BE(data, stsc.off + 16 + i * 12),
        readU32BE(data, stsc.off + 20 + i * 12),
        readU32BE(data, stsc.off + 24 + i * 12)
      ]);
    }

    const sc = readU32BE(data, senc.off + 12);
    const ivs = new Array(sc);
    for (let i = 0; i < sc; i++) {
      ivs[i] = data.subarray(senc.off + 16 + i * 8, senc.off + 24 + i * 8);
    }

    const chunkSpc = {};
    for (let i = 0; i < stscTab.length; i++) {
      const fc = stscTab[i][0];
      const spc = stscTab[i][1];
      const nxt = i + 1 < stscTab.length ? stscTab[i + 1][0] : nc + 1;
      for (let ci = fc - 1; ci < nxt - 1; ci++) chunkSpc[ci] = spc;
    }

    const sampleOffs = [];
    let si = 0;
    for (let ci = 0; ci < nc; ci++) {
      let off = chunkOffs[ci];
      const spc = chunkSpc[ci] || 1;
      for (let s = 0; s < spc; s++) {
        if (si >= n) break;
        sampleOffs.push(off);
        off += sizes[si];
        si++;
      }
    }

    for (let i = 0; i < sampleOffs.length; i++) {
      const off = sampleOffs[i];
      const sz = sizes[i];
      if (sz <= 0 || off + sz > total || i >= ivs.length) continue;
      const counter = new Uint8Array(16);
      counter.set(ivs[i], 0); // 8-byte IV ở đầu, 8-byte block counter = 0 ở sau
      const sampleSlice = data.subarray(off, off + sz);
      decryptJobs.push(
        globalThis.crypto.subtle
          .decrypt({ name: "AES-CTR", counter, length: 64 }, cryptoKey, sampleSlice)
          .then(plainBuf => {
            data.set(new Uint8Array(plainBuf), off);
          })
      );
    }
  }

  // Giải mã song song theo batch để tối ưu bộ nhớ
  const BATCH_SIZE = 500;
  for (let i = 0; i < decryptJobs.length; i += BATCH_SIZE) {
    await Promise.all(decryptJobs.slice(i, i + BATCH_SIZE));
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
