// Cloudflare Pages Function: /api/parse
// Bộ phân tích Đa Năng: Hỗ trợ Hongguo Short Drama (Link chia sẻ, Series ID, Video ID, Từ khóa) + Douyin/TikTok
// Xoay tua đa luồng: Fqnovel 6 Mirrors -> Hongguo Web SSR -> ByteDance VAS -> Third-Party API -> TikWM/Apihz

import {
  extractTargetFromInput,
  resolveHongguoShareUrl,
  fetchHongguoSeriesDetail,
  fetchHongguoEpisodeStreams,
  searchHongguoDramas
} from "./hongguo-core.js";

const DEFAULT_APIHZ_ID = "10003120";
const DEFAULT_APIHZ_KEY = "bfb75036b210ed35bee6e002d623293c";

const APIHZ_ROUTES = [
  "https://cn.apihz.cn/api/fun/douyin.php",
  "http://101.35.2.25/api/fun/douyin.php",
  "http://124.222.204.22/api/fun/douyin.php",
  "http://124.220.49.230/api/fun/douyin.php"
];

function attachEpisodeUrls(streamData, seriesTitle = "hongguo_drama", epIndex = 1) {
  if (!streamData || !Array.isArray(streamData.qualities)) return streamData;
  const safeBase = `${seriesTitle}_Tap_${String(epIndex).padStart(3, "0")}`.slice(0, 60);
  for (const q of streamData.qualities) {
    const fname = `${safeBase}_${q.definition || "hd"}.mp4`;
    const keyParam = q.encrypted && q.key_hex ? `&key=${encodeURIComponent(q.key_hex)}` : "";
    q.proxy_download_url = `/api/download?url=${encodeURIComponent(q.url)}${keyParam}&filename=${encodeURIComponent(fname)}`;
    q.proxy_stream_url = `/api/video?url=${encodeURIComponent(q.url)}${keyParam}`;
  }
  if (streamData.preview_url) {
    streamData.proxy_preview_url = `/api/video?url=${encodeURIComponent(streamData.preview_url)}`;
  }
  return streamData;
}

// ==================== DOUYIN / TIKTOK FALLBACK PARSERS ====================

async function parseWithTikWM(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: new URLSearchParams({ url: url, hd: "1" }).toString(),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`TikWM HTTP ${res.status}`);
    const data = await res.json();
    if (data.code === 0 && data.data) {
      const d = data.data;
      const isImages = Array.isArray(d.images) && d.images.length > 0;
      return {
        provider: "tikwm",
        platform: "douyin",
        id: d.id || "",
        type: isImages ? "images" : "video",
        title: d.title || "Video Douyin/TikTok",
        author: {
          name: d.author?.nickname || "User",
          avatar: d.author?.avatar || "",
          id: d.author?.unique_id || d.author?.id || ""
        },
        cover: d.cover || (isImages ? d.images[0] : ""),
        video: isImages ? null : {
          url: d.play || d.wmplay || "",
          hd_url: d.hdplay || d.play || "",
          duration: d.duration || 0
        },
        music: d.music || d.music_info?.play ? {
          url: d.music || d.music_info?.play || "",
          title: d.music_info?.title || "Original Sound"
        } : null,
        images: isImages ? d.images : [],
        stats: {
          likes: d.digg_count || 0,
          comments: d.comment_count || 0,
          shares: d.share_count || 0
        }
      };
    }
    throw new Error(data.msg || "TikWM parse failed");
  } finally {
    clearTimeout(timer);
  }
}

async function parseWithApihz(url, id, key, routeIndex = 0, timeoutMs = 7000) {
  const targetRoute = APIHZ_ROUTES[routeIndex] || APIHZ_ROUTES[0];
  const apiUrl = `${targetRoute}?id=${id || DEFAULT_APIHZ_ID}&key=${key || DEFAULT_APIHZ_KEY}&url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Apihz HTTP ${res.status}`);
    const data = await res.json();
    if (data.code === 200) {
      const isImages = data.type === "图集" || (Array.isArray(data.images) && data.images.length > 0);
      return {
        provider: `apihz-route-${routeIndex}`,
        platform: "douyin",
        id: "",
        type: isImages ? "images" : "video",
        title: data.title || "Video Douyin",
        author: { name: data.name || "Douyin User", avatar: "", id: "" },
        cover: data.cover || "",
        video: isImages ? null : { url: data.yvideo || "", hd_url: data.yvideo || "", duration: 0 },
        music: null,
        images: isImages ? (data.images || []) : [],
        stats: { likes: 0, comments: 0, shares: 0 }
      };
    }
    throw new Error(data.msg || `Apihz code ${data.code}`);
  } finally {
    clearTimeout(timer);
  }
}

