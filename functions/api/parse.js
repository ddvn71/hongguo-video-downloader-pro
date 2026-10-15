// Cloudflare Pages Function: /api/parse
// Bộ phân tích Đa Năng Tốc Độ Cao:
// - Hongguo Short Drama (Link chia sẻ, Series ID, Video ID, Từ khóa) + Preload 15 tập/lần + Cache 2 tầng
// - Douyin / TikTok: Native iesdouyin SSR (0đ, không giới hạn) + Hedged Parallel Racing + Apihz Key Pool + TikWM

import {
  extractTargetFromInput,
  resolveHongguoShareUrl,
  fetchHongguoSeriesDetail,
  fetchHongguoEpisodeStreams,
  fetchHongguoBatchEpisodeStreams,
  searchHongguoDramas,
  extractAssignedJson,
  cleanEscapedUrl,
  fetchWithTimeout,
  getOrSetCache,
  raceWithHedge,
  HONGGUO_MOBILE_UA
} from "./hongguo-core.js";

const DEFAULT_APIHZ_POOL = [
  { id: "10003120", key: "bfb75036b210ed35bee6e002d623293c" }
];

// Ưu tiên IP tuyến quốc tế 101.35.2.25 (phản hồi ~400ms, tránh timeout từ cn.apihz.cn)
const APIHZ_ROUTES = [
  "https://cn.apihz.cn/api/fun/douyin.php",
  "http://101.35.2.25/api/fun/douyin.php",
  "http://124.222.204.22/api/fun/douyin.php",
  "http://124.220.49.230/api/fun/douyin.php"
];

let apihzPoolCursor = 0;

function pickApihzCredential(customId, customKey, envPoolStr = "") {
  const pool = [];
  if (customId && customKey) {
    // Hỗ trợ nhập nhiều cặp id:key cách nhau dấu phẩy ở ô ID hoặc customPool
    if (customId.includes(":")) {
      for (const pair of customId.split(",")) {
        const [i, k] = pair.trim().split(":");
        if (i && k) pool.push({ id: i.trim(), key: k.trim() });
      }
    } else {
      pool.push({ id: customId.trim(), key: customKey.trim() });
    }
  }
  if (envPoolStr) {
    for (const pair of String(envPoolStr).split(",")) {
      const [i, k] = pair.trim().split(":");
      if (i && k) pool.push({ id: i.trim(), key: k.trim() });
    }
  }
  if (pool.length === 0) {
    return DEFAULT_APIHZ_POOL[0];
  }
  const chosen = pool[apihzPoolCursor % pool.length];
  apihzPoolCursor = (apihzPoolCursor + 1) % 100000;
  return chosen;
}

export function attachEpisodeUrls(streamData, seriesTitle = "hongguo_drama", epIndex = 1) {
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

// ==================== DOUYIN / TIKTOK PARSERS (NATIVE SSR + TIKWM + APIHZ) ====================

/**
 * Phân giải nhanh link rút gọn Douyin (v.douyin.com/xxx) bằng redirect: "manual" (~250ms) để lấy canonical aweme_id
 */
async function resolveDouyinCanonicalId(url) {
  const directMatch = url.match(/(?:video|note)\/(\d{17,21})/i) || url.match(/modal_id=(\d{17,21})/i);
  if (directMatch) return { awemeId: directMatch[1], finalUrl: url };

  const { value } = await getOrSetCache(`dy_resolve:${url}`, 3600, async () => {
    try {
      const res = await fetchWithTimeout(url, {
        method: "GET",
        headers: { "User-Agent": HONGGUO_MOBILE_UA },
        redirect: "manual"
      }, 4500);
      const loc = res.headers.get("location") || "";
      const m = loc.match(/(?:video|note)\/(\d{17,21})/i) || loc.match(/modal_id=(\d{17,21})/i);
      if (m) return { awemeId: m[1], finalUrl: loc };
    } catch {}
    return { awemeId: "", finalUrl: url };
  });
  return value;
}

/**
 * Nguồn 0 (100% Free, Không cần API Key, Không giới hạn Rate-limit):
 * Bóc trực tiếp _ROUTER_DATA từ trang SSR di động iesdouyin.com và dựng luồng 1080p chính thức của ByteDance
 */
async function parseWithDouyinNative(awemeId, timeoutMs = 5000) {
  if (!awemeId) throw new Error("Missing awemeId for native SSR");
  const shareUrl = `https://www.iesdouyin.com/share/video/${encodeURIComponent(awemeId)}/`;
  const res = await fetchWithTimeout(shareUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  }, timeoutMs);

  if (!res.ok) throw new Error(`iesdouyin HTTP ${res.status}`);
  const html = await res.text();
  const router = extractAssignedJson(html, "_ROUTER_DATA");
  if (!router?.loaderData) throw new Error("iesdouyin missing _ROUTER_DATA");

  let item = null;
  for (const val of Object.values(router.loaderData)) {
    const list = val?.videoInfoRes?.item_list;
    if (Array.isArray(list) && list.length > 0) {
      item = list[0];
      break;
    }
  }
  if (!item) throw new Error("iesdouyin videoInfoRes empty (geo/old video)");

  const images = Array.isArray(item.images)
    ? item.images.map(img => cleanEscapedUrl(img?.url_list?.[0] || "")).filter(Boolean)
    : [];
  const isImages = images.length > 0;

  const uri = item.video?.play_addr?.uri || "";
  const rawPlayUrl = cleanEscapedUrl(item.video?.play_addr?.url_list?.[0] || "").replace("playwm", "play");
  const hdPlayUrl = uri
    ? `https://aweme.snssdk.com/aweme/v1/play/?video_id=${encodeURIComponent(uri)}&ratio=1080p&line=0`
    : rawPlayUrl;

  if (!isImages && !hdPlayUrl) throw new Error("iesdouyin missing video stream url");

  return {
    provider: "douyin-native-direct",
    platform: "douyin",
    id: String(item.aweme_id || awemeId),
    type: isImages ? "images" : "video",
    title: item.desc || "Video Douyin",
    author: {
      name: item.author?.nickname || "Douyin User",
      avatar: cleanEscapedUrl(item.author?.avatar_thumb?.url_list?.[0] || ""),
      id: item.author?.unique_id || item.author?.short_id || ""
    },
    cover: cleanEscapedUrl(item.video?.cover?.url_list?.[0] || images[0] || ""),
    video: isImages ? null : {
      url: hdPlayUrl,
      hd_url: hdPlayUrl,
      duration: Math.round(Number(item.video?.duration || 0) / 1000)
    },
    music: item.music?.play_url?.url_list?.[0] ? {
      url: cleanEscapedUrl(item.music.play_url.url_list[0]),
      title: item.music.title || "Original Sound"
    } : null,
    images,
    stats: {
      likes: Number(item.statistics?.digg_count || 0),
      comments: Number(item.statistics?.comment_count || 0),
      shares: Number(item.statistics?.share_count || 0)
    }
  };
}

