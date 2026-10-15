// Cloudflare Pages Function: /api/video
// Video Streaming Proxy tối ưu Cloudflare Free Max Ping:
// 1. Hỗ trợ cả Hongguo Short Drama (kèm tự động giải mã CENC-AES-CTR nếu có key) và Douyin/TikTok
// 2. Tích hợp Cloudflare Edge Cache (caches.default) cho luồng giải mã để tua video (Range 206) đạt 0ms CPU

import { decryptCencMp4, HONGGUO_APP_UA, HONGGUO_WEB_UA, HONGGUO_VIDEO_REFERER } from "./hongguo-core.js";

function getUpstreamHeaders(targetUrl, rangeHeader, isEncrypted) {
  const isHongguoCdn = /qznovelvod\.com|fqnovel\.com|snssdk\.com|byteimg\.com|hongguoduanju\.com/i.test(targetUrl);
  const isHongguoWeb = /hongguoduanju\.com/i.test(targetUrl);

  const headers = new Headers({
    "User-Agent": isHongguoWeb ? HONGGUO_WEB_UA : (isHongguoCdn ? HONGGUO_APP_UA : HONGGUO_WEB_UA),
    "Referer": isHongguoWeb ? "https://hongguoduanju.com/" : (isHongguoCdn ? HONGGUO_VIDEO_REFERER : "https://www.douyin.com/"),
    "Accept": "*/*"
  });

  if (rangeHeader && !isEncrypted) {
    headers.set("Range", rangeHeader);
  }
  return headers;
}

function buildRangeOrFullResponse(decryptedBytes, rangeHeader, cacheHitLabel) {
  const total = decryptedBytes.length;
  if (rangeHeader) {
    const m = rangeHeader.match(/bytes=(\d*)-(\d*)/i);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
      if (start >= 0 && start <= end && start < total) {
        const slice = decryptedBytes.subarray(start, end + 1);
        return new Response(slice, {
          status: 206,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String(slice.length),
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "X-Edge-Cache": cacheHitLabel,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges, X-Edge-Cache"
          }
        });
      }
    }
  }

  return new Response(decryptedBytes, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600, s-maxage=7200",
      "X-Edge-Cache": cacheHitLabel,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges, X-Edge-Cache"
    }
  });
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type, Accept",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get("url");
  const keyHex = (urlObj.searchParams.get("key") || "").trim();

  if (!targetUrl || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
    return new Response("Missing or invalid target url parameter", { status: 400 });
  }

  try {
    const isEncrypted = keyHex.length === 32;
    const rangeHeader = request.headers.get("range");
    const edgeCache = typeof caches !== "undefined" && caches.default ? caches.default : null;

    // Nếu là luồng CENC, kiểm tra Edge Cache trước để tua video không cần giải mã lại
    const cacheKey = edgeCache && isEncrypted
      ? new Request(`https://edge-cache.hongguo.local/api/decrypted-mp4?url=${encodeURIComponent(targetUrl)}&key=${keyHex}`, { method: "GET" })
      : null;

    if (edgeCache && cacheKey) {
      try {
        const cachedResp = await edgeCache.match(cacheKey);
        if (cachedResp) {
          const cachedBytes = new Uint8Array(await cachedResp.arrayBuffer());
          return buildRangeOrFullResponse(cachedBytes, rangeHeader, "HIT");
        }
      } catch {}
    }

    const upstreamHeaders = getUpstreamHeaders(targetUrl, rangeHeader, isEncrypted);
    const upstreamResponse = await fetch(targetUrl, {
      method: isEncrypted ? "GET" : request.method,
      headers: upstreamHeaders,
      cf: {
        cacheEverything: true,
        cacheTtl: 3600
      }
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return new Response(`Upstream CDN HTTP ${upstreamResponse.status}`, { status: upstreamResponse.status });
    }

    // Nếu luồng có khóa CENC-AES-CTR (keyHex), giải mã sang MP4 chuẩn trước khi trả về
    if (isEncrypted) {
      const rawBuf = new Uint8Array(await upstreamResponse.arrayBuffer());
      const decryptedBytes = await decryptCencMp4(rawBuf, keyHex);

      if (edgeCache && cacheKey && decryptedBytes.length <= 20 * 1024 * 1024) {
        const fullCacheResp = new Response(decryptedBytes.slice(), {
          status: 200,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String(decryptedBytes.length),
            "Cache-Control": "public, max-age=3600, s-maxage=7200"
          }
        });
        const putPromise = edgeCache.put(cacheKey, fullCacheResp).catch(() => {});
        if (context.waitUntil) context.waitUntil(putPromise);
        else if (context.ctx?.waitUntil) context.ctx.waitUntil(putPromise);
      }

      return buildRangeOrFullResponse(decryptedBytes, rangeHeader, "MISS");
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=3600, s-maxage=7200");

    if (!responseHeaders.has("content-type") || responseHeaders.get("content-type").includes("octet-stream")) {
      responseHeaders.set("content-type", "video/mp4");
    }

    responseHeaders.delete("x-frame-options");
    responseHeaders.delete("content-security-policy");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(`Streaming proxy error: ${err.message}`, { status: 502 });
  }
}
