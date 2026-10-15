// Cloudflare Pages Function: /api/proxy
// Media / Image Proxy tối ưu Max Ping cho Cloudflare Free:
// 1. Edge Cache API (caches.default) lưu ảnh bìa 7-30 ngày ngay tại PoP gần người dùng (<2ms HIT)
// 2. Cloudflare cf.cacheEverything + immutable header giảm 99% băng thông & Worker invocations

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  const edgeCache = typeof caches !== "undefined" && caches.default ? caches.default : null;
  const cacheKey = edgeCache && request.method === "GET"
    ? new Request(`https://edge-cache.hongguo.local/api/proxy?url=${encodeURIComponent(targetUrl)}`, { method: "GET" })
    : null;

  if (edgeCache && cacheKey) {
    try {
      const cachedResp = await edgeCache.match(cacheKey);
      if (cachedResp) {
        const hitHeaders = new Headers(cachedResp.headers);
        hitHeaders.set("X-Edge-Cache", "HIT");
        return new Response(cachedResp.body, {
          status: cachedResp.status,
          headers: hitHeaders
        });
      }
    } catch {}
  }

  try {
    const isHongguo = /byteimg\.com|hongguoduanju\.com|fqnovel\.com|snssdk\.com/i.test(targetUrl);
    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": isHongguo ? "https://hongguoduanju.com/" : "https://www.douyin.com/",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
      },
      cf: {
        cacheEverything: true,
        cacheTtl: 604800
      }
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cache-Control", "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400, immutable");
    responseHeaders.set("X-Edge-Cache", "MISS");
    responseHeaders.delete("content-security-policy");
    responseHeaders.delete("set-cookie");

    const response = new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });

    if (edgeCache && cacheKey && upstreamResponse.ok) {
      const putPromise = edgeCache.put(cacheKey, response.clone()).catch(() => {});
      if (context.waitUntil) context.waitUntil(putPromise);
      else if (context.ctx?.waitUntil) context.ctx.waitUntil(putPromise);
    }

    return response;
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