async function parseWithTikWM(url, timeoutMs = 6500) {
  const res = await fetchWithTimeout("https://www.tikwm.com/api/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    body: new URLSearchParams({ url: url, hd: "1" }).toString()
  }, timeoutMs);

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
}

async function parseWithApihz(url, id, key, routeIndex = 0, timeoutMs = 6000) {
  const targetRoute = APIHZ_ROUTES[routeIndex] || APIHZ_ROUTES[0];
  const apiUrl = `${targetRoute}?id=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}&url=${encodeURIComponent(url)}`;
  const res = await fetchWithTimeout(apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
  }, timeoutMs);

  if (!res.ok) throw new Error(`Apihz HTTP ${res.status}`);
  const data = await res.json();
  if (data.code === 200) {
    const isImages = data.type === "图集" || (Array.isArray(data.images) && data.images.length > 0);
    // Sửa lỗi quan trọng: Apihz trả về data.video hoặc data.yvideo tùy phiên bản video
    const videoUrl = cleanEscapedUrl(data.yvideo || data.video || "");
    if (!isImages && !videoUrl) {
      throw new Error("Apihz returned empty video url");
    }
    return {
      provider: `apihz-route-${routeIndex}`,
      platform: "douyin",
      id: "",
      type: isImages ? "images" : "video",
      title: data.title || "Video Douyin",
      author: { name: data.name || "Douyin User", avatar: data.avatar || "", id: "" },
      cover: cleanEscapedUrl(data.cover || ""),
      video: isImages ? null : { url: videoUrl, hd_url: videoUrl, duration: 0 },
      music: data.music ? { url: cleanEscapedUrl(data.music), title: "Original Sound" } : null,
      images: isImages ? (data.images || []) : [],
      stats: { likes: 0, comments: 0, shares: 0 }
    };
  }
  throw new Error(data.msg || `Apihz code ${data.code}`);
}

// ==================== MAIN HANDLER ====================

