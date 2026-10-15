// Cloudflare Pages Function: /api/proxy
// Media / Image Proxy: Giải quyết CORS và anti-hotlinking cho ảnh bìa Hongguo (byteimg.com) và Douyin

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

  try {
    const isHongguo = /byteimg\.com|hongguoduanju\.com|fqnovel\.com|snssdk\.com/i.test(targetUrl);
    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": isHongguo ? "https://hongguoduanju.com/" : "https://www.douyin.com/"
      }
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cache-Control", "public, max-age=86400");
    responseHeaders.delete("content-security-policy");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
