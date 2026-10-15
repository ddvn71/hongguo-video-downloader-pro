// Cloudflare Pages Function: /api/episode
// Lấy luồng phát & link tải đa độ phân giải (1080p, 720p, 540p, 480p, 360p-H264) kèm khóa giải mã CENC
// Hỗ trợ cả lấy đơn lẻ (?vid=...) và lấy hàng loạt 15 tập/lần (?vids=vid1,vid2,...&indices=1,2,...)

import { fetchHongguoEpisodeStreams, fetchHongguoBatchEpisodeStreams } from "./hongguo-core.js";

function attachUrlsToStream(streamData, title = "hongguo_drama", epIndex = 1) {
  if (!streamData) return streamData;
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
  return streamData;
}

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
    let vidsParam = u.searchParams.get("vids") || "";
    let indicesParam = u.searchParams.get("indices") || "";
    let seriesId = u.searchParams.get("series_id") || "";
    let title = u.searchParams.get("title") || "hongguo_drama";
    let epIndex = u.searchParams.get("index") || "1";
    let route = u.searchParams.get("route") || "auto";

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      vid = body.vid || vid;
      if (Array.isArray(body.vids)) vidsParam = body.vids.join(",");
      else if (body.vids) vidsParam = body.vids;
      if (Array.isArray(body.indices)) indicesParam = body.indices.join(",");
      else if (body.indices) indicesParam = body.indices;
      seriesId = body.series_id || seriesId;
      title = body.title || title;
      epIndex = body.index || epIndex;
      route = body.route || route;
    }

    // Chế độ Batch (Lấy tối đa 15 tập cùng lúc chỉ trong 1 HTTP call)
    if (vidsParam) {
      const vidsList = vidsParam.split(",").map(s => s.trim()).filter(Boolean);
      const indicesList = indicesParam.split(",").map(s => s.trim());
      if (vidsList.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "Danh sách vids trống." }), {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
        });
      }

      const rawMap = await fetchHongguoBatchEpisodeStreams(vidsList, seriesId, route);
      const outMap = {};
      vidsList.forEach((v, idx) => {
        const epNum = indicesList[idx] || idx + 1;
        if (rawMap[v]) {
          outMap[v] = attachUrlsToStream(rawMap[v], title, epNum);
        }
      });

      return new Response(JSON.stringify({
        success: true,
        mode: "batch",
        count: Object.keys(outMap).length,
        data_map: outMap
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=900, s-maxage=900"
        }
      });
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
    attachUrlsToStream(streamData, title, epIndex);

    return new Response(JSON.stringify({
      success: true,
      data: streamData
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=900, s-maxage=900"
      }
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
