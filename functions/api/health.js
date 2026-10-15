// Cloudflare Pages Function: /api/health
export async function onRequest() {
  return new Response(JSON.stringify({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "hongguo-douyin-downloader",
    version: "2.1.0"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
