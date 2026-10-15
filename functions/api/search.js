// Cloudflare Pages Function: /api/search
// Hỗ trợ tìm kiếm phim ngắn Hongguo theo từ khóa (?q=...) và khám phá bảng xếp hạng/thể loại (?category=hot|real-drama|comic-drama|ai-drama|latest)

import { searchHongguoDramas, discoverHongguoDramas } from "./hongguo-core.js";

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
    const q = (u.searchParams.get("q") || u.searchParams.get("keyword") || "").trim();
    const category = (u.searchParams.get("category") || "hot").trim();
    const page = parseInt(u.searchParams.get("page") || "1", 10) || 1;

    if (q) {
      const searchData = await searchHongguoDramas(q, page);
      return new Response(JSON.stringify({
        success: true,
        mode: "search",
        data: {
          ...searchData,
          results: searchData.list || []
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=180"
        }
      });
    }

    const discoverData = await discoverHongguoDramas(category, page);
    return new Response(JSON.stringify({
      success: true,
      mode: "discover",
      data: discoverData
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      }
    });
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