// ==================== MAIN HANDLER ====================

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  try {
    let rawUrl = "";
    let provider = "auto";
    let apihzId = DEFAULT_APIHZ_ID;
    let apihzKey = DEFAULT_APIHZ_KEY;
    let customApi = "";

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      rawUrl = body.url || body.input || body.q || "";
      provider = body.provider || "auto";
      apihzId = body.apihzId || DEFAULT_APIHZ_ID;
      apihzKey = body.apihzKey || DEFAULT_APIHZ_KEY;
      customApi = body.customApi || "";
    } else {
      const u = new URL(request.url);
      rawUrl = u.searchParams.get("url") || u.searchParams.get("input") || u.searchParams.get("q") || "";
      provider = u.searchParams.get("provider") || "auto";
      apihzId = u.searchParams.get("id") || DEFAULT_APIHZ_ID;
      apihzKey = u.searchParams.get("key") || DEFAULT_APIHZ_KEY;
      customApi = u.searchParams.get("customApi") || "";
    }

    const target = extractTargetFromInput(rawUrl);
    if (target.type === "empty") {
      return new Response(JSON.stringify({
        success: false,
        message: "Vui lòng nhập link Hongguo Short Drama, mã series_id / video_id hoặc tên bộ phim cần tìm."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    // TRƯỜNG HỢP 1: Người dùng nhập từ khóa tên phim -> Tìm kiếm trên Hongguo
    if (target.type === "keyword") {
      const searchRes = await searchHongguoDramas(target.keyword, 1);
      return new Response(JSON.stringify({
        success: true,
        mode: "search",
        data: {
          platform: "hongguo",
          type: "search_results",
          keyword: target.keyword,
          total: searchRes.total,
          results: searchRes.list
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    // TRƯỜNG HỢP 2: Link Douyin / TikTok (Tương thích đa nền tảng)
    if (target.type === "douyin") {
      let result = null;
      const errors = [];
      try {
        result = await parseWithTikWM(target.url);
      } catch (e) {
        errors.push(`TikWM: ${e.message}`);
      }
      if (!result) {
        for (let i = 0; i < APIHZ_ROUTES.length; i++) {
          try {
            result = await parseWithApihz(target.url, apihzId, apihzKey, i);
            if (result) break;
          } catch (e) {
            errors.push(`Apihz[${i}]: ${e.message}`);
          }
        }
      }
      if (!result) {
        return new Response(JSON.stringify({
          success: false,
          message: "Không thể phân tích link Douyin/TikTok này.",
          errors
        }), {
          status: 502,
          headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
        });
      }
      if (result.video?.url) {
        result.video.stream_url = `/api/video?url=${encodeURIComponent(result.video.url)}`;
        result.video.download_url = `/api/download?url=${encodeURIComponent(result.video.url)}&filename=${encodeURIComponent((result.title || "video").slice(0, 40) + ".mp4")}`;
      }
      return new Response(JSON.stringify({
        success: true,
        mode: "douyin",
        data: result
      }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    // TRƯỜNG HỢP 3: Link hoặc ID của Hongguo Short Drama (红果免费短剧)
    let seriesId = target.seriesId || null;
    let activeVid = target.vid || null;

    if (target.type === "hongguo_url") {
      const resolved = await resolveHongguoShareUrl(target.url);
      seriesId = resolved.seriesId;
      activeVid = resolved.vid;
    }

    // Nếu người dùng truyền vào 1 dãy số (có thể là seriesId hoặc vid của 1 tập lẻ)
    let seriesData = null;
    let rotatedErrors = [];

    if (seriesId) {
      try {
        const resDetail = await fetchHongguoSeriesDetail(seriesId, provider, customApi);
        seriesData = resDetail.data;
        rotatedErrors = resDetail.errors || [];
      } catch (err) {
        // Nếu seriesId thực chất là vid của 1 tập lẻ, thử lấy luồng phát trực tiếp cho vid đó
        if (!activeVid) activeVid = seriesId;
      }
    }

    if (seriesData) {
      // Chọn tập cần lấy luồng video ngay lập tức (tập được chỉ định trong link, hoặc Tập 1)
      const targetEp = (activeVid && seriesData.episodes.find(e => e.vid === String(activeVid))) || seriesData.episodes[0];
      let currentStream = null;
      if (targetEp) {
        try {
          const rawStream = await fetchHongguoEpisodeStreams(targetEp.vid, seriesData.series_id, provider);
          currentStream = attachEpisodeUrls(rawStream, seriesData.title, targetEp.vid_index);
        } catch (e) {
          rotatedErrors.push(`Stream: ${e.message}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mode: "hongguo_series",
        data: {
          ...seriesData,
          type: "hongguo_series",
          active_episode: targetEp || null,
          active_stream: currentStream
        },
        rotated_errors: rotatedErrors.length ? rotatedErrors : undefined
      }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Nếu chỉ có activeVid (Tập lẻ không rõ series_id)
    if (activeVid) {
      const rawStream = await fetchHongguoEpisodeStreams(activeVid, "", provider);
      if (rawStream && rawStream.qualities && rawStream.qualities.length > 0) {
        const streamWithUrls = attachEpisodeUrls(rawStream, "hongguo_video", 1);
        return new Response(JSON.stringify({
          success: true,
          mode: "hongguo_single",
          data: {
            provider: rawStream.qualities[0]?.source || "hongguo-direct",
            platform: "hongguo",
            type: "hongguo_series",
            series_id: "",
            title: `Video Hongguo #${activeVid}`,
            cover: "",
            intro: "Video đơn lẻ trích xuất trực tiếp từ Hongguo Short Drama.",
            total_episodes: 1,
            status_text: "Tập đơn",
            tags: ["Hongguo", "Short Drama"],
            celebrities: [],
            stats: { views: 0, likes: 0, favorites: 0, hot_score: 0 },
            episodes: [{ vid: String(activeVid), vid_index: 1, title: "Tập 1", duration: rawStream.duration || 0, cover: "" }],
            active_episode: { vid: String(activeVid), vid_index: 1, title: "Tập 1", duration: rawStream.duration || 0 },
            active_stream: streamWithUrls
          }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      message: "Không tìm thấy dữ liệu phim ngắn Hongguo từ liên kết hoặc ID đã nhập.",
      errors: rotatedErrors
    }), {
      status: 404,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: `Lỗi phân tích: ${err.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
    });
  }
}
