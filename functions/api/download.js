// Cloudflare Pages Function: /api/download
// Force Download Proxy: Hỗ trợ tự động giải mã CENC-AES-CTR (key) cho video 1080p/720p Hongguo hoặc truyền thẳng luồng gốc

import { decryptCencMp4, HONGGUO_APP_UA, HONGGUO_WEB_UA, HONGGUO_VIDEO_REFERER } from "./hongguo-core.js";

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
  const filename = urlObj.searchParams.get("filename") || "hongguo_video.mp4";
  const keyHex = (urlObj.searchParams.get("key") || "").trim();
  const rawMode = urlObj.searchParams.get("raw") === "1"; // Cho phép trình duyệt tải raw bytes để tự giải mã bằng WebCrypto ở Client

  if (!targetUrl) {
    return new Response("Missing target url parameter", { status: 400 });
  }

  try {
    const isHongguoCdn = /qznovelvod\.com|fqnovel\.com|snssdk\.com|byteimg\.com|hongguoduanju\.com/i.test(targetUrl);
    const isHongguoWeb = /hongguoduanju\.com/i.test(targetUrl);

    const upstreamHeaders = new Headers({
      "User-Agent": isHongguoWeb ? HONGGUO_WEB_UA : (isHongguoCdn ? HONGGUO_APP_UA : HONGGUO_WEB_UA),
      "Referer": isHongguoWeb ? "https://hongguoduanju.com/" : (isHongguoCdn ? HONGGUO_VIDEO_REFERER : "https://www.douyin.com/"),
      "Accept": "*/*"
    });

    const isServerDecrypt = keyHex.length === 32 && !rawMode;
    if (request.headers.has("range") && !isServerDecrypt) {
      upstreamHeaders.set("range", request.headers.get("range"));
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: isServerDecrypt ? "GET" : request.method,
      headers: upstreamHeaders
    });

    const safeFilename = encodeURIComponent(filename.replace(/[\\/:*?"<>|]/g, "_"));

    if (isServerDecrypt) {
      const encBytes = new Uint8Array(await upstreamResponse.arrayBuffer());
      const decBytes = await decryptCencMp4(encBytes, keyHex);
      return new Response(decBytes, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(decBytes.length),
          "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
          "X-Hongguo-Decrypted": "CENC-AES-128-CTR",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, X-Hongguo-Decrypted"
        }
      });
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Disposition, Content-Length, Content-Range");
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(`Download proxy error: ${err.message}`, { status: 502 });
  }
}
