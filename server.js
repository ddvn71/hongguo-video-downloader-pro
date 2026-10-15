// Local development & Node.js production server (Render / VPS / Localhost)
// Sử dụng trực tiếp các Cloudflare Pages Functions trong ./functions/api/* để đồng bộ 100% logic
// Chạy: node server.js -> Mở http://localhost:3000

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { pathToFileURL } = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

let handlersPromise = null;
async function getHandlers() {
  if (!handlersPromise) {
    handlersPromise = Promise.all([
      import(pathToFileURL(path.join(__dirname, "functions/api/parse.js")).href),
      import(pathToFileURL(path.join(__dirname, "functions/api/episode.js")).href),
      import(pathToFileURL(path.join(__dirname, "functions/api/search.js")).href),
      import(pathToFileURL(path.join(__dirname, "functions/api/video.js")).href),
      import(pathToFileURL(path.join(__dirname, "functions/api/download.js")).href),
      import(pathToFileURL(path.join(__dirname, "functions/api/proxy.js")).href)
    ]).then(([parseMod, epMod, searchMod, videoMod, dlMod, proxyMod]) => ({
      "/api/parse": parseMod.onRequest,
      "/api/episode": epMod.onRequest,
      "/api/search": searchMod.onRequest,
      "/api/discover": searchMod.onRequest,
      "/api/video": videoMod.onRequest,
      "/api/download": dlMod.onRequest,
      "/api/proxy": proxyMod.onRequest
    }));
  }
  return handlersPromise;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const fullUrl = `http://${req.headers.host || `localhost:${PORT}`}${req.url}`;
  const parsedUrl = new URL(fullUrl);
  const pathname = parsedUrl.pathname;

  // Định tuyến API qua Cloudflare Functions handlers
  if (pathname.startsWith("/api/")) {
    try {
      const handlers = await getHandlers();
      const handler = handlers[pathname];
      if (!handler) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, message: `API route not found: ${pathname}` }));
        return;
      }

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
      }

      const hasBody = !["GET", "HEAD", "OPTIONS"].includes(req.method || "GET");
      const bodyBuf = hasBody ? await readRequestBody(req) : undefined;

      const webReq = new Request(fullUrl, {
        method: req.method || "GET",
        headers,
        body: hasBody && bodyBuf && bodyBuf.length > 0 ? bodyBuf : undefined
      });

      const webResp = await handler({ request: webReq, env: process.env, ctx: {} });

      const respHeaders = {};
      webResp.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });
      res.writeHead(webResp.status, respHeaders);

      if (!webResp.body) {
        res.end();
        return;
      }

      const reader = webResp.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  // Phục vụ Static Files từ thư mục public/
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon"
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        fs.readFile(path.join(PUBLIC_DIR, "index.html"), (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end("404 Not Found");
          } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 Hongguo & Douyin Pro Video Downloader đang chạy tại:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`=============================================================\n`);
});
