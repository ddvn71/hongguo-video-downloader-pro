// Cloudflare Pages Function: /api/episode
// Lấy luồng phát & link tải đa độ phân giải (1080p, 720p, 540p, 480p, 360p-H264) kèm khóa giải mã CENC cho 1 tập cụ thể (vid)

import { fetchHongguoEpisodeStreams } from "./hongguo-core.js";

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
    const u = new URL(request.url);
    let vid = u.searchParams.get("vid") || "";
    let seriesId = u.searchParams.get("series_id") || "";
    let title = u.searchParams.get("title") || "hongguo_drama";
    let epIndex = u.searchParams.get("index") || "1";
    let route = u.searchParams.get("route") || "auto";

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      vid = body.vid || vid;
      seriesId = body.series_id || seriesId;
      title = body.title || title;
      epIndex = body.index || epIndex;
      route = body.route || route;
    }

    if (!vid) {
      return new Response(JSON.stringify({
        success: false,
        message: "Thiếu mã tập phim (vid)."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    const streamData = await fetchHongguoEpisodeStreams(vid, seriesId, route);
    const safeBase = `${title}_Tap_${String(epIndex).padStart(3, "0")}`.slice(0, 60);

    for (const q of (streamData.qualities || [])) {
      const fname = `${safeBase}_${q.definition || "hd"}.mp4`;
      const keyParam = q.encrypted && q.key_hex ? `&key=${encodeURIComponent(q.key_hex)}` : "";
      q.proxy_download_url = `/api/download?url=${encodeURIComponent(q.url)}${keyParam}&filename=${encodeURIComponent(fname)}`;
      q.proxy_stream_url = `/api/video?url=${encodeURIComponent(q.url)}${keyParam}`;
    }

    if (streamData.preview_url) {
      streamData.proxy_preview_url = `/api/video?url=${encodeURIComponent(streamData.preview_url)}`;
    }

    return new Response(JSON.stringify({
      success: true,
      data: streamData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: `Lỗi lấy luồng video: ${err.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
    });
  }
}