export async function onRequest(context) {
  const tStart = Date.now();
  const { request, env } = context;

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
    let apihzId = "";
    let apihzKey = "";
    let customApi = "";

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      rawUrl = body.url || body.input || body.q || "";
      provider = body.provider || "auto";
      apihzId = body.apihzId || "";
      apihzKey = body.apihzKey || "";
      customApi = body.customApi || "";
    } else {
      const u = new URL(request.url);
      rawUrl = u.searchParams.get("url") || u.searchParams.get("input") || u.searchParams.get("q") || "";
      provider = u.searchParams.get("provider") || "auto";
      apihzId = u.searchParams.get("id") || "";
      apihzKey = u.searchParams.get("key") || "";
      customApi = u.searchParams.get("customApi") || "";
    }

    const target = extractTargetFromInput(rawUrl);
    if (target.type === "empty") {
      return new Response(JSON.stringify({
        success: false,
        message: "Vui lòng nhập link Hongguo Short Drama, mã series_id / video_id, tên bộ phim hoặc link Douyin/TikTok."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    // TRƯỜNG HỢP 1: Người dùng nhập từ khóa tên phim -> Tìm kiếm trên Hongguo (Có Cache 10 phút)
    if (target.type === "keyword") {
      const searchRes = await searchHongguoDramas(target.keyword, 1);
      return new Response(JSON.stringify({
        success: true,
        mode: "search",
        latency_ms: Date.now() - tStart,
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

    // TRƯỜNG HỢP 2: Link Douyin / TikTok (Canonical Cache + Đua đa luồng Native SSR / Apihz / TikWM)
    if (target.type === "douyin") {
      const isTikTok = /tiktok\.com/i.test(target.url);
      const { awemeId } = isTikTok ? { awemeId: "" } : await resolveDouyinCanonicalId(target.url);
      const cacheKey = `douyin:${awemeId || target.url}`;

      const { value: result, cached } = await getOrSetCache(cacheKey, 1800, async () => {
        const cred = pickApihzCredential(apihzId, apihzKey, env?.APIHZ_POOL);
        let parsed = null;

        if (isTikTok) {
          const { result: r } = await raceWithHedge(
            () => parseWithTikWM(target.url),
            [() => parseWithApihz(target.url, cred.id, cred.key, 0)],
            1200
          );
          parsed = r;
        } else {
          // Với link Douyin: Gọi Apihz (cn.apihz.cn) làm nguồn chính, hedge 1200ms kích hoạt TikWM / Native SSR
          const tasks = [];
          tasks.push(() => parseWithApihz(target.url, cred.id, cred.key, 0));
          tasks.push(() => parseWithTikWM(target.url));
          if (awemeId) tasks.push(() => parseWithDouyinNative(awemeId));

          const [primaryTask, ...backupTasks] = tasks;
          const { result: r } = await raceWithHedge(primaryTask, backupTasks, 1200);
          parsed = r;
        }

        if (parsed.video?.url) {
          parsed.video.stream_url = `/api/video?url=${encodeURIComponent(parsed.video.url)}`;
          parsed.video.download_url = `/api/download?url=${encodeURIComponent(parsed.video.url)}&filename=${encodeURIComponent((parsed.title || "douyin_video").slice(0, 40) + ".mp4")}`;
        }
        if (parsed.music?.url) {
          parsed.music.download_url = `/api/download?url=${encodeURIComponent(parsed.music.url)}&filename=${encodeURIComponent((parsed.title || "douyin_audio").slice(0, 40) + ".mp3")}`;
        }
        return parsed;
      }).catch(err => ({ value: null, errorMsg: err.message }));

      if (!result) {
        return new Response(JSON.stringify({
          success: false,
          message: "Không thể phân tích link Douyin/TikTok này. Vui lòng thử lại sau ít giây."
        }), {
          status: 502,
          headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        mode: "douyin",
        cached: Boolean(cached),
        latency_ms: Date.now() - tStart,
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

    let seriesData = null;
    let rotatedErrors = [];

    if (seriesId) {
      try {
        const resDetail = await fetchHongguoSeriesDetail(seriesId, provider, customApi);
        seriesData = resDetail.data;
        rotatedErrors = resDetail.errors || [];
      } catch {
        if (!activeVid) activeVid = seriesId;
      }
    }

    if (seriesData) {
      const episodes = seriesData.episodes || [];
      const targetEp = (activeVid && episodes.find(e => e.vid === String(activeVid))) || episodes[0];
      let currentStream = null;
      const prefetchedStreams = {};

      if (targetEp) {
        try {
          // TỐI ƯU ĐỘT PHÁ: Thay vì chỉ lấy 1 tập, lấy luôn 15 tập đầu tiên (hoặc 15 tập quanh tập đang chọn) chỉ trong 1 HTTP call (~300ms)!
          const targetIdx = Math.max(0, episodes.findIndex(e => e.vid === targetEp.vid));
          const batchSlice = episodes.slice(targetIdx, targetIdx + 15);
          const batchVids = batchSlice.map(e => e.vid);

          const batchMap = await fetchHongguoBatchEpisodeStreams(batchVids, seriesData.series_id, provider);
          for (const epItem of batchSlice) {
            if (batchMap[epItem.vid]) {
              prefetchedStreams[epItem.vid] = attachEpisodeUrls(
                batchMap[epItem.vid],
                seriesData.title,
                epItem.vid_index
              );
            }
          }
          currentStream = prefetchedStreams[targetEp.vid] || null;
        } catch (e) {
          rotatedErrors.push(`Stream: ${e.message}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mode: "hongguo_series",
        cached: Boolean(seriesData.cached),
        latency_ms: Date.now() - tStart,
        data: {
          ...seriesData,
          type: "hongguo_series",
          active_episode: targetEp || null,
          active_stream: currentStream,
          prefetched_streams: prefetchedStreams
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
          latency_ms: Date.now() - tStart,
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
            active_stream: streamWithUrls,
            prefetched_streams: { [String(activeVid)]: streamWithUrls }
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
