// Cloudflare Pages Function: /api/search
// Hỗ trợ tìm kiếm phim ngắn Hongguo theo từ khóa (?q=...) và khám phá bảng xếp hạng/thể loại (?category=hot|real-drama|comic-drama|ai-drama|latest)
// Tối ưu Cloudflare Free Max Ping: V8 Isolate RAM Cache (SWR) + Cloudflare Edge Cache (caches.default) + Mirror Telemetry

import { searchHongguoDramas, discoverHongguoDramas, getMirrorTelemetry } from "./hongguo-core.js";

export async function onRequest(context) {
  const { request } = context;
  const t0 = Date.now();

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
    if (u.searchParams.get("telemetry") === "1") {
      return new Response(JSON.stringify({
        success: true,
        mirrors: getMirrorTelemetry(),
        latency_ms: Date.now() - t0
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const q = (u.searchParams.get("q") || u.searchParams.get("keyword") || "").trim();
    const category = (u.searchParams.get("category") || "hot").trim();
    const page = parseInt(u.searchParams.get("page") || "1", 10) || 1;

    const edgeCache = typeof caches !== "undefined" && caches.default ? caches.default : null;
    const cacheKeyUrl = q
      ? `https://edge-cache.hongguo.local/api/search?q=${encodeURIComponent(q.toLowerCase())}&page=${page}`
      : `https://edge-cache.hongguo.local/api/discover?category=${encodeURIComponent(category)}&page=${page}`;
    const cacheKey = edgeCache && request.method === "GET" ? new Request(cacheKeyUrl, { method: "GET" }) : null;

    if (edgeCache && cacheKey) {
      try {
        const cachedResp = await edgeCache.match(cacheKey);
        if (cachedResp) {
          const hitHeaders = new Headers(cachedResp.headers);
          const elapsed = Date.now() - t0;
          hitHeaders.set("X-Edge-Cache", "HIT");
          hitHeaders.set("X-Response-Time", `${elapsed}ms`);
          hitHeaders.set("Server-Timing", `edge;dur=${elapsed};desc="Edge Cache HIT"`);
          return new Response(cachedResp.body, {
            status: cachedResp.status,
            headers: hitHeaders
          });
        }
      } catch {}
    }

    if (q) {
      const searchData = await searchHongguoDramas(q, page);
      const elapsed = Date.now() - t0;
      const resp = new Response(JSON.stringify({
        success: true,
        mode: "search",
        latency_ms: elapsed,
        data: {
          ...searchData,
          results: searchData.list || []
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
          "X-Edge-Cache": elapsed <= 5 ? "RAM-HIT" : "MISS",
          "X-Response-Time": `${elapsed}ms`,
          "Server-Timing": `total;dur=${elapsed}`
        }
      });

      if (edgeCache && cacheKey) {
        const putPromise = edgeCache.put(cacheKey, resp.clone()).catch(() => {});
        if (context.waitUntil) context.waitUntil(putPromise);
        else if (context.ctx?.waitUntil) context.ctx.waitUntil(putPromise);
      }
      return resp;
    }

    const discoverData = await discoverHongguoDramas(category, page);
    const elapsed = Date.now() - t0;
    const resp = new Response(JSON.stringify({
      success: true,
      mode: "discover",
      latency_ms: elapsed,
      data: discoverData
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
        "X-Edge-Cache": elapsed <= 5 ? "RAM-HIT" : "MISS",
        "X-Response-Time": `${elapsed}ms`,
        "Server-Timing": `total;dur=${elapsed}`
      }
    });

    if (edgeCache && cacheKey) {
      const putPromise = edgeCache.put(cacheKey, resp.clone()).catch(() => {});
      if (context.waitUntil) context.waitUntil(putPromise);
      else if (context.ctx?.waitUntil) context.ctx.waitUntil(putPromise);
    }
    return resp;
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: `Lỗi tìm kiếm / khám phá: ${err.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
    });
  }
}
